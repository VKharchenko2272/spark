import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../../lib/api';
import '../admin-form.css';

function AddDepartment() {
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [department, setDepartment] = useState({
    name: '',
  });

  const handleInputChange = (e) => {
    const { value } = e.target;
    setDepartment({ name: value });
  };

  const handleSubmit = async (e) => {
    setErrorMessage('');
    setSuccessMessage('');
    e.preventDefault();

    try {
      await api.post('/departments', department, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setSuccessMessage('Department added successfully');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to create a new department');
    }
  };

  return (
    <section className="admin-form-page">
      <Helmet>
        <title>Add Department</title>
      </Helmet>
      <form className="admin-form-shell" onSubmit={handleSubmit}>
        <h1 className="admin-form-title">Add Department</h1>
        <p className="admin-form-subtitle">Create a department that can be assigned to employees and dashboards.</p>
        <div className="admin-form-grid">
          <div className="admin-form-field full-width">
            <label className="admin-form-label">Department name</label>
            <input className="admin-form-input" type="text" value={department.name} onChange={handleInputChange} />
          </div>
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-dark">
            Add Department
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

export default AddDepartment;
