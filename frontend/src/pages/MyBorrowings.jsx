"use client"

import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import { toast, ToastContainer } from "react-toastify"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

const EnhancedMyBorrowings = () => {
  const { t } = useTranslation()
  const [borrowings, setBorrowings] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [sortBy, setSortBy] = useState("start_date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [viewMode, setViewMode] = useState("cards") // 'cards' or 'table'
  const [selectedBorrowing, setSelectedBorrowing] = useState(null)
  const [timeframe, setTimeframe] = useState("all") // 'all', 'current', 'past', 'upcoming'

  const token = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  // Fetch borrowings from API
  const fetchBorrowings = async () => {
    setLoading(true)
    try {
      const res = await axios.get("http://localhost:5000/api/borrow/my", { headers })
      setBorrowings(res.data)
    } catch (err) {
      console.error("Error fetching borrowings:", err)
      if (err.response?.status !== 404) {
        toast.error(t("borrowings.error_fetch"))
      } else {
        setBorrowings([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBorrowings()
  }, [])

  // Handle refresh button click
  const handleRefresh = () => {
    fetchBorrowings()
    toast.info(t("borrowings.refreshed"))
  }

  // Filter and sort borrowings
  const filteredAndSortedBorrowings = useMemo(() => {
    // First, filter by search term
    let filtered = borrowings.filter((borrowing) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        borrowing.device.toLowerCase().includes(searchLower) ||
        borrowing.usage_place.toLowerCase().includes(searchLower)
      )
    })

    // Then filter by status
    if (selectedStatus) {
      filtered = filtered.filter((borrowing) => borrowing.status === selectedStatus)
    }

    // Filter by timeframe
    const now = new Date()
    if (timeframe === "current") {
      filtered = filtered.filter(
        (borrowing) => new Date(borrowing.start_date) <= now && new Date(borrowing.end_date) >= now,
      )
    } else if (timeframe === "past") {
      filtered = filtered.filter((borrowing) => new Date(borrowing.end_date) < now)
    } else if (timeframe === "upcoming") {
      filtered = filtered.filter((borrowing) => new Date(borrowing.start_date) > now)
    }

    // Sort the filtered borrowings
    return filtered.sort((a, b) => {
      let aValue, bValue

      // Determine the values to compare based on the sort field
      switch (sortBy) {
        case "device":
          aValue = a.device
          bValue = b.device
          break
        case "start_date":
          aValue = new Date(a.start_date)
          bValue = new Date(b.start_date)
          break
        case "end_date":
          aValue = new Date(a.end_date)
          bValue = new Date(b.end_date)
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = new Date(a.start_date)
          bValue = new Date(b.start_date)
      }

      // Compare the values based on sort order
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [borrowings, searchTerm, selectedStatus, sortBy, sortOrder, timeframe])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = borrowings.length
    const pending = borrowings.filter((b) => b.status === "pending").length
    const confirmed = borrowings.filter((b) => b.status === "confirmed").length
    const rejected = borrowings.filter((b) => b.status === "rejected").length
    const returned = borrowings.filter((b) => b.status === "returned").length

    return { total, pending, confirmed, rejected, returned }
  }, [borrowings])

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // If already sorting by this field, toggle the order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Otherwise, sort by the new field in ascending order
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  // View borrowing details
  const viewBorrowingDetails = (borrowing) => {
    setSelectedBorrowing(borrowing)
  }

  // Close borrowing details modal
  const closeBorrowingDetails = () => {
    setSelectedBorrowing(null)
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Calculate borrowing duration in days
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Check if a borrowing is active (current date is between start and end date)
  const isActiveBorrowing = (startDate, endDate) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start <= now && end >= now
  }

  // Check if a borrowing is upcoming (start date is in the future)
  const isUpcomingBorrowing = (startDate) => {
    const now = new Date()
    const start = new Date(startDate)
    return start > now
  }

  // Render status badge
  const renderStatusBadge = (status) => {
    return (
      <span className={`badge ${getBadgeClass(status)}`}>
        {status === "pending" && <i className="fas fa-clock me-1"></i>}
        {status === "confirmed" && <i className="fas fa-check me-1"></i>}
        {status === "rejected" && <i className="fas fa-times me-1"></i>}
        {status === "returned" && <i className="fas fa-undo me-1"></i>}
        {getStatusTranslation(status, t)}
      </span>
    )
  }

  // Render card view
  const renderCardView = () => {
    return (
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {filteredAndSortedBorrowings.map((borrowing) => (
          <div className="col" key={borrowing.id}>
            <div
              className={`card h-100 shadow-sm ${
                isActiveBorrowing(borrowing.start_date, borrowing.end_date)
                  ? "border-success"
                  : isUpcomingBorrowing(borrowing.start_date)
                    ? "border-primary"
                    : ""
              }`}
            >
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 text-truncate" style={{ maxWidth: "70%" }}>
                  {borrowing.device}
                </h5>
                {renderStatusBadge(borrowing.status)}
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">
                      <i className="fas fa-calendar-alt me-1"></i> {t("borrowings.from")}:
                    </small>
                    <small>{formatDate(borrowing.start_date)}</small>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">
                      <i className="fas fa-calendar-check me-1"></i> {t("borrowings.to")}:
                    </small>
                    <small>{formatDate(borrowing.end_date)}</small>
                  </div>
                  <div className="d-flex justify-content-between">
                    <small className="text-muted">
                      <i className="fas fa-map-marker-alt me-1"></i> {t("borrowings.place")}:
                    </small>
                    <small className="text-truncate" style={{ maxWidth: "60%" }}>
                      {borrowing.usage_place}
                    </small>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="badge bg-light text-dark">
                    <i className="fas fa-clock me-1"></i> {calculateDuration(borrowing.start_date, borrowing.end_date)}{" "}
                    {calculateDuration(borrowing.start_date, borrowing.end_date) > 1
                      ? t("borrowings.days")
                      : t("borrowings.day")}
                  </span>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => viewBorrowingDetails(borrowing)}>
                    <i className="fas fa-eye me-1"></i> {t("borrowings.view_details")}
                  </button>
                </div>
              </div>
              <div className="card-footer bg-transparent">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>{" "}
                  {isActiveBorrowing(borrowing.start_date, borrowing.end_date)
                    ? t("borrowings.currently_active")
                    : isUpcomingBorrowing(borrowing.start_date)
                      ? t("borrowings.upcoming")
                      : t("borrowings.past")}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Render table view
  const renderTableView = () => {
    return (
      <div className="table-responsive">
        <table className="table table-hover border">
          <thead className="table-light">
            <tr>
              <th className="cursor-pointer" onClick={() => handleSortChange("device")} style={{ cursor: "pointer" }}>
                {t("borrowings.device")}{" "}
                {sortBy === "device" && <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`}></i>}
              </th>
              <th
                className="cursor-pointer"
                onClick={() => handleSortChange("start_date")}
                style={{ cursor: "pointer" }}
              >
                {t("borrowings.from")}{" "}
                {sortBy === "start_date" && <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`}></i>}
              </th>
              <th className="cursor-pointer" onClick={() => handleSortChange("end_date")} style={{ cursor: "pointer" }}>
                {t("borrowings.to")}{" "}
                {sortBy === "end_date" && <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`}></i>}
              </th>
              <th>{t("borrowings.place")}</th>
              <th className="cursor-pointer" onClick={() => handleSortChange("status")} style={{ cursor: "pointer" }}>
                {t("borrowings.status")}{" "}
                {sortBy === "status" && <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`}></i>}
              </th>
              <th>{t("borrowings.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedBorrowings.map((borrowing) => (
              <tr
                key={borrowing.id}
                className={
                  isActiveBorrowing(borrowing.start_date, borrowing.end_date)
                    ? "table-success"
                    : isUpcomingBorrowing(borrowing.start_date)
                      ? "table-primary"
                      : ""
                }
              >
                <td>{borrowing.device}</td>
                <td>{formatDate(borrowing.start_date)}</td>
                <td>{formatDate(borrowing.end_date)}</td>
                <td>{borrowing.usage_place}</td>
                <td>{renderStatusBadge(borrowing.status)}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => viewBorrowingDetails(borrowing)}>
                    <i className="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Render empty state
  const renderEmptyState = () => {
    return (
      <div className="text-center py-5">
        <div className="display-6 text-muted mb-3">
          <i className="fas fa-inbox"></i>
        </div>
        <h4 className="text-muted mb-3">{t("borrowings.no_borrowings")}</h4>
        <p className="mb-4">{t("borrowings.start_borrowing")}</p>
        <Link to="/borrow" className="btn btn-primary">
          <i className="fas fa-plus-circle me-2"></i> {t("borrowings.create_new")}
        </Link>
      </div>
    )
  }

  // Render borrowing details modal
  const renderBorrowingDetailsModal = () => {
    if (!selectedBorrowing) return null

    return (
      <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{t("borrowings.borrowing_details")}</h5>
              <button type="button" className="btn-close" onClick={closeBorrowingDetails}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="card mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">{t("borrowings.device_info")}</h6>
                    </div>
                    <div className="card-body">
                      <h5 className="card-title">{selectedBorrowing.device}</h5>
                      <p className="card-text">
                        <span className="badge bg-secondary">{selectedBorrowing.device_type || "N/A"}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">{t("borrowings.status_info")}</h6>
                    </div>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="card-title mb-0">{t("borrowings.status")}</h5>
                        {renderStatusBadge(selectedBorrowing.status)}
                      </div>
                      <div className="progress mb-3" style={{ height: "8px" }}>
                        <div
                          className={`progress-bar ${getProgressBarClass(selectedBorrowing.status)}`}
                          role="progressbar"
                          style={{ width: getProgressWidth(selectedBorrowing.status) }}
                          aria-valuenow={getProgressValue(selectedBorrowing.status)}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <p className="card-text small">{getStatusDescription(selectedBorrowing.status, t)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">{t("borrowings.time_details")}</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label text-muted small">{t("borrowings.from")}</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="fas fa-calendar-alt"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            value={formatDate(selectedBorrowing.start_date)}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label text-muted small">{t("borrowings.to")}</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="fas fa-calendar-check"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            value={formatDate(selectedBorrowing.end_date)}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-light text-dark">
                      <i className="fas fa-clock me-1"></i>{" "}
                      {calculateDuration(selectedBorrowing.start_date, selectedBorrowing.end_date)}{" "}
                      {calculateDuration(selectedBorrowing.start_date, selectedBorrowing.end_date) > 1
                        ? t("borrowings.days")
                        : t("borrowings.day")}
                    </span>
                    {isActiveBorrowing(selectedBorrowing.start_date, selectedBorrowing.end_date) && (
                      <span className="badge bg-success">
                        <i className="fas fa-check-circle me-1"></i> {t("borrowings.currently_active")}
                      </span>
                    )}
                    {isUpcomingBorrowing(selectedBorrowing.start_date) && (
                      <span className="badge bg-primary">
                        <i className="fas fa-hourglass-start me-1"></i> {t("borrowings.upcoming")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header bg-light">
                  <h6 className="mb-0">{t("borrowings.usage_details")}</h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label text-muted small">{t("borrowings.place")}</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-map-marker-alt"></i>
                      </span>
                      <input type="text" className="form-control" value={selectedBorrowing.usage_place} readOnly />
                    </div>
                  </div>
                  {selectedBorrowing.purpose && (
                    <div>
                      <label className="form-label text-muted small">{t("borrowings.purpose")}</label>
                      <div className="card bg-light">
                        <div className="card-body py-2 px-3">
                          <p className="card-text mb-0">{selectedBorrowing.purpose}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeBorrowingDetails}>
                {t("borrowings.close")}
              </button>
              {selectedBorrowing.status === "confirmed" && (
                <Link to="/borrow" className="btn btn-primary">
                  <i className="fas fa-copy me-1"></i> {t("borrowings.borrow_again")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
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
                  <i className="fas fa-history"></i>
                </div>
                <div>
                  <h2 className="mb-0">{t("borrowings.title")}</h2>
                  <p className="text-muted mb-0">{t("borrowings.subtitle")}</p>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button onClick={handleRefresh} className="btn btn-outline-primary">
                  <i className="fas fa-sync-alt me-1"></i> {t("borrowings.refresh")}
                </button>
                <Link to="/borrow" className="btn btn-primary">
                  <i className="fas fa-plus-circle me-1"></i> {t("borrowings.new_borrowing")}
                </Link>
              </div>
            </div>
            <div style={styles.divider} className="mt-3"></div>
          </div>

          <div className="card-body p-4">
            {/* Stats cards */}
            <div className="row mb-4">
              <div className="col-6 col-md-3 mb-3 mb-md-0">
                <div className="card border-0 bg-light h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                      <i className="fas fa-list text-primary"></i>
                    </div>
                    <div>
                      <h6 className="card-title mb-0">{t("borrowings.total")}</h6>
                      <h3 className="mb-0">{stats.total}</h3>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-3 mb-3 mb-md-0">
                <div className="card border-0 bg-light h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                      <i className="fas fa-clock text-warning"></i>
                    </div>
                    <div>
                      <h6 className="card-title mb-0">{t("borrowings.pending")}</h6>
                      <h3 className="mb-0">{stats.pending}</h3>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-3 mb-3 mb-md-0">
                <div className="card border-0 bg-light h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                      <i className="fas fa-check text-success"></i>
                    </div>
                    <div>
                      <h6 className="card-title mb-0">{t("borrowings.confirmed")}</h6>
                      <h3 className="mb-0">{stats.confirmed}</h3>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-3 mb-3 mb-md-0">
                <div className="card border-0 bg-light h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                      <i className="fas fa-undo text-info"></i>
                    </div>
                    <div>
                      <h6 className="card-title mb-0">{t("borrowings.returned")}</h6>
                      <h3 className="mb-0">{stats.returned}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                    placeholder={t("borrowings.search_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3 mb-3 mb-md-0">
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">{t("borrowings.all_statuses")}</option>
                  <option value="pending">{t("admin_panel.status_pending")}</option>
                  <option value="confirmed">{t("admin_panel.status_confirmed")}</option>
                  <option value="rejected">{t("admin_panel.status_rejected")}</option>
                  <option value="returned">{t("admin_panel.status_returned")}</option>
                </select>
              </div>
              <div className="col-md-3 mb-3 mb-md-0">
                <select className="form-select" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                  <option value="all">{t("borrowings.all_timeframes")}</option>
                  <option value="current">{t("borrowings.current")}</option>
                  <option value="upcoming">{t("borrowings.upcoming")}</option>
                  <option value="past">{t("borrowings.past")}</option>
                </select>
              </div>
              <div className="col-md-2 d-flex justify-content-end">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn btn-outline-secondary ${viewMode === "cards" ? "active" : ""}`}
                    onClick={() => setViewMode("cards")}
                    title={t("borrowings.card_view")}
                  >
                    <i className="fas fa-th-large"></i>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline-secondary ${viewMode === "table" ? "active" : ""}`}
                    onClick={() => setViewMode("table")}
                    title={t("borrowings.table_view")}
                  >
                    <i className="fas fa-table"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Borrowings content */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t("borrowings.loading")}</span>
                </div>
                <p className="mt-2">{t("borrowings.loading")}</p>
              </div>
            ) : filteredAndSortedBorrowings.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                {viewMode === "cards" ? renderCardView() : renderTableView()}

                {/* Results summary */}
                <div className="text-muted text-center mt-4">
                  {t("borrowings.showing_results", {
                    showing: filteredAndSortedBorrowings.length,
                    total: borrowings.length,
                  })}
                </div>
              </>
            )}
          </div>

          <div className="card-footer bg-light p-3 text-center" style={styles.cardFooter}>
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              {t("borrowings.footer_note")}
            </small>
          </div>
        </div>
      </div>

      {/* Borrowing details modal */}
      {renderBorrowingDetailsModal()}

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

// Helper function to get badge class based on status
function getBadgeClass(status) {
  switch (status) {
    case "pending":
      return "bg-warning"
    case "confirmed":
      return "bg-success"
    case "rejected":
      return "bg-danger"
    case "returned":
      return "bg-info"
    default:
      return "bg-secondary"
  }
}

// Helper function to translate status
function getStatusTranslation(status, t) {
  switch (status) {
    case "pending":
      return t("admin_panel.status_pending")
    case "confirmed":
      return t("admin_panel.status_confirmed")
    case "rejected":
      return t("admin_panel.status_rejected")
    case "returned":
      return t("admin_panel.status_returned")
    default:
      return status
  }
}

// Helper function to get progress bar class based on status
function getProgressBarClass(status) {
  switch (status) {
    case "pending":
      return "bg-warning"
    case "confirmed":
      return "bg-success"
    case "rejected":
      return "bg-danger"
    case "returned":
      return "bg-info"
    default:
      return "bg-secondary"
  }
}

// Helper function to get progress width based on status
function getProgressWidth(status) {
  switch (status) {
    case "pending":
      return "25%"
    case "confirmed":
      return "75%"
    case "rejected":
      return "100%"
    case "returned":
      return "100%"
    default:
      return "0%"
  }
}

// Helper function to get progress value based on status
function getProgressValue(status) {
  switch (status) {
    case "pending":
      return 25
    case "confirmed":
      return 75
    case "rejected":
      return 100
    case "returned":
      return 100
    default:
      return 0
  }
}

// Helper function to get status description
function getStatusDescription(status, t) {
  switch (status) {
    case "pending":
      return t("borrowings.status_pending_desc")
    case "confirmed":
      return t("borrowings.status_confirmed_desc")
    case "rejected":
      return t("borrowings.status_rejected_desc")
    case "returned":
      return t("borrowings.status_returned_desc")
    default:
      return ""
  }
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

export default EnhancedMyBorrowings
