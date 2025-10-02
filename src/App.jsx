// src/App.jsx
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";

import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import VehicleDetail from "./pages/VehicleDetail.jsx";
import Checkout from "./pages/Checkout.jsx";
import CheckoutList from "./pages/CheckoutList.jsx";
import AuthLogin from "./pages/AuthLogin.jsx";
import AuthRegister from "./pages/AuthRegister.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Bookings from "./pages/Bookings.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Admin
import AdminRoute from "./components/AdminRoute.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminBookings from "./admin/AdminBookings.jsx";
import AdminVehicles from "./admin/AdminVehicles.jsx";
import AdminReviews from "./admin/AdminReviews.jsx";
import VehicleForm from "./admin/VehicleForm.jsx"; // <-- ADD THIS
import "./styles/admin.css";

// Premium navbar
import Navbar from "./components/Navbar.jsx";

export default function App() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/", { replace: true });
  }

  const isAdmin = useMemo(() => {
    if (user?.role === "admin") return true;
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;
      const body = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return body?.role === "admin" || body?.isAdmin === true;
    } catch {
      return false;
    }
  }, [user]);

  return (
    <>
      <Navbar user={user} onLogout={logout} />

      <main className={isHome ? "" : "v-container py-6"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/vehicle/:id" element={<VehicleDetail />} />

          <Route
            path="/checkout/:bookingId"
            element={
              <ProtectedRoute user={user}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout-list"
            element={
              <ProtectedRoute user={user}>
                <CheckoutList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute user={user}>
                <Bookings />
              </ProtectedRoute>
            }
          />

          {/* Auth */}
          <Route
            path="/login"
            element={
              <AuthLogin
                onAuth={(data) => {
                  localStorage.setItem("token", data.token);
                  localStorage.setItem("user", JSON.stringify(data.user));
                  setUser(data.user);
                }}
              />
            }
          />
          <Route
            path="/register"
            element={
              <AuthRegister
                onAuth={(data) => {
                  localStorage.setItem("token", data.token);
                  localStorage.setItem("user", JSON.stringify(data.user));
                  setUser(data.user);
                }}
              />
            }
          />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin (guarded) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="vehicles" element={<AdminVehicles />} />

            {/* NEW: vehicle create/edit routes (fixes 404) */}
            <Route path="vehicles/new" element={<VehicleForm mode="create" />} />
            <Route path="vehicles/:id/edit" element={<VehicleForm mode="edit" />} />
            {/* optional alias: open edit form at /admin/vehicles/:id */}
            <Route path="vehicles/:id" element={<VehicleForm mode="edit" />} />

            <Route path="reviews" element={<AdminReviews />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
