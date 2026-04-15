"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Map,
  Store,
  ListChecks,
  PlusCircle,
  ShoppingBag,
} from "lucide-react";

const menu = [
  { name: "Dashboard",   path: "/dashboard",   icon: LayoutDashboard },
  { name: "Employees",   path: "/employees",   icon: Users },
  { name: "Live Map",    path: "/live-map",    icon: Map },
  { name: "Shops",       path: "/shops",       icon: Store },
  { name: "Tasks",       path: "/tasks",       icon: ListChecks },
  { name: "Create Task", path: "/create-task", icon: PlusCircle },
  { name: "Orders",      path: "/orders",      icon: ShoppingBag },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <div style={{
      width: 240,
      minHeight: "100vh",
      background: "#0d0d14",
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
    }}>

      {/* Logo */}
      <div style={{ padding: "28px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: 9,
            background: "linear-gradient(135deg, #6C63FF, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <LayoutDashboard size={16} color="#fff" />
          </div>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#f9fafb",
            letterSpacing: "-0.3px",
          }}>
            Field Admin
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px 16px" }} />

      {/* Nav label */}
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#4b5563",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        padding: "0 20px 10px",
      }}>
        Navigation
      </div>

      {/* Menu */}
      <nav style={{ padding: "0 10px", flex: 1 }}>
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={handleLinkClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                marginBottom: 2,
                borderRadius: 9,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#a78bfa" : "#9ca3af",
                background: isActive ? "rgba(108,99,255,0.15)" : "transparent",
                transition: "all 0.15s",
                position: "relative",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.color = "#e5e7eb";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#9ca3af";
                }
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: 18,
                  borderRadius: "0 3px 3px 0",
                  background: "#6C63FF",
                }} />
              )}

              <div style={{
                width: 30, height: 30,
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isActive ? "rgba(108,99,255,0.2)" : "rgba(255,255,255,0.04)",
                flexShrink: 0,
                transition: "background 0.15s",
              }}>
                <Icon size={15} color={isActive ? "#a78bfa" : "#6b7280"} />
              </div>

              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user area */}
      <div style={{
        margin: "16px 10px",
        padding: "12px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: 9,
          background: "linear-gradient(135deg, #374151, #1f2937)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 700,
          color: "#d1d5db",
        }}>
          A
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f3f4f6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Admin</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>Field Manager</div>
        </div>
      </div>

    </div>
  );
}