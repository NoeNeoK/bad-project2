import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Spin } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useQuery, useMutation } from "@apollo/client";

import {
  GET_TOP_EMPLOYEES,
  ADD_EMPLOYEE,
  UPDATE_EMPLOYEE,
  DELETE_EMPLOYEE,
} from "./queries";

const Page = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { loading, error, data } = useQuery(GET_TOP_EMPLOYEES, {
    fetchPolicy: "cache-first",
  });
  const [addEmployee] = useMutation(ADD_EMPLOYEE);
  const [updateEmployee] = useMutation(UPDATE_EMPLOYEE);
  const [deleteEmployee] = useMutation(DELETE_EMPLOYEE);

  useEffect(() => {
    if (error) {
      message.error("Error fetching employees");
    }
  }, [error]);

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
      render: (text, record) => (
        <div>
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
            type="danger"
            icon={<DeleteOutlined />}
            onClick={() => {
              deleteEmployee({ variables: { id: record.id } });
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleAddEmployee = async (values) => {
    try {
      await addEmployee({ variables: { input: values } });
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Error adding employee");
    }
  };

  const handleUpdateEmployee = async (values) => {
    try {
      await updateEmployee({
        variables: { id: selectedEmployee.id, input: values },
      });
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Error updating employee");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setIsUpdate(false);
    setSelectedEmployee(null);
  };

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setIsModalVisible(true);
        }}
      >
        Add Employee
      </Button>
      {loading ? (
        <Spin />
      ) : (
        <Table
          columns={columns}
          dataSource={data ? data.employees : []}
          rowKey="id"
        />
      )}
      <Modal
        title={isUpdate ? "Update Employee" : "Add Employee"}
        visible={isModalVisible}
        onCancel={handleCancel}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              if (isUpdate) {
                handleUpdateEmployee(values);
              } else {
                handleAddEmployee(values);
              }
            })
            .catch((info) => {
              console.log("Validate Failed:", info);
            });
        }}
      >
        <Form form={form} layout="vertical" name="employeeForm">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input the name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="position"
            label="Position"
            rules={[{ required: true, message: "Please input the position!" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Page;
