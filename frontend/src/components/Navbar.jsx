import React from 'react';

export default function Navbar({ onHomeClick }) {
  return (
    <header className="navbar">
      <div
        className="navbar-brand"
        onClick={onHomeClick}
        role="button"
        tabIndex={0}
        style={{ cursor: onHomeClick ? 'pointer' : 'default' }}
      >
        HOS Trip Planner
      </div>
    </header>
  );
}
