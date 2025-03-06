from db_config import DB, Cache
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
                'body': cached
            }

        # Get connection
        conn = DB.get_connection()
        
        with conn.cursor() as cursor:
            query = """
            SELECT e.emp_no, e.first_name, e.last_name, d.dept_name, s.salary
            FROM employees e
            JOIN (
                SELECT emp_no, dept_no
                FROM dept_emp
                WHERE to_date = '9999-01-01'  -- Only current department
            ) de ON e.emp_no = de.emp_no
            JOIN departments d ON de.dept_no = d.dept_no
            JOIN (
                SELECT emp_no, salary
                FROM salaries
                WHERE to_date = '9999-01-01'  -- Only current salary
            ) s ON e.emp_no = s.emp_no
            WHERE s.salary > (SELECT AVG(salary) FROM salaries WHERE to_date = '9999-01-01')
            ORDER BY s.salary DESC
            LIMIT 10;
            """
            cursor.execute(query)
            result = cursor.fetchall()
            
            # Cache for 5 minutes
            cache.setex('top_employees', 300, json.dumps(result))
            
            return {
                'statusCode': 200,
                'body': json.dumps(result)
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if conn:
            conn.close()