import { gql } from '@apollo/client';

export const GET_EMPLOYEES = gql`
    query GetEmployees {
        employees {
            id
            name
            position
        }
    }
`;

export const ADD_EMPLOYEE = gql`
    mutation AddEmployee($input: EmployeeInput!) {
        addEmployee(input: $input) {
            id
            name
            position
        }
    }
`;

export const UPDATE_EMPLOYEE = gql`
    mutation UpdateEmployee($id: ID!, $input: EmployeeInput!) {
        updateEmployee(id: $id, input: $input) {
            id
            name
            position
        }
    }
`;

export const DELETE_EMPLOYEE = gql`
    mutation DeleteEmployee($id: ID!) {
        deleteEmployee(id: $id) {
            id
        }
    }
`;