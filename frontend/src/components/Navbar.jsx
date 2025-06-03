"use client"
import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992)

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992)
      if (window.innerWidth >= 992) {
        setIsExpanded(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  const toggleTheme = () => {
    document.body.classList.toggle("dark-theme")
    localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light")
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "ar" ? "fr" : "ar")
  }

  const toggleNavbar = () => {
    setIsExpanded(!isExpanded)
  }

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path
  }

  // Get role-specific menu items
  const getRoleMenuItems = () => {
    if (!user || !user.role) return []

    const commonItems = [
      {
        path: "/dashboard",
        icon: "fa-home",
        label: t("navbar.home"),
      },
      {
        path: "/my-borrowings",
        icon: "fa-list-alt",
        label: t("navbar.my_borrowings"),
      },
      {
        path: "/borrow",
        icon: "fa-plus-circle",
        label: t("navbar.borrow"),
      },
    ]

    const adminItems = [
      {
        path: "/admin",
        icon: "fa-tachometer-alt",
        label: t("navbar.admin_dashboard"),
      },
      {
        path: "/add-device",
        icon: "fa-plus",
        label: t("navbar.add_device"),
      },
      {
        path: "/manage-devices",
        icon: "fa-cogs",
        label: t("navbar.manage_devices"),
      },
      {
        path: "/manage-users",
        icon: "fa-users",
        label: t("navbar.manage_users"),
      },
    ]

    switch (user.role) {
      case "admin":
        return adminItems
      default:
        return commonItems
    }
  }

  // Get user role badge color
  const getRoleBadgeColor = () => {
    switch (user.role) {
      case "admin":
        return "bg-danger"
      case "teacher":
        return "bg-success"
      case "student":
        return "bg-primary"
      case "worker":
        return "bg-warning"
      default:
        return "bg-secondary"
    }
  }

  // Get user role translation
  const getRoleTranslation = () => {
    switch (user.role) {
      case "admin":
        return t("roles.admin")
      case "teacher":
        return t("roles.teacher")
      case "student":
        return t("roles.student")
      case "worker":
        return t("roles.worker")
      default:
        return user.role
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div className="container-fluid px-3">
        {/* Logo and Brand */}
        <Link className="navbar-brand d-flex align-items-center" to={user?.role === "admin" ? "/admin" : "/dashboard"}>
          <img src="/resouniv-logo.png" alt="Logo" width={40} height={40} className="me-2" />
          <span className="d-none d-sm-inline fw-bold">RESOUniv</span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={toggleNavbar}
          aria-expanded={isExpanded}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Content */}
        <div className={`collapse navbar-collapse ${isExpanded ? "show" : ""}`}>
          {token && (
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {getRoleMenuItems().map((item) => (
                <li className="nav-item" key={item.path}>
                  <Link
                    className={`nav-link ${isActive(item.path) ? "active fw-bold" : ""}`}
                    to={item.path}
                    onClick={() => isMobile && setIsExpanded(false)}
                  >
                    <i className={`fas ${item.icon} me-2`}></i>
                    {item.label}
                    {isActive(item.path) && <span className="visually-hidden">(current)</span>}
                  </Link>
                </li>
              ))}
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive("/about") ? "active fw-bold" : ""}`}
                  to="/about"
                  onClick={() => isMobile && setIsExpanded(false)}
                >
                  <i className="fas fa-info-circle me-2"></i>
                  {t("navbar.about")}
                </Link>
              </li>
            </ul>
          )}

          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
            {/* Language Toggle */}
            <li className="nav-item">
              <button
                className="btn btn-outline-light btn-sm me-2 d-flex align-items-center"
                onClick={toggleLang}
                aria-label="Toggle language"
              >
                <i className="fas fa-globe me-1"></i>
                {i18n.language === "ar" ? "FR" : "AR"}
              </button>
            </li>

            {/* Theme Toggle */}
            <li className="nav-item me-2">
              <button className="btn btn-outline-light btn-sm" onClick={toggleTheme} aria-label="Toggle theme">
                <i className="fas fa-moon"></i>
              </button>
            </li>

            {token ? (
              <>
                {/* User Info Dropdown */}
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle d-flex align-items-center"
                    href="#"
                    id="navbarDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                        style={{ width: "32px", height: "32px", fontSize: "14px" }}
                      >
                        {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="d-none d-md-block">
                        <div className="small fw-bold">{user?.full_name}</div>
                        <div className="d-flex align-items-center">
                          <span className={`badge ${getRoleBadgeColor()} me-1`} style={{ fontSize: "0.65rem" }}>
                            {getRoleTranslation()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li>
                      <div className="dropdown-item-text d-md-none">
                        <div className="fw-bold">{user?.full_name}</div>
                        <span className={`badge ${getRoleBadgeColor()}`}>{getRoleTranslation()}</span>
                      </div>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/settings" onClick={() => isMobile && setIsExpanded(false)}>
                        <i className="fas fa-cog me-2"></i>
                        {t("navbar.settings")}
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt me-2"></i>
                        {t("navbar.logout")}
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                {/* Login/Register Links */}
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/") ? "active" : ""}`}
                    to="/"
                    onClick={() => isMobile && setIsExpanded(false)}
                  >
                    <i className="fas fa-sign-in-alt me-1"></i> {t("navbar.login")}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/register") ? "active" : ""}`}
                    to="/register"
                    onClick={() => isMobile && setIsExpanded(false)}
                  >
                    <i className="fas fa-user-plus me-1"></i> {t("navbar.register")}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
