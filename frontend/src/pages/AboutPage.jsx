"use client"

import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

const developers = [
  {
    name: "إياد سغيري",
    role: "Full-Stack Developer · Open Source Contributor · Security-Oriented Engineer",
    image: "../src/assets/dev.jpg",
    github: "https://github.com/ayadseghairi",
    linkedin: "https://www.linkedin.com/in/ayad-seghiri",
  },
  
]

const AboutPage = () => {
  const { t, i18n } = useTranslation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
  }, [])
  const currentYear = new Date().getFullYear();

  return (
    <>
      {isLoggedIn && <Navbar />}
      <div className="container py-5">
        <div className="row justify-content-center mb-5">
          <div className="col-lg-10">
            <div className="card shadow-lg border-0" style={styles.card}>
              {/* Header with logos */}
              <div className="text-center p-4 bg-light" style={styles.cardHeader}>
                <div className="d-flex justify-content-center align-items-center mb-3">
                  <img src="/khenchela-logo.png" alt="Université de Khenchela" height="80" className="mx-2" />
                  <img src="/resouniv-logo.png" alt="RESOUniv" height="80" className="mx-2" />
                </div>
                <h2 className="fw-bold text-primary mb-1">RESOUniv</h2>
                <p className="text-muted">{t("site.university")}</p>
                <div style={styles.divider}></div>
              </div>

              <div className="card-body p-4">
                <h3 className="text-center mb-4">{t("about.title")}</h3>

                {/* System description */}
                <div className="mb-5">
                  <h4 className="mb-3">{t("about.system_title")}</h4>
                  <p className="lead">{t("about.system_description")}</p>
                  <div className="row mt-4">
                    <div className="col-md-4 mb-3">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 text-primary mb-3">
                            <i className="fas fa-laptop-code"></i>
                          </div>
                          <h5>{t("about.feature1_title")}</h5>
                          <p className="text-muted">{t("about.feature1_desc")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 text-success mb-3">
                            <i className="fas fa-tasks"></i>
                          </div>
                          <h5>{t("about.feature2_title")}</h5>
                          <p className="text-muted">{t("about.feature2_desc")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 text-info mb-3">
                            <i className="fas fa-chart-line"></i>
                          </div>
                          <h5>{t("about.feature3_title")}</h5>
                          <p className="text-muted">{t("about.feature3_desc")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Development team */}
                <h4 className="text-center mb-4">{t("about.dev_team")}</h4>
                <div className="row">
                  {developers.map((dev, index) => (
                    <div className="col-lg-4 mb-4" key={index}>
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="text-center pt-4">
                          <div className="position-relative mx-auto" style={styles.imageContainer}>
                            <img
                              src={dev.image || "/placeholder.svg"}
                              className="rounded-circle"
                              alt={dev.name}
                              style={styles.developerImage}
                            />
                          </div>
                        </div>
                        <div className="card-body text-center">
                          <h5 className="card-title">{dev.name}</h5>
                          <p className="card-text text-muted">{dev.role}</p>
                          <div className="d-flex justify-content-center gap-3">
                            <a
                              href={dev.github}
                              className="btn btn-sm btn-outline-dark"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="fab fa-github me-1"></i> GitHub
                            </a>
                            <a
                              href={dev.linkedin}
                              className="btn btn-sm btn-outline-primary"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="fab fa-linkedin me-1"></i> LinkedIn
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-footer bg-light text-center py-3" style={styles.cardFooter}>
                <p className="mb-1">
                  {t("about.contact_us")}{" "}
                  <a href="mailto:contact@univ-khenchela.dz" className="text-decoration-none">
                    contact@univ-khenchela.dz
                  </a>
                </p>
                <div className="small text-muted mt-2">
                  © {currentYear} {t("about.copyright")} - {t("site.university")}
                </div>
                {!isLoggedIn && (
                  <div className="mt-3">
                    <Link to="/" className="btn btn-primary">
                      <i className="fas fa-sign-in-alt me-2"></i>
                      {t("about.back_to_login")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
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
  imageContainer: {
    width: "150px",
    height: "150px",
    overflow: "hidden",
  },
  developerImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
}

export default AboutPage
