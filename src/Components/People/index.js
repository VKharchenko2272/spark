import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import checkmark_icon from "./img/check.png";
import edit_icon from "./img/edit.png";
import delete_icon from "./img/delete.png";
import profile_icon from "./img/profile.png"
import './people-style.css';
import ConfirmationModal from '../ConfirmationModal';
import DeleteYourselfModal from '../DeleteYourselfModal';
import SearchBar from '../SearchBar';
import axios from 'axios';

function People() {
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [department, setDepartments] = useState([]); // Fetch department list
    const [selectAll, setSelectAll] = useState(false);
    const [selectedRows, setSelectedRows] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const [isDeleteYourselfModalOpen, setIsDeleteYourselfModalOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState(null); // State to hold the ID of the user to delete
    const [statuses, setStatuses] = useState({});
    const [searchQuery, setSearchQuery] = useState(''); // Состояние для поиска
    const [filteredPeople, setFilteredPeople] = useState([]); // Состояние для отфильтрованных данных
    const [deleteSelected, setDeleteSelected] = useState([]); // State for storing selected users for deletion

    const currentUserId = parseInt(localStorage.getItem('userId')); // Fetch the current user ID as an integer
    const isAdmin = localStorage.getItem('isAdmin');

    const handleDeleteClick = (id) => {
        if (id === currentUserId) {
            setIsDeleteYourselfModalOpen(true);
            return;
        }
        setDeleteUserId(id); // Set the ID of the user to delete
        setIsModalOpen(true); // Open the confirmation modal
    };


    // Confirm delete action
    // Confirm delete action for single user
    const handleConfirmDelete = async () => {
        try {
            const idsToDelete = deleteUserId ? [deleteUserId] : deleteSelected;

            const deletePromises = idsToDelete.map(id =>
                fetch(`http://localhost:5212/employees/${id}`, {
                    method: 'DELETE',
                })
            );

            const responses = await Promise.all(deletePromises);

            const failedDeletes = responses.filter(response => !response.ok);

            if (failedDeletes.length === 0) {
                setPeople(prevPeople => prevPeople.filter(person => !idsToDelete.includes(person.id)));
                alert('Users deleted successfully.');
            } else {
                alert('Some users could not be deleted.');
            }
        } catch (error) {
            console.error('Error deleting users:', error);
            alert('An error occurred while deleting the users.');
        } finally {
            setIsModalOpen(false);
            setDeleteUserId(null);
            setDeleteSelected([]);
        }
    };

    // Cancel delete action
    const handleCancelDelete = () => {
        setIsModalOpen(false); // Simply close the modal
        setIsDeleteYourselfModalOpen(false);
        setDeleteUserId(null);
    };

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:5212/employees`);
                const data = await response.json();

                // Filter people based on manager_id matching currentUserId
                const filteredData = data.filter(person => person.manager_id === currentUserId);

                setPeople(filteredData);
                setLoading(false);

                // Declare statusPromises outside the if-else block
                let statusPromises;
                console.log("is admin", isAdmin)
                if (isAdmin === "true") {
                    setPeople(data);
                    statusPromises = data.map(async (person) => {
                        const statusResponse = await fetch(`http://localhost:5212/status/${person.id}`);
                        const statusData = await statusResponse.json();
                        return { id: person.id, status: statusData.status };
                    });
                } else {
                    statusPromises = filteredData.map(async (person) => {
                        const statusResponse = await fetch(`http://localhost:5212/status/${person.id}`);
                        const statusData = await statusResponse.json();
                        return { id: person.id, status: statusData.status };
                    });
                }

                const statuses = await Promise.all(statusPromises);
                const statusMap = {};
                statuses.forEach((status) => {
                    statusMap[status.id] = status.status;
                });

                setStatuses(statusMap);

            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
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

        fetchDepartments();
        fetchData();
    }, [currentUserId, isAdmin]);

    useEffect(() => {
        const filtered = people.filter(person =>
            `${person.firstname} ${person.lastname}`.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPeople(filtered);
    }, [searchQuery, people]); // Пересчитываем, если изменяются запрос или список людей

    // Track the currently edited user and their form values
    const [editUserId, setEditUserId] = useState(null); // ID of user being edited
    const [editFormValues, setEditFormValues] = useState({
        firstname: '',
        lastname: '',
        email: '',
        company_role: '',
        department_id: '',
        hired_date: ''
    });

    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);

        const newSelectedRows = {};
        people.forEach(person => {
            newSelectedRows[person.id] = newSelectAll;
        });
        setSelectedRows(newSelectedRows);

        setDeleteSelected(newSelectAll ? people.map(person => person.id) : []);
    };

    // Handle individual row checkbox change
    const handleRowSelect = (id) => {
        const newSelectedRows = { ...selectedRows, [id]: !selectedRows[id] };
        setSelectedRows(newSelectedRows);

        const selectedIds = Object.keys(newSelectedRows).filter(key => newSelectedRows[key]).map(Number);
        setDeleteSelected(selectedIds);

        const allSelected = people.every(person => newSelectedRows[person.id]);
        setSelectAll(allSelected);
    };

    // Handle input changes in the inline form
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Directly set the date string (no need to manipulate it with `Date`)
        if (name === 'hired_date') {
            setEditFormValues((prevValues) => ({
                ...prevValues,
                hired_date: value  // Just set the date string as-is
            }));
        } else {
            setEditFormValues((prevValues) => ({
                ...prevValues,
                [name]: value
            }));
        }
    };

    // Handle edit button click - populate the form with existing values
    const handleEditClick = (person) => {
        setEditUserId(person.id); // Set the current user being edited
        setEditFormValues({
            firstname: person.firstname,
            lastname: person.lastname,
            email: person.email,
            company_role: person.company_role,
            department_id: person.department?.id || '', // Set department ID if exists
            hired_date: person.hired_date ? person.hired_date.split('T')[0] : ''// Format date for input
        });
    };



    // Save the updated user information
    const handleSaveClick = async () => {
        try {
            const response = await fetch(`http://localhost:5212/users/${editUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editFormValues)  // Directly use the string values, including the date
            });

            if (response.ok) {
                // Find the department name based on the selected department_id
                const updatedDepartment = department.find(dep => dep.id === Number(editFormValues.department_id));

                // Update the local state with the new user info
                setPeople((prevPeople) =>
                    prevPeople.map((p) =>
                        p.id === editUserId
                            ? {
                                ...p,
                                ...editFormValues,
                                department: updatedDepartment ? { id: updatedDepartment.id, name: updatedDepartment.name } : p.department,
                                // Fix the date issue by removing any timezone shift
                                hired_date: editFormValues.hired_date // Use the date as-is without conversion to UTC

                            }
                            : p
                    )
                );

                // Reset editing state
                setEditUserId(null);
            } else {
                console.error('Error saving data:', response.statusText);
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };


    const handleCancelClick = () => {
        setEditUserId(null); // Cancel the edit
    };



    // Sorting function
    const handleSort = (field) => {
        const sortedPeople = [...people].sort((a, b) => {
            let aField, bField;

            switch (field) {
                case 'name':
                    // Combine firstname and lastname for sorting
                    aField = `${a.firstname} ${a.lastname}`.toLowerCase();
                    bField = `${b.firstname} ${b.lastname}`.toLowerCase();
                    break;
                case 'department':
                    // Access the department name for sorting
                    aField = a.department?.name?.toLowerCase() || '';
                    bField = b.department?.name?.toLowerCase() || '';
                    break;
                case 'title':
                    // Directly access the title for sorting
                    aField = a.company_role?.toLowerCase() || '';
                    bField = b.company_role?.toLowerCase() || '';
                    console.log(`aField: ${aField}, bField: ${bField}`); // Добавим вывод в консоль
                    break;
                default:
                    aField = '';
                    bField = '';
            }

            if (aField < bField) return sortOrder === 'asc' ? -1 : 1;
            if (aField > bField) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        setPeople(sortedPeople);
        // Toggle sort order
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    // Three dotes dropdown menu
    const handleMenuToggle = (id) => {
        setOpenMenuId(openMenuId === id ? null : id); // Open or close the menu
    };

    const dropdownRef = useRef(null);
    const triggerRef = useRef(null); // Reference to the element triggering the dropdown

    // Close the dropdown when clicking outside
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) && triggerRef.current !== event.target) {
            setOpenMenuId(null); // Close any open menu
        }
    };

    // Close the dropdown when the mouse leaves
    const handleMouseLeave = () => {
        setOpenMenuId(null);
    };

    useEffect(() => {
        // Add event listener to handle click outside
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDeleteSelectedClick = () => {
        if (deleteSelected.length === 0) {
            alert("No users selected for deletion.");
            return;
        }
        setIsModalOpen(true);
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div >


            <Helmet><title>People</title></Helmet>
            {/* Компонент поиска */}
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            {isAdmin === 'true' && (
                <div className='button-wrapper'>
                    <div className='left-button-container'>
                        <Link to="/Add" className='btn btn-dark'>
                            Add User
                        </Link>
                        <Link to="/AddDepartment" className='btn btn-dark add-department-btn'>
                            Add Department
                        </Link>
                    </div>
                    <button
                        onClick={handleDeleteSelectedClick}
                        className='btn btn-danger'
                        disabled={deleteSelected.length === 0} // Disable button if no users selected
                    >
                        Delete Selected
                    </button>
                </div>
            )}
            <table className="people-container">
                <thead>
                    <tr>
                        {isAdmin === "true" && (
                            <th><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
                        )}
                        <th>Image</th>
                        <th className='sort' onClick={() => handleSort('name')}>
                            Full Name{sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                        <th>Date</th>
                        <th className='sort' onClick={() => handleSort('department')}>
                            Department{sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                        <th className='sort' onClick={() => handleSort('title')}>
                            Title{sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                        <th className='th-email'>Email</th>
                        <th className='th-status'>Status</th>
                        <th className="th-action">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPeople.map(p => (
                        <tr key={p.id}>{isAdmin === "true" && (
                            <td><input type="checkbox" checked={selectedRows[p.id] || false} onChange={() => handleRowSelect(p.id)} /></td>
                        )}
                            <td className='img-box'>
                                {p.img ? (
                                    <img className='img'
                                        src={`http://localhost:5212/images/${p.id}`} // Fetch the image from your backend
                                        alt={`${p.firstname} ${p.lastname}`}
                                        style={{ width: '45px', height: '45px', borderRadius: '50%' }}
                                    />
                                ) : (
                                    <img className='img'
                                        src={profile_icon} // Fallback image
                                        alt="Default Avatar"
                                        style={{ width: '45px', height: '45px', borderRadius: '50%' }}
                                    />
                                )}
                            </td>
                            <td>
                                {editUserId === p.id ? (
                                    <>
                                        <input
                                            type="text"
                                            name="firstname"
                                            className='edit-field'
                                            value={editFormValues.firstname}
                                            onChange={handleInputChange}
                                        />
                                        <input
                                            type="text"
                                            name="lastname" // <-- Added lastname input
                                            className='edit-field'
                                            value={editFormValues.lastname}
                                            onChange={handleInputChange}
                                        />
                                    </>
                                ) : (
                                    <Link to={`/home/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {p.firstname} {p.lastname}
                                    </Link>
                                )}
                            </td>
                            <td>
                                {editUserId === p.id ? (
                                    <input
                                        type="date"
                                        name="hired_date"
                                        className='edit-field'
                                        value={editFormValues.hired_date}  // Use the raw string from the state
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    p.hired_date.split('T')[0] // Display the date as it is, without converting to Date object
                                )}
                            </td>
                            <td>
                                {editUserId === p.id ? (
                                    <select
                                        name="department_id"
                                        className='edit-field'
                                        value={editFormValues.department_id}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Department</option>
                                        {department.map(department => (
                                            <option key={department.id} value={department.id}>
                                                {department.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    p.department?.name
                                )}
                            </td>
                            <td>
                                {editUserId === p.id ? (
                                    <input
                                        type="text"
                                        name="company_role"
                                        className='edit-field'
                                        value={editFormValues.company_role}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    p.company_role
                                )}
                            </td>
                            <td className='td-email'>
                                {editUserId === p.id ? (
                                    <input
                                        type="text"
                                        name="email"
                                        className='edit-field'
                                        value={editFormValues.email}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    p.email
                                )}
                            </td>
                            <td className='th-status'>
                                {statuses[p.id] !== undefined && ( // Проверка, если данные статуса загружены
                                    statuses[p.id] === 'Done' ? (
                                        <button className="td-status-a">Done</button>
                                    ) : (
                                        <button className="td-status-b">Not Done</button>
                                    )
                                )}
                            </td>


                            <td className="td-action-b">
                                {editUserId === p.id ? (
                                    <>
                                        <button className='edit-field' onClick={handleSaveClick}>Save</button>
                                        <button className='edit-field' onClick={handleCancelClick}>Cancel</button>
                                    </>
                                ) : (
                                    <div className="ellipsis-container">
                                        <button
                                            className="ellipsis-button"
                                            onClick={() => handleMenuToggle(p.id)}
                                        >
                                            &#x2026; {/* This represents the three dots */}
                                        </button>
                                        {openMenuId === p.id && (
                                            <div
                                                className={isAdmin === 'true' ? 'dropdown-menu-admin' : 'dropdown-menu-manager'}
                                                ref={dropdownRef}
                                                onMouseLeave={handleMouseLeave}>
                                                <button onClick={() => window.location.href = `/Eval/${p.id}`}>
                                                    <img src={checkmark_icon} alt="checkmark" /> Evaluate
                                                </button>
                                                <button onClick={() => handleEditClick(p)}>
                                                    <img src={edit_icon} alt="edit" /> Edit
                                                </button>
                                                {isAdmin === 'true' && (
                                                    <button onClick={() => handleDeleteClick(p.id)}>
                                                        <img src={delete_icon} alt="delete" /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <DeleteYourselfModal
                isOpen={isDeleteYourselfModalOpen}
                onCancel={handleCancelDelete}
                message="You cannot delete your own account!"
            />
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isModalOpen}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                message="Are you sure you want to delete this user? This action cannot be undone."
            />
        </div>
    );
}

export default People;
