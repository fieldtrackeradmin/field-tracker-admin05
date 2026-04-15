"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ListChecks, Truck, Store, Clock, CheckCircle, Trash2, X, MapPin, Package, User, Tag } from "lucide-react";

type Task = {
  id: string;
  title: string;
  task_type: string;
  area_name?: string;
  target_shops?: number;
  target_orders?: number;
  delivery_location?: string;
  delivery_item?: string;
  status: string;
  created_at?: string;
  users?: { name: string };
};

// ── Delete Dialog ─────────────────────────────────────────────────────────────
function DeleteDialog({ task, onConfirm, onCancel, deleting }: {
  task: Task; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Trash2 size={22} color="#dc2626" />
        </div>
        <h2 style={{ margin: "0 0 8px", textAlign: "center", fontSize: 17, fontWeight: 700, color: "#111827" }}>Delete Task?</h2>
        <p style={{ textAlign: "center", color: "#6b7280", margin: "0 0 24px", fontSize: 13, lineHeight: 1.6 }}>
          This will permanently delete <b style={{ color: "#dc2626" }}>{task.title}</b>. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={deleting}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: deleting ? "#fca5a5" : "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: deleting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {deleting
              ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Deleting…</>
              : "Yes, Delete"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  completed:   { bg: "#dcfce7", color: "#15803d", label: "Completed"   },
  in_progress: { bg: "#fef3c7", color: "#d97706", label: "In Progress" },
  pending:     { bg: "#f3f4f6", color: "#6b7280", label: "Pending"     },
};

const typeConfig: Record<string, { icon: React.ReactNode; bg: string; color: string; label: string }> = {
  shop_visit: { icon: <Store size={14} />,  bg: "#ede9fe", color: "#6C63FF", label: "Shop Visit" },
  delivery:   { icon: <Truck size={14} />,  bg: "#dbeafe", color: "#2563eb", label: "Delivery"   },
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "shop_visit" | "delivery">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchTasks)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, users(name)")
      .order("created_at", { ascending: false });
    if (!error) setTasks((data as Task[]) || []);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("tasks").delete().eq("id", deleteTarget.id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  };

  const filtered = tasks.filter(t => {
    const matchType   = activeFilter === "all" || t.task_type === activeFilter;
    const matchStatus = statusFilter === "all" || t.status    === statusFilter;
    return matchType && matchStatus;
  });

  const counts = {
    total:       tasks.length,
    shop_visit:  tasks.filter(t => t.task_type === "shop_visit").length,
    delivery:    tasks.filter(t => t.task_type === "delivery").length,
    completed:   tasks.filter(t => t.status === "completed").length,
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#6C63FF", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: 14, color: "#9ca3af" }}>Loading tasks…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="page">

      {deleteTarget && (
        <DeleteDialog task={deleteTarget} onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)} deleting={deleting} />
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="pageTitle" style={{ marginBottom: 4 }}>Tasks</h1>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Manage and track all field tasks</p>
      </div>

      {/* Stats */}
      <div className="statsGrid" style={{ marginBottom: 24 }}>
        {[
          { icon: <ListChecks size={20} color="#6C63FF" />, bg: "#ede9fe", label: "Total Tasks",   value: counts.total      },
          { icon: <Store size={20} color="#16a34a" />,      bg: "#dcfce7", label: "Shop Visits",   value: counts.shop_visit },
          { icon: <Truck size={20} color="#2563eb" />,      bg: "#dbeafe", label: "Deliveries",    value: counts.delivery   },
          { icon: <CheckCircle size={20} color="#d97706" />,bg: "#fef3c7", label: "Completed",     value: counts.completed  },
        ].map(stat => (
          <div key={stat.label} className="statCard" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <h3>{stat.label}</h3>
              <p style={{ fontSize: 24, marginTop: 4 }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {/* Type filter */}
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, gap: 2 }}>
          {(["all", "shop_visit", "delivery"] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: "7px 16px", borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: activeFilter === f ? "#fff" : "transparent",
              color:      activeFilter === f ? "#111827" : "#6b7280",
              boxShadow:  activeFilter === f ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}>
              {f === "all" ? "All Types" : f === "shop_visit" ? "🏪 Shop Visits" : "🚚 Deliveries"}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, gap: 2 }}>
          {(["all", "pending", "in_progress", "completed"] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{
              padding: "7px 14px", borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: statusFilter === f ? "#fff" : "transparent",
              color:      statusFilter === f ? "#111827" : "#6b7280",
              boxShadow:  statusFilter === f ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}>
              {f === "all" ? "All Status" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 13, color: "#6b7280", marginLeft: "auto" }}>
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Task Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>No tasks found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
          {filtered.map(task => {
            const type   = typeConfig[task.task_type]   || { icon: <Tag size={14} />,  bg: "#f3f4f6", color: "#6b7280", label: task.task_type };
            const status = statusConfig[task.status]    || { bg: "#f3f4f6", color: "#6b7280", label: task.status };

            return (
              <div key={task.id} style={{
                background: "#fff", borderRadius: 14,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                overflow: "hidden",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(108,99,255,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                {/* Top bar */}
                <div style={{ height: 3, background: task.task_type === "delivery" ? "linear-gradient(90deg,#2563eb,#93c5fd)" : "linear-gradient(90deg,#6C63FF,#a78bfa)" }} />

                <div style={{ padding: 18 }}>

                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 10, marginBottom: 16 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: type.bg, color: type.color, display: "flex", alignItems: "center", gap: 4 }}>
                          {type.icon} {type.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>{task.title}</h3>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(task)}
                      style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#dc2626"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff5f5"; (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}>
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>

                    {/* Employee */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={12} color="#9ca3af" />
                      </div>
                      <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, minWidth: 58 }}>Employee</span>
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{task.users?.name || "Unknown"}</span>
                    </div>

                    {/* Shop visit fields */}
                    {task.task_type === "shop_visit" && (
                      <>
                        {task.area_name && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <MapPin size={12} color="#9ca3af" />
                            </div>
                            <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, minWidth: 58 }}>Area</span>
                            <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{task.area_name}</span>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <div style={{ flex: 1, background: "#f9fafb", borderRadius: 8, padding: "8px 10px", border: "1px solid #f3f4f6" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Target Shops</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#6C63FF" }}>{task.target_shops || 0}</div>
                          </div>
                          <div style={{ flex: 1, background: "#f9fafb", borderRadius: 8, padding: "8px 10px", border: "1px solid #f3f4f6" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Target Orders</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#6C63FF" }}>{task.target_orders || 0}</div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Delivery fields */}
                    {task.task_type === "delivery" && (
                      <>
                        {task.delivery_location && (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                              <MapPin size={12} color="#9ca3af" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 2 }}>Location</div>
                              <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 500, wordBreak: "break-word" }}>
                                {task.delivery_location}
                              </span>
                            </div>
                          </div>
                        )}
                        {task.delivery_item && (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                              <Package size={12} color="#9ca3af" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 2 }}>Item</div>
                              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500, wordBreak: "break-word" }}>{task.delivery_item}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Created at */}
                    {task.created_at && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Clock size={12} color="#9ca3af" />
                        </div>
                        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, minWidth: 58 }}>Created</span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {new Date(task.created_at).toLocaleDateString()} · {new Date(task.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}