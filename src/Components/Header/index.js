import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import profile_icon from "./img/profile_icon.svg";
import logo_icon from "./img/spark_logo_icon.png";
import { useNavigate } from 'react-router-dom';
import BurgerMenu from '../BurgerMenu';
import HeaderInfo from '../HeaderInfo';
import './header-style.css';

function Logo({ userId }) {
    return (
        <Link className='col-auto p-0' to={`/home/${userId}`}>
            <img className="logo-icon" src={logo_icon} alt="logo-img"></img>
        </Link>
    )
}

function Header() {
    const userId = localStorage.getItem('userId');
    const navigate = useNavigate();
    const location = useLocation();
    
    const [prevScrollPos, setPrevScrollPos] = useState(window.pageYOffset);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPos = window.pageYOffset;
            const isScrolledUp = prevScrollPos > currentScrollPos;

            setVisible(isScrolledUp || currentScrollPos < 100); // Always show the header at the top of the page
            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [prevScrollPos]);

    const handleLogout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('isManager');
        navigate('/Login');
    }

    const displayBurger = location.pathname.includes('/Eval') || location.pathname.includes('/View') && (localStorage.isAdmin === "true" || localStorage.isManager === "true");

    return (
        <>
            <header 
                style={{ zIndex: 99, top: visible ? '0' : '-100px', transition: 'top 0.1s ease-in-out' }}
                className='row align-items-center m-0 position-fixed w-100 bg-white pb-1 px-4 shadow-sm'>
                {displayBurger ? <BurgerMenu /> : <Logo userId={userId} />}
                <HeaderInfo userId={userId} />
                <button className='btn btn-dark col-auto' onClick={handleLogout}>Logout</button>
            </header>
            <div className='p-5 bg-white'></div>
        </>
    );
}

export default Header;
