from db_config import DB, Cache, get_cors_headers
import json

def lambda_handler(event, context):
    conn = None
    cache = Cache.get_client()
    try:
        # Check cache
        cached = cache.get('top_employees')
        if cached:
            return {
                'statusCode': 200,
                'headers': get_cors_headers(),
                'body': cached
            }

        # Get connection
        conn = DB.get_connection()
        
        with conn.cursor() as cursor:
            query = """
            SELECT e.emp_no, e.first_name, e.last_name, d.dept_name, MAX(s.salary) AS max_salary
            FROM employees e
            JOIN dept_emp de ON e.emp_no = de.emp_no
            JOIN departments d ON de.dept_no = d.dept_no
            JOIN (SELECT emp_no, salary FROM salaries WHERE to_date = '9999-01-01') s
            ON e.emp_no = s.emp_no
            WHERE s.salary > (SELECT AVG(salary) FROM salaries)
            GROUP BY e.emp_no, e.first_name, e.last_name, d.dept_name
            ORDER BY max_salary DESC
            LIMIT 10;
            """
            cursor.execute(query)
            result = cursor.fetchall()
            
            # Cache for 5 minutes
            cache.setex('top_employees', 300, json.dumps(result))
            
            return {
                'statusCode': 200,
                'headers': {**get_cors_headers(), 'Content-Type': 'application/json'},
                'body': json.dumps(result)
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if conn:
            conn.close()