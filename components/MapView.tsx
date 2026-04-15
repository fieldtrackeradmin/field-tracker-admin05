"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

type RouteMap = { [key: string]: [number, number][]; };

// ── Fix default leaflet icon paths broken by webpack ─────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// ── Custom SVG marker factory ─────────────────────────────────────────────────
const makePinIcon = (fillColor: string, svgLabel: string) =>
  L.divIcon({
    className:   "",
    iconSize:    [36, 44],
    iconAnchor:  [18, 44],
    popupAnchor: [0, -44],
    html: `
      <div style="position:relative;width:36px;height:44px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
        <svg viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg" width="36" height="44">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.25 18 26 18 26S36 31.25 36 18C36 8.06 27.94 0 18 0z"
            fill="${fillColor}" stroke="rgba(0,0,0,0.18)" stroke-width="1.2"/>
          <circle cx="18" cy="18" r="11" fill="rgba(255,255,255,0.25)"/>
        </svg>
        <div style="position:absolute;top:5px;left:0;width:36px;text-align:center;font-size:16px;line-height:1;pointer-events:none;user-select:none;">
          ${svgLabel}
        </div>
      </div>`,
  });

const EMPLOYEE_ICON = makePinIcon("#2563eb", "\u{1F464}");
const SHOP_ICON     = makePinIcon("#ea580c", "\u{1F3EA}");

// ── Props ─────────────────────────────────────────────────────────────────────
interface MapViewProps {
  // When provided, map shows ONLY this employee's location + their shops.
  // When omitted, map shows ALL employees and ALL shops (original behaviour).
  employeeId?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapView({ employeeId }: MapViewProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [routes,    setRoutes]    = useState<RouteMap>({});
  const [shops,     setShops]     = useState<any[]>([]);
  const [center,    setCenter]    = useState<[number, number]>([12.9716, 77.5946]);
  const [loading,   setLoading]   = useState(true);

  const fetchData = async () => {
    try {
      if (employeeId) {
        // ── Filtered mode: only this employee ──────────────────────────────
        const [{ data: empData }, { data: logs }, { data: shopData }] = await Promise.all([
          supabase.from("users").select("id, name").eq("id", employeeId).single(),
          supabase.from("travel_logs").select("*").eq("employee_id", employeeId).order("created_at", { ascending: true }),
          supabase.from("shops").select("id, shop_name, latitude, longitude").eq("employee_id", employeeId),
        ]);

        // Build employees list with just this one person
        if (empData) setEmployees([empData]);

        if (logs && logs.length > 0) {
          const routeMap: RouteMap = {};
          logs.forEach((log: any) => {
            if (!routeMap[log.employee_id]) routeMap[log.employee_id] = [];
            routeMap[log.employee_id].push([log.latitude, log.longitude]);
          });
          setRoutes(routeMap);
          // Centre on this employee's latest position
          const last = logs[logs.length - 1];
          setCenter([last.latitude, last.longitude]);
        }

        if (shopData) setShops(shopData);

      } else {
        // ── Global mode: all employees + all shops ─────────────────────────
        const { data: users } = await supabase
          .from("users").select("id, name").eq("role", "employee");
        if (users) setEmployees(users);

        const { data: logs } = await supabase
          .from("travel_logs").select("*").order("created_at", { ascending: true });

        if (logs && logs.length > 0) {
          const routeMap: RouteMap = {};
          logs.forEach((log: any) => {
            if (!routeMap[log.employee_id]) routeMap[log.employee_id] = [];
            routeMap[log.employee_id].push([log.latitude, log.longitude]);
          });
          setRoutes(routeMap);
          const last = logs[logs.length - 1];
          setCenter([last.latitude, last.longitude]);
        }

        const { data: shopData } = await supabase
          .from("shops").select("id, shop_name, latitude, longitude");
        if (shopData) setShops(shopData);
      }

    } catch (err) {
      console.error("Map load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [employeeId]);

  if (loading) return (
    <p style={{ padding: 20, color: "#6C63FF", fontWeight: 600 }}>Loading map...</p>
  );

  return (
    <>
      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#2563eb", boxShadow: "0 0 0 3px #bfdbfe" }} />
          {employeeId ? "Live Location" : "Employee Live Location"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ea580c", boxShadow: "0 0 0 3px #fed7aa" }} />
          {employeeId ? "Their Shops" : "Visited Shop"}
        </div>
        {employeeId && shops.length === 0 && (
          <div style={{ fontSize: 13, color: "#9ca3af" }}>No shops recorded yet</div>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={13}
        className="mapContainer"
        style={{ width: "100%", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />

        {/* Blue employee marker — latest position only */}
        {employees.map(emp => {
          const route = routes[emp.id];
          if (!route || route.length === 0) return null;
          const lastPos = route[route.length - 1];
          return (
            <Marker key={emp.id} position={lastPos} icon={EMPLOYEE_ICON}>
              <Popup>
                <div style={{ fontFamily: "sans-serif", minWidth: 140 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#2563eb", marginBottom: 4 }}>
                    {emp.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Live Location</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {lastPos[0].toFixed(5)}, {lastPos[1].toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Orange shop markers — only this employee's shops */}
        {shops
          .filter(shop => shop.latitude && shop.longitude)
          .map(shop => (
            <Marker
              key={shop.id}
              position={[shop.latitude, shop.longitude]}
              icon={SHOP_ICON}>
              <Popup>
                <div style={{ fontFamily: "sans-serif", minWidth: 140 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#ea580c", marginBottom: 4 }}>
                    {shop.shop_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Shop</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {Number(shop.latitude).toFixed(5)}, {Number(shop.longitude).toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

      </MapContainer>
    </>
  );
}