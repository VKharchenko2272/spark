import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ROLE_OPTIONS } from '../../data/roles';
import { api } from '../../lib/api';
import '../admin-form.css';

function AddUser() {
  const [user, setUser] = useState({
    firstname: '',
    lastname: '',
    email: '',
    username: '',
    password: '',
    company_role: '',
    role: 'employee',
    hired_date: '',
    manager_id: '',
    department_id: '',
  });
  const [image, setImage] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    api.get('/departments')
      .then((response) => {
        setDepartments(response.data);
      })
      .catch(() => {
        setErrorMessage('Failed to load departments.');
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('firstname', user.firstname);
    formData.append('lastname', user.lastname);
    formData.append('email', user.email);
    formData.append('username', user.username);
    formData.append('password', user.password);
    formData.append('company_role', user.company_role);
    formData.append('role', user.role);
    formData.append('hired_date', user.hired_date);
    formData.append('manager_id', user.manager_id);
    formData.append('department_id', user.department_id);

    if (image) {
      formData.append('image', image);
    }

    try {
      await api.post('/users', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage('Added user successfully!');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to create a new user!');
    }
  };

  return (
    <section className="admin-form-page">
      <Helmet>
        <title>Add User</title>
      </Helmet>
      <form className="admin-form-shell single-column" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="admin-form-header">
          <h1 className="admin-form-title">Add User</h1>
          <p className="admin-form-subtitle">Create a user with department, reporting line, and secure role access.</p>
        </div>
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label className="admin-form-label">First Name</label>
            <input type="text" name="firstname" className="admin-form-input" value={user.firstname} onChange={handleInputChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Last Name</label>
            <input type="text" name="lastname" className="admin-form-input" value={user.lastname} onChange={handleInputChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Email</label>
            <input type="email" name="email" className="admin-form-input" value={user.email} onChange={handleInputChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Username</label>
            <input type="text" name="username" className="admin-form-input" value={user.username} onChange={handleInputChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Password</label>
            <input type="password" name="password" className="admin-form-input" value={user.password} onChange={handleInputChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Company Role</label>
            <input type="text" name="company_role" className="admin-form-input" value={user.company_role} onChange={handleInputChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Access Role</label>
            <select name="role" className="admin-form-select" value={user.role} onChange={handleInputChange}>
              {ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Hired Date</label>
            <input type="date" name="hired_date" className="admin-form-input" value={user.hired_date} onChange={handleInputChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Manager ID</label>
            <input type="number" name="manager_id" className="admin-form-input" value={user.manager_id} onChange={handleInputChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Department</label>
            <select name="department_id" className="admin-form-select" value={user.department_id} onChange={handleInputChange}>
              <option value="">Select Department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-field full-width">
            <label className="admin-form-label">Profile Image</label>
            <input type="file" className="admin-form-file" onChange={handleImageChange} />
          </div>
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-dark">
            Add User
          </button>
        </div>
        <div className="admin-form-status">
          {successMessage && <p className="text-success">{successMessage}</p>}
          {errorMessage && <p className="text-danger">{errorMessage}</p>}
        </div>
      </form>
    </section>
  );
}

export default AddUser;
