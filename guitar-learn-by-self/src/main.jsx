// src/main.jsx
import React from "react"; // 🛠 THÊM DÒNG NÀY
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
    
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
