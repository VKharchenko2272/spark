import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
    const userId = localStorage.getItem('userId');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'; // check isAuthenticated 
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const isManager = localStorage.getItem('isManager') === 'true';
    const { id } = useParams();

    const userRoles = [];
    if (isAdmin) userRoles.push('admin');
    if (isManager) userRoles.push('manager');
    if (!isAdmin && !isManager) userRoles.push('employee');

    const hasAccess = isAuthenticated && allowedRoles.some(role => userRoles.includes(role));

    const isOwnPage = parseInt(id) === parseInt(userId);


    if (userRoles.includes('employee') && (id && !isOwnPage)) {
        return <Navigate to="/Login" />; // Redirect if the ID doesn't match
    }

    console.log(userRoles);
    return hasAccess ? children : <Navigate to="/Login" />;

};

export default PrivateRoute;
