"use client"
import { useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"

const NotFound = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)

    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate(isLoggedIn ? "/dashboard" : "/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate, isLoggedIn])

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate(isLoggedIn ? "/dashboard" : "/")
  }

  return (
    <>
      {isLoggedIn && <Navbar />}
      <div className="min-vh-100 d-flex align-items-center" style={styles.pageContainer}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="card shadow-lg border-0" style={styles.card}>
                <div className="text-center p-4 bg-light" style={styles.cardHeader}>
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <img src="/khenchela-logo.png" alt="Université de Khenchela" height="60" className="mx-2" />
                    <img src="/resouniv-logo.png" alt="RESOUniv" height="60" className="mx-2" />
                  </div>
                  <div style={styles.divider}></div>
                </div>

                <div className="card-body text-center p-5">
                  <div className="display-1 text-danger mb-4">
                    <i className="fas fa-exclamation-circle"></i>
                  </div>
                  <h1 className="display-4 fw-bold text-danger mb-3">404</h1>
                  <h2 className="mb-4">{t("notfound.title")}</h2>
                  <p className="lead mb-4">{t("notfound.message")}</p>

                  <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mt-4">
                    <button onClick={handleGoBack} className="btn btn-outline-secondary">
                      <i className="fas fa-arrow-left me-2"></i>
                      {t("notfound.go_back")}
                    </button>
                    <button onClick={handleGoHome} className="btn btn-primary">
                      <i className="fas fa-home me-2"></i>
                      {t("notfound.go_home")}
                    </button>
                  </div>

                  <div className="mt-4 text-muted">
                    <p>
                      {t("notfound.auto_redirect")} <span className="fw-bold">{countdown}</span> {t("notfound.seconds")}
                    </p>
                  </div>
                </div>

                <div className="card-footer bg-light text-center py-3" style={styles.cardFooter}>
                  <Link to="/about" className="text-decoration-none">
                    <i className="fas fa-info-circle me-1"></i> {t("notfound.about")}
                  </Link>
                  <div className="small text-muted mt-2">© 2023-2024 {t("site.university")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const styles = {
  pageContainer: {
    backgroundImage: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
    padding: "20px",
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
    margin: "10px auto 0",
    borderRadius: "2px",
  },
}

export default NotFound
