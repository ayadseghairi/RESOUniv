"use client"

import { useState } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import { toast, ToastContainer } from "react-toastify"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import "react-toastify/dist/ReactToastify.css"

const AddDevice = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    device_type: "",
    quantity: "",
    description: "", // Added description field
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [previewMode, setPreviewMode] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = t("addDevice.error_name_required")
    if (!formData.device_type.trim()) newErrors.device_type = t("addDevice.error_type_required")

    const quantity = Number.parseInt(formData.quantity)
    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = t("addDevice.error_quantity_invalid")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePreview = (e) => {
    e.preventDefault()
    if (validateForm()) {
      setPreviewMode(true)
    }
  }

  const handleEditAgain = () => {
    setPreviewMode(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    const token = localStorage.getItem("token")

    try {
      const res = await axios.post(
        "http://localhost:5000/api/devices/",
        {
          name: formData.name,
          device_type: formData.device_type,
          quantity: Number.parseInt(formData.quantity),
          description: formData.description || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      toast.success(res.data.msg || t("addDevice.success"))

      // Reset form after successful submission
      setFormData({
        name: "",
        device_type: "",
        quantity: "",
        description: "",
      })

      // Redirect to manage devices after a short delay
      setTimeout(() => {
        navigate("/manage-devices")
      }, 2000)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.msg || t("addDevice.error"))
    } finally {
      setLoading(false)
      setPreviewMode(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg border-0" style={styles.card}>
              <div className="card-header bg-light p-4" style={styles.cardHeader}>
                <div className="d-flex align-items-center">
                  <div className="display-6 text-primary me-3">
                    <i className="fas fa-plus-circle"></i>
                  </div>
                  <div>
                    <h2 className="mb-0">{t("addDevice.title")}</h2>
                    <p className="text-muted mb-0">{t("addDevice.subtitle")}</p>
                  </div>
                </div>
                <div style={styles.divider} className="mt-3"></div>
              </div>

              <div className="card-body p-4">
                {previewMode ? (
                  <div>
                    <h4 className="mb-4">{t("addDevice.preview_title")}</h4>

                    <div className="card mb-4">
                      <div className="card-body">
                        <div className="row mb-3">
                          <div className="col-md-4 fw-bold">{t("addDevice.deviceName")}</div>
                          <div className="col-md-8">{formData.name}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-md-4 fw-bold">{t("addDevice.deviceType")}</div>
                          <div className="col-md-8">{formData.device_type}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-md-4 fw-bold">{t("addDevice.quantity")}</div>
                          <div className="col-md-8">{formData.quantity}</div>
                        </div>
                        {formData.description && (
                          <div className="row mb-3">
                            <div className="col-md-4 fw-bold">{t("addDevice.description")}</div>
                            <div className="col-md-8">{formData.description}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between">
                      <button className="btn btn-outline-secondary" onClick={handleEditAgain} disabled={loading}>
                        <i className="fas fa-arrow-left me-2"></i>
                        {t("addDevice.edit_again")}
                      </button>

                      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            {t("addDevice.saving")}
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            {t("addDevice.confirm_save")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePreview}>
                    <div className="mb-3">
                      <label className="form-label">
                        <i className="fas fa-laptop me-2"></i>
                        {t("addDevice.deviceName")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t("addDevice.deviceName_placeholder")}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        <i className="fas fa-tag me-2"></i>
                        {t("addDevice.deviceType")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.device_type ? "is-invalid" : ""}`}
                        name="device_type"
                        value={formData.device_type}
                        onChange={handleChange}
                        placeholder={t("addDevice.deviceType_placeholder")}
                      />
                      {errors.device_type && <div className="invalid-feedback">{errors.device_type}</div>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        <i className="fas fa-sort-numeric-up me-2"></i>
                        {t("addDevice.quantity")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${errors.quantity ? "is-invalid" : ""}`}
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        placeholder={t("addDevice.quantity_placeholder")}
                      />
                      {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                    </div>

                    <div className="mb-4">
                      <label className="form-label">
                        <i className="fas fa-align-left me-2"></i>
                        {t("addDevice.description")}
                      </label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder={t("addDevice.description_placeholder")}
                      ></textarea>
                    </div>

                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate("/manage-devices")}
                      >
                        <i className="fas fa-times me-2"></i>
                        {t("addDevice.cancel")}
                      </button>

                      <button type="submit" className="btn btn-primary">
                        <i className="fas fa-eye me-2"></i>
                        {t("addDevice.preview")}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="card-footer bg-light p-3 text-center" style={styles.cardFooter}>
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  {t("addDevice.footer_note")}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
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

export default AddDevice
