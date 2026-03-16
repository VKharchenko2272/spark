import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import profile_icon from './img/profile_icon.svg';
import metrics_icon from './img/metrics_icon.svg';
import people_icon from './img/people_icon.svg';
import './nav-menu-style.css';
import { useAuth } from '../../auth/AuthContext';

function NavMenu() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  if (!user || (!isAdmin && !isManager)) {
    return null;
  }

  return (
    <ul className="custom-col-width nav-menu">
      <li className={`nav-element ${location.pathname === `/home/${user.id}` ? 'active' : ''}`}>
        <Link className="nav-element-link" to={`/home/${user.id}`}>
          <span className="nav-text">
            <img className="nav-element-icon" src={profile_icon} alt="Home icon" />
            Home
          </span>
        </Link>
      </li>
      <li className={`nav-element ${location.pathname === `/DepMetrics` ? 'active' : ''}`}>
        <Link className="nav-element-link" to="/DepMetrics">
          <span className="nav-text">
            <img className="nav-element-icon" src={metrics_icon} alt="Department metrics" />
            Department metrics
          </span>
        </Link>
      </li>
      <li className={`nav-element ${location.pathname === `/People` ? 'active' : ''}`}>
        <Link className="nav-element-link" to="/People">
          <span className="nav-text">
            <img className="nav-element-icon" src={people_icon} alt="People" />
            People
          </span>
        </Link>
      </li>
    </ul>
  );
}

export default NavMenu;
