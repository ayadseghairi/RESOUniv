"use client"

import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { useTranslation } from "react-i18next"
import { toast, ToastContainer } from "react-toastify"
import Navbar from "../components/Navbar"
import { Link } from "react-router-dom"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js"
import { Pie, Bar } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const Dashboard = () => {
  const { t, i18n } = useTranslation()
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const token = localStorage.getItem("token")

  // State for data
  const [devices, setDevices] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    rejected: 0,
    returned: 0,
  })

  // UI state
  const [loading, setLoading] = useState({
    devices: true,
    requests: true,
    stats: true,
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [timeframe, setTimeframe] = useState("week")

  useEffect(() => {
    if (token) {
      fetchDevices()
      fetchMyRequests()
    } else {
      toast.error(t("dashboard.error_no_token"))
    }
  }, [token])

  // Fetch devices from API
  const fetchDevices = async () => {
    setLoading((prev) => ({ ...prev, devices: true }))
    try {
      const res = await axios.get("http://localhost:5000/api/devices", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDevices(res.data)
    } catch (err) {
      console.error("Error fetching devices:", err)
      toast.error(t("dashboard.error_fetch_devices"))
    } finally {
      setLoading((prev) => ({ ...prev, devices: false }))
    }
  }

  // Fetch user's borrowing requests
  const fetchMyRequests = async () => {
    setLoading((prev) => ({ ...prev, requests: true }))
    try {
      const res = await axios.get(`http://localhost:5000/api/borrow/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMyRequests(res.data)

      // Calculate statistics
      const statData = {
        total: res.data.length,
        pending: res.data.filter((req) => req.status === "pending").length,
        confirmed: res.data.filter((req) => req.status === "confirmed").length,
        rejected: res.data.filter((req) => req.status === "rejected").length,
        returned: res.data.filter((req) => req.status === "returned").length,
      }
      setStats(statData)
    } catch (err) {
      console.error("Error fetching requests:", err)
      if (err.response?.status !== 404) {
        toast.error(t("dashboard.error_fetch_requests"))
      } else {
        setMyRequests([])
        setStats({
          total: 0,
          pending: 0,
          confirmed: 0,
          rejected: 0,
          returned: 0,
        })
      }
    } finally {
      setLoading((prev) => ({ ...prev, requests: false }))
    }
  }

  // Refresh data
  const handleRefresh = () => {
    fetchDevices()
    fetchMyRequests()
    toast.info(t("dashboard.refreshed"))
  }

  // Filter requests by timeframe
  const filteredRequests = useMemo(() => {
    if (!myRequests.length) return []

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    switch (timeframe) {
      case "week":
        return myRequests.filter((req) => new Date(req.start_date) >= weekAgo)
      case "month":
        return myRequests.filter((req) => new Date(req.start_date) >= monthAgo)
      case "all":
      default:
        return myRequests
    }
  }, [myRequests, timeframe])

  // Get active borrowings (current date is between start and end date)
  const activeBorrowings = useMemo(() => {
    if (!myRequests.length) return []

    const now = new Date()
    return myRequests.filter(
      (req) => req.status === "confirmed" && new Date(req.start_date) <= now && new Date(req.end_date) >= now,
    )
  }, [myRequests])

  // Get upcoming borrowings (start date is in the future)
  const upcomingBorrowings = useMemo(() => {
    if (!myRequests.length) return []

    const now = new Date()
    return myRequests.filter((req) => req.status === "confirmed" && new Date(req.start_date) > now)
  }, [myRequests])

  // Prepare chart data for status distribution
  const statusChartData = {
    labels: [
      t("admin_panel.status_pending"),
      t("admin_panel.status_confirmed"),
      t("admin_panel.status_rejected"),
      t("admin_panel.status_returned"),
    ],
    datasets: [
      {
        data: [stats.pending, stats.confirmed, stats.rejected, stats.returned],
        backgroundColor: [
          "rgba(255, 193, 7, 0.8)", // warning - pending
          "rgba(40, 167, 69, 0.8)", // success - confirmed
          "rgba(220, 53, 69, 0.8)", // danger - rejected
          "rgba(23, 162, 184, 0.8)", // info - returned
        ],
        borderColor: ["rgba(255, 193, 7, 1)", "rgba(40, 167, 69, 1)", "rgba(220, 53, 69, 1)", "rgba(23, 162, 184, 1)"],
        borderWidth: 1,
      },
    ],
  }

  // Prepare chart data for device distribution
  const deviceChartData = useMemo(() => {
    if (!devices.length) return { labels: [], datasets: [{ data: [], backgroundColor: [] }] }

    // Get top 5 devices by quantity
    const topDevices = [...devices].sort((a, b) => b.quantity - a.quantity).slice(0, 5)

    return {
      labels: topDevices.map((device) => device.name),
      datasets: [
        {
          label: t("dashboard.available_devices"),
          data: topDevices.map((device) => device.quantity),
          backgroundColor: [
            "rgba(54, 162, 235, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
            "rgba(255, 159, 64, 0.8)",
            "rgba(255, 99, 132, 0.8)",
          ],
          borderColor: [
            "rgba(54, 162, 235, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(255, 99, 132, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }
  }, [devices])

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Get badge class based on status
  const getBadgeClass = (status) => {
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

  // Get status translation
  const getStatusTranslation = (status) => {
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

  // Render overview tab content
  const renderOverviewTab = () => (
    <>
      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
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
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
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
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
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
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
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

      {/* Charts Row */}
      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h5 className="card-title mb-0">{t("dashboard.status_distribution")}</h5>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center">
              {loading.requests ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t("dashboard.loading")}</span>
                  </div>
                </div>
              ) : stats.total === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                  <p>{t("dashboard.no_data_to_display")}</p>
                </div>
              ) : (
                <div style={{ height: "250px", width: "250px" }}>
                  <Pie data={statusChartData} options={{ maintainAspectRatio: true }} />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h5 className="card-title mb-0">{t("dashboard.available_devices")}</h5>
            </div>
            <div className="card-body">
              {loading.devices ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t("dashboard.loading")}</span>
                  </div>
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-laptop fa-3x text-muted mb-3"></i>
                  <p>{t("dashboard.no_devices")}</p>
                </div>
              ) : (
                <Bar
                  data={deviceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active and Upcoming Borrowings */}
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h5 className="card-title mb-0">
                <i className="fas fa-play-circle text-success me-2"></i>
                {t("dashboard.active_borrowings")}
              </h5>
            </div>
            <div className="card-body">
              {loading.requests ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t("dashboard.loading")}</span>
                  </div>
                </div>
              ) : activeBorrowings.length === 0 ? (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  {t("dashboard.no_active_borrowings")}
                </div>
              ) : (
                <div className="list-group">
                  {activeBorrowings.map((borrowing) => (
                    <div key={borrowing.id} className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{borrowing.device}</h6>
                        <small className="text-success">
                          <i className="fas fa-circle me-1"></i>
                          {t("dashboard.active")}
                        </small>
                      </div>
                      <p className="mb-1 small">
                        <i className="fas fa-map-marker-alt me-1 text-muted"></i> {borrowing.usage_place}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {t("dashboard.return_by")}: {formatDate(borrowing.end_date)}
                        </small>
                        <Link to="/my-borrowings" className="btn btn-sm btn-outline-primary">
                          <i className="fas fa-eye me-1"></i>
                          {t("dashboard.details")}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h5 className="card-title mb-0">
                <i className="fas fa-calendar-alt text-primary me-2"></i>
                {t("dashboard.upcoming_borrowings")}
              </h5>
            </div>
            <div className="card-body">
              {loading.requests ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t("dashboard.loading")}</span>
                  </div>
                </div>
              ) : upcomingBorrowings.length === 0 ? (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  {t("dashboard.no_upcoming_borrowings")}
                </div>
              ) : (
                <div className="list-group">
                  {upcomingBorrowings.map((borrowing) => (
                    <div key={borrowing.id} className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{borrowing.device}</h6>
                        <small className="text-primary">
                          <i className="fas fa-calendar me-1"></i>
                          {t("dashboard.upcoming")}
                        </small>
                      </div>
                      <p className="mb-1 small">
                        <i className="fas fa-map-marker-alt me-1 text-muted"></i> {borrowing.usage_place}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {t("dashboard.starts_at")}: {formatDate(borrowing.start_date)}
                        </small>
                        <Link to="/my-borrowings" className="btn btn-sm btn-outline-primary">
                          <i className="fas fa-eye me-1"></i>
                          {t("dashboard.details")}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // Render devices tab content
  const renderDevicesTab = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">{t("dashboard.available_devices")}</h5>
        <Link to="/borrow" className="btn btn-sm btn-primary">
          <i className="fas fa-plus-circle me-1"></i>
          {t("dashboard.borrow_device")}
        </Link>
      </div>
      <div className="card-body">
        {loading.devices ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t("dashboard.loading")}</span>
            </div>
          </div>
        ) : devices.length === 0 ? (
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            {t("dashboard.no_devices")}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>{t("devices.name")}</th>
                  <th>{t("devices.type")}</th>
                  <th>{t("devices.quantity")}</th>
                  <th>{t("dashboard.action")}</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id}>
                    <td>{device.name}</td>
                    <td>
                      <span className="badge bg-info text-dark">{device.device_type}</span>
                    </td>
                    <td>
                      <span className="badge bg-primary">{device.quantity}</span>
                    </td>
                    <td>
                      <Link to="/borrow" className="btn btn-sm btn-outline-primary">
                        <i className="fas fa-hand-holding me-1"></i>
                        {t("dashboard.borrow")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  // Render requests tab content
  const renderRequestsTab = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">{t("dashboard.my_requests")}</h5>
        <div className="d-flex align-items-center">
          <div className="btn-group me-2">
            <button
              type="button"
              className={`btn btn-sm ${timeframe === "week" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setTimeframe("week")}
            >
              {t("dashboard.week")}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${timeframe === "month" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setTimeframe("month")}
            >
              {t("dashboard.month")}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${timeframe === "all" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setTimeframe("all")}
            >
              {t("dashboard.all")}
            </button>
          </div>
          <Link to="/my-borrowings" className="btn btn-sm btn-primary">
            <i className="fas fa-list me-1"></i>
            {t("dashboard.view_all")}
          </Link>
        </div>
      </div>
      <div className="card-body">
        {loading.requests ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t("dashboard.loading_requests")}</span>
            </div>
            <p className="mt-2">{t("dashboard.loading_requests")}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            {timeframe !== "all" ? t("dashboard.no_requests_in_timeframe") : t("dashboard.no_requests")}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>{t("dashboard.device")}</th>
                  <th>{t("dashboard.from")}</th>
                  <th>{t("dashboard.to")}</th>
                  <th>{t("dashboard.usage_place")}</th>
                  <th>{t("dashboard.status")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.device}</td>
                    <td>{formatDate(req.start_date)}</td>
                    <td>{formatDate(req.end_date)}</td>
                    <td>{req.usage_place}</td>
                    <td>
                      <span className={`badge ${getBadgeClass(req.status)}`}>{getStatusTranslation(req.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <Navbar />

      <div className="container py-4">
        {/* Welcome header with refresh button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">
              {t("dashboard.welcome")}, {user.full_name}
            </h2>
            <p className="text-muted mb-0">
              <i className="fas fa-user-tag me-2"></i>
              {t(`roles.${user.role}`)}
              {user.role === "student" && user.registration_number && ` - ${user.registration_number}`}
            </p>
          </div>
          <button onClick={handleRefresh} className="btn btn-outline-primary">
            <i className="fas fa-sync-alt me-2"></i> {t("dashboard.refresh")}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="row mb-4">
          <div className="col-md-6 col-lg-3 mb-3">
            <Link to="/borrow" className="card border-0 shadow-sm h-100 text-decoration-none">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                  <i className="fas fa-plus-circle text-primary"></i>
                </div>
                <div>
                  <h6 className="card-title mb-0 text-primary">{t("dashboard.new_request")}</h6>
                  <p className="card-text small text-muted mb-0">{t("dashboard.borrow_device")}</p>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3 mb-3">
            <Link to="/my-borrowings" className="card border-0 shadow-sm h-100 text-decoration-none">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                  <i className="fas fa-list text-success"></i>
                </div>
                <div>
                  <h6 className="card-title mb-0 text-success">{t("dashboard.my_borrowings")}</h6>
                  <p className="card-text small text-muted mb-0">{t("dashboard.view_all_requests")}</p>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3 mb-3">
            <Link to="/settings" className="card border-0 shadow-sm h-100 text-decoration-none">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                  <i className="fas fa-cog text-warning"></i>
                </div>
                <div>
                  <h6 className="card-title mb-0 text-warning">{t("navbar.settings")}</h6>
                  <p className="card-text small text-muted mb-0">{t("dashboard.manage_account")}</p>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3 mb-3">
            <Link to="/about" className="card border-0 shadow-sm h-100 text-decoration-none">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                  <i className="fas fa-info-circle text-info"></i>
                </div>
                <div>
                  <h6 className="card-title mb-0 text-info">{t("navbar.about")}</h6>
                  <p className="card-text small text-muted mb-0">{t("dashboard.about_system")}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Tabs Navigation */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <i className="fas fa-chart-pie me-2"></i>
              {t("dashboard.overview")}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "devices" ? "active" : ""}`}
              onClick={() => setActiveTab("devices")}
            >
              <i className="fas fa-laptop me-2"></i>
              {t("dashboard.devices")}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "requests" ? "active" : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              <i className="fas fa-clipboard-list me-2"></i>
              {t("dashboard.requests")}
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "devices" && renderDevicesTab()}
        {activeTab === "requests" && renderRequestsTab()}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

export default Dashboard
