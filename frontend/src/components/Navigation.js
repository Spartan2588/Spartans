import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/navigation.css';

const Navigation = () => {
  const [isActive, setIsActive] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsActive(!isActive);
  };

  const closeMenu = () => {
    setIsActive(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Platform', path: '/platform' },
    { name: 'Trends', path: '/trends' },
    { name: 'Map', path: '/map' },
    { name: 'Cascade', path: '/cascade' },
    { name: 'Scenarios', path: '/scenarios' },
    { name: 'Impact', path: '/impact' },
    { name: 'About', path: '/about' },
  ];

  return (
    <nav className="nav-container">
      <Link to="/" className="nav-logo" onClick={closeMenu}>
        <span className="logo-icon">◆</span>
        <span className="logo-text">Urban Risk</span>
      </Link>

      <button
        className={`nav-toggle ${isActive ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <ul className={`nav-menu ${isActive ? 'active' : ''}`}>
        {navLinks.map((link) => (
          <li key={link.path}>
            <Link
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;
