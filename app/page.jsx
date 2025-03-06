"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { fetchTopEmployees, createEmployee, updateEmployee, deleteEmployee, fetchDepartments } from "../hooks/useEmployees";

const Page = () => {
  // Modify initial form state to ensure all fields have defined values
  const initialFormState = {
    first_name: '',
    last_name: '',
    birth_date: new Date().toISOString().split('T')[0],
    gender: 'M',
    dept_name: '',
    title: '', // Ensure title has an initial empty string
    salary: '',
    hire_date: new Date().toISOString().split('T')[0]
  };

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [modifiedFields, setModifiedFields] = useState({});

  const formatDate = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date.replace(/-/g, '/')) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-CA');
  };

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await fetchTopEmployees();
        const deptData = await fetchDepartments();
        setDepartments(JSON.parse(deptData.body));
        const employeesData = JSON.parse(data.body).map(emp => ({
          ...emp,
          max_salary: emp.salary ? Number(emp.salary) : 0, 
        }));
        console.log(employeesData, "employeesData");
        console.log(data, "Fetched data")
        setEmployees(employeesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setModifiedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let formattedData = {};
    if (selectedEmployee) {
      Object.keys(modifiedFields).forEach(field => {
        if (modifiedFields[field]) {
          let value = formData[field];
          if (field === 'salary') value = Number(value);
          if (field === 'birth_date' || field === 'hire_date') value = formatDate(value);
          formattedData[field] = value;
        }
      });
    } else {
      formattedData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_date: formatDate(formData.birth_date),
        gender: formData.gender,
        hire_date: formatDate(formData.hire_date),
        salary: Number(formData.salary),
        dept_name: formData.dept_name,
        title: formData.title,
      };
    }

    try {
      if (selectedEmployee) {
        const updatedEmployees = employees.map(emp =>
          emp.emp_no === selectedEmployee.emp_no
            ? { ...emp, ...formattedData, ...(formattedData.salary && { max_salary: formattedData.salary }) }
            : emp
        );
        setEmployees(updatedEmployees);

        await updateEmployee(selectedEmployee.emp_no, formattedData);
        setModifiedFields({});
        resetForm();
      } else {
        const tempId = Date.now();
        const newEmployee = {
          emp_no: tempId,
          ...formattedData,
          max_salary: formattedData.salary
        };

        const tempEmployee = { ...newEmployee }

        setEmployees([...employees, newEmployee]);
        resetForm();

        const response = await createEmployee(formattedData);
        const realEmployee = JSON.parse(response.body);

        const newIdEmployee = { ...tempEmployee, emp_no: realEmployee.emp_no };

        setEmployees(currentEmployees => {
          const updatedEmployees = currentEmployees.filter(emp => emp.emp_no !== tempId);
          return [...updatedEmployees, newIdEmployee];
        });
      }
    } catch (err) {
      setError(err.message);
      if (selectedEmployee) {
        const data = await fetchTopEmployees();
        setEmployees(JSON.parse(data.body));
      } else {
        setEmployees(employees.filter(emp => typeof emp.emp_no === 'number'));
      }
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      birth_date: formatDate(employee.birth_date) || new Date().toISOString().split('T')[0],
      gender: employee.gender || 'M',
      dept_name: employee.dept_name || '',
      title: employee.title || '',
      salary: employee.max_salary || '',
      hire_date: formatDate(employee.hire_date) || new Date().toISOString().split('T')[0],
    });
    setModifiedFields({});
    setShowModal(true);
  };

  const handleDelete = async (empNo) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    const employeeToDelete = employees.find(emp => emp.emp_no === empNo);

    setEmployees(employees.filter(emp => emp.emp_no !== empNo));

    try {
      await deleteEmployee(empNo);
    } catch (err) {
      setError(err.message);
      setEmployees(prev => [...prev, employeeToDelete]);
    }
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setFormData(initialFormState);
    setShowModal(false);
  };

  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.leftSection}>
          <h1 className={styles.title}>Top Earning Employees</h1>
        </div>
        <nav className={styles.rightSection}>
          <button className={styles.addButton} onClick={() => setShowModal(true)}>
            + Add Employee
          </button>
          <Link href="/about" className={styles.aboutLink}>About</Link>
        </nav>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.emp_no}>
              <td>#{emp.emp_no}</td>
              <td>{`${emp.first_name} ${emp.last_name}`}</td>
              <td>{emp.dept_name}</td>
              <td>${emp.max_salary}</td>
              <td>
                <button className={styles.editButton} onClick={() => handleEdit(emp)}>
                  Edit
                </button>
                <button className={styles.deleteButton} onClick={() => handleDelete(emp.emp_no)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{selectedEmployee ? "Update Employee" : "Add Employee"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>First Name: (max 14 chars)</label>
                <input
                  required={!selectedEmployee}
                  maxLength={14}
                  value={formData.first_name}
                  onChange={(e) => handleFormChange('first_name', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name: (max 16 chars)</label>
                <input
                  required={!selectedEmployee}
                  maxLength={16}
                  value={formData.last_name}
                  onChange={(e) => handleFormChange('last_name', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Hire Date:</label>
                <input
                  type="date"
                  required={!selectedEmployee}
                  value={formData.hire_date}
                  onChange={(e) => handleFormChange('hire_date', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Birth Date:</label>
                <input
                  type="date"
                  required={!selectedEmployee}
                  value={formData.birth_date}
                  onChange={(e) => handleFormChange('birth_date', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Gender:</label>
                <select
                  required={!selectedEmployee}
                  value={formData.gender}
                  onChange={(e) => handleFormChange('gender', e.target.value)}
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Department:</label>
                {departments.length > 0 ? (
                  <select
                    required={!selectedEmployee}
                    value={formData.dept_name}
                    onChange={(e) => handleFormChange('dept_name', e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.dept_no} value={dept.dept_name}>
                        {dept.dept_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>Loading departments...</div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Title:</label>
                <input
                  required={!selectedEmployee}
                  maxLength={50}
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Salary:</label>
                <input
                  type="number"
                  required={!selectedEmployee}
                  min="1"
                  value={formData.salary}
                  onChange={(e) => handleFormChange('salary', e.target.value)}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  {selectedEmployee ? "Update" : "Add"}
                </button>
                <button type="button" className={styles.cancelButton} onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div >
      )}
    </div >
  );
};

export default Page;
