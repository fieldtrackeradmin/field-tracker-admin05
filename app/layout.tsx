import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
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
        }}>

          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main style={{
            flex: 1,
            marginLeft: 0,
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
            <div style={{
              padding: "36px 40px",
              maxWidth: 1400,
              margin: "0 auto",
            }}>
              {children}
            </div>
          </main>

        </div>
      </body>
    </html>
  );
}