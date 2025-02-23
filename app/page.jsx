"use client";

import React, { useState } from "react";
import { Table, Button, Modal, Form, Input, DatePicker, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const mockData = [
  {
    emp_no: 10001,
    birth_date: "1953-09-02",
    first_name: "Georgi",
    last_name: "Facello",
    gender: "M",
    hire_date: "1986-06-26",
    department: "Development", // This will come from dept_emp and departments tables join
    title: "Senior Engineer", // This will come from titles table
    salary: 85000, // This will come from salaries table (current salary)
  },
  {
    emp_no: "10002",
    first_name: "Jane",
    last_name: "Smith",
    dept_name: "Marketing",
    max_salary: 75000,
  },
  // Add more mock data as needed
];

const Page = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState(mockData);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: "Emp. No",
      dataIndex: "emp_no",
      key: "emp_no",
    },
    {
      title: "Full Name",
      key: "fullName",
      render: (_, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Birth Date",
      dataIndex: "birth_date",
      key: "birth_date",
    },
    {
      title: "Hire Date",
      dataIndex: "hire_date",
      key: "hire_date",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Current Salary",
      dataIndex: "salary",
      key: "salary",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedEmployee(record);
              setIsUpdate(true);
              setIsModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.emp_no)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleDelete = (empNo) => {
    setEmployees(employees.filter((emp) => emp.emp_no !== empNo));
  };

  const handleAdd = (values) => {
    const newEmployee = {
      emp_no: Date.now(),
      birth_date: values.birth_date.format("YYYY-MM-DD"),
      first_name: values.first_name,
      last_name: values.last_name,
      gender: values.gender,
      hire_date: values.hire_date.format("YYYY-MM-DD"),
      department: values.department,
      title: values.title,
      salary: parseFloat(values.salary),
    };
    setEmployees([...employees, newEmployee]);
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleUpdate = (values) => {
    setEmployees(
      employees.map((emp) =>
        emp.emp_no === selectedEmployee.emp_no ? { ...emp, ...values } : emp
      )
    );
    setIsModalVisible(false);
    setSelectedEmployee(null);
    form.resetFields();
  };

  return (
    <div style={{ padding: "20px" }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setIsUpdate(false);
          setIsModalVisible(true);
        }}
        style={{ marginBottom: "16px" }}
      >
        Add Employee
      </Button>

      <Table
        columns={columns}
        dataSource={employees}
        rowKey="emp_no"
        loading={loading}
      />

      <Modal
        title={isUpdate ? "Update Employee" : "Add Employee"}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedEmployee(null);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={isUpdate ? handleUpdate : handleAdd}
          initialValues={selectedEmployee}
        >
          <Form.Item
            name="first_name"
            label="First Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="last_name"
            label="Last Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="M">Male</Select.Option>
              <Select.Option value="F">Female</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="birth_date"
            label="Birth Date"
            rules={[{ required: true }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="hire_date"
            label="Hire Date"
            rules={[{ required: true }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="salary" label="Salary" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Page;
