import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BurgerMenu.css';
import profile_icon from './img/profile_icon.svg';
import metrics_icon from './img/metrics_icon.svg';
import people_icon from './img/people_icon.svg';
import { useAuth } from '../../auth/AuthContext';

const BurgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const closeTimerRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const cancelCloseMenu = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleCloseMenu = () => {
    cancelCloseMenu();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, 200);
  };

  useEffect(() => {
    return () => {
      cancelCloseMenu();
    };
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div
      className="burger-menu col-auto p-0"
      onMouseEnter={cancelCloseMenu}
      onMouseLeave={scheduleCloseMenu}
    >
      <div className={`burger-icon ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
        <div className="line1"></div>
        <div className="line2"></div>
        <div className="line3"></div>
      </div>
      <nav className={`menu ${isOpen ? 'open' : ''}`}>
        <ul>
          <div className={`burger-element ${location.pathname === `/home/${user.id}` ? 'active' : ''}`}>
            <li>
              <Link to={`/home/${user.id}`} onClick={() => setIsOpen(false)}>
                <img className="burger-menu-icon" src={profile_icon} alt="Home" />
                <p className="m-0 ps-2">Home</p>
              </Link>
            </li>
          </div>
          <div className={`burger-element ${location.pathname === `/DepMetrics` ? 'active' : ''}`}>
            <li>
              <Link to="/DepMetrics" onClick={() => setIsOpen(false)}>
                <img className="burger-menu-icon" src={metrics_icon} alt="Metrics" />
                <p className="m-0 ps-2">Metrics</p>
              </Link>
            </li>
          </div>
          <div className={`burger-element ${location.pathname === `/People` ? 'active' : ''}`}>
            <li>
              <Link to="/People" onClick={() => setIsOpen(false)}>
                <img className="burger-menu-icon" src={people_icon} alt="People" />
                <p className="m-0 ps-2">People</p>
              </Link>
            </li>
          </div>
        </ul>
      </nav>
    </div>
  );
};

export default BurgerMenu;
