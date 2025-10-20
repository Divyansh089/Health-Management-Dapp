import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./app.css";
import queryClient from "./state/queryClient.js";
import { Web3Provider } from "./state/Web3Provider.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Web3Provider>
          <App />
        </Web3Provider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
