"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Store, Users, ShoppingCart, TrendingUp, Trash2, MapPin, Phone, Clock, User, ChevronDown, ChevronUp, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Shop {
  id: string;
  created_at: string;
  employee_id: string;
  task_id: string;
  shop_name: string;
  owner_name: string;
  contact_number: string;
  shop_type: string;
  shop_timing: string;
  visit_timing: string;
  agreed_to_shop_smart: string;
  backout_reason: string;
  latitude: number | null;
  longitude: number | null;
  shop_photo: string | null;
  voice_note: string | null;
}

interface Employee { id: string; name: string; }
interface Order { id: string; shop_id: string; order_details: string; created_at: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: any) => (!v || v === "null" || v === "undefined") ? "—" : v;

const formatQty = (qty: any): string => {
  if (qty === null || qty === undefined) return "—";
  if (typeof qty === "object") {
    return Object.entries(qty).map(([unit, val]) => `${val} ${unit}`).join(", ");
  }
  return String(qty);
};

// ── Delete Dialog ─────────────────────────────────────────────────────────────
function DeleteConfirmDialog({ shop, onConfirm, onCancel, deleting }: {
  shop: Shop; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Trash2 size={24} color="#dc2626" />
        </div>
        <h2 style={{ margin: "0 0 8px", textAlign: "center", color: "#111827", fontSize: 18, fontWeight: 700 }}>Delete Shop?</h2>
        <p style={{ textAlign: "center", color: "#6b7280", margin: "0 0 24px", fontSize: 14, lineHeight: 1.5 }}>
          This will permanently delete <b style={{ color: "#dc2626" }}>{shop.shop_name}</b> and all associated orders. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={deleting}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: deleting ? "#fca5a5" : "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: deleting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {deleting ? (
              <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Deleting…</>
            ) : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ShopsPage() {
  const [shops,        setShops]        = useState<Shop[]>([]);
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterEmp,    setFilterEmp]    = useState("all");
  const [filterType,   setFilterType]   = useState("all");
  const [filterAgreed, setFilterAgreed] = useState("all");
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shop | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);
  const [photoModal,   setPhotoModal]   = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [{ data: shopData }, { data: userData }, { data: orderData }] = await Promise.all([
      supabase.from("shops").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("id,name"),
      supabase.from("orders").select("*"),
    ]);
    setShops(shopData   || []);
    setEmployees(userData || []);
    setOrders(orderData  || []);
    setLoading(false);
  };

  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || "Unknown";
  const getOrder   = (shopId: string) => orders.find(o => o.shop_id === shopId);
  const parseOrder = (order: Order | undefined) => {
    if (!order) return null;
    try { return JSON.parse(order.order_details); } catch { return null; }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const { error: orderErr } = await supabase.from("orders").delete().eq("shop_id", deleteTarget.id);
      if (orderErr) throw new Error(orderErr.message);
      const { error: shopErr } = await supabase.from("shops").delete().eq("id", deleteTarget.id);
      if (shopErr) throw new Error(shopErr.message);
      setShops(prev  => prev.filter(s => s.id !== deleteTarget.id));
      setOrders(prev => prev.filter(o => o.shop_id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteError(e.message || "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const shopTypes = [...new Set(shops.map(s => s.shop_type).filter(Boolean))];
  const empList   = [...new Set(shops.map(s => s.employee_id))];

  const filtered = shops.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.shop_name?.toLowerCase().includes(q) ||
      s.owner_name?.toLowerCase().includes(q) ||
      s.contact_number?.includes(q) ||
      getEmpName(s.employee_id).toLowerCase().includes(q);
    const matchEmp    = filterEmp    === "all" || s.employee_id          === filterEmp;
    const matchType   = filterType   === "all" || s.shop_type            === filterType;
    const matchAgreed = filterAgreed === "all" || s.agreed_to_shop_smart === filterAgreed;
    return matchSearch && matchEmp && matchType && matchAgreed;
  });

  const totalShops   = shops.length;
  const agreedCount  = shops.filter(s => s.agreed_to_shop_smart === "Yes").length;
  const backoutCount = shops.filter(s => s.agreed_to_shop_smart === "No").length;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#6C63FF", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: 14, color: "#9ca3af" }}>Loading shops…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="page">

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog shop={deleteTarget} onConfirm={handleDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError(null); }} deleting={deleting} />
      )}

      {/* Delete Error Toast */}
      {deleteError && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#dc2626", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 999, boxShadow: "0 4px 20px rgba(220,38,38,0.4)", display: "flex", alignItems: "center", gap: 10 }}>
          ❌ {deleteError}
          <button onClick={() => setDeleteError(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={16} /></button>
        </div>
      )}

      {/* Photo Lightbox */}
      {photoModal && (
        <div
          onClick={() => setPhotoModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, cursor: "zoom-out",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setPhotoModal(null)}
            style={{
              position: "absolute", top: 20, right: 20,
              width: 42, height: 42, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.25)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"}
          >
            <X size={20} />
          </button>

          {/* Full image */}
          <img
            src={photoModal}
            alt="Shop full view"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 12,
              objectFit: "contain",
              boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
              cursor: "default",
            }}
          />

          {/* Hint */}
          <div style={{
            position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
            fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500,
          }}>
            Click anywhere to close
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="pageTitle" style={{ marginBottom: 4 }}>Shops</h1>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>All shop visit records with full details</p>
      </div>

      {/* Stats */}
      <div className="statsGrid" style={{ marginBottom: 24 }}>
        {[
          { icon: <Store size={20} color="#6C63FF" />,        bg: "#ede9fe", label: "Total Shops",   value: totalShops   },
          { icon: <TrendingUp size={20} color="#16a34a" />,   bg: "#dcfce7", label: "Agreed",        value: agreedCount  },
          { icon: <Users size={20} color="#dc2626" />,        bg: "#fee2e2", label: "Backout",       value: backoutCount },
          { icon: <ShoppingCart size={20} color="#d97706" />, bg: "#fef3c7", label: "With Orders",   value: orders.length },
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
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} color="#9ca3af" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Search shop, owner, contact, employee…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9, borderRadius: 9, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" }}
          />
        </div>
        {[
          { value: filterEmp,    onChange: (v: string) => setFilterEmp(v),    options: [{ v: "all", l: "All Employees" }, ...empList.map(id => ({ v: id, l: getEmpName(id) }))] },
          { value: filterType,   onChange: (v: string) => setFilterType(v),   options: [{ v: "all", l: "All Types" }, ...shopTypes.map(t => ({ v: t, l: t }))] },
          { value: filterAgreed, onChange: (v: string) => setFilterAgreed(v), options: [{ v: "all", l: "All Status" }, { v: "Yes", l: "✅ Agreed" }, { v: "No", l: "❌ Backout" }] },
        ].map((sel, i) => (
          <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid #e5e7eb", fontSize: 14, background: "#fff", cursor: "pointer", outline: "none" }}>
            {sel.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}
        <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>{filtered.length} of {totalShops}</span>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>No shops found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
          {filtered.map(shop => {
            const order     = getOrder(shop.id);
            const orderData = parseOrder(order);
            const expanded  = expandedId === shop.id;
            const isAgreed  = shop.agreed_to_shop_smart === "Yes";

            return (
              <div key={shop.id} style={{
                background: "#fff", borderRadius: 16,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                overflow: "hidden",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(108,99,255,0.12)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >

                {/* Shop photo — clickable */}
                {shop.shop_photo && (
                  <div
                    style={{ position: "relative", cursor: "zoom-in", overflow: "hidden" }}
                    onClick={() => setPhotoModal(shop.shop_photo)}
                  >
                    <img
                      src={shop.shop_photo}
                      alt="shop"
                      style={{ width: "100%", height: 180, objectFit: "cover", display: "block", transition: "transform 0.3s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
                    />
                    {/* Overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)",
                      display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
                      padding: "10px 12px",
                    }}>
                      <div style={{
                        background: "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: 8,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}>
                        🔍 View Full
                      </div>
                    </div>
                  </div>
                )}

                {/* Top accent bar */}
                <div style={{ height: 3, background: isAgreed ? "linear-gradient(90deg,#22c55e,#86efac)" : "linear-gradient(90deg,#ef4444,#fca5a5)" }} />

                <div style={{ padding: 20 }}>

                  {/* Shop name row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {fmt(shop.shop_name)}
                      </h2>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {shop.shop_type && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "#ede9fe", color: "#6C63FF" }}>{shop.shop_type}</span>
                        )}
                        {orderData && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "#fef3c7", color: "#d97706" }}>🛒 Order</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                        background: isAgreed ? "#dcfce7" : "#fee2e2",
                        color:      isAgreed ? "#15803d" : "#dc2626",
                      }}>
                        {isAgreed ? "✅ Agreed" : "❌ Backout"}
                      </span>
                      <button
                        onClick={() => setDeleteTarget(shop)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#dc2626"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff5f5"; (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Detail rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {[
                      { icon: <User size={13} color="#9ca3af" />,  label: "Employee", value: getEmpName(shop.employee_id) },
                      { icon: <Store size={13} color="#9ca3af" />, label: "Owner",    value: shop.owner_name },
                      { icon: <Phone size={13} color="#9ca3af" />, label: "Contact",  value: shop.contact_number },
                      { icon: <Clock size={13} color="#9ca3af" />, label: "Visited",  value: shop.visit_timing },
                    ].map(row => (
                      <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {row.icon}
                        </div>
                        <span style={{ color: "#9ca3af", minWidth: 62, fontSize: 12, fontWeight: 600 }}>{row.label}</span>
                        <span style={{ color: "#374151", fontWeight: 500 }}>{fmt(row.value)}</span>
                      </div>
                    ))}

                    {shop.latitude && shop.longitude && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <MapPin size={13} color="#9ca3af" />
                        </div>
                        <span style={{ color: "#9ca3af", minWidth: 62, fontSize: 12, fontWeight: 600 }}>Location</span>
                        <a href={`https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`}
                          target="_blank" rel="noreferrer"
                          style={{ color: "#6C63FF", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                          {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)} ↗
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Backout reason */}
                  {shop.backout_reason && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", marginTop: 12, fontSize: 13, color: "#dc2626" }}>
                      <b>Backout:</b> {shop.backout_reason}
                    </div>
                  )}

                  {/* Order details */}
                  {orderData && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
                      <div style={{ fontWeight: 700, color: "#92400e", fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>🛒 Order Details</div>
                      {orderData.brands && Object.keys(orderData.brands).map((brand: string) => (
                        <div key={brand} style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 11, color: "#78350f", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{brand}</div>
                          {Object.entries(orderData.brands[brand]).map(([product, qty]: any) => (
                            <div key={product} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#451a03", padding: "3px 0", borderBottom: "1px dashed #fde68a" }}>
                              <span>{product}</span>
                              <span style={{ fontWeight: 700 }}>×{formatQty(qty)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                      {!orderData.brands && orderData.products && Object.entries(orderData.products).map(([product, qty]: any) => (
                        <div key={product} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#451a03", padding: "3px 0", borderBottom: "1px dashed #fde68a" }}>
                          <span>{product}</span>
                          <span style={{ fontWeight: 700 }}>×{formatQty(qty)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Voice note */}
                  {shop.voice_note && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>🎙 Voice Note</div>
                      <audio controls style={{ width: "100%", height: 36 }}>
                        <source src={shop.voice_note} />
                      </audio>
                    </div>
                  )}

                  {/* Expand toggle */}
                  <button onClick={() => setExpandedId(expanded ? null : shop.id)}
                    style={{ marginTop: 14, width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {expanded ? <><ChevronUp size={14} /> Hide Details</> : <><ChevronDown size={14} /> More Details</>}
                  </button>

                  {expanded && (
                    <div style={{ marginTop: 10, background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                      {[
                        { label: "Shop ID", value: shop.id },
                        { label: "Task ID", value: shop.task_id },
                        { label: "Created", value: shop.created_at ? new Date(shop.created_at).toLocaleString() : "—" },
                      ].map(row => (
                        <div key={row.label} style={{ display: "flex", gap: 8, marginBottom: 5, fontSize: 12 }}>
                          <span style={{ color: "#9ca3af", minWidth: 68, fontWeight: 600 }}>{row.label}</span>
                          <span style={{ color: "#6b7280", wordBreak: "break-all" }}>{fmt(row.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

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