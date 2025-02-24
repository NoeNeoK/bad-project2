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
  const formattedData = {
    httpMethod: "POST",
    body: JSON.stringify(employeeData),
  };

  return fetchAPI(`${BASE_URL}/employees`, {
    method: "POST",
    body: JSON.stringify(formattedData),
  });
};

export const fetchDepartments = () => fetchAPI(`${BASE_URL}/departments`);

export const updateEmployee = async (empNo, employeeData) => {
  const formattedData = {
    httpMethod: "PUT",
    pathParameters: {
      emp_no: empNo,
    },
    body: JSON.stringify(employeeData), // Now only contains modified fields
  };

  return fetchAPI(`${BASE_URL}/employees/${empNo}`, {
    method: "PUT",
    body: JSON.stringify(formattedData),
  });
};

export const deleteEmployee = async (empNo) => {
  const formattedData = {
    httpMethod: "DELETE",
    pathParameters: {
      emp_no: empNo,
    },
  };

  return fetchAPI(`${BASE_URL}/employees/${empNo}`, {
    method: "DELETE",
    body: JSON.stringify(formattedData),
  });
};

export const batchUpdateEmployees = async (updates) => {
  const formattedData = {
    httpMethod: "PUT",
    body: JSON.stringify({ updates }),
  };

  return fetchAPI(`${BASE_URL}/employees/batch`, {
    method: "PUT",
    body: JSON.stringify(formattedData),
  });
};
