"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Map, Users, Wifi, RefreshCw } from "lucide-react";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function LiveMapPage() {
  const [employees,    setEmployees]    = useState<any[]>([]);
  const [lastRefresh,  setLastRefresh]  = useState(new Date());
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    fetchEmployees();
    const interval = setInterval(fetchEmployees, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, name, last_active")
      .eq("role", "employee");
    if (data) setEmployees(data);
    setLastRefresh(new Date());
    setLoading(false);
  };

  const getStatus = (lastActive: string | null) => {
    if (!lastActive) return "Offline";
    return (Date.now() - Date.parse(lastActive)) / 1000 <= 60 ? "Online" : "Offline";
  };

  const onlineCount = employees.filter(e => getStatus(e.last_active) === "Online").length;

  return (
    <div className="page">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="pageTitle" style={{ marginBottom: 4 }}>Live Map</h1>
          <div style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 2px #dcfce7" }} />
            Tracking {onlineCount} employee{onlineCount !== 1 ? "s" : ""} live
            <span style={{ color: "#d1d5db" }}>·</span>
            Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        <button
          onClick={fetchEmployees}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 9,
            border: "1px solid #e5e7eb", background: "#fff",
            fontSize: 13, fontWeight: 600, color: "#374151",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="statsGrid" style={{ marginBottom: 20 }}>
        <div className="statCard" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={20} color="#6C63FF" />
          </div>
          <div>
            <h3>Total Employees</h3>
            <p style={{ fontSize: 24, marginTop: 4 }}>{employees.length}</p>
          </div>
        </div>

        <div className="statCard" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Wifi size={20} color="#16a34a" />
          </div>
          <div>
            <h3>Online Now</h3>
            <p style={{ fontSize: 24, marginTop: 4 }}>{onlineCount}</p>
          </div>
        </div>

        <div className="statCard" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Map size={20} color="#2563eb" />
          </div>
          <div>
            <h3>Tracking Active</h3>
            <p style={{ fontSize: 16, fontWeight: 600, marginTop: 6, color: "#2563eb" }}>Live</p>
          </div>
        </div>
      </div>

      {/* Map card */}
      <div style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}>

        {/* Map toolbar */}
        <div style={{
          padding: "12px 18px",
          background: "#fff",
          borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Map size={15} color="#6C63FF" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Employee Locations</span>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { color: "#22c55e", label: "Online" },
              { color: "#9ca3af", label: "Offline" },
              { color: "#6C63FF", label: "Route" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map body */}
        <div style={{ height: 560, position: "relative" }}>
          {loading ? (
            <div style={{
              height: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", background: "#f9fafb",
              flexDirection: "column", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "3px solid #e5e7eb", borderTopColor: "#6C63FF",
                animation: "spin 0.8s linear infinite",
              }} />
              <span style={{ fontSize: 14, color: "#9ca3af" }}>Loading map…</span>
            </div>
          ) : (
            <MapView />
          )}
        </div>
      </div>

      {/* Employee list */}
      {employees.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Employee Status</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {employees.map(emp => {
              const isOnline = getStatus(emp.last_active) === "Online";
              return (
                <div key={emp.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 9,
                  background: isOnline ? "#f0fdf4" : "#f9fafb",
                  border: `1px solid ${isOnline ? "#bbf7d0" : "#f3f4f6"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: "linear-gradient(135deg, #6C63FF, #a78bfa)",
                      color: "#fff", display: "flex", alignItems: "center",
                      justifyContent: "center", fontWeight: 700, fontSize: 13,
                      position: "relative",
                    }}>
                      {emp.name?.[0]?.toUpperCase()}
                      {isOnline && (
                        <div style={{
                          position: "absolute", bottom: -1, right: -1,
                          width: 9, height: 9, borderRadius: "50%",
                          background: "#22c55e", border: "2px solid #fff",
                        }} />
                      )}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{emp.name}</span>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    padding: "3px 10px", borderRadius: 6,
                    background: isOnline ? "#dcfce7" : "#f3f4f6",
                    color:      isOnline ? "#15803d" : "#6b7280",
                  }}>
                    {isOnline ? "● Online" : "○ Offline"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}