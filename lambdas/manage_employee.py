from db_config import DB, Cache
import json

def add_cors_headers(response):
    if 'headers' not in response:
        response['headers'] = {}
    
    response['headers'].update({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,DELETE,GET'
    })
    return response

def lambda_handler(event, context):
    # Handle preflight OPTIONS request
    if event['httpMethod'] == 'OPTIONS':
        return add_cors_headers({
            'statusCode': 200,
            'body': ''
        })

    conn = DB.get_connection()
    cache = Cache.get_client()
    http_method = event['httpMethod']
    emp_no = event.get('pathParameters', {}).get('emp_no')
    
    try:
        if http_method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            return add_cors_headers(search_employees(conn, query_params))
        elif http_method == 'POST':
            return add_cors_headers(create_employee(conn, cache, json.loads(event['body'])))
            
        elif http_method == 'PUT':
            return add_cors_headers(update_employee(conn, cache, emp_no, json.loads(event['body'])))
            
        elif http_method == 'DELETE':
            return add_cors_headers(delete_employee(conn, cache, emp_no))
            
    except Exception as e:
        conn.rollback()
        return add_cors_headers({
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        })

def create_employee(conn, cache, data):
    required_fields = ['birth_date', 'first_name', 'last_name', 'gender', 
                      'hire_date', 'salary', 'dept_name', 'title']
    if not all(field in data for field in required_fields):
        return add_cors_headers({
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing required fields'})
        })

    with conn.cursor() as cursor:
        # Transaction Start
        cursor.execute("SELECT MAX(emp_no)+1 AS new_id FROM employees")
        new_emp_no = cursor.fetchone()['new_id']
        
        # Validate department exists
        cursor.execute("SELECT dept_no FROM departments WHERE dept_name = %s", 
                      (data['dept_name'],))
        dept = cursor.fetchone()
        if not dept:
            return add_cors_headers({
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid department name'})
            })

        # Insert employee
        cursor.execute("""
            INSERT INTO employees 
            (emp_no, birth_date, first_name, last_name, gender, hire_date)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (new_emp_no, data['birth_date'], data['first_name'], 
              data['last_name'], data['gender'], data['hire_date']))
        
        # Insert salary
        if not isinstance(data['salary'], int) or data['salary'] <= 0:
            return add_cors_headers({
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid salary'})
            })
        
        cursor.execute("""
            INSERT INTO salaries 
            (emp_no, salary, from_date, to_date)
            VALUES (%s, %s, %s, '9999-01-01')
        """, (new_emp_no, data['salary'], data['hire_date']))
        
        # Insert department
        cursor.execute("""
            INSERT INTO dept_emp 
            (emp_no, dept_no, from_date, to_date)
            VALUES (%s, %s, %s, '9999-01-01')
        """, (new_emp_no, dept['dept_no'], data['hire_date']))

        # Insert title
        cursor.execute("""
            INSERT INTO titles 
            (emp_no, title, from_date, to_date)
            VALUES (%s, %s, %s, '9999-01-01')
        """, (new_emp_no, data['title'], data['hire_date']))
        
        conn.commit()
        cache.delete('top_employees')
        return add_cors_headers({
            'statusCode': 201,
            'body': json.dumps({'emp_no': new_emp_no})
        })

def update_employee(conn, cache, emp_no, data):
    with conn.cursor() as cursor:
        # Verify employee exists
        cursor.execute("SELECT emp_no FROM employees WHERE emp_no = %s", (emp_no,))
        if not cursor.fetchone():
            return add_cors_headers({
                'statusCode': 404,
                'body': json.dumps({'error': 'Employee not found'})
            })

        try:
            # Update employee basic info
            if 'first_name' in data or 'last_name' in data:
                cursor.execute("""
                    UPDATE employees 
                    SET first_name = COALESCE(%s, first_name), 
                        last_name = COALESCE(%s, last_name)
                    WHERE emp_no = %s
                """, (data.get('first_name'), data.get('last_name'), emp_no))
            
            # Update salary if provided
            if 'salary' in data:
                if not isinstance(data['salary'], int) or data['salary'] <= 0:
                    return add_cors_headers({
                        'statusCode': 400,
                        'body': json.dumps({'error': 'Invalid salary'})
                    })
                
                # Check if salary already updated today
                cursor.execute("""
                    SELECT COUNT(*) as count
                    FROM salaries 
                    WHERE emp_no = %s 
                    AND from_date = CURRENT_DATE()
                """, (emp_no,))
                
                if cursor.fetchone()['count'] == 0:
                    cursor.execute("""
                        UPDATE salaries 
                        SET to_date = CURRENT_DATE() - INTERVAL 1 DAY
                        WHERE emp_no = %s AND to_date = '9999-01-01'
                    """, (emp_no,))
                    
                    cursor.execute("""
                        INSERT INTO salaries 
                        (emp_no, salary, from_date, to_date)
                        VALUES (%s, %s, CURRENT_DATE(), '9999-01-01')
                    """, (emp_no, data['salary']))
            
            # Update title if provided
            if 'title' in data:
                cursor.execute("""
                    UPDATE titles 
                    SET to_date = CURRENT_DATE()
                    WHERE emp_no = %s AND to_date = '9999-01-01'
                """, (emp_no,))
                
                cursor.execute("""
                    INSERT INTO titles 
                    (emp_no, title, from_date, to_date)
                    VALUES (%s, %s, CURRENT_DATE(), '9999-01-01')
                """, (emp_no, data['title']))
            
            # Update department if provided
            if 'dept_name' in data:
                cursor.execute("SELECT dept_no FROM departments WHERE dept_name = %s", 
                             (data['dept_name'],))
                new_dept = cursor.fetchone()
                if not new_dept:
                    return add_cors_headers({
                        'statusCode': 400,
                        'body': json.dumps({'error': 'Invalid department name'})
                    })
                
                cursor.execute("""
                    UPDATE dept_emp 
                    SET to_date = CURRENT_DATE()
                    WHERE emp_no = %s AND to_date = '9999-01-01'
                """, (emp_no,))
                
                cursor.execute("""
                    INSERT INTO dept_emp 
                    (emp_no, dept_no, from_date, to_date)
                    VALUES (%s, %s, CURRENT_DATE(), '9999-01-01')
                """, (emp_no, new_dept['dept_no']))
            
            conn.commit()
            cache.delete('top_employees')
            return add_cors_headers({
                'statusCode': 200,
                'body': json.dumps({'message': 'Employee updated successfully'})
            })
        except Exception as e:
            conn.rollback()
            return add_cors_headers({
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            })

def delete_employee(conn, cache, emp_no):
    with conn.cursor() as cursor:
        # Verify employee exists
        cursor.execute("SELECT emp_no FROM employees WHERE emp_no = %s", (emp_no,))
        if not cursor.fetchone():
            return add_cors_headers({
                'statusCode': 404,
                'body': json.dumps({'error': 'Employee not found'})
            })

        # Set end dates for all related records
        cursor.execute("""
            UPDATE salaries 
            SET to_date = CURRENT_DATE()
            WHERE emp_no = %s AND to_date = '9999-01-01'
        """, (emp_no,))
        
        cursor.execute("""
            UPDATE dept_emp 
            SET to_date = CURRENT_DATE()
            WHERE emp_no = %s AND to_date = '9999-01-01'
        """, (emp_no,))
        
        cursor.execute("""
            UPDATE titles 
            SET to_date = CURRENT_DATE()
            WHERE emp_no = %s AND to_date = '9999-01-01'
        """, (emp_no,))
        
        cursor.execute("""
            DELETE FROM employees 
            WHERE emp_no = %s
        """, (emp_no,))
            
        conn.commit()
        cache.delete('top_employees')
        return add_cors_headers({
            'statusCode': 200,
            'body': json.dumps({'message': 'Employee deleted successfully'})
        })

def search_employees(conn, params):
    with conn.cursor() as cursor:
        query = """
            SELECT e.emp_no, e.first_name, e.last_name, e.gender, e.birth_date, e.hire_date,
                   s.salary, d.dept_name, t.title
            FROM employees e
            LEFT JOIN salaries s ON e.emp_no = s.emp_no AND s.to_date = '9999-01-01'
            LEFT JOIN dept_emp de ON e.emp_no = de.emp_no AND de.to_date = '9999-01-01'
            LEFT JOIN departments d ON de.dept_no = d.dept_no
            LEFT JOIN titles t ON e.emp_no = t.emp_no AND t.to_date = '9999-01-01'
            WHERE 1=1
        """
        conditions = []
        values = []

        if params.get('name'):
            search_term = f"%{params['name']}%"
            conditions.append("(e.first_name LIKE %s OR e.last_name LIKE %s)")
            values.extend([search_term, search_term])

        if conditions:
            query += " AND " + " AND ".join(conditions)

        query += " ORDER BY e.last_name, e.first_name LIMIT 100"
        
        cursor.execute(query, values)
        employees = cursor.fetchall()
        
        # Convert datetime objects to strings for JSON serialization
        for emp in employees:
            emp['birth_date'] = emp['birth_date'].strftime('%Y-%m-%d')
            emp['hire_date'] = emp['hire_date'].strftime('%Y-%m-%d')

        return {
            'statusCode': 200,
            'body': json.dumps(employees)
        }