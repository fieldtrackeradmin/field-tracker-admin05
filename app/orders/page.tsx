"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParsedOrder {
  id: string;
  created_at: string;
  shop_id: string;
  task_id: string;
  employee_id: string;
  status?: string;
  delivery_employee_id?: string;
  shop: { shop_name: string; latitude?: number; longitude?: number } | null;
  employee: { name: string; email: string } | null;
  deliveryEmployee?: { name: string } | null;
  parsedDetails: {
    brands?: Record<string, Record<string, { kg: number; pack: number; kgPrice?: string; packPrice?: string }>>;
    brand?: string;
    products?: Record<string, number | { kg: number; pack: number; kgPrice?: string; packPrice?: string }>;
  };
  totalUnits: number;
  brandList: string[];
}

interface Employee {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseOrderDetails(raw: string) {
  try { return JSON.parse(raw); } catch { return {}; }
}

function calcTotalUnits(details: any): number {
  let total = 0;
  if (details?.brands) {
    Object.values(details.brands).forEach((products: any) => {
      Object.values(products).forEach((qty: any) => {
        if (typeof qty === "object") total += (qty.kg || 0) + (qty.pack || 0);
        else total += qty || 0;
      });
    });
  } else if (details?.products) {
    Object.values(details.products).forEach((qty: any) => {
      if (typeof qty === "object") total += (qty.kg || 0) + (qty.pack || 0);
      else total += qty || 0;
    });
  }
  return total;
}

function getBrandList(details: any): string[] {
  if (details?.brands) return Object.keys(details.brands);
  if (details?.brand) return [details.brand];
  return [];
}

function formatDate(iso: string) {
  const d      = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  const day    = String(d.getUTCDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatTime(iso: string) {
  const d  = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  let h    = d.getUTCHours();
  const m  = String(d.getUTCMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ap}`;
}

function buildDeliveryItem(details: any): string {
  const parts: string[] = [];
  if (details?.brands) {
    Object.entries(details.brands).forEach(([brand, products]: [string, any]) => {
      Object.entries(products).forEach(([product, qty]: [string, any]) => {
        const kg   = typeof qty === "object" ? (qty.kg   || 0) : 0;
        const pack = typeof qty === "object" ? (qty.pack || 0) : (qty || 0);
        if (kg   > 0) parts.push(`${brand} ${product} ${kg}KG`);
        if (pack > 0) parts.push(`${brand} ${product} ${pack}Pack`);
      });
    });
  }
  return parts.join(", ") || "Order delivery";
}

// Build a "lat,lng" string from shop coordinates
function buildLatLng(shop: ParsedOrder["shop"]): string {
  if (shop?.latitude && shop?.longitude) {
    return `${shop.latitude},${shop.longitude}`;
  }
  return shop?.shop_name?.trim() || "";
}

const BRAND_COLORS: Record<string, string> = {
  "SRR":        "#6C63FF",
  "JJR":        "#00A65A",
  "Millet Pro": "#E67E22",
};

// ─── Product Line ─────────────────────────────────────────────────────────────
function ProductLine({ product, kg, pack, kgPrice, packPrice, accent }: {
  product: string; kg: number; pack: number;
  kgPrice?: string; packPrice?: string; accent: string;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 10px", borderRadius: 7,
      background: "#fff", border: "1px solid #f3f4f6", marginBottom: 4,
      flexWrap: "wrap", gap: 6,
    }}>
      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500, flex: 1, minWidth: 120 }}>{product}</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {kg > 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: accent + "15", color: accent }}>⚖️ {kg} KG</span>
            {kgPrice ? <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>₹{kgPrice} / kg</span> : null}
          </div>
        )}
        {pack > 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: accent + "15", color: accent }}>📦 {pack} Pack</span>
            {packPrice ? <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>₹{packPrice} / pack</span> : null}
          </div>
        )}
        {kg === 0 && pack === 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: accent + "15", color: accent }}>×{kg + pack}</span>
        )}
      </div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ order, employees, onClose, onAssigned }: {
  order: ParsedOrder;
  employees: Employee[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selectedEmp, setSelectedEmp] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const hasCoords = !!(order.shop?.latitude && order.shop?.longitude);

  // Auto-fill: use "lat,lng" if coords exist, else fall back to shop_name
  const autoLocation = buildLatLng(order.shop);
  const [location, setLocation] = useState(autoLocation);

  useEffect(() => {
    setLocation(buildLatLng(order.shop));
  }, [order.id]);

  const handleAssign = async () => {
    if (!selectedEmp)     { setError("Please select an employee"); return; }
    if (!location.trim()) { setError("Please enter delivery location"); return; }
    setLoading(true);
    setError("");
    try {
      const deliveryItem = buildDeliveryItem(order.parsedDetails);

      const { error: taskErr } = await supabase.from("tasks").insert({
        title:              `Deliver order to ${order.shop?.shop_name || location.trim()}`,
        task_type:          "delivery",
        employee_id:        selectedEmp,
        status:             "pending",
        delivery_location:  location.trim(),   // "lat,lng" string stored here
        delivery_item:      deliveryItem,
        created_at:         new Date().toISOString(),
      });
      if (taskErr) throw new Error(taskErr.message);

      const { error: orderErr } = await supabase
        .from("orders")
        .update({ delivery_employee_id: selectedEmp, status: "assigned" })
        .eq("id", order.id);
      if (orderErr) throw new Error(orderErr.message);

      onAssigned();
      onClose();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>🚚 Assign Delivery</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{order.shop?.shop_name || "Unknown Shop"}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>

        {/* Order summary */}
        <div style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px", marginBottom: 18, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Order Summary</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {order.brandList.map(b => (
              <span key={b} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, backgroundColor: BRAND_COLORS[b] ? BRAND_COLORS[b] + "18" : "#f3f4f6", color: BRAND_COLORS[b] || "#6b7280" }}>{b}</span>
            ))}
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#f0eeff", color: "#6C63FF" }}>×{order.totalUnits} units</span>
          </div>
        </div>

        {/* Delivery location */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            📍 Delivery Location
            {hasCoords && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: "#16a34a" }}>✓ GPS coords from shop</span>
            )}
            {!hasCoords && autoLocation && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: "#f59e0b" }}>⚠ No GPS — using shop name</span>
            )}
          </label>

          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="lat,lng or location name"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: `1.5px solid ${hasCoords ? "#86efac" : "#e5e7eb"}`,
              fontSize: 14, color: "#111827",
              outline: "none", boxSizing: "border-box",
              background: hasCoords ? "#f0fdf4" : "#fff",
            }}
          />

          {/* Show shop name + GPS link below the input */}
          {hasCoords && (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                🏪 {order.shop?.shop_name} — {order.shop?.latitude?.toFixed(6)}, {order.shop?.longitude?.toFixed(6)}
              </span>
              <a
                href={`https://maps.google.com/?q=${order.shop?.latitude},${order.shop?.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
              >
                🗺 Open in Maps ↗
              </a>
            </div>
          )}
          {!hasCoords && (
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              No GPS coordinates found for this shop. Add lat/lng to the shop record for precise delivery.
            </div>
          )}
        </div>

        {/* Employee select */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>👤 Assign To Employee</label>
          <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, color: "#111827", background: "#fff", cursor: "pointer", outline: "none" }}>
            <option value="">Select employee…</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13, color: "#dc2626" }}>
            ❌ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={loading}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleAssign} disabled={loading}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: loading ? "#93c5fd" : "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Assigning…" : "Assign & Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders,        setOrders]        = useState<ParsedOrder[]>([]);
  const [employees,     setEmployees]     = useState<Employee[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [expanded,      setExpanded]      = useState<Record<string, boolean>>({});
  const [stats,         setStats]         = useState({ total: 0, units: 0, brands: 0 });
  const [activeTab,     setActiveTab]     = useState<"pending" | "completed">("pending");
  const [assignTarget,  setAssignTarget]  = useState<ParsedOrder | null>(null);
  const [completingId,  setCompletingId]  = useState<string | null>(null);

  const [search,         setSearch]         = useState("");
  const [filterBrand,    setFilterBrand]    = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [filterDate,     setFilterDate]     = useState("All");

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data, error: ordersErr }, { data: empData }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("id, name").eq("role", "employee"),
      ]);

      if (ordersErr) console.error("[Orders] fetch error:", ordersErr);
      setEmployees(empData || []);

      const shopIds   = [...new Set((data || []).map((o: any) => o.shop_id).filter(Boolean))];
      const empIds    = [...new Set((data || []).map((o: any) => o.employee_id).filter(Boolean))];
      const delIds    = [...new Set((data || []).map((o: any) => o.delivery_employee_id).filter(Boolean))];
      const allEmpIds = [...new Set([...empIds, ...delIds])];

      const [{ data: shops, error: shopsErr }, { data: emps }] = await Promise.all([
        shopIds.length > 0
          ? supabase.from("shops").select("id, shop_name, latitude, longitude").in("id", shopIds)
          : Promise.resolve({ data: [], error: null }),
        allEmpIds.length > 0
          ? supabase.from("users").select("id, name, email").in("id", allEmpIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (shopsErr) console.error("[Orders] shops error:", shopsErr);

      const shopMap: Record<string, any> = {};
      (shops || []).forEach((s: any) => { shopMap[String(s.id)] = s; });

      const empMap: Record<string, any> = {};
      (emps || []).forEach((e: any) => { empMap[e.id] = e; });

      const parsed: ParsedOrder[] = (data || []).map((o: any) => {
        const details = parseOrderDetails(o.order_details);
        const shop    = shopMap[String(o.shop_id)] || null;
        return {
          ...o,
          shop,
          employee:         empMap[o.employee_id]           || null,
          deliveryEmployee: o.delivery_employee_id ? (empMap[o.delivery_employee_id] || null) : null,
          parsedDetails:    details,
          totalUnits:       calcTotalUnits(details),
          brandList:        getBrandList(details),
        };
      });

      setOrders(parsed);
      const allBrands = new Set(parsed.flatMap(o => o.brandList));
      setStats({
        total:  parsed.length,
        units:  parsed.reduce((s, o) => s + o.totalUnits, 0),
        brands: allBrands.size,
      });
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (order: ParsedOrder) => {
    setCompletingId(order.id);
    try {
      await supabase.from("orders").update({ status: "completed" }).eq("id", order.id);
      if (order.delivery_employee_id) {
        await supabase
          .from("tasks")
          .delete()
          .eq("employee_id", order.delivery_employee_id)
          .eq("task_type", "delivery")
          .eq("status", "pending");
      }
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "completed" } : o));
    } finally {
      setCompletingId(null);
    }
  };

  const allBrands = useMemo(() => {
    const s = new Set(orders.flatMap(o => o.brandList));
    return ["All", ...Array.from(s).sort()];
  }, [orders]);

  const allEmployees = useMemo(() => {
    const s = new Set(orders.map(o => o.employee?.name || o.employee_id));
    return ["All", ...Array.from(s).sort()];
  }, [orders]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return orders.filter(o => {
      const status = o.status || "pending";
      if (activeTab === "pending"   && status === "completed") return false;
      if (activeTab === "completed" && status !== "completed") return false;

      const shopName = o.shop?.shop_name?.toLowerCase() || "";
      const empName  = o.employee?.name?.toLowerCase()  || "";
      const q        = search.toLowerCase();
      if (q && !shopName.includes(q) && !empName.includes(q)) return false;
      if (filterBrand    !== "All" && !o.brandList.includes(filterBrand))                     return false;
      if (filterEmployee !== "All" && (o.employee?.name || o.employee_id) !== filterEmployee) return false;
      const created = Date.parse(o.created_at);
      if (filterDate === "Today") {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (created < today.getTime()) return false;
      } else if (filterDate === "Last 7 days")  { if (now - created > 7  * 86400000) return false; }
        else if (filterDate === "Last 30 days") { if (now - created > 30 * 86400000) return false; }
      return true;
    });
  }, [orders, search, filterBrand, filterEmployee, filterDate, activeTab]);

  const pendingCount   = orders.filter(o => (o.status || "pending") !== "completed").length;
  const completedCount = orders.filter(o => o.status === "completed").length;

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="page">

      {assignTarget && (
        <AssignModal
          order={assignTarget}
          employees={employees}
          onClose={() => setAssignTarget(null)}
          onAssigned={fetchAll}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h1 className="title">Orders</h1>
        <button onClick={fetchAll} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="statsGrid" style={{ marginBottom: 24 }}>
        <div className="statCard"><h3>Total Orders</h3><p>{stats.total}</p></div>
        <div className="statCard"><h3>Total Units</h3><p>{stats.units}</p></div>
        <div className="statCard"><h3>Brands Active</h3><p>{stats.brands}</p></div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "#f3f4f6", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["pending", "completed"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "8px 22px", borderRadius: 8, border: "none",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            background:  activeTab === tab ? "#fff" : "transparent",
            color:       activeTab === tab ? (tab === "completed" ? "#16a34a" : "#2563eb") : "#6b7280",
            boxShadow:   activeTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            transition:  "all 0.15s",
          }}>
            {tab === "pending" ? `⏳ Pending (${pendingCount})` : `✅ Completed (${completedCount})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search shop or employee…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", background: "#fff" }} />
        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, background: "#fff", cursor: "pointer" }}>
          {allBrands.map(b => <option key={b}>{b}</option>)}
        </select>
        <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, background: "#fff", cursor: "pointer" }}>
          {allEmployees.map(e => <option key={e}>{e}</option>)}
        </select>
        <select value={filterDate} onChange={e => setFilterDate(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, background: "#fff", cursor: "pointer" }}>
          {["All", "Today", "Last 7 days", "Last 30 days"].map(d => <option key={d}>{d}</option>)}
        </select>
        <span style={{ fontSize: 13, color: "#6b7280" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", fontSize: 15 }}>Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No {activeTab} orders</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Try adjusting your filters</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((order, idx) => {
            const isOpen      = !!expanded[order.id];
            const shopName    = order.shop?.shop_name || "Unknown Shop";
            const empName     = order.employee?.name  || order.employee_id?.slice(0, 8) || "—";
            const delEmpName  = order.deliveryEmployee?.name || null;
            const isCompleted = order.status === "completed";
            const isAssigned  = order.status === "assigned";
            const hasCoords   = !!(order.shop?.latitude && order.shop?.longitude);
            const d           = order.parsedDetails;

            return (
              <div key={order.id} style={{
                background: isCompleted ? "#f0fdf4" : "#fff",
                borderRadius: 12,
                border: `1px solid ${isCompleted ? "#bbf7d0" : isAssigned ? "#bfdbfe" : "#e5e7eb"}`,
                overflow: "hidden",
              }}>
                {/* Row header */}
                <div onClick={() => toggleExpand(order.id)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, color: "#9ca3af", minWidth: 28, fontFamily: "monospace" }}>#{filtered.length - idx}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shopName}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ color: "#6C63FF", fontWeight: 600 }}>{empName}</span>
                        · {formatDate(order.created_at)} · {formatTime(order.created_at)}
                        {hasCoords && (
                          <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>📍 GPS</span>
                        )}
                        {delEmpName && (
                          <span style={{ background: "#eff6ff", color: "#2563eb", fontWeight: 700, padding: "1px 7px", borderRadius: 5, fontSize: 11 }}>🚚 {delEmpName}</span>
                        )}
                        {isCompleted && <span style={{ background: "#dcfce7", color: "#16a34a", fontWeight: 700, padding: "1px 7px", borderRadius: 5, fontSize: 11 }}>✅ Completed</span>}
                        {isAssigned && !isCompleted && <span style={{ background: "#eff6ff", color: "#2563eb", fontWeight: 700, padding: "1px 7px", borderRadius: 5, fontSize: 11 }}>📋 Assigned</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {order.brandList.map(b => (
                      <span key={b} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, backgroundColor: BRAND_COLORS[b] ? BRAND_COLORS[b] + "18" : "#f3f4f6", color: BRAND_COLORS[b] || "#6b7280" }}>{b}</span>
                    ))}
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "#f0eeff", color: "#6C63FF" }}>×{order.totalUnits}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #f3f4f6", padding: "16px 18px", background: isCompleted ? "#f0fdf4" : "#fafafa" }}>

                    {/* Meta chips */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 10, marginBottom: 16 }}>
                      {[
                        { label: "Order ID",    value: order.id.slice(0, 18) + "…" },
                        { label: "Date & Time", value: `${formatDate(order.created_at)} · ${formatTime(order.created_at)}` },
                        { label: "Collected By",value: empName },
                        { label: "Total Units", value: `${order.totalUnits} units` },
                        { label: "Shop",        value: shopName },
                        ...(hasCoords ? [{ label: "GPS Location", value: `${order.shop!.latitude?.toFixed(5)}, ${order.shop!.longitude?.toFixed(5)}` }] : []),
                        ...(delEmpName ? [{ label: "Delivery By", value: `🚚 ${delEmpName}` }] : []),
                      ].map(chip => (
                        <div key={chip.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{chip.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{chip.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Maps link if coords available */}
                    {hasCoords && (
                      <a
                        href={`https://maps.google.com/?q=${order.shop!.latitude},${order.shop!.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-block", marginBottom: 14, fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none", background: "#eff6ff", padding: "5px 12px", borderRadius: 7, border: "1px solid #bfdbfe" }}
                      >
                        🗺 Open Shop Location in Google Maps ↗
                      </a>
                    )}

                    {/* Products */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Product Breakdown</div>

                    {d.brands && Object.entries(d.brands).map(([brand, products]: [string, any]) => (
                      <div key={brand} style={{ marginBottom: 12 }}>
                        <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, marginBottom: 8, backgroundColor: BRAND_COLORS[brand] ? BRAND_COLORS[brand] + "18" : "#f3f4f6", color: BRAND_COLORS[brand] || "#6b7280" }}>{brand}</span>
                        {Object.entries(products).map(([product, qty]: [string, any]) => (
                          <ProductLine key={product} product={product}
                            kg={typeof qty === "object" ? (qty.kg || 0) : 0}
                            pack={typeof qty === "object" ? (qty.pack || 0) : (qty || 0)}
                            kgPrice={typeof qty === "object" ? (qty.kgPrice || "") : ""}
                            packPrice={typeof qty === "object" ? (qty.packPrice || "") : ""}
                            accent={BRAND_COLORS[brand] || "#6C63FF"} />
                        ))}
                      </div>
                    ))}

                    {!d.brands && d.products && (
                      <div style={{ marginBottom: 12 }}>
                        {d.brand && <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, marginBottom: 8, backgroundColor: BRAND_COLORS[d.brand] ? BRAND_COLORS[d.brand] + "18" : "#f3f4f6", color: BRAND_COLORS[d.brand] || "#6b7280" }}>{d.brand}</span>}
                        {Object.entries(d.products).map(([product, qty]: [string, any]) => (
                          <ProductLine key={product} product={product}
                            kg={typeof qty === "object" ? (qty.kg || 0) : 0}
                            pack={typeof qty === "object" ? (qty.pack || 0) : (qty || 0)}
                            kgPrice={typeof qty === "object" ? (qty.kgPrice || "") : ""}
                            packPrice={typeof qty === "object" ? (qty.packPrice || "") : ""}
                            accent={d.brand ? (BRAND_COLORS[d.brand] || "#6C63FF") : "#6C63FF"} />
                        ))}
                      </div>
                    )}

                    {!d.brands && !d.products && <div style={{ fontSize: 13, color: "#9ca3af" }}>No product data available</div>}

                    {/* Action buttons */}
                    {!isCompleted && (
                      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                        <button
                          onClick={e => { e.stopPropagation(); setAssignTarget(order); }}
                          style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          🚚 {isAssigned ? "Re-assign Delivery" : "Assign Delivery"}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); markCompleted(order); }}
                          disabled={completingId === order.id}
                          style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: completingId === order.id ? "#86efac" : "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: completingId === order.id ? "default" : "pointer" }}>
                          {completingId === order.id ? "Marking…" : "✅ Mark Completed"}
                        </button>
                      </div>
                    )}

                    {isCompleted && (
                      <div style={{ marginTop: 14, padding: "10px 14px", background: "#dcfce7", borderRadius: 10, border: "1px solid #bbf7d0", fontSize: 13, fontWeight: 600, color: "#16a34a", textAlign: "center" }}>
                        ✅ This order has been completed
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}