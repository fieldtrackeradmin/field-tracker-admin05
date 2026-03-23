"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MapView from "@/components/MapView";
import { MapPin, Route, Store, Clock } from "lucide-react";

export default function EmployeeDetails() {
  const params = useParams();
  const id = params.id as string;

  const [logs,     setLogs]     = useState<any[]>([]);
  const [shops,    setShops]    = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [distance, setDistance] = useState(0);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { fetchData(); }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R    = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a    =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const fetchData = async () => {
    setLoading(true);
    const [{ data: route }, { data: shopData }, { data: empData }] = await Promise.all([
      supabase.from("travel_logs").select("*").eq("employee_id", id).order("created_at", { ascending: true }),
      supabase.from("shops").select("*").eq("employee_id", id),
      supabase.from("users").select("*").eq("id", id).single(),
    ]);

    if (route) {
      setLogs(route);
      let total = 0;
      for (let i = 1; i < route.length; i++) {
        total += calculateDistance(route[i-1].latitude, route[i-1].longitude, route[i].latitude, route[i].longitude);
      }
      setDistance(total);
    }

    if (shopData) setShops(shopData);
    if (empData)  setEmployee(empData);
    setLoading(false);
  };

  const lastSeen = logs.length > 0 ? new Date(logs[logs.length - 1].created_at) : null;
  const formatLastSeen = (d: Date) => {
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1)  return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div className="page">

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #6C63FF, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {employee?.name?.[0]?.toUpperCase() || "E"}
          </div>
          <div>
            <h1 className="title" style={{ marginBottom: 2 }}>
              {employee?.name || "Employee"} — Tracking
            </h1>
            <div style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: logs.length > 0 ? "#22c55e" : "#d1d5db",
              }} />
              {logs.length > 0 ? "Active today" : "No activity today"}
              {lastSeen && <span>· Last seen {formatLastSeen(lastSeen)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="statsGrid" style={{ marginBottom: 24 }}>
        <div className="statCard" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Route size={20} color="#6C63FF" />
          </div>
          <div>
            <h3>Distance</h3>
            <p style={{ fontSize: 24, marginTop: 4 }}>{distance.toFixed(2)} <span style={{ fontSize: 14, fontWeight: 500, color: "#6b7280" }}>km</span></p>
          </div>
        </div>

        <div className="statCard" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin size={20} color="#16a34a" />
          </div>
          <div>
            <h3>GPS Points</h3>
            <p style={{ fontSize: 24, marginTop: 4 }}>{logs.length}</p>
          </div>
        </div>

        <div className="statCard" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Store size={20} color="#d97706" />
          </div>
          <div>
            <h3>Shops Visited</h3>
            <p style={{ fontSize: 24, marginTop: 4 }}>{shops.length}</p>
          </div>
        </div>

        <div className="statCard" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Clock size={20} color="#dc2626" />
          </div>
          <div>
            <h3>Last Ping</h3>
            <p style={{ fontSize: 16, marginTop: 4, fontWeight: 600 }}>{lastSeen ? formatLastSeen(lastSeen) : "—"}</p>
          </div>
        </div>
      </div>

      {/* Map — pass employeeId so MapView shows ONLY this employee */}
      <div style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}>
        {/* Map header */}
        <div style={{
          padding: "14px 18px",
          background: "#fff",
          borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={15} color="#6C63FF" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
              {employee?.name ? `${employee.name}'s Route` : "Route Map"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { color: "#2563eb", label: "Live location" },
              { color: "#ea580c", label: "Their shops" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map body — key={id} forces remount if employee changes */}
        <div style={{ height: 500 }}>
          {loading ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", flexDirection: "column", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#6C63FF", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 14, color: "#9ca3af" }}>Loading map…</span>
            </div>
          ) : (
            <MapView key={id} employeeId={id} />
          )}
        </div>
      </div>

      {/* Recent locations */}
      {logs.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Recent GPS Pings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
            {[...logs].reverse().slice(0, 10).map((log, i) => (
              <div key={log.id || i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: 8, background: i === 0 ? "#f0eeff" : "#f9fafb",
                border: `1px solid ${i === 0 ? "#e0d9ff" : "#f3f4f6"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={13} color={i === 0 ? "#6C63FF" : "#9ca3af"} />
                  <span style={{ fontSize: 12, color: "#374151", fontFamily: "monospace" }}>
                    {Number(log.latitude).toFixed(5)}, {Number(log.longitude).toFixed(5)}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                  {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
}