import React, { useState } from 'react';
import {Link, useLocation} from 'react-router-dom';

import './BurgerMenu.css';

import profile_icon from "./img/profile_icon.svg";
import metrics_icon from "./img/metrics_icon.svg";
import people_icon from "./img/people_icon.svg";

const BurgerMenu = ({userRole}) => {
  const [isOpen, setIsOpen] = useState(false);
  const userId = localStorage.getItem('userId');
  const location = useLocation();

const isAdmin = localStorage.getItem("isAdmin") === "true";


  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="burger-menu col-auto p-0">
      <div className={`burger-icon ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
        <div className="line1"></div>
        <div className="line2"></div>
        <div className="line3"></div>
      </div>
      <nav className={`menu ${isOpen ? 'open' : ''}`}>
        <ul>
          <div className={`burger-element ${location.pathname === `/home/${userId}` ? 'active' : ''}`}>

            <li>
              <Link to={`/home/${userId}`}>
                <img className="burger-menu-icon" src={profile_icon} />
                <p className='m-0 ps-2'>Home</p>
              </Link>
            </li>

          </div>
          <div className={`burger-element ${location.pathname === `/DepMetrics` ? 'active' : ''}`}>

            <li>
              <Link to="/DepMetrics">
                <img className="burger-menu-icon" src={metrics_icon} />
                <p className='m-0 ps-2'>Metrics</p>
              </Link>
            </li>

          </div>
          <div className={`burger-element ${location.pathname === `/People` ? 'active' : ''}`}>

            <li>
              <Link to="/People">
                <img className="burger-menu-icon" src={people_icon} />
                <p className='m-0 ps-2'>People</p>
              </Link>
            </li>

          </div>
        </ul>
      </nav>
    </div>
  );
};

export default BurgerMenu;