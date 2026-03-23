"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, User, Tag, MapPin, Store, Package, Truck, CheckCircle } from "lucide-react";

type Employee = { id: string; name: string };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 9,
  border: "1px solid #e5e7eb", fontSize: 14, color: "#111827",
  outline: "none", background: "#fff", boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "#374151",
  display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6,
};

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {icon} {label}
        </span>
      </label>
      {children}
    </div>
  );
}

export default function CreateTaskPage() {
  const [title,            setTitle]            = useState("");
  const [taskType,         setTaskType]         = useState("");
  const [employee,         setEmployee]         = useState("");
  const [area,             setArea]             = useState("");
  const [targetShops,      setTargetShops]      = useState("");
  const [targetOrders,     setTargetOrders]     = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryItem,     setDeliveryItem]     = useState("");
  const [employees,        setEmployees]        = useState<Employee[]>([]);
  const [loading,          setLoading]          = useState(false);
  const [success,          setSuccess]          = useState(false);
  const [error,            setError]            = useState("");

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase.from("users").select("id,name").eq("role", "employee");
    setEmployees(data || []);
  };

  const resetForm = () => {
    setTitle(""); setTaskType(""); setEmployee("");
    setArea(""); setTargetShops(""); setTargetOrders("");
    setDeliveryLocation(""); setDeliveryItem("");
    setError("");
  };

  const handleCreate = async () => {
    setError("");
    if (!title || !taskType || !employee) { setError("Please fill all required fields."); return; }
    if (taskType === "shop_visit" && (!area || !targetShops || !targetOrders)) { setError("Please fill all shop visit details."); return; }
    if (taskType === "delivery"   && (!deliveryLocation || !deliveryItem))     { setError("Please fill all delivery details."); return; }

    setLoading(true);
    try {
      const taskData: any = {
        title: title.trim(), task_type: taskType,
        employee_id: employee, status: "pending",
        created_at: new Date().toISOString(),
      };
      if (taskType === "shop_visit") {
        taskData.area_name     = area;
        taskData.target_shops  = Number(targetShops);
        taskData.target_orders = Number(targetOrders);
      }
      if (taskType === "delivery") {
        taskData.delivery_location = deliveryLocation;
        taskData.delivery_item     = deliveryItem;
      }

      const { error: err } = await supabase.from("tasks").insert(taskData).select();
      if (err) { setError(err.message); return; }

      setSuccess(true);
      resetForm();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isShopVisit = taskType === "shop_visit";
  const isDelivery  = taskType === "delivery";

  return (
    <div className="page">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="pageTitle" style={{ marginBottom: 4 }}>Create Task</h1>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Assign a new task to a field employee</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        <div className="card" style={{ marginTop: 0 }}>

          {/* Success banner */}
          {success && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
              padding: "12px 16px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 14, fontWeight: 600, color: "#15803d",
            }}>
              <CheckCircle size={18} color="#16a34a" />
              Task created successfully!
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
              padding: "12px 16px", marginBottom: 20,
              fontSize: 14, fontWeight: 600, color: "#dc2626",
            }}>
              ❌ {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Title */}
            <Field label="Task Title" icon={<Tag size={12} />}>
              <input
                type="text" placeholder="e.g. Visit shops in Whitefield"
                value={title} onChange={e => setTitle(e.target.value)}
                style={inputStyle}
                onFocus={e  => (e.target as HTMLInputElement).style.borderColor = "#6C63FF"}
                onBlur={e   => (e.target as HTMLInputElement).style.borderColor = "#e5e7eb"}
              />
            </Field>

            {/* Employee */}
            <Field label="Assign To" icon={<User size={12} />}>
              <select value={employee} onChange={e => setEmployee(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Select employee…</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </Field>

            {/* Task Type */}
            <Field label="Task Type" icon={<Tag size={12} />}>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { value: "shop_visit", label: "🏪 Shop Visit", icon: <Store size={16} /> },
                  { value: "delivery",   label: "🚚 Delivery",   icon: <Truck size={16} /> },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setTaskType(opt.value)} style={{
                    flex: 1, padding: "12px 10px", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${taskType === opt.value ? "#6C63FF" : "#e5e7eb"}`,
                    background: taskType === opt.value ? "#f0eeff" : "#fff",
                    color:      taskType === opt.value ? "#6C63FF" : "#6b7280",
                    fontSize: 14, fontWeight: 700, transition: "all 0.15s",
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Shop Visit Fields */}
            {isShopVisit && (
              <div style={{ background: "#f9fafb", borderRadius: 12, padding: 16, border: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6C63FF", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>
                  🏪 Shop Visit Details
                </div>

                <Field label="Area Name" icon={<MapPin size={12} />}>
                  <input type="text" placeholder="e.g. Whitefield, Koramangala"
                    value={area} onChange={e => setArea(e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#6C63FF"}
                    onBlur={e  => (e.target as HTMLInputElement).style.borderColor = "#e5e7eb"}
                  />
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Target Shops" icon={<Store size={12} />}>
                    <input type="number" placeholder="0" min="0"
                      value={targetShops} onChange={e => setTargetShops(e.target.value)}
                      style={inputStyle}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#6C63FF"}
                      onBlur={e  => (e.target as HTMLInputElement).style.borderColor = "#e5e7eb"}
                    />
                  </Field>
                  <Field label="Target Orders" icon={<Package size={12} />}>
                    <input type="number" placeholder="0" min="0"
                      value={targetOrders} onChange={e => setTargetOrders(e.target.value)}
                      style={inputStyle}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#6C63FF"}
                      onBlur={e  => (e.target as HTMLInputElement).style.borderColor = "#e5e7eb"}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* Delivery Fields */}
            {isDelivery && (
              <div style={{ background: "#f0f7ff", borderRadius: 12, padding: 16, border: "1px solid #dbeafe", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>
                  🚚 Delivery Details
                </div>

                <Field label="Delivery Location" icon={<MapPin size={12} />}>
                  <input type="text" placeholder="e.g. Shop name or address"
                    value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#2563eb"}
                    onBlur={e  => (e.target as HTMLInputElement).style.borderColor = "#e5e7eb"}
                  />
                </Field>

                <Field label="Delivery Item" icon={<Package size={12} />}>
                  <input type="text" placeholder="e.g. SRR Rice 10KG, 5 Pack"
                    value={deliveryItem} onChange={e => setDeliveryItem(e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#2563eb"}
                    onBlur={e  => (e.target as HTMLInputElement).style.borderColor = "#e5e7eb"}
                  />
                </Field>
              </div>
            )}

            {/* Submit */}
            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button onClick={resetForm} disabled={loading}
                style={{ padding: "11px 20px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Reset
              </button>
              <button onClick={handleCreate} disabled={loading} style={{
                flex: 1, padding: "11px 20px", borderRadius: 10, border: "none",
                background: loading ? "#93c5fd" : "#2563eb",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.15s",
              }}>
                {loading
                  ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Creating…</>
                  : <><PlusCircle size={16} /> Create Task</>
                }
              </button>
            </div>

          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}