import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import AddDevice from "./pages/AddDevice";
import ManageDevices from "./pages/ManageDevices";
import ManageUsers from "./pages/ManageUsers";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import MyBorrowings from "./pages/MyBorrowings";
import BorrowPage from "./pages/BorrowPage";
import AboutPage from "./pages/AboutPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/add-device" element={<ProtectedRoute><AddDevice /></ProtectedRoute>} />
        <Route path="/manage-devices" element={<ProtectedRoute><ManageDevices /></ProtectedRoute>} />
        <Route path="/manage-users" element={<ProtectedRoute><ManageUsers /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/my-borrowings" element={<ProtectedRoute><MyBorrowings /></ProtectedRoute>} />
        <Route path="/borrow" element={<ProtectedRoute><BorrowPage /></ProtectedRoute>} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;