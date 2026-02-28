import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuActive, setMenuActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav
      className="navbar is-primary is-fixed-top"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="container">
        {/* Brand */}
        <div className="navbar-brand">
          <Link className="navbar-item has-text-white has-text-weight-bold" to="/">
            QGIS Plugins Repository
          </Link>
          <button
            className={`navbar-burger${menuActive ? " is-active" : ""}`}
            aria-label="menu"
            aria-expanded={menuActive}
            onClick={() => setMenuActive(!menuActive)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        {/* Menu */}
        <div className={`navbar-menu${menuActive ? " is-active" : ""}`}>
          <div className="navbar-start">
            <Link className="navbar-item" to="/plugins/">
              All Plugins
            </Link>
            <div className="navbar-item has-dropdown is-hoverable">
              <span className="navbar-link">Browse</span>
              <div className="navbar-dropdown">
                <Link className="navbar-item" to="/plugins/fresh/">New Plugins</Link>
                <Link className="navbar-item" to="/plugins/latest/">Latest Updates</Link>
                <Link className="navbar-item" to="/plugins/popular/">Popular</Link>
                <Link className="navbar-item" to="/plugins/most_downloaded/">Most Downloaded</Link>
                <Link className="navbar-item" to="/plugins/best_rated/">Best Rated</Link>
                <Link className="navbar-item" to="/plugins/featured/">Featured</Link>
                <hr className="navbar-divider" />
                <Link className="navbar-item" to="/plugins/stable/">Stable</Link>
                <Link className="navbar-item" to="/plugins/experimental/">Experimental</Link>
                <Link className="navbar-item" to="/plugins/server/">Server Plugins</Link>
              </div>
            </div>
            <div className="navbar-item has-dropdown is-hoverable">
              <span className="navbar-link">Docs</span>
              <div className="navbar-dropdown">
                <Link className="navbar-item" to="/docs/publish/">Publishing Plugins</Link>
                <Link className="navbar-item" to="/docs/approval/">Approval Process</Link>
                <Link className="navbar-item" to="/docs/faq/">FAQ</Link>
              </div>
            </div>
          </div>

          <div className="navbar-end">
            {/* Search */}
            <div className="navbar-item">
              <form onSubmit={handleSearch}>
                <div className="field has-addons">
                  <div className="control">
                    <input
                      className="input is-small"
                      type="search"
                      placeholder="Search plugins…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="control">
                    <button className="button is-small is-light" type="submit">
                      Search
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {isAuthenticated ? (
              <div className="navbar-item has-dropdown is-hoverable">
                <span className="navbar-link">
                  {user?.username}
                </span>
                <div className="navbar-dropdown is-right">
                  <Link className="navbar-item" to="/plugins/my/">My Plugins</Link>
                  <Link className="navbar-item" to="/plugins/add/">Upload Plugin</Link>
                  {user?.is_staff && (
                    <>
                      <hr className="navbar-divider" />
                      <Link className="navbar-item" to="/plugins/unapproved/">Unapproved</Link>
                      <Link className="navbar-item" to="/admin/" target="_blank">Admin</Link>
                    </>
                  )}
                  <hr className="navbar-divider" />
                  <button className="navbar-item" onClick={logout} style={{ cursor: "pointer" }}>
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="navbar-item">
                <Link className="button is-light is-small" to="/accounts/login/">
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
