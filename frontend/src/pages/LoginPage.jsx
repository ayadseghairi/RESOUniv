"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ToastContainer } from "react-toastify"

const LoginPage = () => {
  const { t, i18n } = useTranslation()
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_number: registrationNumber, password }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.msg || t("login.error"))

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard")
    } catch (err) {
      setError(err.message || t("login.error"))
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

      <div className="container my-auto py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
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
                <h4 className="card-title text-center mb-4">{t("login.title")}</h4>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="fas fa-id-card me-2"></i>
                      {t("login.regNum")}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label">
                      <i className="fas fa-lock me-2"></i>
                      {t("login.pass")}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 mb-3"
                    disabled={loading}
                    style={styles.submitButton}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {t("login.loading")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        {t("login.login")}
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <Link to="/register" className="btn btn-outline-secondary w-100">
                      <i className="fas fa-user-plus me-2"></i>
                      {t("login.createAccount")}
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

export default LoginPage
