import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo_icon from './img/spark_logo_icon.png';
import BurgerMenu from '../BurgerMenu';
import HeaderInfo from '../HeaderInfo';
import './header-style.css';
import { useAuth } from '../../auth/AuthContext';

function Logo({ userId }) {
  return (
    <Link className="col-auto p-0" to={userId ? `/home/${userId}` : '/Login'}>
      <img className="logo-icon" src={logo_icon} alt="Spark logo" />
    </Link>
  );
}

Logo.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [prevScrollPos, setPrevScrollPos] = useState(window.pageYOffset);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const isScrolledUp = prevScrollPos > currentScrollPos;

      setVisible(isScrolledUp || currentScrollPos < 100);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [prevScrollPos]);

  const handleLogout = async () => {
    await logout();
    navigate('/Login');
  };

  const canUseManagerNav = user?.role === 'admin' || user?.role === 'manager';
  const displayBurger = (location.pathname.includes('/Eval') || location.pathname.includes('/View')) && canUseManagerNav;

  return (
    <>
      <header
        style={{ zIndex: 99, top: visible ? '0' : '-100px', transition: 'top 0.1s ease-in-out' }}
        className="main-header position-fixed w-100 bg-white shadow-sm"
      >
        <div className="header-shell">
          <div className="header-left">
            {displayBurger ? <BurgerMenu /> : <Logo userId={user?.id} />}
          </div>
          <div className="header-right">
            <HeaderInfo user={user} />
            <button className="btn btn-dark header-logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="header-spacer"></div>
    </>
  );
}

export default Header;
