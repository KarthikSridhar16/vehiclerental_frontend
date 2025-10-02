import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./state/AuthContext.jsx";
import Toaster from "./ui/Toaster.jsx";
import MailNoticeListener from "./ui/MailNoticeListener.jsx";

import "./tailwind.css";
import "./styles/base.css";
import "./styles/mixins.css";
import "./styles/responsive.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <MailNoticeListener />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
  