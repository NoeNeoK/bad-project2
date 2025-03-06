from db_config import DB, Cache
import json

def lambda_handler(event, context):
    conn = None
    cache = Cache.get_client()
    try:
        # Check cache first
        cached = cache.get('departments')
        if cached:
            return {
                'statusCode': 200,
                'body': cached
            }

        # Get database connection
        conn = DB.get_connection()
        
        with conn.cursor() as cursor:
            query = """
            SELECT dept_no, dept_name
            FROM departments
            ORDER BY dept_name
            """
            cursor.execute(query)
            departments = cursor.fetchall()
            
            # Cache for 1 hour since department data rarely changes
            response_data = json.dumps(departments)
            cache.setex('departments', 3600, response_data)
            
            return {
                'statusCode': 200,
                'body': response_data
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if conn:
            conn.close()