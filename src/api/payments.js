// src/api/payments.js
import client from "./client";

export const payments = {
  order(bookingId) {
    return client.post("/payments/razorpay/order", { bookingId });
  },
  verify({ bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    return client.post("/payments/razorpay/verify", {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
  },
};

export default payments;
