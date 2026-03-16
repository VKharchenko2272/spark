import { Link } from 'react-router-dom';
import React from 'react';
import PropTypes from 'prop-types';
import '../right-panel-style.css';
import { useAuth } from '../../../auth/AuthContext';

function PageHome({ userId, isEvaluationExists, isLoading }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isTheSamePerson = String(userId) === String(user?.id);

  return (
    <div className="col-auto right-panel-width">
      <div className="row flex-column gy-3 right-panel-view-evaluation-button">
        {isAdmin && (
          <Link to={`/EditUser/${userId}`} className="col-12 py-1 btn btn-dark">
            Edit User
          </Link>
        )}

        {isLoading ? (
          <button className="col-12 py-1 btn btn-dark" disabled>
            Loading...
          </button>
        ) : (
          isEvaluationExists && (
            <Link to={`/View/${userId}`} className="col-12 py-1 btn btn-dark">
              View evaluation
            </Link>
          )
        )}

        {!isEvaluationExists && (isAdmin || isManager) && !isTheSamePerson && (
          <Link to={`/Eval/${userId}`} className="col-12 py-1 btn btn-dark">
            Evaluation
          </Link>
        )}
      </div>
    </div>
  );
}

export default PageHome;

PageHome.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  isEvaluationExists: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
};
