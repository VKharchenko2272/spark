import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './edit.css'
import { Helmet } from 'react-helmet-async';

const EditUser = () => {
    const { id } = useParams();
    const [employee, setEmployee] = useState({
        firstname: '',
        lastname: '',
        email: '',
        username: '',
        password: '',
        company_role: '',
        is_admin: false,
        hired_date: '',
        manager_id: '',
        department_id: '',
        img: null,
    });

    const [file, setFile] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const element = document.querySelector('.custom-row-height');
        if (element) {
            element.classList.remove('custom-row-height');
        }
    }, []);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const response = await axios.get(`http://localhost:5212/users/${id}`);
                const data = response.data;
                if (data.hired_date) {
                    data.hired_date = data.hired_date.split('T')[0];
                }
                setEmployee(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching employee:', error);
            }
        };

        const fetchDepartments = async () => {
            try {
                const response = await axios.get('http://localhost:5212/departments');
                setDepartments(response.data);
            } catch (error) {
                console.error('Error fetching departments:', error);
            }
        };

        fetchEmployee();
        fetchDepartments();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEmployee((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        Object.keys(employee).forEach((key) => {
            formData.append(key, employee[key]);
        });

        if (file) {
            formData.append('image', file);
        }

        try {
            const response = await axios.put(`http://localhost:5212/edit/${id}`, formData);

            if (response.status === 204) {
                alert('Employee updated successfully!');
                setSuccessMessage('Employee updated successfully!');
            } else {
                alert('Failed to update employee.');
                setErrorMessage('Failed to update employee!');
            }
        } catch (error) {
            console.error('Error updating employee:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mt-5" >
            <Helmet> <title>Edit User</title></Helmet>
            <form className='form-margin' onSubmit={handleSubmit} encType="multipart/form-data">

                <ul className="list-group">
                    <h2 className="mb-4">Edit Employee</h2>
                    <li className="list-group-item">
                        <label className="form-label">First Name:</label>
                        <input
                            type="text"
                            name="firstname"
                            className="form-control"
                            value={employee.firstname}
                            onChange={handleChange}
                            required
                        />
                    </li>

                    <li className="list-group-item">
                        <label className="form-label">Last Name:</label>
                        <input
                            type="text"
                            name="lastname"
                            className="form-control"
                            value={employee.lastname}
                            onChange={handleChange}
                            required
                        />
                    </li>

                    <li className="list-group-item">
                        <label className="form-label">Email:</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            value={employee.email}
                            onChange={handleChange}
                            required
                        />
                    </li>

                    <li className="list-group-item">
                        <label className="form-label">Username:</label>
                        <input
                            type="text"
                            name="username"
                            className="form-control"
                            value={employee.username}
                            onChange={handleChange}
                        />
                    </li>

                    <li className="list-group-item">
                        <label className="form-label">Password:</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            value={employee.password}
                            onChange={handleChange}
                        />
                    </li>

                    <li className="list-group-item">
                        <label className="form-label">Company Role:</label>
                        <input
                            type="text"
                            name="company_role"
                            className="form-control"
                            value={employee.company_role}
                            onChange={handleChange}
                        />
                    </li>

                    <li className="list-group-item">
                        <label className="form-label">Is Admin:</label>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                name="is_admin"
                                className="form-check-input"
                                id="isAdmin"
                                checked={employee.is_admin}
                                onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="isAdmin">
                                Is Admin
                            </label>
                        </div>
                    </li>

                    <li className="list-group-item">
                        <label className="form-label">Hired Date:</label>
                        <input
                            type="date"
                            name="hired_date"
                            className="form-control"
                            value={employee.hired_date}
                            onChange={handleChange}
                        />
                    </li>

                    <li className="list-group-item">
                        <label className="form-label">Manager ID:</label>
                        <input
                            type="number"
                            name="manager_id"
                            className="form-control"
                            value={employee.manager_id}
                            onChange={handleChange}
                        />
                    </li>

                    <li className="list-group-item">
                        <label className="form-label">Department:</label>
                        <select
                            name="department_id"
                            className="form-select"
                            value={employee.department_id}
                            onChange={handleChange}
                        >
                            <option value="">Select Department</option>
                            {departments.map((dep) => (
                                <option key={dep.id} value={dep.id}>
                                    {dep.name}
                                </option>
                            ))}
                        </select>
                    </li>

                    <li className="list-group-item">
                        <label className="form-label">Upload Image:</label>
                        <input
                            type="file"
                            name="image"
                            className="form-control"
                            onChange={handleFileChange}
                        />
                    </li>
                    <button type="submit" className="btn btn-primary mt-3">Update Employee</button>
                </ul>


            </form>
        </div>
    );
};

export default EditUser;
