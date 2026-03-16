import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './edit.css';
import { Helmet } from 'react-helmet-async';
import { ROLE_OPTIONS } from '../../data/roles';
import { api } from '../../lib/api';
import '../admin-form.css';

const EditUser = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState({
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
    img: false,
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
        const response = await api.get(`/users/${id}`);
        const data = response.data;
        if (data.hired_date) {
          data.hired_date = data.hired_date.split('T')[0];
        }
        setEmployee((prev) => ({
          ...prev,
          ...data,
          password: '',
        }));
        setLoading(false);
      } catch {
        setErrorMessage('Failed to fetch employee.');
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments');
        setDepartments(response.data);
      } catch {
        setErrorMessage('Failed to fetch departments.');
      }
    };

    void fetchEmployee();
    void fetchDepartments();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('firstname', employee.firstname);
    formData.append('lastname', employee.lastname);
    formData.append('email', employee.email);
    formData.append('username', employee.username);
    formData.append('password', employee.password);
    formData.append('company_role', employee.company_role);
    formData.append('role', employee.role);
    formData.append('hired_date', employee.hired_date);
    formData.append('manager_id', employee.manager_id || '');
    formData.append('department_id', employee.department_id || '');

    if (file) {
      formData.append('image', file);
    }

    try {
      await api.put(`/users/${id}`, formData);
      setSuccessMessage('Employee updated successfully!');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to update employee.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <section className="admin-form-page">
      <Helmet>
        <title>Edit User</title>
      </Helmet>
      <form className="admin-form-shell" onSubmit={handleSubmit} encType="multipart/form-data">
        <h1 className="admin-form-title">Edit Employee</h1>
        <p className="admin-form-subtitle">Update profile details, access role, department assignment, and credentials.</p>
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label className="admin-form-label">First Name</label>
            <input type="text" name="firstname" className="admin-form-input" value={employee.firstname} onChange={handleChange} required />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Last Name</label>
            <input type="text" name="lastname" className="admin-form-input" value={employee.lastname} onChange={handleChange} required />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Email</label>
            <input type="email" name="email" className="admin-form-input" value={employee.email} onChange={handleChange} required />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Username</label>
            <input type="text" name="username" className="admin-form-input" value={employee.username} onChange={handleChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Password</label>
            <input type="password" name="password" className="admin-form-input" value={employee.password} onChange={handleChange} placeholder="Leave blank to keep the current password" />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Company Role</label>
            <input type="text" name="company_role" className="admin-form-input" value={employee.company_role} onChange={handleChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Access Role</label>
            <select name="role" className="admin-form-select" value={employee.role} onChange={handleChange}>
              {ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Hired Date</label>
            <input type="date" name="hired_date" className="admin-form-input" value={employee.hired_date || ''} onChange={handleChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Manager ID</label>
            <input type="number" name="manager_id" className="admin-form-input" value={employee.manager_id || ''} onChange={handleChange} />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Department</label>
            <select name="department_id" className="admin-form-select" value={employee.department_id || ''} onChange={handleChange}>
              <option value="">Select Department</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-field full-width">
            <label className="admin-form-label">Upload Image</label>
            <input type="file" name="image" className="admin-form-file" onChange={handleFileChange} />
          </div>
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-dark">
            Update Employee
          </button>
        </div>
        <div className="admin-form-status">
          {successMessage && <p className="text-success">{successMessage}</p>}
          {errorMessage && <p className="text-danger">{errorMessage}</p>}
        </div>
      </form>
    </section>
  );
};

export default EditUser;
