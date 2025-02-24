from datetime import datetime
from db_config import DB, Cache, get_cors_headers
import json
from typing import List
import pymysql
from contextlib import contextmanager

logger = logging.getLogger()
logger.setLevel(logging.INFO)

@contextmanager
def get_transaction(conn):
    try:
        with conn.cursor() as cursor:
            yield cursor
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise

def lambda_handler(event, context):
    # Handle preflight OPTIONS request
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': ''
        }

    conn = DB.get_connection()
    cache = Cache.get_client()
    http_method = event['httpMethod']
    emp_no = event.get('pathParameters', {}).get('emp_no')
    
    try:
        if http_method == 'POST':
            return create_employee(conn, cache, json.loads(event['body']))
        elif http_method == 'PUT':
            return update_employee(conn, cache, emp_no, json.loads(event['body']))
        elif http_method == 'DELETE':
            return delete_employee(conn, cache, emp_no)
            
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

# Add query execution time monitoring
def execute_query(cursor, query, params=None):
    start_time = datetime.now()
    cursor.execute(query, params)
    execution_time = (datetime.now() - start_time).total_seconds()
    if execution_time > 1.0:  # Log slow queries
        logger.warning(f"Slow query ({execution_time}s): {query}")
    return cursor

def create_employee(conn, cache, data):
    with get_transaction(conn) as cursor:
        # Bulk insert preparation
        cursor.execute("SELECT MAX(emp_no)+1 FROM employees")
        new_emp_no = cursor.fetchone()[0]
        
        # Prepare all inserts at once
        queries = [
            ("""
                INSERT INTO employees 
                (emp_no, birth_date, first_name, last_name, gender, hire_date)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (new_emp_no, data['birth_date'], data['first_name'],
                 data['last_name'], data['gender'], data['hire_date'])),
            ("""
                INSERT INTO salaries 
                (emp_no, salary, from_date, to_date)
                VALUES (%s, %s, %s, '9999-01-01')
            """, (new_emp_no, data['salary'], data['hire_date'])),
            ("INSERT INTO dept_emp VALUES (%s, %s, %s, '9999-01-01')",
                 (new_emp_no, data['dept_no'], data['hire_date'])),
            ("INSERT INTO titles VALUES (%s, %s, %s, '9999-01-01')",
                 (new_emp_no, data['title'], data['hire_date']))
        ]
        
        # Execute all queries in sequence
        for query, params in queries:
            cursor.execute(query, params)
        
        cache.delete('top_employees')
        return {
            'statusCode': 201,
            'headers': get_cors_headers(),
            'body': json.dumps({'emp_no': new_emp_no})
        }

def update_employee(conn, cache, emp_no, data):
    with get_transaction(conn) as cursor:
        # Combine updates into single query where possible
        if 'first_name' in data or 'last_name' in data:
            cursor.execute("""
                UPDATE employees
                SET first_name = COALESCE(%s, first_name),
                    last_name = COALESCE(%s, last_name)
                WHERE emp_no = %s
            """, (data.get('first_name'), data.get('last_name'), emp_no))
            
        # Batch update all changes in one transaction
        updates = []
        if 'salary' in data:
            updates.extend([
                "UPDATE salaries SET to_date = CURRENT_DATE() WHERE emp_no = %s AND to_date = '9999-01-01'",
                "INSERT INTO salaries (emp_no, salary, from_date, to_date) VALUES (%s, %s, CURRENT_DATE(), '9999-01-01')"
            ])
        
        # Execute all updates in batch
        for query in updates:
            execute_query(cursor, query, (emp_no,))
        
        cache.delete_many(['top_employees', f'employee:{emp_no}'])
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Update successful'})
        }

def batch_process(conn, cache, operations):
    with get_transaction(conn) as cursor:
        results = []
        for op in operations:
            if op['type'] == 'create':
                # Handle create
                pass
            elif op['type'] == 'update':
                # Handle update
                pass
            elif op['type'] == 'delete':
                # Handle delete
                pass
                
        return results

def batch_delete_employees(conn, cache, emp_nos: List[int]):
    with get_transaction(conn) as cursor:
        # Batch update all related tables
        tables = ['salaries', 'dept_emp', 'titles']
        for table in tables:
            execute_query(cursor, f"""
                UPDATE {table}
                SET to_date = CURRENT_DATE()
                WHERE emp_no IN ({','.join(['%s'] * len(emp_nos))})
                AND to_date = '9999-01-01'
            """, emp_no)
        
        # Delete employees in batch
        execute_query(cursor, f"""
            DELETE FROM employees
            WHERE emp_no IN ({','.join(['%s'] * len(emp_nos))})
        """, emp_nos)
        
        cache.delete('top_employees')
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': f'{len(emp_nos)} employees deleted'})
        }

def delete_employee(conn, cache, emp_no):
    with get_transaction(conn) as cursor:
        # Verify employee exists
        cursor.execute("SELECT emp_no FROM employees WHERE emp_no = %s", (emp_no,))
        if not cursor.fetchone():
            return {
                'statusCode': 404,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Employee not found'})
            }

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
            
        cache.delete('top_employees')
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Employee deleted successfully'})
        }