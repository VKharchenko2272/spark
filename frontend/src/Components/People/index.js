import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import checkmark_icon from './img/check.png';
import edit_icon from './img/edit.png';
import delete_icon from './img/delete.png';
import profile_icon from './img/profile.png';
import './people-style.css';
import ConfirmationModal from '../ConfirmationModal';
import DeleteYourselfModal from '../DeleteYourselfModal';
import SearchBar from '../SearchBar';
import { useAuth } from '../../auth/AuthContext';
import { api, apiFetch, buildApiUrl } from '../../lib/api';

function People() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteYourselfModalOpen, setIsDeleteYourselfModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteSelected, setDeleteSelected] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editUserId, setEditUserId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const menuCloseTimerRef = useRef(null);
  const [editFormValues, setEditFormValues] = useState({
    firstname: '',
    lastname: '',
    email: '',
    company_role: '',
    department_id: '',
    hired_date: '',
  });

  const currentUserId = user?.id ?? null;
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const filteredPeople = people.filter((person) =>
    `${person.firstname || ''} ${person.lastname || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target instanceof Element ? event.target : null;

      if (!target) {
        return;
      }

      if (!target.closest('.ellipsis-container') && !target.closest('.people-action-menu')) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => () => {
    if (menuCloseTimerRef.current) {
      window.clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const loadPageData = async () => {
      try {
        setLoading(true);
        const [usersResponse, departmentsResponse] = await Promise.all([
          api.get('/users'),
          api.get('/departments'),
        ]);

        const nextPeople = usersResponse.data || [];
        setPeople(nextPeople);
        setDepartments(departmentsResponse.data || []);

        const statusEntries = await Promise.all(
          nextPeople.map(async (person) => {
            const statusResponse = await api.get(`/evaluations/users/${person.id}/status`);
            return [person.id, statusResponse.data.status];
          })
        );

        setStatuses(Object.fromEntries(statusEntries));
        setErrorMessage('');
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Failed to load users.');
      } finally {
        setLoading(false);
      }
    };

    void loadPageData();
  }, [currentUserId, user?.role]);

  useEffect(() => {
    const allFilteredSelected =
      filteredPeople.length > 0 && filteredPeople.every((person) => selectedRows[person.id]);
    setSelectAll(allFilteredSelected);
  }, [filteredPeople, selectedRows]);

  const handleDeleteClick = (id) => {
    if (menuCloseTimerRef.current) {
      window.clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }

    setOpenMenuId(null);
    setMenuPosition(null);

    if (id === currentUserId) {
      setIsDeleteYourselfModalOpen(true);
      return;
    }

    setDeleteUserId(id);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const idsToDelete = deleteUserId ? [deleteUserId] : deleteSelected;

    try {
      const responses = await Promise.all(
        idsToDelete.map((id) =>
          apiFetch(`/users/${id}`, {
            method: 'DELETE',
          })
        )
      );

      const failedDeletes = responses.filter((response) => !response.ok);

      if (failedDeletes.length > 0) {
        const errorPayload = await failedDeletes[0].json().catch(() => null);
        setSuccessMessage('');
        setErrorMessage(errorPayload?.message || 'Some users could not be deleted.');
        return;
      }

      setPeople((prevPeople) => prevPeople.filter((person) => !idsToDelete.includes(person.id)));
      setStatuses((prevStatuses) => {
        const nextStatuses = { ...prevStatuses };
        idsToDelete.forEach((id) => {
          delete nextStatuses[id];
        });
        return nextStatuses;
      });
      setSelectedRows((prevRows) => {
        const nextRows = { ...prevRows };
        idsToDelete.forEach((id) => {
          delete nextRows[id];
        });
        return nextRows;
      });
      setSuccessMessage(idsToDelete.length > 1 ? 'Users deleted successfully.' : 'User deleted successfully.');
      setErrorMessage('');
    } catch (error) {
      setSuccessMessage('');
      setErrorMessage(error?.message || 'An error occurred while deleting users.');
    } finally {
      setIsModalOpen(false);
      setDeleteUserId(null);
      setDeleteSelected([]);
    }
  };

  const handleCancelDelete = () => {
    setIsModalOpen(false);
    setIsDeleteYourselfModalOpen(false);
    setDeleteUserId(null);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    const nextSelectedRows = { ...selectedRows };

    filteredPeople.forEach((person) => {
      nextSelectedRows[person.id] = newSelectAll;
    });

    setSelectedRows(nextSelectedRows);
    setDeleteSelected(
      Object.keys(nextSelectedRows)
        .filter((key) => nextSelectedRows[key])
        .map(Number)
    );
  };

  const handleRowSelect = (id) => {
    const nextSelectedRows = { ...selectedRows, [id]: !selectedRows[id] };
    setSelectedRows(nextSelectedRows);
    setDeleteSelected(
      Object.keys(nextSelectedRows)
        .filter((key) => nextSelectedRows[key])
        .map(Number)
    );
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleEditClick = (person) => {
    if (menuCloseTimerRef.current) {
      window.clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }

    setOpenMenuId(null);
    setMenuPosition(null);
    setEditUserId(person.id);
    setEditFormValues({
      firstname: person.firstname || '',
      lastname: person.lastname || '',
      email: person.email || '',
      company_role: person.company_role || '',
      department_id: person.department?.id || '',
      hired_date: person.hired_date ? person.hired_date.split('T')[0] : '',
    });
  };

  const handleSaveClick = async () => {
    try {
      const payload = {
        firstname: editFormValues.firstname?.trim() || null,
        lastname: editFormValues.lastname?.trim() || null,
        email: editFormValues.email?.trim() || null,
        company_role: editFormValues.company_role?.trim() || null,
        department_id:
          editFormValues.department_id === '' || editFormValues.department_id == null
            ? null
            : Number(editFormValues.department_id),
        hired_date: editFormValues.hired_date?.trim() || null,
      };

      const response = await apiFetch(`/users/${editUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        setSuccessMessage('');
        setErrorMessage(errorPayload?.message || 'Failed to save user changes.');
        return;
      }

      const updatedUser = await response.json();
      setPeople((prevPeople) =>
        prevPeople.map((person) => (person.id === editUserId ? updatedUser : person))
      );
      setEditUserId(null);
      setSuccessMessage('User updated successfully.');
      setErrorMessage('');
    } catch (error) {
      setSuccessMessage('');
      setErrorMessage(error?.message || 'Failed to save user changes.');
    }
  };

  const handleCancelClick = () => {
    setEditUserId(null);
  };

  const handleSort = (field) => {
    const nextSortOrder =
      sortField === field && sortOrder === 'asc'
        ? 'desc'
        : 'asc';

    const sortedPeople = [...people].sort((a, b) => {
      let aField = '';
      let bField = '';

      switch (field) {
        case 'name':
          aField = `${a.firstname || ''} ${a.lastname || ''}`.toLowerCase();
          bField = `${b.firstname || ''} ${b.lastname || ''}`.toLowerCase();
          break;
        case 'department':
          aField = a.department?.name?.toLowerCase() || '';
          bField = b.department?.name?.toLowerCase() || '';
          break;
        case 'title':
          aField = a.company_role?.toLowerCase() || '';
          bField = b.company_role?.toLowerCase() || '';
          break;
        default:
          break;
      }

      if (aField < bField) {
        return nextSortOrder === 'asc' ? -1 : 1;
      }

      if (aField > bField) {
        return nextSortOrder === 'asc' ? 1 : -1;
      }

      return 0;
    });

    setPeople(sortedPeople);
    setSortField(field);
    setSortOrder(nextSortOrder);
  };

  const handleMenuToggle = (id, event) => {
    if (menuCloseTimerRef.current) {
      window.clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }

    const triggerElement =
      event?.currentTarget instanceof Element
        ? event.currentTarget
        : event?.target instanceof Element
          ? event.target.closest('.ellipsis-button')
          : null;
    const triggerRect = triggerElement?.getBoundingClientRect() || null;

    setOpenMenuId((currentOpenMenuId) => {
      if (currentOpenMenuId === id) {
        setMenuPosition(null);
        return null;
      }

      if (triggerRect) {
        setMenuPosition({
          top: triggerRect.top - 8,
          left: triggerRect.left - 170,
        });
      }
      return id;
    });
  };

  const cancelMenuClose = () => {
    if (menuCloseTimerRef.current) {
      window.clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }
  };

  const scheduleMenuClose = () => {
    cancelMenuClose();
    menuCloseTimerRef.current = window.setTimeout(() => {
      setOpenMenuId(null);
      setMenuPosition(null);
      menuCloseTimerRef.current = null;
    }, 200);
  };

  const handleDeleteSelectedClick = () => {
    if (deleteSelected.length === 0) {
      setSuccessMessage('');
      setErrorMessage('No users selected for deletion.');
      return;
    }

    setIsModalOpen(true);
  };

  const activeMenuPerson = people.find((person) => person.id === openMenuId) || null;
  const activeMenuCanEdit = activeMenuPerson
    ? isAdmin || (isManager && activeMenuPerson.manager_id === currentUserId)
    : false;
  const activeMenuCanEvaluate = activeMenuPerson
    ? activeMenuCanEdit && activeMenuPerson.id !== currentUserId
    : false;
  const activeMenuCanDelete = activeMenuPerson
    ? isAdmin && activeMenuPerson.id !== currentUserId
    : false;

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <section className="people-page">
      <Helmet>
        <title>People</title>
      </Helmet>

      <div className="people-toolbar">
        <div className="people-toolbar-header">
          <div className="people-toolbar-main">
            <h1 className="people-title">People</h1>
            <p className="people-subtitle">Manage employees, review status, and access role-based actions.</p>
          </div>
          <div className="people-toolbar-actions">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
        </div>

        {isAdmin && (
          <div className="people-action-bar">
            <div className="button-wrapper people-primary-actions">
              <div className="left-button-container">
                <Link to="/Add" className="btn btn-dark">
                  Add User
                </Link>
                <Link to="/AddDepartment" className="btn btn-dark add-department-btn">
                  Add Department
                </Link>
              </div>
            </div>
            <button
              onClick={handleDeleteSelectedClick}
              className="btn btn-danger people-delete-button"
              disabled={deleteSelected.length === 0}
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {successMessage && <p className="text-success">{successMessage}</p>}
      {errorMessage && <p className="text-danger">{errorMessage}</p>}

      <div className="people-table-card">
      <div className="people-table-scroll">
      <table className="people-container">
        <thead>
          <tr>
            {isAdmin && (
              <th>
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
              </th>
            )}
            <th>Image</th>
            <th className="sort" onClick={() => handleSort('name')}>
              Full Name{sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
            </th>
            <th>Date</th>
            <th className="sort" onClick={() => handleSort('department')}>
              Department{sortField === 'department' && (sortOrder === 'asc' ? '▲' : '▼')}
            </th>
            <th className="sort" onClick={() => handleSort('title')}>
              Title{sortField === 'title' && (sortOrder === 'asc' ? '▲' : '▼')}
            </th>
            <th className="th-email">Email</th>
            <th className="th-status">Status</th>
            <th className="th-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredPeople.map((person) => {
            const canEditRow = isAdmin || (isManager && person.manager_id === currentUserId);
            const canEvaluateRow = canEditRow && person.id !== currentUserId;
            const canDeleteRow = isAdmin && person.id !== currentUserId;
            const hasActions = canEvaluateRow || canEditRow || canDeleteRow;

            return (
              <tr key={person.id}>
                {isAdmin && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows[person.id] || false}
                      onChange={() => handleRowSelect(person.id)}
                    />
                  </td>
                )}
                <td className="img-box">
                  {person.img ? (
                    <img
                      className="img"
                      src={buildApiUrl(`/users/${person.id}/image`)}
                      alt={`${person.firstname || ''} ${person.lastname || ''}`.trim()}
                      style={{ width: '45px', height: '45px', borderRadius: '50%' }}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = profile_icon;
                      }}
                    />
                  ) : (
                    <img
                      className="img"
                      src={profile_icon}
                      alt="Default Avatar"
                      style={{ width: '45px', height: '45px', borderRadius: '50%' }}
                    />
                  )}
                </td>
                <td>
                  {editUserId === person.id ? (
                    <>
                      <input
                        type="text"
                        name="firstname"
                        className="edit-field"
                        value={editFormValues.firstname}
                        onChange={handleInputChange}
                      />
                      <input
                        type="text"
                        name="lastname"
                        className="edit-field"
                        value={editFormValues.lastname}
                        onChange={handleInputChange}
                      />
                    </>
                  ) : (
                    <Link to={`/home/${person.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {person.firstname} {person.lastname}
                    </Link>
                  )}
                </td>
                <td>
                  {editUserId === person.id ? (
                    <input
                      type="date"
                      name="hired_date"
                      className="edit-field"
                      value={editFormValues.hired_date}
                      onChange={handleInputChange}
                    />
                  ) : (
                    person.hired_date?.split('T')[0] || ''
                  )}
                </td>
                <td>
                  {editUserId === person.id ? (
                    <select
                      name="department_id"
                      className="edit-field"
                      value={editFormValues.department_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    person.department?.name || ''
                  )}
                </td>
                <td>
                  {editUserId === person.id ? (
                    <input
                      type="text"
                      name="company_role"
                      className="edit-field"
                      value={editFormValues.company_role}
                      onChange={handleInputChange}
                    />
                  ) : (
                    person.company_role
                  )}
                </td>
                <td className="td-email">
                  {editUserId === person.id ? (
                    <input
                      type="text"
                      name="email"
                      className="edit-field"
                      value={editFormValues.email}
                      onChange={handleInputChange}
                    />
                  ) : (
                    person.email
                  )}
                </td>
                <td className="th-status">
                  {statuses[person.id] === 'Done' && <button className="td-status-a">Done</button>}
                  {statuses[person.id] === 'Not Done' && <button className="td-status-b">Not Done</button>}
                </td>
                <td className="td-action-b">
                  {editUserId === person.id ? (
                    <>
                      <button className="edit-field" onClick={handleSaveClick}>
                        Save
                      </button>
                      <button className="edit-field" onClick={handleCancelClick}>
                        Cancel
                      </button>
                    </>
                  ) : hasActions ? (
                    <div
                      className="ellipsis-container"
                      onMouseEnter={cancelMenuClose}
                      onMouseLeave={scheduleMenuClose}
                    >
                      <button
                        className="ellipsis-button"
                        onClick={(event) => handleMenuToggle(person.id, event)}
                      >
                        &#x2026;
                      </button>
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      </div>

      <DeleteYourselfModal
        isOpen={isDeleteYourselfModalOpen}
        onCancel={handleCancelDelete}
        message="You cannot delete your own account!"
      />
      {activeMenuPerson && menuPosition && (
        <div
          className="people-action-menu"
          onMouseEnter={cancelMenuClose}
          onMouseLeave={scheduleMenuClose}
          style={{
            top: `${Math.max(menuPosition.top, 96)}px`,
            left: `${Math.max(menuPosition.left, 16)}px`,
          }}
        >
          {activeMenuCanEvaluate && (
            <button
              onClick={() => {
                cancelMenuClose();
                setOpenMenuId(null);
                setMenuPosition(null);
                navigate(`/Eval/${activeMenuPerson.id}`);
              }}
            >
              <img src={checkmark_icon} alt="checkmark" /> Evaluate
            </button>
          )}
          {activeMenuCanEdit && (
            <button onClick={() => handleEditClick(activeMenuPerson)}>
              <img src={edit_icon} alt="edit" /> Edit
            </button>
          )}
          {activeMenuCanDelete && (
            <button onClick={() => handleDeleteClick(activeMenuPerson.id)}>
              <img src={delete_icon} alt="delete" /> Delete
            </button>
          )}
        </div>
      )}
      <ConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </section>
  );
}

export default People;
