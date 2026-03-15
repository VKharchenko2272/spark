import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

function AddUser() {
    const [user, setUser] = useState({
        firstname: '',
        lastname: '',
        email: '',
        username: '',
        password: '',
        company_role: '',
        is_admin: false,
        hired_date: '',
        manager_id: '',
        department_id: ''
    });
    const [image, setImage] = useState(null);
    const [department, setDepartments] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        // Fetch departments
        axios.get('http://localhost:5212/departments')
            .then(response => {
                console.log('Departments fetched:', response.data); // Debugging: Check response
                setDepartments(response.data);
            })
            .catch(error => {
                console.error('Error fetching departments:', error);
            });
    }, []);


    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUser({ ...user, [name]: type === 'checkbox' ? checked : value });
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('firstname', user.firstname);
        formData.append('lastname', user.lastname);
        formData.append('email', user.email);
        formData.append('username', user.username);
        formData.append('password', user.password);
        formData.append('company_role', user.company_role);
        formData.append('is_admin', user.is_admin);
        formData.append('hired_date', user.hired_date);
        formData.append('manager_id', user.manager_id);
        formData.append('department_id', user.department_id);

        if (image) {
            formData.append('image', image);
        }
        console.log(formData);
        try {
            const response = await axios.post('http://localhost:5212/employees-with-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSuccessMessage('Added user successfully!');
            console.log('User created:', response.data);
        } catch (error) {
            console.error('There was an error!', error);
            setErrorMessage('Failed to create a new user!');
        }
    };

    return (
        <div className="container mt-5" >
            <Helmet> <title>Add User</title></Helmet>
            <form className='form-margin' onSubmit={handleSubmit} encType="multipart/form-data">
                <ul className="list-group">
                    <h2>Add User Form</h2>
                    <li className="list-group-item">
                        <label className="form-label">First Name:</label>
                        <input
                            type="text"
                            name="firstname"
                            className="form-control"
                            value={user.firstname}
                            onChange={handleInputChange}
                        />
                    </li>
                    <li className="list-group-item">
                        <label className="form-label">Last Name:</label>
                        <input
                            type="text"
                            name="lastname"
                            className="form-control"
                            value={user.lastname}
                            onChange={handleInputChange}
                        />
                    </li>
                    <li className="list-group-item">
                        <label className="form-label">Email:</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            value={user.email}
                            onChange={handleInputChange}
                        />
                    </li>
                    <li className="list-group-item">
                        <label className="form-label">Username:</label>
                        <input
                            type="text"
                            name="username"
                            className="form-control"
                            value={user.username}
                            onChange={handleInputChange}
                        />
                    </li>
                    <li className="list-group-item">
                        <label className="form-label">Password:</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            value={user.password}
                            onChange={handleInputChange}
                        />
                    </li>
                    <li className="list-group-item">
                        <label className="form-label">Company Role:</label>
                        <input
                            type="text"
                            name="company_role"
                            className="form-control"
                            value={user.company_role}
                            onChange={handleInputChange}
                        />
                    </li>
                    <li className="list-group-item">
                        <label className="form-label">Hired Date:</label>
                        <input
                            type="date"
                            name="hired_date"
                            className="form-control"
                            value={user.hired_date}
                            onChange={handleInputChange}
                        />
                    </li>
                    <li className="list-group-item">
                        <label className="form-label">Manager ID:</label>
                        <input
                            type="number"
                            name="manager_id"
                            className="form-control"
                            value={user.manager_id}
                            onChange={handleInputChange}
                        />
                    </li>
                    <li className="list-group-item">
                        <label className="form-label">Department:</label>
                        <select
                            name="department_id"
                            className="form-control"
                            value={user.department_id}
                            onChange={handleInputChange}
                        >
                            <option value="">Select Department</option>
                            {department.map(department => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </li>
                    <li className="list-group-item">
                        <label className="form-label">Is Admin:</label>

                        <div className="form-check">
                            <input
                                type="checkbox"
                                name="is_admin"
                                className="form-check-input"
                                checked={user.is_admin}
                                onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="isAdmin">
                                Is Admin
                            </label>
                        </div>
                    </li>
                    <li className="list-group-item">
                        <label className="form-label">Profile Image:</label>
                        <input type="file" className="form-control" onChange={handleImageChange} />
                    </li>

                    <button type="submit" className="btn btn-primary mt-3" FormData>Add User</button>
                </ul>
            </form>
            <div className="status-message form-margin">
                {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            </div>
        </div >
    );
}

export default AddUser;
