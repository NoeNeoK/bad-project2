const mysql = require("mysql2/promise");
const redis = require("redis");
const { promisify } = require("util");

// Redis setup
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

exports.handler = async (event) => {
  const { httpMethod, path } = event;
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    switch (httpMethod) {
      case "GET":
        if (path === "/top-employees") {
          // Try cache first
          const cached = await getAsync("top-employees");
          if (cached) return JSON.parse(cached);

          // If not in cache, query DB
          const result = await queryTopEmployees(connection);
          await setAsync("top-employees", JSON.stringify(result), "EX", 300); // Cache for 5 minutes
          return result;
        }
        break;

      case "POST":
        return await createEmployee(connection, JSON.parse(event.body));

      case "PUT":
        return await updateEmployee(
          connection,
          event.pathParameters.id,
          JSON.parse(event.body)
        );

      case "DELETE":
        return await deleteEmployee(connection, event.pathParameters.id);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

async function queryTopEmployees(connection) {
  const query = `
    SELECT e.emp_no, e.first_name, e.last_name, d.dept_name, MAX(s.salary) AS max_salary 
    FROM employees e 
    JOIN dept_emp de ON e.emp_no = de.emp_no 
    JOIN departments d ON de.dept_no = d.dept_no 
    JOIN (SELECT emp_no, salary FROM salaries WHERE to_date = '9999-01-01') s 
    ON e.emp_no = s.emp_no 
    WHERE s.salary > (SELECT AVG(salary) FROM salaries) 
    GROUP BY e.emp_no, e.first_name, e.last_name, d.dept_name 
    ORDER BY max_salary DESC 
    LIMIT 10
  `;

  const [rows] = await connection.execute(query);
  return rows;
}

async function createEmployee(connection, employee) {
  const query =
    "INSERT INTO employees (first_name, last_name, birth_date, gender, hire_date) VALUES (?, ?, ?, ?, ?)";
  const [result] = await connection.execute(query, [
    employee.first_name,
    employee.last_name,
    employee.birth_date,
    employee.gender,
    employee.hire_date,
  ]);
  return { id: result.insertId, ...employee };
}

async function updateEmployee(connection, id, employee) {
  const query =
    "UPDATE employees SET first_name = ?, last_name = ? WHERE emp_no = ?";
  await connection.execute(query, [
    employee.first_name,
    employee.last_name,
    id,
  ]);
  return { id, ...employee };
}

async function deleteEmployee(connection, id) {
  const query = "DELETE FROM employees WHERE emp_no = ?";
  await connection.execute(query, [id]);
  return { message: "Employee deleted successfully" };
}
