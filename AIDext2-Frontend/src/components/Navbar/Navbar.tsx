import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { useMode } from "../../context/ModeContext";
import { GrPersonalComputer } from "react-icons/gr";
import { AiOutlineCloudServer } from "react-icons/ai";



const NAV_LINKS = [
  { label: "Documentation", to: "/docs" },
  { label: "Models", to: "/models" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { useLocal, setUseLocal } = useMode();

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <a href="/" className="navbar-logo">
          AIDext<span className="navbar-logo-accent">2</span>
        </a>

        <div className="navbar-links">
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
            <Link key={link.label} to={link.to} className="navbar-link">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}