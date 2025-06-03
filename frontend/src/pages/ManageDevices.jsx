"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import { toast, ToastContainer } from "react-toastify"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import "react-toastify/dist/ReactToastify.css"

const ManageDevices = () => {
  const { t } = useTranslation()

  // State to hold all devices
  const [devices, setDevices] = useState([])
  const [filteredDevices, setFilteredDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [deviceTypes, setDeviceTypes] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" })

  // State for editing
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState("")
  const [editQty, setEditQty] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // Get token from local storage
  const token = localStorage.getItem("token")
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  // Fetch devices when component mounts
  useEffect(() => {
    fetchDevices()
  }, [])

  // Apply filters when devices, searchTerm, or selectedType changes
  useEffect(() => {
    filterDevices()
  }, [devices, searchTerm, selectedType])

  // Fetch all devices from the API
  const fetchDevices = async () => {
    setLoading(true)
    try {
      const res = await axios.get("http://localhost:5000/api/devices/", { headers })
      setDevices(res.data)

      // Extract unique device types for filter dropdown
      const types = [...new Set(res.data.map((device) => device.device_type))]
      setDeviceTypes(types)
    } catch (err) {
      toast.error(t("devices.error_fetch"))
    } finally {
      setLoading(false)
    }
  }

  // Filter devices based on search term and selected type
  const filterDevices = () => {
    let filtered = [...devices]

    if (searchTerm) {
      filtered = filtered.filter(
        (device) =>
          device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.device_type.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedType) {
      filtered = filtered.filter((device) => device.device_type === selectedType)
    }

    // Apply sorting if configured
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    setFilteredDevices(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle sorting when a column header is clicked
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Get current devices for pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentDevices = filteredDevices.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Start editing a device
  const handleEdit = (device) => {
    setEditId(device.id)
    setEditName(device.name)
    setEditType(device.device_type)
    setEditQty(device.quantity)
    setEditDescription(device.description || "")
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditId(null)
  }

  // Save changes to the device
  const handleSave = async (id) => {
    // Validate inputs
    if (!editName.trim()) {
      toast.warning(t("devices.name_required"))
      return
    }

    if (!editType.trim()) {
      toast.warning(t("devices.type_required"))
      return
    }

    const quantity = Number.parseInt(editQty)
    if (isNaN(quantity) || quantity <= 0) {
      toast.warning(t("devices.quantity_invalid"))
      return
    }

    try {
      const updatedDevice = {
        name: editName,
        device_type: editType,
        quantity: Number.parseInt(editQty),
        description: editDescription,
      }

      await axios.put(`http://localhost:5000/api/devices/${id}`, updatedDevice, { headers })

      toast.success(t("devices.updated"))
      setEditId(null) // Reset the edit state after save
      fetchDevices() // Re-fetch devices to reflect changes
    } catch (err) {
      toast.error(t("devices.error_update"))
    }
  }

  // Confirm delete
  const handleConfirmDelete = (id) => {
    setDeleteConfirmId(id)
  }

  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteConfirmId(null)
  }

  // Delete a device
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/devices/${id}`, { headers })
      toast.success(t("devices.deleted"))
      setDeleteConfirmId(null)
      fetchDevices() // Re-fetch devices after deletion
    } catch (err) {
      toast.error(t("devices.error_delete"))
    }
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("")
    setSelectedType("")
    setSortConfig({ key: null, direction: "ascending" })
  }

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "ascending" ? (
      <i className="fas fa-sort-up ms-1"></i>
    ) : (
      <i className="fas fa-sort-down ms-1"></i>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="card shadow-lg border-0" style={styles.card}>
          <div className="card-header bg-light p-4" style={styles.cardHeader}>
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <div className="d-flex align-items-center mb-2 mb-md-0">
                <div className="display-6 text-primary me-3">
                  <i className="fas fa-laptop"></i>
                </div>
                <div>
                  <h2 className="mb-0">{t("devices.manage_title")}</h2>
                  <p className="text-muted mb-0">{t("devices.manage_subtitle")}</p>
                </div>
              </div>
              <Link to="/add-device" className="btn btn-primary">
                <i className="fas fa-plus-circle me-2"></i>
                {t("devices.add_new")}
              </Link>
            </div>
            <div style={styles.divider} className="mt-3"></div>
          </div>

          <div className="card-body p-4">
            {/* Filters and search */}
            <div className="row mb-4">
              <div className="col-md-4 mb-3 mb-md-0">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t("devices.search_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4 mb-3 mb-md-0">
                <select className="form-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                  <option value="">{t("devices.all_types")}</option>
                  {deviceTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 d-flex justify-content-md-end">
                <button className="btn btn-outline-secondary" onClick={handleResetFilters}>
                  <i className="fas fa-undo me-2"></i>
                  {t("devices.reset_filters")}
                </button>
              </div>
            </div>

            {/* Devices table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t("devices.loading")}</span>
                </div>
                <p className="mt-2">{t("devices.loading")}</p>
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                {searchTerm || selectedType ? t("devices.no_matching_devices") : t("devices.no_devices")}
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover border">
                    <thead className="table-light">
                      <tr>
                        <th className="cursor-pointer" onClick={() => requestSort("name")}>
                          {t("devices.name")}
                          {getSortIndicator("name")}
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("device_type")}>
                          {t("devices.type")}
                          {getSortIndicator("device_type")}
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("quantity")}>
                          {t("devices.quantity")}
                          {getSortIndicator("quantity")}
                        </th>
                        <th>{t("devices.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDevices.map((device) => (
                        <tr key={device.id}>
                          <td>
                            {editId === device.id ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                            ) : (
                              device.name
                            )}
                          </td>
                          <td>
                            {editId === device.id ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editType}
                                onChange={(e) => setEditType(e.target.value)}
                              />
                            ) : (
                              <span className="badge bg-info text-dark">{device.device_type}</span>
                            )}
                          </td>
                          <td>
                            {editId === device.id ? (
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={editQty}
                                onChange={(e) => setEditQty(e.target.value)}
                                min="1"
                              />
                            ) : (
                              <span className="badge bg-primary">{device.quantity}</span>
                            )}
                          </td>
                          <td>
                            {deleteConfirmId === device.id ? (
                              <div className="d-flex gap-2">
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(device.id)}>
                                  <i className="fas fa-check me-1"></i> {t("devices.confirm")}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={handleCancelDelete}>
                                  <i className="fas fa-times me-1"></i> {t("devices.cancel")}
                                </button>
                              </div>
                            ) : editId === device.id ? (
                              <div className="d-flex gap-2">
                                <button className="btn btn-success btn-sm" onClick={() => handleSave(device.id)}>
                                  <i className="fas fa-save me-1"></i> {t("devices.save")}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>
                                  <i className="fas fa-times me-1"></i> {t("devices.cancel")}
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-warning btn-sm"
                                  onClick={() => handleEdit(device)}
                                  title={t("devices.edit")}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleConfirmDelete(device.id)}
                                  title={t("devices.delete")}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav aria-label="Page navigation" className="mt-4">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                      </li>

                      {[...Array(totalPages)].map((_, index) => {
                        // Show limited page numbers with ellipsis
                        if (
                          index === 0 ||
                          index === totalPages - 1 ||
                          (index >= currentPage - 2 && index <= currentPage + 2)
                        ) {
                          return (
                            <li key={index} className={`page-item ${currentPage === index + 1 ? "active" : ""}`}>
                              <button className="page-link" onClick={() => paginate(index + 1)}>
                                {index + 1}
                              </button>
                            </li>
                          )
                        } else if (
                          (index === 1 && currentPage > 3) ||
                          (index === totalPages - 2 && currentPage < totalPages - 3)
                        ) {
                          return (
                            <li key={index} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )
                        }
                        return null
                      })}

                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}

                {/* Results summary */}
                <div className="text-muted text-center mt-3">
                  {t("devices.showing_results", {
                    showing: currentDevices.length,
                    total: filteredDevices.length,
                  })}
                </div>
              </>
            )}
          </div>

          <div className="card-footer bg-light p-3 text-center" style={styles.cardFooter}>
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              {t("devices.footer_note")}
            </small>
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

export default ManageDevices
