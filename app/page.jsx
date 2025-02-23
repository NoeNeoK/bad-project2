"use client";

import React, { useState } from "react";
import { Table, Button, Modal, Form, Input, Spin } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const mockData = [
  {
    emp_no: "10001",
    first_name: "John",
    last_name: "Doe",
    dept_name: "Engineering",
    max_salary: 85000,
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
      title: "Employee No",
      dataIndex: "emp_no",
      key: "emp_no",
    },
    {
      title: "First Name",
      dataIndex: "first_name",
      key: "first_name",
    },
    {
      title: "Last Name",
      dataIndex: "last_name",
      key: "last_name",
    },
    {
      title: "Department",
      dataIndex: "dept_name",
      key: "dept_name",
    },
    {
      title: "Salary",
      dataIndex: "max_salary",
      key: "max_salary",
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
      emp_no: String(Date.now()),
      first_name: values.first_name,
      last_name: values.last_name,
      dept_name: values.department,
      max_salary: parseFloat(values.salary),
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
          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true }]}
          >
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
