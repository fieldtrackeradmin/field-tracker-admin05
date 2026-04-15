"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Users, Search, ChevronRight, Wifi, WifiOff } from "lucide-react";

type Employee = {
  id: string;
  name: string;
  email: string;
  last_active: string | null;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
    const channel = supabase
      .channel("employees-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchEmployees)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id,name,email,last_active")
      .eq("role", "employee");
    if (!error) setEmployees((data as Employee[]) || []);
    setLoading(false);
  };

  const getStatus = (lastActive: string | null) => {
    if (!lastActive) return "Offline";
    return (Date.now() - Date.parse(lastActive)) / 1000 <= 60 ? "Online" : "Offline";
  };

  const getLastSeen = (lastActive: string | null) => {
    if (!lastActive) return "Never";
    const diff = Math.floor((Date.now() - Date.parse(lastActive)) / 1000);
    if (diff < 60)   return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(lastActive).toLocaleDateString();
  };

  const filtered = employees.filter(emp =>
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.email?.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount  = employees.filter(e => getStatus(e.last_active) === "Online").length;
  const offlineCount = employees.length - onlineCount;

  return (
    <div className="page">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="pageTitle" style={{ marginBottom: 4 }}>Employees</h1>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#6b7280" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              {onlineCount} online
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#d1d5db" }} />
              {offlineCount} offline
            </span>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={15} color="#9ca3af" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Search employees…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              borderRadius: 9, border: "1px solid #e5e7eb",
              background: "#fff", fontSize: 14, color: "#111827",
              outline: "none", width: 220,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="statsGrid" style={{ marginBottom: 24 }}>
        <div className="statCard" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={20} color="#6C63FF" />
          </div>
          <div>
            <h3>Total</h3>
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
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <WifiOff size={20} color="#dc2626" />
          </div>
          <div>
            <h3>Offline</h3>
            <p style={{ fontSize: 24, marginTop: 4 }}>{offlineCount}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="tableCard">

        {/* Table header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
            {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
          </span>
          {search && (
            <button onClick={() => setSearch("")} style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
              Clear search
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
            Loading employees…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👤</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No employees found</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Try a different search</div>
          </div>
        ) : (
          <div className="tableContainer">
            <table className="employeeTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  const status   = getStatus(emp.last_active);
                  const isOnline = status === "Online";
                  return (
                    <tr
                      key={emp.id}
                      className="row"
                      onClick={() => router.push(`/employees/${emp.id}`)}
                    >
                      <td>
                        <div className="nameCell">
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: "linear-gradient(135deg, #6C63FF, #a78bfa)",
                            color: "#fff", display: "flex", alignItems: "center",
                            justifyContent: "center", fontWeight: 700, fontSize: 14,
                            position: "relative",
                          }}>
                            {emp.name?.charAt(0)?.toUpperCase()}
                            {/* Online dot */}
                            {isOnline && (
                              <div style={{
                                position: "absolute", bottom: -1, right: -1,
                                width: 10, height: 10, borderRadius: "50%",
                                background: "#22c55e", border: "2px solid #fff",
                              }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{emp.name}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ color: "#6b7280", fontSize: 13 }}>{emp.email}</td>

                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                          background: isOnline ? "#dcfce7" : "#f3f4f6",
                          color:      isOnline ? "#15803d" : "#6b7280",
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isOnline ? "#22c55e" : "#d1d5db" }} />
                          {status}
                        </span>
                      </td>

                      <td style={{ fontSize: 13, color: "#6b7280" }}>
                        {getLastSeen(emp.last_active)}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <ChevronRight size={16} color="#d1d5db" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}