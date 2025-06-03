"use client"

import { useState } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import { toast, ToastContainer } from "react-toastify"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

const SettingsPage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const token = localStorage.getItem("token")

  // State for different settings sections
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form data state
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    phone: user.phone || "",
    email: user.email || "",
    password: "",
    confirm_password: "",
    language: i18n.language || "ar",
    theme: localStorage.getItem("theme") || "light",
    notifications_enabled: true,
  })

  // Form validation state
  const [errors, setErrors] = useState({})

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Handle theme change
  const handleThemeChange = (theme) => {
    setFormData((prev) => ({ ...prev, theme }))
    localStorage.setItem("theme", theme)

    if (theme === "dark") {
      document.body.classList.add("dark-theme")
    } else {
      document.body.classList.remove("dark-theme")
    }
  }

  // Handle language change
  const handleLanguageChange = (language) => {
    setFormData((prev) => ({ ...prev, language }))
    i18n.changeLanguage(language)
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = t("settings.error_name_required")
    }

    if (formData.phone && !/^\d{10,15}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = t("settings.error_phone_invalid")
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("settings.error_email_invalid")
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = t("settings.error_password_short")
    }

    if (formData.password && formData.password !== formData.confirm_password) {
      newErrors.confirm_password = t("settings.error_password_mismatch")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Prepare data for API
      const dataToSend = {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
      }

      // Only include password if it was changed
      if (formData.password) {
        dataToSend.password = formData.password
      }

      const res = await axios.put(`http://localhost:5000/api/auth/update/${user.id}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update local storage with new user data
      const updatedUser = { ...user, ...res.data.user }
      localStorage.setItem("user", JSON.stringify(updatedUser))

      // Show success message
      toast.success(t("settings.success_update"))
      setSaveSuccess(true)

      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirm_password: "",
      }))

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (err) {
      console.error("Update error:", err)
      toast.error(err.response?.data?.error || t("settings.error_update"))
    } finally {
      setLoading(false)
    }
  }

  // Handle account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteAccount = async () => {
    try {
      setLoading(true)
      await axios.delete(`http://localhost:5000/api/auth/delete/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Clear local storage and redirect to login
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      toast.success(t("settings.success_delete"))
      navigate("/")
    } catch (err) {
      console.error("Delete error:", err)
      toast.error(err.response?.data?.error || t("settings.error_delete"))
      setLoading(false)
    }
  }

  // Render profile settings tab
  const renderProfileSettings = () => {
    return (
      <div className="profile-settings">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-user me-2"></i>
              {t("settings.full_name")} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              className={`form-control ${errors.full_name ? "is-invalid" : ""}`}
              value={formData.full_name}
              onChange={handleChange}
            />
            {errors.full_name && <div className="invalid-feedback">{errors.full_name}</div>}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-phone me-2"></i>
              {t("settings.phone")}
            </label>
            <input
              type="text"
              name="phone"
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              value={formData.phone}
              onChange={handleChange}
              placeholder={t("settings.phone_placeholder")}
            />
            {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">
            <i className="fas fa-envelope me-2"></i>
            {t("settings.email")}
          </label>
          <input
            type="email"
            name="email"
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            value={formData.email}
            onChange={handleChange}
            placeholder={t("settings.email_placeholder")}
          />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-id-card me-2"></i>
              {t("settings.registration_number")}
            </label>
            <input type="text" className="form-control" value={user.registration_number || ""} disabled />
            <div className="form-text">{t("settings.registration_number_help")}</div>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-user-tag me-2"></i>
              {t("settings.role")}
            </label>
            <input type="text" className="form-control" value={t(`roles.${user.role}`) || user.role || ""} disabled />
          </div>
        </div>
      </div>
    )
  }

  // Render security settings tab
  const renderSecuritySettings = () => {
    return (
      <div className="security-settings">
        <div className="mb-3">
          <label className="form-label">
            <i className="fas fa-lock me-2"></i>
            {t("settings.new_password")}
          </label>
          <div className="input-group">
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              value={formData.password}
              onChange={handleChange}
              placeholder={t("settings.password_placeholder")}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              <i className={`fas fa-${passwordVisible ? "eye-slash" : "eye"}`}></i>
            </button>
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>
          <div className="form-text">{t("settings.password_help")}</div>
        </div>

        <div className="mb-3">
          <label className="form-label">
            <i className="fas fa-lock me-2"></i>
            {t("settings.confirm_password")}
          </label>
          <div className="input-group">
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              name="confirm_password"
              className={`form-control ${errors.confirm_password ? "is-invalid" : ""}`}
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder={t("settings.confirm_password_placeholder")}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            >
              <i className={`fas fa-${confirmPasswordVisible ? "eye-slash" : "eye"}`}></i>
            </button>
            {errors.confirm_password && <div className="invalid-feedback">{errors.confirm_password}</div>}
          </div>
        </div>

        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          {t("settings.password_info")}
        </div>
      </div>
    )
  }

  // Render preferences settings tab
  const renderPreferencesSettings = () => {
    return (
      <div className="preferences-settings">
        <div className="mb-4">
          <label className="form-label d-block">
            <i className="fas fa-palette me-2"></i>
            {t("settings.theme")}
          </label>
          <div className="d-flex gap-3">
            <div
              className={`theme-option ${formData.theme === "light" ? "active" : ""}`}
              onClick={() => handleThemeChange("light")}
            >
              <div className="theme-preview light-theme">
                <div className="theme-header"></div>
                <div className="theme-content"></div>
              </div>
              <div className="mt-2 text-center">
                <i className={`fas fa-check-circle me-1 ${formData.theme === "light" ? "text-primary" : "d-none"}`}></i>
                {t("settings.light_theme")}
              </div>
            </div>

            <div
              className={`theme-option ${formData.theme === "dark" ? "active" : ""}`}
              onClick={() => handleThemeChange("dark")}
            >
              <div className="theme-preview dark-theme">
                <div className="theme-header"></div>
                <div className="theme-content"></div>
              </div>
              <div className="mt-2 text-center">
                <i className={`fas fa-check-circle me-1 ${formData.theme === "dark" ? "text-primary" : "d-none"}`}></i>
                {t("settings.dark_theme")}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label d-block">
            <i className="fas fa-language me-2"></i>
            {t("settings.language")}
          </label>
          <div className="d-flex gap-3">
            <div
              className={`language-option ${formData.language === "ar" ? "active" : ""}`}
              onClick={() => handleLanguageChange("ar")}
            >
              <div className="d-flex align-items-center">
                <span className="language-flag me-2">🇩🇿</span>
                <span>العربية</span>
                {formData.language === "ar" && <i className="fas fa-check-circle ms-2 text-primary"></i>}
              </div>
            </div>

            <div
              className={`language-option ${formData.language === "fr" ? "active" : ""}`}
              onClick={() => handleLanguageChange("fr")}
            >
              <div className="d-flex align-items-center">
                <span className="language-flag me-2">🇫🇷</span>
                <span>Français</span>
                {formData.language === "fr" && <i className="fas fa-check-circle ms-2 text-primary"></i>}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="notificationsSwitch"
              checked={formData.notifications_enabled}
              onChange={() => setFormData((prev) => ({ ...prev, notifications_enabled: !prev.notifications_enabled }))}
            />
            <label className="form-check-label" htmlFor="notificationsSwitch">
              <i className="fas fa-bell me-2"></i>
              {t("settings.enable_notifications")}
            </label>
          </div>
          <div className="form-text">{t("settings.notifications_help")}</div>
        </div>
      </div>
    )
  }

  // Render account settings tab
  const renderAccountSettings = () => {
    return (
      <div className="account-settings">
        <div className="alert alert-warning">
          <h5 className="alert-heading">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {t("settings.danger_zone")}
          </h5>
          <p>{t("settings.danger_zone_description")}</p>

          <div className="mt-3">
            <button type="button" className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              <i className="fas fa-trash-alt me-2"></i>
              {t("settings.delete_account")}
            </button>
          </div>
        </div>

        {/* Delete account confirmation modal */}
        {showDeleteConfirm && (
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {t("settings.confirm_delete_title")}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowDeleteConfirm(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>{t("settings.confirm_delete_message")}</p>
                  <p className="fw-bold">{t("settings.confirm_delete_warning")}</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={loading}
                  >
                    {t("settings.cancel")}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteAccount} disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {t("settings.deleting")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash-alt me-2"></i>
                        {t("settings.confirm_delete")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="card shadow-lg border-0" style={styles.card}>
          <div className="card-header bg-light p-4" style={styles.cardHeader}>
            <div className="d-flex align-items-center">
              <div className="display-6 text-primary me-3">
                <i className="fas fa-cog"></i>
              </div>
              <div>
                <h2 className="mb-0">{t("settings.title")}</h2>
                <p className="text-muted mb-0">{t("settings.subtitle")}</p>
              </div>
            </div>
            <div style={styles.divider} className="mt-3"></div>
          </div>

          <div className="card-body p-4">
            <div className="row">
              {/* Settings navigation */}
              <div className="col-md-3 mb-4 mb-md-0">
                <div className="list-group">
                  <button
                    type="button"
                    className={`list-group-item list-group-item-action ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <i className="fas fa-user-circle me-2"></i>
                    {t("settings.profile")}
                  </button>
                  <button
                    type="button"
                    className={`list-group-item list-group-item-action ${activeTab === "security" ? "active" : ""}`}
                    onClick={() => setActiveTab("security")}
                  >
                    <i className="fas fa-shield-alt me-2"></i>
                    {t("settings.security")}
                  </button>
                  <button
                    type="button"
                    className={`list-group-item list-group-item-action ${activeTab === "preferences" ? "active" : ""}`}
                    onClick={() => setActiveTab("preferences")}
                  >
                    <i className="fas fa-sliders-h me-2"></i>
                    {t("settings.preferences")}
                  </button>
                  <button
                    type="button"
                    className={`list-group-item list-group-item-action ${activeTab === "account" ? "active" : ""}`}
                    onClick={() => setActiveTab("account")}
                  >
                    <i className="fas fa-user-cog me-2"></i>
                    {t("settings.account")}
                  </button>
                </div>

                <div className="mt-4 d-none d-md-block">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">
                        <i className="fas fa-info-circle me-2"></i>
                        {t("settings.help_title")}
                      </h6>
                      <p className="card-text small">{t("settings.help_text")}</p>
                      <a href="#" className="btn btn-sm btn-outline-primary">
                        <i className="fas fa-question-circle me-1"></i>
                        {t("settings.get_help")}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings content */}
              <div className="col-md-9">
                <form onSubmit={handleSave}>
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">
                        {activeTab === "profile" && (
                          <>
                            <i className="fas fa-user-circle me-2"></i>
                            {t("settings.profile")}
                          </>
                        )}
                        {activeTab === "security" && (
                          <>
                            <i className="fas fa-shield-alt me-2"></i>
                            {t("settings.security")}
                          </>
                        )}
                        {activeTab === "preferences" && (
                          <>
                            <i className="fas fa-sliders-h me-2"></i>
                            {t("settings.preferences")}
                          </>
                        )}
                        {activeTab === "account" && (
                          <>
                            <i className="fas fa-user-cog me-2"></i>
                            {t("settings.account")}
                          </>
                        )}
                      </h5>
                    </div>
                    <div className="card-body">
                      {/* Show success message */}
                      {saveSuccess && (
                        <div className="alert alert-success alert-dismissible fade show" role="alert">
                          <i className="fas fa-check-circle me-2"></i>
                          {t("settings.success_update")}
                          <button type="button" className="btn-close" onClick={() => setSaveSuccess(false)}></button>
                        </div>
                      )}

                      {/* Render active tab content */}
                      {activeTab === "profile" && renderProfileSettings()}
                      {activeTab === "security" && renderSecuritySettings()}
                      {activeTab === "preferences" && renderPreferencesSettings()}
                      {activeTab === "account" && renderAccountSettings()}
                    </div>

                    {/* Only show save button for profile and security tabs */}
                    {(activeTab === "profile" || activeTab === "security") && (
                      <div className="card-footer bg-light d-flex justify-content-end">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          {loading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              {t("settings.saving")}
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-2"></i>
                              {t("settings.save_changes")}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>
        {`
          .theme-option {
            cursor: pointer;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 10px;
            width: 120px;
            transition: all 0.2s;
          }
          
          .theme-option.active {
            border-color: var(--bs-primary);
          }
          
          .theme-preview {
            height: 80px;
            border-radius: 4px;
            overflow: hidden;
          }
          
          .theme-header {
            height: 20px;
          }
          
          .theme-content {
            height: 60px;
          }
          
          .light-theme {
            background-color: #f8f9fa;
          }
          
          .light-theme .theme-header {
            background-color: #e9ecef;
          }
          
          .dark-theme {
            background-color: #212529;
          }
          
          .dark-theme .theme-header {
            background-color: #343a40;
          }
          
          .language-option {
            cursor: pointer;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 10px 15px;
            transition: all 0.2s;
          }
          
          .language-option.active {
            border-color: var(--bs-primary);
            background-color: rgba(var(--bs-primary-rgb), 0.1);
          }
          
          .language-flag {
            font-size: 1.2rem;
          }
        `}
      </style>
    </>
  )
}

const styles = {
  card: {
    borderRadius: "10px",
    overflow: "hidden",
  },
  cardHeader: {
    borderBottom: "1px solid rgba(0,0,0,0.1)",
  },
  divider: {
    height: "4px",
    width: "60px",
    background: "linear-gradient(90deg, #007bff, #6610f2)",
    borderRadius: "2px",
  },
}

export default SettingsPage
