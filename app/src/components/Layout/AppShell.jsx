import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import "./Layout.css";
import { SearchProvider } from "../../state/SearchContext.jsx";

export default function AppShell({ sidebarTitle, sidebarItems, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <SearchProvider>
      <div className="app-shell">
        <TopBar />
        <div className={`app-shell-body ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <Sidebar 
            title={sidebarTitle} 
            items={sidebarItems} 
            onCollapseChange={setSidebarCollapsed}
          />
          <main className="app-shell-content">{children}</main>
        </div>
      </div>
    </SearchProvider>
  );
}
