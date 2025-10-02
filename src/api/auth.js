// src/api/auth.js
import client from "./client";

export const auth = {
  forgot(email) {
    return client.post("/auth/forgot", { email });
  },
  reset({ email, token, password }) {
    return client.post("/auth/reset", { email, token, password });
  },
};

export default auth;
