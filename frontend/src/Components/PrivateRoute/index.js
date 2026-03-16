import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { id } = useParams();
  const location = useLocation();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/Login" replace state={{ from: location }} />;
  }

  const hasAccess = allowedRoles.includes(user.role);
  const isOwnPage = id ? Number(id) === Number(user.id) : true;

  if (user.role === 'employee' && id && !isOwnPage) {
    return <Navigate to="/Login" replace />;
  }

  return hasAccess ? children : <Navigate to="/Login" replace />;
};

export default PrivateRoute;

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};
