import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="sidebar">

      {/* BRAND */}

      <div className="brand">
        <div className="brand-icon">₹</div>

        <div>
          <h2>Expense</h2>
          <span>Tracker</span>
        </div>
      </div>

      {/* NAVIGATION */}

      <nav className="sidebar-nav">

        {/* DASHBOARD */}

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>▦</span>
          Dashboard
        </NavLink>

        {/* ADD EXPENSE */}

        <NavLink
          to="/add-expense"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>−</span>
          Add Expense
        </NavLink>

        {/* ADD INCOME */}

        <NavLink
          to="/add-income"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>+</span>
          Add Income
        </NavLink>

        {/* GOALS */}

        <NavLink
          to="/goals"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>◎</span>
          Goals
        </NavLink>

        {/* REPORTS */}

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>◴</span>
          Reports
        </NavLink>

        {/* PROFILE */}

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span>◯</span>
          Profile
        </NavLink>

      </nav>

      {/* THEME + LOGOUT */}

      <div className="sidebar-bottom">

        <button
          className="logout-btn theme-toggle-btn"
          onClick={toggleTheme}
        >
          <span>{theme === "dark" ? "☀" : "☾"}</span>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>

      </div>

    </aside>
  );
}

export default Navbar;
