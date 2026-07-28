import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { useMode } from "../../context/ModeContext";
import { GrPersonalComputer } from "react-icons/gr";
import { AiOutlineCloudServer } from "react-icons/ai";



const NAV_LINKS = [
  { label: "Detector", to: "/" },
  { label: "Documentation", to: "/docs" },
  { label: "Models", to: "/models" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { useLocal, setUseLocal } = useMode();
  const location = useLocation();

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);


  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <Link to="/" className="navbar-logo">
          AIDetx<span className="navbar-logo-accent">2</span>
        </Link>

        <div className="navbar-links">
          {/* Desktop links */}
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.to} className={`navbar-link ${isActive(link.to) ? "active" : ""}`}>
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

         <div className="navbar-mode-switch">
              <span className={`mode-label ${useLocal ? "active" : ""}`}>
                <GrPersonalComputer />
                <span>Local</span>
              </span>

            <label className="switch">
                <input
                    type="checkbox"
                    checked={!useLocal}
                    onChange={() => setUseLocal(u => !u)}
                />
                <span className="slider"></span>
            </label>

          <span className={`mode-label ${!useLocal ? "active" : ""}`}>
            <AiOutlineCloudServer />
            <span>Backend</span>
          </span>
        </div>

      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.to} className={`navbar-link ${isActive(link.to) ? "active" : ""}`}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}