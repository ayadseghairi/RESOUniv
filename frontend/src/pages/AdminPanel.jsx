"use client"

import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import { toast, ToastContainer } from "react-toastify"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import "react-toastify/dist/ReactToastify.css"

const AdminPanel = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const headers = { Authorization: `Bearer ${token}` }

  // State management
  const [users, setUsers] = useState([])
  const [borrowings, setBorrowings] = useState([])
  const [logs, setLogs] = useState([])
  const [devices, setDevices] = useState([])
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedItems, setSelectedItems] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" })
  const [loading, setLoading] = useState({
    users: false,
    borrowings: false,
    logs: false,
    devices: false,
  })

  // Constants
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    if (!token || !user || user.role !== "admin") {
      toast.error(t("admin_panel.unauthorized"))
      localStorage.clear()
      navigate("/login")
    } else {
      fetchAllData()
    }
  }, [])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, dateRange])

  const fetchAllData = () => {
    fetchUsers()
    fetchBorrowings()
    fetchLogs()
    fetchDevices()
  }

  const handleError = (err, defaultMsg) => {
    if (err.response?.status === 401) {
      toast.error(t("admin_panel.unauthorized"))
      localStorage.clear()
      navigate("/login")
    } else {
      toast.error(err.response?.data?.error || defaultMsg)
    }
  }

  const fetchUsers = async () => {
    setLoading((prev) => ({ ...prev, users: true }))
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", { headers })
      setUsers(res.data)
    } catch (err) {
      handleError(err, t("users.error_fetch"))
    } finally {
      setLoading((prev) => ({ ...prev, users: false }))
    }
  }

  const fetchBorrowings = async () => {
    setLoading((prev) => ({ ...prev, borrowings: true }))
    try {
      const res = await axios.get("http://localhost:5000/api/admin/borrowings", { headers })
      setBorrowings(res.data)
    } catch (err) {
      handleError(err, t("dashboard.error_fetch_requests"))
    } finally {
      setLoading((prev) => ({ ...prev, borrowings: false }))
    }
  }

  const fetchLogs = async () => {
    setLoading((prev) => ({ ...prev, logs: true }))
    try {
      const res = await axios.get("http://localhost:5000/api/admin/logs", { headers })
      setLogs(res.data)
    } catch (err) {
      handleError(err, t("admin_panel.error_logs"))
    } finally {
      setLoading((prev) => ({ ...prev, logs: false }))
    }
  }

  const fetchDevices = async () => {
    setLoading((prev) => ({ ...prev, devices: true }))
    try {
      const res = await axios.get("http://localhost:5000/api/devices", { headers })
      setDevices(res.data)
    } catch (err) {
      handleError(err, "Failed to fetch devices")
    } finally {
      setLoading((prev) => ({ ...prev, devices: false }))
    }
  }

  const handleBorrowingAction = async (id, action) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/borrowing/${id}/${action}`, {}, { headers })
      toast.success("✅ " + t(`admin_panel.${action}_success`))
      fetchBorrowings()
    } catch (err) {
      handleError(err, t("admin_panel.error_action"))
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) {
      toast.warning(t("admin_panel.no_items_selected"))
      return
    }

    const confirmMessage = t(`admin_panel.confirm_bulk_${action}`, { count: selectedItems.length })
    if (window.confirm(confirmMessage)) {
      try {
        // In a real app, you might want to use Promise.all to handle multiple requests
        for (const id of selectedItems) {
          await axios.put(`http://localhost:5000/api/admin/borrowing/${id}/${action}`, {}, { headers })
        }
        toast.success(t(`admin_panel.bulk_${action}_success`, { count: selectedItems.length }))
        setSelectedItems([])
        fetchBorrowings()
      } catch (err) {
        handleError(err, t("admin_panel.error_bulk_action"))
      }
    }
  }

  const handleUserAction = async (userId, action) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/user/${userId}/${action}`, {}, { headers })
      toast.success(t(`admin_panel.user_${action}_success`))
      fetchUsers()
    } catch (err) {
      handleError(err, t("admin_panel.error_user_action"))
    }
  }

  const handleRefresh = () => {
    fetchAllData()
    toast.info(t("admin_panel.refreshed"))
  }

  const handleSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(filteredBorrowings.map((b) => b.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  // Filtered and sorted data
  const filteredBorrowings = useMemo(() => {
    let filtered = [...borrowings]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter)
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date()
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      filtered = filtered.filter((b) => {
        const borrowDate = new Date(b.start_date)
        if (dateRange === "today") return borrowDate >= startOfDay
        if (dateRange === "week") return borrowDate >= startOfWeek
        if (dateRange === "month") return borrowDate >= startOfMonth
        return true
      })
    }

    // Apply search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.user.toLowerCase().includes(search) ||
          b.device.toLowerCase().includes(search) ||
          b.usage_place.toLowerCase().includes(search),
      )
    }

    // Apply sorting
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

    return filtered
  }, [borrowings, statusFilter, dateRange, searchTerm, sortConfig])

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users

    const search = searchTerm.toLowerCase()
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(search) ||
        u.registration_number.toLowerCase().includes(search) ||
        u.role.toLowerCase().includes(search),
    )
  }, [users, searchTerm])

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs

    const search = searchTerm.toLowerCase()
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(search) ||
        l.description.toLowerCase().includes(search) ||
        l.performed_by.toLowerCase().includes(search),
    )
  }, [logs, searchTerm])

  // Pagination
  const paginatedBorrowings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredBorrowings.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredBorrowings, currentPage])

  const totalPages = Math.ceil(filteredBorrowings.length / ITEMS_PER_PAGE)

  // Statistics
  const statistics = useMemo(() => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.is_active).length,
      totalDevices: devices.length,
      totalBorrowings: borrowings.length,
      pendingBorrowings: borrowings.filter((b) => b.status === "pending").length,
      confirmedBorrowings: borrowings.filter((b) => b.status === "confirmed").length,
      returnedBorrowings: borrowings.filter((b) => b.status === "returned").length,
      rejectedBorrowings: borrowings.filter((b) => b.status === "rejected").length,
    }
  }, [users, devices, borrowings])

  // Recent activity
  const recentActivity = useMemo(() => {
    return logs.slice(0, 5)
  }, [logs])

  return (
    <>
      <Navbar />
      <div className="container-fluid mt-4 px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="fas fa-tachometer-alt me-2"></i>
            {t("admin_panel.title")}
          </h2>
          <div>
            <button onClick={handleRefresh} className="btn btn-outline-primary">
              <i className="fas fa-sync-alt me-2"></i> {t("admin_panel.refresh")}
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <i className="fas fa-chart-line me-2"></i>
              {t("admin_panel.dashboard")}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "borrowings" ? "active" : ""}`}
              onClick={() => setActiveTab("borrowings")}
            >
              <i className="fas fa-exchange-alt me-2"></i>
              {t("admin_panel.borrowings")}
              {statistics.pendingBorrowings > 0 && (
                <span className="badge bg-warning ms-2">{statistics.pendingBorrowings}</span>
              )}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <i className="fas fa-users me-2"></i>
              {t("admin_panel.users")}
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "logs" ? "active" : ""}`} onClick={() => setActiveTab("logs")}>
              <i className="fas fa-history me-2"></i>
              {t("admin_panel.logs")}
            </button>
          </li>
        </ul>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="dashboard-tab">
            {/* Statistics Cards */}
            <div className="row mb-4">
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="card border-0 shadow-sm h-100 bg-primary text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="text-uppercase">{t("admin_panel.total_users")}</h6>
                        <h2 className="mb-0">{statistics.totalUsers}</h2>
                      </div>
                      <div className="rounded-circle bg-white p-2">
                        <i className="fas fa-users text-primary"></i>
                      </div>
                    </div>
                    <div className="mt-2 small">
                      <span className="text-white-50">{t("admin_panel.active")}: </span>
                      <span className="fw-bold">{statistics.activeUsers}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="card border-0 shadow-sm h-100 bg-success text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="text-uppercase">{t("admin_panel.devices")}</h6>
                        <h2 className="mb-0">{statistics.totalDevices}</h2>
                      </div>
                      <div className="rounded-circle bg-white p-2">
                        <i className="fas fa-laptop text-success"></i>
                      </div>
                    </div>
                    <div className="mt-2 small">
                      <span className="text-white-50">{t("admin_panel.available")}: </span>
                      <span className="fw-bold">{statistics.totalDevices - statistics.confirmedBorrowings}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="card border-0 shadow-sm h-100 bg-warning text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="text-uppercase">{t("admin_panel.pending")}</h6>
                        <h2 className="mb-0">{statistics.pendingBorrowings}</h2>
                      </div>
                      <div className="rounded-circle bg-white p-2">
                        <i className="fas fa-clock text-warning"></i>
                      </div>
                    </div>
                    <div className="mt-2 small">
                      <span className="text-white-50">{t("admin_panel.total")}: </span>
                      <span className="fw-bold">{statistics.totalBorrowings}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="card border-0 shadow-sm h-100 bg-info text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="text-uppercase">{t("admin_panel.active_borrowings")}</h6>
                        <h2 className="mb-0">{statistics.confirmedBorrowings}</h2>
                      </div>
                      <div className="rounded-circle bg-white p-2">
                        <i className="fas fa-exchange-alt text-info"></i>
                      </div>
                    </div>
                    <div className="mt-2 small">
                      <span className="text-white-50">{t("admin_panel.returned")}: </span>
                      <span className="fw-bold">{statistics.returnedBorrowings}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="row">
              <div className="col-lg-8 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">{t("admin_panel.recent_activity")}</h5>
                  </div>
                  <div className="card-body">
                    {loading.logs ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : recentActivity.length === 0 ? (
                      <div className="alert alert-info">{t("admin_panel.no_recent_activity")}</div>
                    ) : (
                      <div className="timeline">
                        {recentActivity.map((log, index) => (
                          <div key={log.id} className="timeline-item">
                            <div className="timeline-item-content">
                              <div className="timeline-item-marker">
                                <div className="timeline-item-marker-indicator bg-primary"></div>
                              </div>
                              <div className="timeline-item-content-wrapper">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <h6 className="mb-0">{log.action}</h6>
                                  <small className="text-muted">{new Date(log.timestamp).toLocaleString()}</small>
                                </div>
                                <p className="mb-0 text-muted small">{log.description}</p>
                                <small className="text-primary">{log.performed_by}</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="card-footer bg-white border-0">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => setActiveTab("logs")}>
                      {t("admin_panel.view_all_logs")}
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">{t("admin_panel.quick_actions")}</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-grid gap-2">
                      <a href="/add-device" className="btn btn-outline-primary">
                        <i className="fas fa-plus-circle me-2"></i>
                        {t("admin_panel.add_device")}
                      </a>
                      <a href="/manage-devices" className="btn btn-outline-success">
                        <i className="fas fa-cogs me-2"></i>
                        {t("admin_panel.manage_devices")}
                      </a>
                      <a href="/manage-users" className="btn btn-outline-info">
                        <i className="fas fa-user-cog me-2"></i>
                        {t("admin_panel.manage_users")}
                      </a>
                      <button
                        className="btn btn-outline-warning"
                        onClick={() => {
                          setActiveTab("borrowings")
                          setStatusFilter("pending")
                        }}
                      >
                        <i className="fas fa-clock me-2"></i>
                        {t("admin_panel.view_pending")}
                        {statistics.pendingBorrowings > 0 && (
                          <span className="badge bg-warning ms-2">{statistics.pendingBorrowings}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Borrowing Status Distribution */}
            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">{t("admin_panel.borrowing_status")}</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="d-flex align-items-center">
                          <div className="status-indicator bg-warning me-2"></div>
                          <div>
                            <div className="small text-muted">{t("admin_panel.status_pending")}</div>
                            <div className="fw-bold">{statistics.pendingBorrowings}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="d-flex align-items-center">
                          <div className="status-indicator bg-success me-2"></div>
                          <div>
                            <div className="small text-muted">{t("admin_panel.status_confirmed")}</div>
                            <div className="fw-bold">{statistics.confirmedBorrowings}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="d-flex align-items-center">
                          <div className="status-indicator bg-info me-2"></div>
                          <div>
                            <div className="small text-muted">{t("admin_panel.status_returned")}</div>
                            <div className="fw-bold">{statistics.returnedBorrowings}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="d-flex align-items-center">
                          <div className="status-indicator bg-danger me-2"></div>
                          <div>
                            <div className="small text-muted">{t("admin_panel.status_rejected")}</div>
                            <div className="fw-bold">{statistics.rejectedBorrowings}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="progress mt-3" style={{ height: "20px" }}>
                      {statistics.totalBorrowings > 0 && (
                        <>
                          <div
                            className="progress-bar bg-warning"
                            role="progressbar"
                            style={{ width: `${(statistics.pendingBorrowings / statistics.totalBorrowings) * 100}%` }}
                            aria-valuenow={statistics.pendingBorrowings}
                            aria-valuemin="0"
                            aria-valuemax={statistics.totalBorrowings}
                          ></div>
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${(statistics.confirmedBorrowings / statistics.totalBorrowings) * 100}%` }}
                            aria-valuenow={statistics.confirmedBorrowings}
                            aria-valuemin="0"
                            aria-valuemax={statistics.totalBorrowings}
                          ></div>
                          <div
                            className="progress-bar bg-info"
                            role="progressbar"
                            style={{ width: `${(statistics.returnedBorrowings / statistics.totalBorrowings) * 100}%` }}
                            aria-valuenow={statistics.returnedBorrowings}
                            aria-valuemin="0"
                            aria-valuemax={statistics.totalBorrowings}
                          ></div>
                          <div
                            className="progress-bar bg-danger"
                            role="progressbar"
                            style={{ width: `${(statistics.rejectedBorrowings / statistics.totalBorrowings) * 100}%` }}
                            aria-valuenow={statistics.rejectedBorrowings}
                            aria-valuemin="0"
                            aria-valuemax={statistics.totalBorrowings}
                          ></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">{t("admin_panel.user_distribution")}</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {["admin", "teacher", "student", "worker"].map((role) => {
                        const count = users.filter((u) => u.role === role).length
                        const percentage = users.length > 0 ? Math.round((count / users.length) * 100) : 0

                        return (
                          <div key={role} className="col-md-6 mb-3">
                            <div className="d-flex align-items-center">
                              <div className={`status-indicator ${getRoleBadgeClass(role)} me-2`}></div>
                              <div>
                                <div className="small text-muted">{t(`roles.${role}`)}</div>
                                <div className="fw-bold">
                                  {count} <span className="small text-muted">({percentage}%)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="progress mt-3" style={{ height: "20px" }}>
                      {users.length > 0 && (
                        <>
                          {["admin", "teacher", "student", "worker"].map((role) => {
                            const count = users.filter((u) => u.role === role).length
                            const percentage = (count / users.length) * 100

                            return (
                              <div
                                key={role}
                                className={`progress-bar ${getRoleBadgeClass(role)}`}
                                role="progressbar"
                                style={{ width: `${percentage}%` }}
                                aria-valuenow={count}
                                aria-valuemin="0"
                                aria-valuemax={users.length}
                              ></div>
                            )
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Borrowings Tab */}
        {activeTab === "borrowings" && (
          <div className="borrowings-tab">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-0 py-3">
                <div className="row align-items-center">
                  <div className="col-md-6 mb-2 mb-md-0">
                    <h5 className="mb-0">{t("admin_panel.borrowings")}</h5>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("admin_panel.search_placeholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchTerm("")}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="p-3 border-bottom">
                  <div className="row">
                    <div className="col-md-6 mb-2 mb-md-0">
                      <div className="btn-group" role="group">
                        <button
                          type="button"
                          className={`btn btn-sm ${statusFilter === "all" ? "btn-primary" : "btn-outline-primary"}`}
                          onClick={() => setStatusFilter("all")}
                        >
                          {t("admin_panel.all")}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${statusFilter === "pending" ? "btn-warning" : "btn-outline-warning"}`}
                          onClick={() => setStatusFilter("pending")}
                        >
                          {t("admin_panel.status_pending")}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${statusFilter === "confirmed" ? "btn-success" : "btn-outline-success"}`}
                          onClick={() => setStatusFilter("confirmed")}
                        >
                          {t("admin_panel.status_confirmed")}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${statusFilter === "returned" ? "btn-info" : "btn-outline-info"}`}
                          onClick={() => setStatusFilter("returned")}
                        >
                          {t("admin_panel.status_returned")}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${statusFilter === "rejected" ? "btn-danger" : "btn-outline-danger"}`}
                          onClick={() => setStatusFilter("rejected")}
                        >
                          {t("admin_panel.status_rejected")}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-6 d-flex justify-content-md-end">
                      <div className="btn-group" role="group">
                        <button
                          type="button"
                          className={`btn btn-sm ${dateRange === "all" ? "btn-secondary" : "btn-outline-secondary"}`}
                          onClick={() => setDateRange("all")}
                        >
                          {t("admin_panel.all_time")}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${dateRange === "today" ? "btn-secondary" : "btn-outline-secondary"}`}
                          onClick={() => setDateRange("today")}
                        >
                          {t("admin_panel.today")}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${dateRange === "week" ? "btn-secondary" : "btn-outline-secondary"}`}
                          onClick={() => setDateRange("week")}
                        >
                          {t("admin_panel.this_week")}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${dateRange === "month" ? "btn-secondary" : "btn-outline-secondary"}`}
                          onClick={() => setDateRange("month")}
                        >
                          {t("admin_panel.this_month")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedItems.length > 0 && (
                  <div className="p-3 bg-light border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="me-2">{t("admin_panel.selected_items", { count: selectedItems.length })}</span>
                        <button
                          className="btn btn-sm btn-link text-decoration-none"
                          onClick={() => setSelectedItems([])}
                        >
                          {t("admin_panel.clear_selection")}
                        </button>
                      </div>
                      <div>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleBulkAction("confirm")}
                          disabled={
                            !selectedItems.some((id) => {
                              const borrow = borrowings.find((b) => b.id === id)
                              return borrow && borrow.status === "pending"
                            })
                          }
                        >
                          <i className="fas fa-check me-1"></i> {t("admin_panel.confirm_selected")}
                        </button>
                        <button
                          className="btn btn-sm btn-danger me-2"
                          onClick={() => handleBulkAction("cancel")}
                          disabled={
                            !selectedItems.some((id) => {
                              const borrow = borrowings.find((b) => b.id === id)
                              return borrow && borrow.status === "pending"
                            })
                          }
                        >
                          <i className="fas fa-times me-1"></i> {t("admin_panel.cancel_selected")}
                        </button>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => handleBulkAction("return")}
                          disabled={
                            !selectedItems.some((id) => {
                              const borrow = borrowings.find((b) => b.id === id)
                              return borrow && borrow.status === "confirmed"
                            })
                          }
                        >
                          <i className="fas fa-undo me-1"></i> {t("admin_panel.return_selected")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {loading.borrowings ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">{t("admin_panel.loading")}</p>
                  </div>
                ) : filteredBorrowings.length === 0 ? (
                  <div className="alert alert-info m-3">{t("admin_panel.no_borrowings_found")}</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={
                                  selectedItems.length > 0 && selectedItems.length === paginatedBorrowings.length
                                }
                                onChange={handleSelectAll}
                                id="selectAll"
                              />
                              <label className="form-check-label" htmlFor="selectAll">
                                <span className="visually-hidden">{t("admin_panel.select_all")}</span>
                              </label>
                            </div>
                          </th>
                          <th className="sortable" onClick={() => handleSort("user")}>
                            {t("admin_panel.user")}
                            {sortConfig.key === "user" && (
                              <i
                                className={`fas fa-sort-${sortConfig.direction === "ascending" ? "up" : "down"} ms-1`}
                              ></i>
                            )}
                          </th>
                          <th className="sortable" onClick={() => handleSort("device")}>
                            {t("admin_panel.device")}
                            {sortConfig.key === "device" && (
                              <i
                                className={`fas fa-sort-${sortConfig.direction === "ascending" ? "up" : "down"} ms-1`}
                              ></i>
                            )}
                          </th>
                          <th className="sortable" onClick={() => handleSort("start_date")}>
                            {t("admin_panel.from")}
                            {sortConfig.key === "start_date" && (
                              <i
                                className={`fas fa-sort-${sortConfig.direction === "ascending" ? "up" : "down"} ms-1`}
                              ></i>
                            )}
                          </th>
                          <th className="sortable" onClick={() => handleSort("end_date")}>
                            {t("admin_panel.to")}
                            {sortConfig.key === "end_date" && (
                              <i
                                className={`fas fa-sort-${sortConfig.direction === "ascending" ? "up" : "down"} ms-1`}
                              ></i>
                            )}
                          </th>
                          <th>{t("admin_panel.usage_place")}</th>
                          <th className="sortable" onClick={() => handleSort("status")}>
                            {t("admin_panel.status")}
                            {sortConfig.key === "status" && (
                              <i
                                className={`fas fa-sort-${sortConfig.direction === "ascending" ? "up" : "down"} ms-1`}
                              ></i>
                            )}
                          </th>
                          <th>{t("admin_panel.action")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedBorrowings.map((b) => (
                          <tr key={b.id} className={selectedItems.includes(b.id) ? "table-active" : ""}>
                            <td>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={selectedItems.includes(b.id)}
                                  onChange={() => handleSelectItem(b.id)}
                                  id={`select-${b.id}`}
                                />
                                <label className="form-check-label" htmlFor={`select-${b.id}`}>
                                  <span className="visually-hidden">{t("admin_panel.select_item")}</span>
                                </label>
                              </div>
                            </td>
                            <td>{b.user}</td>
                            <td>{b.device}</td>
                            <td>{new Date(b.start_date).toLocaleString()}</td>
                            <td>{new Date(b.end_date).toLocaleString()}</td>
                            <td>{b.usage_place}</td>
                            <td>
                              <span className={`badge ${getBadgeClass(b.status)}`}>
                                {getStatusTranslation(b.status, t)}
                              </span>
                            </td>
                            <td>
                              {b.status === "pending" && (
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-success"
                                    onClick={() => handleBorrowingAction(b.id, "confirm")}
                                    title={t("admin_panel.confirm")}
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleBorrowingAction(b.id, "cancel")}
                                    title={t("admin_panel.cancel")}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              )}
                              {b.status === "confirmed" && (
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => handleBorrowingAction(b.id, "return")}
                                  title={t("admin_panel.return")}
                                >
                                  <i className="fas fa-undo"></i>
                                </button>
                              )}
                              {(b.status === "rejected" || b.status === "returned") && (
                                <span className="text-muted">{t("admin_panel.no_actions")}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {filteredBorrowings.length > ITEMS_PER_PAGE && (
                  <div className="d-flex justify-content-between align-items-center p-3 border-top">
                    <div>
                      {t("admin_panel.showing_items", {
                        from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                        to: Math.min(currentPage * ITEMS_PER_PAGE, filteredBorrowings.length),
                        total: filteredBorrowings.length,
                      })}
                    </div>
                    <nav aria-label="Page navigation">
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage(1)} aria-label="First">
                            <i className="fas fa-angle-double-left"></i>
                          </button>
                        </li>
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            aria-label="Previous"
                          >
                            <i className="fas fa-angle-left"></i>
                          </button>
                        </li>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <li key={i} className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                              <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                                {pageNum}
                              </button>
                            </li>
                          )
                        })}

                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            aria-label="Next"
                          >
                            <i className="fas fa-angle-right"></i>
                          </button>
                        </li>
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage(totalPages)} aria-label="Last">
                            <i className="fas fa-angle-double-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="users-tab">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-0 py-3">
                <div className="row align-items-center">
                  <div className="col-md-6 mb-2 mb-md-0">
                    <h5 className="mb-0">{t("admin_panel.users")}</h5>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("admin_panel.search_users")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchTerm("")}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                {loading.users ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">{t("admin_panel.loading")}</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="alert alert-info m-3">{t("admin_panel.no_users_found")}</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>{t("users.name")}</th>
                          <th>{t("users.registration_number")}</th>
                          <th>{t("users.phone")}</th>
                          <th>{t("users.role")}</th>
                          <th>{t("users.academic_year")}</th>
                          <th>{t("users.status")}</th>
                          <th>{t("users.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id}>
                            <td>{u.full_name}</td>
                            <td>{u.registration_number}</td>
                            <td>{u.phone}</td>
                            <td>
                              <span className={`badge ${getRoleBadgeClass(u.role)}`}>{t(`roles.${u.role}`)}</span>
                            </td>
                            <td>{u.academic_year || "-"}</td>
                            <td>
                              <span className={`badge ${u.is_active ? "bg-success" : "bg-danger"}`}>
                                {u.is_active ? t("users.active") : t("users.inactive")}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                {u.is_active ? (
                                  <button
                                    className="btn btn-warning"
                                    onClick={() => handleUserAction(u.id, "deactivate")}
                                    title={t("users.deactivate")}
                                  >
                                    <i className="fas fa-ban"></i>
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-success"
                                    onClick={() => handleUserAction(u.id, "activate")}
                                    title={t("users.activate")}
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                )}
                                <button
                                  className="btn btn-danger"
                                  onClick={() => {
                                    if (window.confirm(t("users.confirm_delete"))) {
                                      handleUserAction(u.id, "delete")
                                    }
                                  }}
                                  title={t("users.delete")}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="logs-tab">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-0 py-3">
                <div className="row align-items-center">
                  <div className="col-md-6 mb-2 mb-md-0">
                    <h5 className="mb-0">{t("admin_panel.logs")}</h5>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("admin_panel.search_logs")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchTerm("")}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                {loading.logs ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">{t("admin_panel.loading")}</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="alert alert-info m-3">{t("admin_panel.no_logs_found")}</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>{t("admin_panel.timestamp")}</th>
                          <th>{t("admin_panel.action")}</th>
                          <th>{t("admin_panel.description")}</th>
                          <th>{t("admin_panel.performed_by")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log) => (
                          <tr key={log.id}>
                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                            <td>
                              <span className="badge bg-primary">{log.action}</span>
                            </td>
                            <td>{log.description}</td>
                            <td>{log.performed_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS */}
      <style jsx="true">{`
        .sortable {
          cursor: pointer;
        }
        .sortable:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        .status-indicator {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }
        .timeline {
          position: relative;
          padding-left: 1.5rem;
        }
        .timeline-item {
          position: relative;
          padding-bottom: 1.5rem;
        }
        .timeline-item:last-child {
          padding-bottom: 0;
        }
        .timeline-item-marker {
          position: absolute;
          left: -1.5rem;
          width: 1.5rem;
          height: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }
        .timeline-item-marker-indicator {
          width: 12px;
          height: 12px;
          border-radius: 100%;
          margin-top: 0.25rem;
        }
        .timeline-item-marker::before {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          border-left: 1px solid #dee2e6;
          transform: translateX(-50%);
        }
        .timeline-item:last-child .timeline-item-marker::before {
          bottom: 50%;
        }
      `}</style>

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

// Helper function to get badge class based on role
function getRoleBadgeClass(role) {
  switch (role) {
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

export default AdminPanel
