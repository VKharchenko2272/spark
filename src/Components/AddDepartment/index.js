import axios from "axios";
import React, { useState } from "react";
import { Helmet } from 'react-helmet-async';

function AddDepartment() {
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [department, setDepartment] = useState({
        name: "",
    });

    // Handle input change
    const handleInputChange = (e) => {
        const { value } = e.target;
        setDepartment({ name: value }); // Update the department name state
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        setErrorMessage('');  // Очистка предыдущих ошибок
        setSuccessMessage('');
        e.preventDefault();

        console.log("Submitting department:", department);

        try {
            // Send the data as JSON
            const response = await axios.post(
                "http://localhost:5212/departments",
                department, // Send the department object directly
                {
                    headers: {
                        "Content-Type": "application/json", // Set the content type to JSON
                    },
                }
            );
            setSuccessMessage('Department added successfully');
            console.log("Response:", response.data);
        } catch (error) {
            console.error("There was an error!", error);
            setErrorMessage('Failed to create a new department');
        }
    };

    return (
        <div className="container mt-5">
        <Helmet> <title>Add Department</title></Helmet>
            <form className='form-margin' onSubmit={handleSubmit}>
                <ul className="list-group">
                    <li className="list-group-item">
                        <label className="form-label">Add department:</label>
                        <input
                            className="form-control"
                            type="text"
                            value={department.name}
                            onChange={handleInputChange} // Add onChange handler
                        />
                    </li>
                    <button type="submit form-margin" className="btn btn-primary mt-3">
                        Add Department
                    </button>
                </ul>


            </form>
            <div className="status-message form-margin">
                {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            </div>
        </div>
    );
}

export default AddDepartment;
