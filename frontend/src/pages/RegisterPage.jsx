"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { useTranslation } from "react-i18next"
import { toast, ToastContainer } from "react-toastify"

const RegisterPage = () => {
  const { t, i18n } = useTranslation()
  const [formData, setFormData] = useState({
    full_name: "",
    registration_number: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "student",
    academic_year: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Validate form
    if (formData.password !== formData.confirm_password) {
      setError(t("register.password_mismatch"))
      return
    }

    if (formData.password.length < 6) {
      setError(t("register.password_short"))
      return
    }

    setLoading(true)

    try {
      const dataToSend = {
        full_name: formData.full_name,
        registration_number: formData.registration_number,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        academic_year: formData.role === "student" ? formData.academic_year : null,
      }

      await axios.post("http://localhost:5000/api/auth/register", dataToSend)
      toast.success(t("register.success"))
      setTimeout(() => navigate("/"), 1500)
    } catch (err) {
      console.error("Registration error:", err)
      setError(err.response?.data?.msg || t("register.error"))
    } finally {
      setLoading(false)
    }
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "ar" ? "fr" : "ar")
  }
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-vh-100 d-flex flex-column" style={styles.pageContainer}>
      {/* Language toggle button */}
      <div className="position-absolute top-0 end-0 m-3">
        <button onClick={toggleLanguage} className="btn btn-outline-secondary btn-sm">
          <i className="fas fa-globe me-1"></i>
          {i18n.language === "ar" ? "Français" : "العربية"}
        </button>
      </div>

      <div className="container my-auto py-4">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="card shadow-lg border-0" style={styles.card}>
              {/* University logos and header */}
              <div className="text-center p-4 bg-light" style={styles.cardHeader}>
                <div className="d-flex justify-content-center align-items-center mb-3">
                  <img src="/khenchela-logo.png" alt="Université de Khenchela" height="80" className="mx-2" />
                  <img src="/resouniv-logo.png" alt="RESOUniv" height="80" className="mx-2" />
                </div>
                <h3 className="fw-bold text-primary mb-1">RESOUniv</h3>
                <p className="text-muted">{t("site.university")}</p>
                <div style={styles.divider}></div>
              </div>

              <div className="card-body p-4">
                <h4 className="card-title text-center mb-4">{t("register.title")}</h4>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-user me-2"></i>
                        {t("register.fullName")}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-id-card me-2"></i>
                        {t("register.regNum")}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="registration_number"
                        value={formData.registration_number}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-phone me-2"></i>
                        {t("register.phone")}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-user-tag me-2"></i>
                        {t("register.role")}
                      </label>
                      <select
                        className="form-select"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="student">{t("roles.student")}</option>
                        <option value="teacher">{t("roles.teacher")}</option>
                        <option value="worker">{t("roles.worker")}</option>
                        
                      </select>
                    </div>
                  </div>

                  {formData.role === "student" && (
                    <div className="mb-3">
                      <label className="form-label">
                        <i className="fas fa-calendar-alt me-2"></i>
                        {t("register.academicYear")}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="academic_year"
                        value={formData.academic_year}
                        onChange={handleChange}
                        placeholder={t("register.academicYearPlaceholder")}
                        disabled={loading}
                      />
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-lock me-2"></i>
                        {t("register.password")}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-lock me-2"></i>
                        {t("register.confirmPassword")}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="d-grid gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary py-2"
                      disabled={loading}
                      style={styles.submitButton}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          {t("register.processing")}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus me-2"></i>
                          {t("register.submit")}
                        </>
                      )}
                    </button>

                    <Link to="/" className="btn btn-outline-secondary">
                      <i className="fas fa-sign-in-alt me-2"></i>
                      {t("register.haveAccount")}
                    </Link>
                  </div>
                </form>
              </div>

              <div className="card-footer bg-light text-center py-3" style={styles.cardFooter}>
                <Link to="/about" className="text-decoration-none">
                  <i className="fas fa-info-circle me-1"></i> {t("login.about")}
                </Link>
                <div className="small text-muted mt-2">© {currentYear} Université Abbas Laghrour Khenchela</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

const styles = {
  pageContainer: {
    backgroundImage: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
  },
  card: {
    borderRadius: "10px",
    overflow: "hidden",
  },
  cardHeader: {
    borderBottom: "1px solid rgba(0,0,0,0.1)",
  },
  cardFooter: {
    borderTop: "1px solid rgba(0,0,0,0.1)",
  },
  divider: {
    height: "4px",
    width: "60px",
    background: "linear-gradient(90deg, #007bff, #6610f2)",
    margin: "0 auto",
    borderRadius: "2px",
  },
  submitButton: {
    fontWeight: "500",
    letterSpacing: "0.5px",
  },
}

export default RegisterPage
