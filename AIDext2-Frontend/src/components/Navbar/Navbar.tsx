import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "Documentation", to: "/docs" },
  { label: "Models", to: "/models" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* Logo OUTSIDE container */}
      {/* Logo - full width positioning */}
      <a href="/" className="navbar-logo navbar-logo--left">
        AIDext<span className="navbar-logo-accent">2</span>
      </a>
      <div className="navbar-inner">

        {/* Desktop links */}
        {NAV_LINKS.map((link) => (
          <Link key={link.label} to={link.to} className="navbar-link">
            {link.label}
          </Link>
        ))}

        {/* Mobile hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={`ham-line ${menuOpen ? "ham-line--open-1" : ""}`} />
          <span className={`ham-line ${menuOpen ? "ham-line--open-2" : ""}`} />
          <span className={`ham-line ${menuOpen ? "ham-line--open-3" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.to} className="navbar-link">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}