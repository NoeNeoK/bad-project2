const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const fetchAPI = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    mode: 'cors'
  });

  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  return response.json();
};

export const fetchTopEmployees = () => fetchAPI(`${BASE_URL}/employees/top-employee`);

export const createEmployee = async (employeeData) => {
  // Send data directly without the extra wrapping
  return fetchAPI(`${BASE_URL}/employees`, {
    method: "POST",
    body: JSON.stringify(employeeData)
  });
};

export const fetchDepartments = () => fetchAPI(`${BASE_URL}/departments`);

export const updateEmployee = async (empNo, employeeData) => {
  // Send data directly without the extra wrapping
  return fetchAPI(`${BASE_URL}/employees/${empNo}`, {
    method: "PUT",
    body: JSON.stringify(employeeData)
  });
};

export const deleteEmployee = async (empNo) => {
  // No need for body in DELETE request
  return fetchAPI(`${BASE_URL}/employees/${empNo}`, {
    method: "DELETE"
  });
};

export const batchUpdateEmployees = async (updates) => {
  // Send updates directly
  return fetchAPI(`${BASE_URL}/employees/batch`, {
    method: "PUT",
    body: JSON.stringify({ updates })
  });
};
