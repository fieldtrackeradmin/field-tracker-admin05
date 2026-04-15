"use client";

import { useState, type ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Menu, X } from "lucide-react";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div style={{
          display: "flex",
          minHeight: "100vh",
          background: "#0a0a0f",
          fontFamily: "'Geist', sans-serif",
          flexDirection: "column",
        }}>

          {/* Mobile Header */}
          <header className="mobileHeader">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: 9,
                background: "linear-gradient(135deg, #6C63FF, #a78bfa)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Menu size={18} color="#fff" onClick={() => setSidebarOpen(true)} style={{ cursor: "pointer" }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>Field Admin</span>
            </div>
          </header>

          <div style={{ display: "flex", flex: 1 }}>
            {/* Desktop Sidebar Container */}
            <div className="desktopSidebarContainer">
              <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
              <div className="sidebarOverlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Mobile Sidebar Drawer */}
            <div className={`mobileSidebar ${sidebarOpen ? "open" : ""}`}>
              <div style={{ position: "absolute", top: 20, right: 20, zIndex: 110 }}>
                <X size={24} color="#9ca3af" onClick={() => setSidebarOpen(false)} style={{ cursor: "pointer" }} />
              </div>
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <main style={{
              flex: 1,
              background: "#f4f5f7",
              overflowY: "auto",
              minHeight: "100vh",
              position: "relative",
            }}>
              {/* Top accent bar */}
              <div style={{
                height: 3,
                background: "linear-gradient(90deg, #6C63FF 0%, #00c9a7 50%, #f59e0b 100%)",
                position: "sticky",
                top: 0,
                zIndex: 50,
              }} />

              {/* Content wrapper */}
              <div className="contentWrapper">
                {children}
              </div>
            </main>
          </div>

        </div>
      </body>
    </html>
  );
}