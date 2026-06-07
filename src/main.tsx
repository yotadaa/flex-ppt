import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/google-fonts.css";
import "./styles/tokens.css";
import "./styles/slide-source.css";
import "./styles/slide-compat.css";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
