"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import { toast, ToastContainer } from "react-toastify"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import "react-toastify/dist/ReactToastify.css"

const BorrowPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Form state
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [usagePlace, setUsagePlace] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [purpose, setPurpose] = useState("")

  // UI state
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [deviceSearchTerm, setDeviceSearchTerm] = useState("")
  const [filteredDevices, setFilteredDevices] = useState([])

  const token = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchDevices()

    // Set default dates (start: tomorrow, end: day after tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    setStartDate(formatDateTimeForInput(tomorrow))
    setEndDate(formatDateTimeForInput(dayAfterTomorrow))
  }, [])

  useEffect(() => {
    // Filter devices based on search term
    if (devices.length > 0) {
      const filtered = devices.filter(
        (device) =>
          device.name.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
          device.device_type.toLowerCase().includes(deviceSearchTerm.toLowerCase()),
      )
      setFilteredDevices(filtered)
    }
  }, [deviceSearchTerm, devices])

  const formatDateTimeForInput = (date) => {
    return date.toISOString().slice(0, 16)
  }

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const res = await axios.get("http://localhost:5000/api/devices", { headers })
      // Filter out devices with quantity 0
      const availableDevices = res.data.filter((device) => device.quantity > 0)
      setDevices(availableDevices)
      setFilteredDevices(availableDevices)
    } catch (err) {
      console.error("Error fetching devices:", err)
      toast.error(t("borrowPage.error_fetch_devices"))
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!selectedDevice) {
        newErrors.device = t("borrowPage.error_no_device")
      }
    } else if (step === 2) {
      if (!usagePlace.trim()) {
        newErrors.usagePlace = t("borrowPage.error_no_place")
      }

      if (!purpose.trim()) {
        newErrors.purpose = t("borrowPage.error_no_purpose")
      } else if (purpose.trim().length < 10) {
        newErrors.purpose = t("borrowPage.error_purpose_short")
      }
    } else if (step === 3) {
      if (!startDate) {
        newErrors.startDate = t("borrowPage.error_no_start_date")
      }

      if (!endDate) {
        newErrors.endDate = t("borrowPage.error_no_end_date")
      }

      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const now = new Date()

        if (start < now) {
          newErrors.startDate = t("borrowPage.error_past_start_date")
        }

        if (end <= start) {
          newErrors.endDate = t("borrowPage.error_invalid_end_date")
        }

        // Check if the borrowing period is too long (more than 7 days)
        const diffTime = Math.abs(end - start)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > 7) {
          newErrors.endDate = t("borrowPage.error_too_long")
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device)
    if (errors.device) {
      setErrors({ ...errors, device: null })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateStep(3)) {
      return
    }

    setSubmitting(true)
    try {
      await axios.post(
        "http://localhost:5000/api/borrow",
        {
          device_id: selectedDevice.id,
          usage_place: usagePlace,
          start_date: startDate,
          end_date: endDate,
          purpose: purpose,
        },
        { headers },
      )

      toast.success(t("borrowPage.success"))

      // Reset form
      setTimeout(() => {
        navigate("/my-borrowings")
      }, 2000)
    } catch (err) {
      console.error("Error submitting request:", err)
      toast.error(err.response?.data?.msg || t("borrowPage.error_submit"))
    } finally {
      setSubmitting(false)
    }
  }

  const renderStepIndicator = () => {
    return (
      <div className="mb-4">
        <div className="d-flex justify-content-between position-relative">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`step-indicator ${currentStep >= step ? "active" : ""} ${currentStep > step ? "completed" : ""}`}
              onClick={() => currentStep > step && setCurrentStep(step)}
              style={{
                cursor: currentStep > step ? "pointer" : "default",
                zIndex: 2,
              }}
            >
              <div className="step-number">{currentStep > step ? <i className="fas fa-check"></i> : step}</div>
              <div className="step-title small mt-2">
                {step === 1 && t("borrowPage.step_device")}
                {step === 2 && t("borrowPage.step_details")}
                {step === 3 && t("borrowPage.step_schedule")}
              </div>
            </div>
          ))}

          {/* Progress bar */}
          <div
            className="progress position-absolute"
            style={{
              width: "100%",
              height: "4px",
              top: "20px",
              zIndex: 1,
            }}
          >
            <div className="progress-bar bg-primary" style={{ width: `${(currentStep - 1) * 50}%` }}></div>
          </div>
        </div>
      </div>
    )
  }

  const renderDeviceSelection = () => {
    return (
      <div className="device-selection">
        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder={t("borrowPage.search_devices")}
              value={deviceSearchTerm}
              onChange={(e) => setDeviceSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t("borrowPage.loading")}</span>
            </div>
            <p className="mt-2">{t("borrowPage.loading_devices")}</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="alert alert-info">
            {deviceSearchTerm ? t("borrowPage.no_matching_devices") : t("borrowPage.no_devices")}
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 g-3 mb-3">
            {filteredDevices.map((device) => (
              <div key={device.id} className="col">
                <div
                  className={`card h-100 ${selectedDevice?.id === device.id ? "border-primary" : ""}`}
                  onClick={() => handleDeviceSelect(device)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <h5 className="card-title">{device.name}</h5>
                      <span className="badge bg-primary rounded-pill">
                        {device.quantity} {t("borrowPage.available")}
                      </span>
                    </div>
                    <p className="card-text text-muted small mb-1">
                      <i className="fas fa-tag me-1"></i> {device.device_type}
                    </p>
                    {device.description && <p className="card-text small mt-2">{device.description}</p>}
                  </div>
                  <div className="card-footer bg-transparent">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="deviceRadio"
                        checked={selectedDevice?.id === device.id}
                        onChange={() => handleDeviceSelect(device)}
                      />
                      <label className="form-check-label">{t("borrowPage.select_this_device")}</label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {errors.device && <div className="alert alert-danger">{errors.device}</div>}
      </div>
    )
  }

  const renderBorrowingDetails = () => {
    return (
      <div className="borrowing-details">
        {selectedDevice && (
          <div className="card mb-4 bg-light">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">{t("borrowPage.selected_device")}</h6>
              <h5 className="card-title">{selectedDevice.name}</h5>
              <p className="card-text small">
                <span className="badge bg-secondary me-2">{selectedDevice.device_type}</span>
                <span className="badge bg-primary">
                  {selectedDevice.quantity} {t("borrowPage.available")}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">
            <i className="fas fa-map-marker-alt me-2"></i>
            {t("borrowPage.usage_place")} <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.usagePlace ? "is-invalid" : ""}`}
            value={usagePlace}
            onChange={(e) => {
              setUsagePlace(e.target.value)
              if (errors.usagePlace) {
                setErrors({ ...errors, usagePlace: null })
              }
            }}
            placeholder={t("borrowPage.usage_place_placeholder")}
          />
          {errors.usagePlace && <div className="invalid-feedback">{errors.usagePlace}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">
            <i className="fas fa-clipboard me-2"></i>
            {t("borrowPage.purpose")} <span className="text-danger">*</span>
          </label>
          <textarea
            className={`form-control ${errors.purpose ? "is-invalid" : ""}`}
            rows="3"
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value)
              if (errors.purpose) {
                setErrors({ ...errors, purpose: null })
              }
            }}
            placeholder={t("borrowPage.purpose_placeholder")}
          ></textarea>
          {errors.purpose ? (
            <div className="invalid-feedback">{errors.purpose}</div>
          ) : (
            <div className="form-text">{t("borrowPage.purpose_help")}</div>
          )}
        </div>
      </div>
    )
  }

  const renderScheduling = () => {
    return (
      <div className="scheduling">
        {selectedDevice && (
          <div className="card mb-4 bg-light">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="card-subtitle mb-2 text-muted">{t("borrowPage.selected_device")}</h6>
                  <h5 className="card-title">{selectedDevice.name}</h5>
                  <p className="card-text small">
                    <span className="badge bg-secondary me-2">{selectedDevice.device_type}</span>
                  </p>
                </div>
                <div className="col-md-6">
                  <h6 className="card-subtitle mb-2 text-muted">{t("borrowPage.usage_details")}</h6>
                  <p className="card-text">
                    <i className="fas fa-map-marker-alt me-1"></i> {usagePlace}
                  </p>
                  <p className="card-text small text-truncate">
                    <i className="fas fa-clipboard me-1"></i> {purpose}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-calendar-alt me-2"></i>
              {t("borrowPage.start_date")} <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              className={`form-control ${errors.startDate ? "is-invalid" : ""}`}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (errors.startDate) {
                  setErrors({ ...errors, startDate: null })
                }
              }}
            />
            {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">
              <i className="fas fa-calendar-check me-2"></i>
              {t("borrowPage.end_date")} <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              className={`form-control ${errors.endDate ? "is-invalid" : ""}`}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                if (errors.endDate) {
                  setErrors({ ...errors, endDate: null })
                }
              }}
            />
            {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
          </div>
        </div>

        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          {t("borrowPage.scheduling_info")}
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderDeviceSelection()
      case 2:
        return renderBorrowingDetails()
      case 3:
        return renderScheduling()
      default:
        return null
    }
  }

  const renderStepActions = () => {
    return (
      <div className="d-flex justify-content-between mt-4">
        {currentStep > 1 ? (
          <button type="button" className="btn btn-outline-secondary" onClick={handlePrevStep} disabled={submitting}>
            <i className="fas fa-arrow-left me-2"></i>
            {t("borrowPage.previous")}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/dashboard")}
            disabled={submitting}
          >
            <i className="fas fa-times me-2"></i>
            {t("borrowPage.cancel")}
          </button>
        )}

        {currentStep < 3 ? (
          <button type="button" className="btn btn-primary" onClick={handleNextStep} disabled={submitting}>
            {t("borrowPage.next")}
            <i className="fas fa-arrow-right ms-2"></i>
          </button>
        ) : (
          <button type="submit" className="btn btn-success" disabled={submitting} onClick={handleSubmit}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {t("borrowPage.submitting")}
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                {t("borrowPage.submit")}
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-lg border-0" style={styles.card}>
              <div className="card-header bg-light p-4" style={styles.cardHeader}>
                <div className="d-flex align-items-center">
                  <div className="display-6 text-primary me-3">
                    <i className="fas fa-hand-holding"></i>
                  </div>
                  <div>
                    <h2 className="mb-0">{t("borrowPage.title")}</h2>
                    <p className="text-muted mb-0">{t("borrowPage.subtitle")}</p>
                  </div>
                </div>
                <div style={styles.divider} className="mt-3"></div>
              </div>

              <div className="card-body p-4">
                {renderStepIndicator()}
                {renderStepContent()}
                {renderStepActions()}
              </div>

              <div className="card-footer bg-light p-3" style={styles.cardFooter}>
                <div className="row">
                  <div className="col-md-4 mb-2 mb-md-0">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-info-circle text-primary me-2"></i>
                      <small>{t("borrowPage.footer_note1")}</small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-2 mb-md-0">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-clock text-warning me-2"></i>
                      <small>{t("borrowPage.footer_note2")}</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-question-circle text-info me-2"></i>
                      <small>{t("borrowPage.footer_note3")}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 33.33%;
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #6c757d;
        }
        
        .step-indicator.active .step-number {
          background-color: #007bff;
          color: white;
        }
        
        .step-indicator.completed .step-number {
          background-color: #28a745;
          color: white;
        }
        
        .step-title {
          color: #6c757d;
        }
        
        .step-indicator.active .step-title,
        .step-indicator.completed .step-title {
          color: #212529;
          font-weight: 500;
        }
      `}</style>

      <ToastContainer position="top-right" autoClose={3000} />
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
    borderRadius: "2px",
  },
}

export default BorrowPage
