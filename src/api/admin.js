// src/api/admin.js
import client from "./client";

export const adminVehicles = {
  list: (params = {}) => client.get("/admin/vehicles", { params }),
  get: (id) => client.get(`/admin/vehicles/${id}`),
  create: (payload) => client.post("/admin/vehicles", payload),
  update: (id, payload) => client.patch(`/admin/vehicles/${id}`, payload),
  remove: (id) => client.delete(`/admin/vehicles/${id}`),
};

export const adminReviews = {
  list: (params = {}) => client.get("/admin/reviews", { params }),
  update: (id, payload) => client.patch(`/admin/reviews/${id}`, payload),
  remove: (id) => client.delete(`/admin/reviews/${id}`),
};

export const adminBookings = {
  list: (params = {}) => client.get("/admin/bookings", { params }),
  update: (id, payload) => client.patch(`/admin/bookings/${id}`, payload),
};

export default { adminVehicles, adminReviews, adminBookings };
