"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import { toast, ToastContainer } from "react-toastify"
import { useTranslation } from "react-i18next"
import "react-toastify/dist/ReactToastify.css"

const ManageUsers = () => {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" })
  const [actionInProgress, setActionInProgress] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [userDetail, setUserDetail] = useState(null)

  const token = localStorage.getItem("token")
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}")
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, selectedRole, selectedStatus])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", { headers })
      setUsers(res.data)
    } catch (error) {
      toast.error(t("users.error_fetch"))
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.phone && user.phone.includes(searchTerm)),
      )
    }

    if (selectedRole) {
      filtered = filtered.filter((user) => user.role === selectedRole)
    }

    if (selectedStatus) {
      const isActive = selectedStatus === "active"
      filtered = filtered.filter((user) => user.is_active === isActive)
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

    setFilteredUsers(filtered)
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

  // Get current users for pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const handleAction = async (userId, action) => {
    // Don't allow actions on self
    if (userId === currentUser.id) {
      toast.warning(t("users.cannot_modify_self"))
      return
    }

    setActionInProgress(userId)
    try {
      await axios.put(`http://localhost:5000/api/admin/user/${userId}/${action}`, {}, { headers })

      let successMessage
      switch (action) {
        case "activate":
          successMessage = t("users.success_activate")
          break
        case "deactivate":
          successMessage = t("users.success_deactivate")
          break
        case "delete":
          successMessage = t("users.success_delete")
          break
        default:
          successMessage = t("users.success_action")
      }

      toast.success(successMessage)
      setConfirmAction(null)
      fetchUsers()
    } catch (error) {
      toast.error(t("users.error_action"))
    } finally {
      setActionInProgress(null)
    }
  }

  const showConfirmation = (userId, action) => {
    setConfirmAction({ userId, action })
  }

  const cancelAction = () => {
    setConfirmAction(null)
  }

  const showUserDetail = (user) => {
    setUserDetail(user)
  }

  const closeUserDetail = () => {
    setUserDetail(null)
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("")
    setSelectedRole("")
    setSelectedStatus("")
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

  // Get role badge class
  const getRoleBadgeClass = (role) => {
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

  // Get role translation
  const getRoleTranslation = (role) => {
    return t(`roles.${role}`) || role
  }

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="card shadow-lg border-0" style={styles.card}>
          <div className="card-header bg-light p-4" style={styles.cardHeader}>
            <div className="d-flex align-items-center">
              <div className="display-6 text-primary me-3">
                <i className="fas fa-users"></i>
              </div>
              <div>
                <h2 className="mb-0">{t("users.title")}</h2>
                <p className="text-muted mb-0">{t("users.subtitle")}</p>
              </div>
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
                    placeholder={t("users.search_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3 mb-3 mb-md-0">
                <select className="form-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="">{t("users.all_roles")}</option>
                  <option value="admin">{t("roles.admin")}</option>
                  <option value="teacher">{t("roles.teacher")}</option>
                  <option value="student">{t("roles.student")}</option>
                  <option value="worker">{t("roles.worker")}</option>
                </select>
              </div>
              <div className="col-md-3 mb-3 mb-md-0">
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">{t("users.all_statuses")}</option>
                  <option value="active">{t("users.active")}</option>
                  <option value="inactive">{t("users.inactive")}</option>
                </select>
              </div>
              <div className="col-md-2 d-flex justify-content-md-end">
                <button className="btn btn-outline-secondary w-100" onClick={handleResetFilters}>
                  <i className="fas fa-undo me-2"></i>
                  {t("users.reset")}
                </button>
              </div>
            </div>

            {/* Users table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t("users.loading")}</span>
                </div>
                <p className="mt-2">{t("users.loading")}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                {searchTerm || selectedRole || selectedStatus ? t("users.no_matching_users") : t("users.no_users")}
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover border">
                    <thead className="table-light">
                      <tr>
                        <th className="cursor-pointer" onClick={() => requestSort("full_name")}>
                          {t("users.name")}
                          {getSortIndicator("full_name")}
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("registration_number")}>
                          {t("users.registration")}
                          {getSortIndicator("registration_number")}
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("role")}>
                          {t("users.role")}
                          {getSortIndicator("role")}
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("is_active")}>
                          {t("users.status")}
                          {getSortIndicator("is_active")}
                        </th>
                        <th>{t("users.action")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <button
                              className="btn btn-link text-decoration-none p-0 text-start"
                              onClick={() => showUserDetail(user)}
                            >
                              {user.full_name}
                            </button>
                          </td>
                          <td>{user.registration_number}</td>
                          <td>
                            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                              {getRoleTranslation(user.role)}
                            </span>
                          </td>
                          <td>
                            {user.is_active ? (
                              <span className="badge bg-success">{t("users.active")}</span>
                            ) : (
                              <span className="badge bg-danger">{t("users.inactive")}</span>
                            )}
                          </td>
                          <td>
                            {confirmAction && confirmAction.userId === user.id ? (
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleAction(user.id, confirmAction.action)}
                                  disabled={actionInProgress === user.id}
                                >
                                  {actionInProgress === user.id ? (
                                    <span
                                      className="spinner-border spinner-border-sm me-1"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                  ) : (
                                    <i className="fas fa-check me-1"></i>
                                  )}
                                  {t("users.confirm")}
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={cancelAction}
                                  disabled={actionInProgress === user.id}
                                >
                                  <i className="fas fa-times me-1"></i>
                                  {t("users.cancel")}
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex gap-2">
                                {user.id !== currentUser.id && (
                                  <>
                                    {user.is_active ? (
                                      <button
                                        className="btn btn-warning btn-sm"
                                        onClick={() => showConfirmation(user.id, "deactivate")}
                                        disabled={actionInProgress === user.id}
                                        title={t("users.deactivate")}
                                      >
                                        <i className="fas fa-user-lock"></i>
                                      </button>
                                    ) : (
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => showConfirmation(user.id, "activate")}
                                        disabled={actionInProgress === user.id}
                                        title={t("users.activate")}
                                      >
                                        <i className="fas fa-user-check"></i>
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => showConfirmation(user.id, "delete")}
                                      disabled={actionInProgress === user.id}
                                      title={t("users.delete")}
                                    >
                                      <i className="fas fa-user-times"></i>
                                    </button>
                                  </>
                                )}
                                <button
                                  className="btn btn-info btn-sm text-white"
                                  onClick={() => showUserDetail(user)}
                                  title={t("users.view_details")}
                                >
                                  <i className="fas fa-eye"></i>
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
                  {t("users.showing_results", {
                    showing: currentUsers.length,
                    total: filteredUsers.length,
                  })}
                </div>
              </>
            )}
          </div>

          <div className="card-footer bg-light p-3 text-center" style={styles.cardFooter}>
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              {t("users.footer_note")}
            </small>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {userDetail && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title">{t("users.user_details")}</h5>
                <button type="button" className="btn-close" onClick={closeUserDetail}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                  <div
                    className={`d-inline-flex align-items-center justify-content-center rounded-circle ${getRoleBadgeClass(userDetail.role)}`}
                    style={{ width: "80px", height: "80px", fontSize: "2rem", color: "white" }}
                  >
                    {userDetail.full_name.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="mt-2">{userDetail.full_name}</h4>
                  <span className={`badge ${getRoleBadgeClass(userDetail.role)} mb-2`}>
                    {getRoleTranslation(userDetail.role)}
                  </span>
                  <span className={`badge ms-2 ${userDetail.is_active ? "bg-success" : "bg-danger"}`}>
                    {userDetail.is_active ? t("users.active") : t("users.inactive")}
                  </span>
                </div>

                <div className="card mb-3">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span className="fw-bold">{t("users.registration")}</span>
                      <span>{userDetail.registration_number}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span className="fw-bold">{t("users.phone")}</span>
                      <span>{userDetail.phone || t("users.not_provided")}</span>
                    </li>
                    {userDetail.role === "student" && userDetail.academic_year && (
                      <li className="list-group-item d-flex justify-content-between">
                        <span className="fw-bold">{t("users.academic_year")}</span>
                        <span>{userDetail.academic_year}</span>
                      </li>
                    )}
                  </ul>
                </div>

                {userDetail.id !== currentUser.id && (
                  <div className="d-flex justify-content-center gap-2">
                    {userDetail.is_active ? (
                      <button
                        className="btn btn-warning"
                        onClick={() => {
                          closeUserDetail()
                          showConfirmation(userDetail.id, "deactivate")
                        }}
                      >
                        <i className="fas fa-user-lock me-2"></i>
                        {t("users.deactivate")}
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        onClick={() => {
                          closeUserDetail()
                          showConfirmation(userDetail.id, "activate")
                        }}
                      >
                        <i className="fas fa-user-check me-2"></i>
                        {t("users.activate")}
                      </button>
                    )}
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        closeUserDetail()
                        showConfirmation(userDetail.id, "delete")
                      }}
                    >
                      <i className="fas fa-user-times me-2"></i>
                      {t("users.delete")}
                    </button>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeUserDetail}>
                  {t("users.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default ManageUsers
