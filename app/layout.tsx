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
      <body>

        <div
          style={{
            display: "flex",
            minHeight: "100vh",
          }}
        >

          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main
            style={{
              flex: 1,
              padding: "40px",
              background: "#f3f4f6",
              overflowY: "auto",
            }}
          >
            {children}
          </main>

        </div>

      </body>
    </html>
  );
}