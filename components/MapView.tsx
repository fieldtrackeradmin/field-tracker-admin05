"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";

type RouteMap = {
  [key: string]: [number, number][];
};

/* Fix leaflet marker icons */

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function MapView() {

  const [employees, setEmployees] = useState<any[]>([]);
  const [routes, setRoutes] = useState<RouteMap>({});
  const [shops, setShops] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {

    try {

      /* Employees */

      const { data: users } = await supabase
        .from("users")
        .select("id,name")
        .eq("role", "employee");

      if (users) setEmployees(users);

      /* Travel logs */

      const { data: logs } = await supabase
        .from("travel_logs")
        .select("*")
        .order("created_at", { ascending: true });

      if (logs && logs.length > 0) {

        const routeMap: RouteMap = {};

        logs.forEach((log: any) => {

          if (!routeMap[log.employee_id]) {
            routeMap[log.employee_id] = [];
          }

          routeMap[log.employee_id].push([
            log.latitude,
            log.longitude
          ]);

        });

        setRoutes(routeMap);

        const last = logs[logs.length - 1];

        setCenter([last.latitude, last.longitude]);
      }

      /* Shops */

      const { data: shopData } = await supabase
        .from("shops")
        .select("id,shop_name,latitude,longitude");

      if (shopData) setShops(shopData);

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

  }, []);

  if (loading) return <p>Loading map...</p>;

  return (

    <MapContainer
      center={center}
      zoom={13}
      style={{
        height: "650px",
        width: "100%",
        marginTop: 20,
        borderRadius: 12
      }}
    >

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Employee markers */}

      {employees.map((emp) => {

        const route = routes[emp.id];

        if (!route) return null;

        const lastLocation = route[route.length - 1];

        return (
          <Marker key={emp.id} position={lastLocation}>
            <Popup>
              <strong>{emp.name}</strong>
              <br />
              Live Location
            </Popup>
          </Marker>
        );

      })}

      {/* Routes */}

      {Object.entries(routes).map(([empId, points]) => (

        <Polyline
          key={empId}
          positions={points}
          color="#2563eb"
          weight={4}
        />

      ))}

      {/* Shop markers */}

      {shops.map((shop) => (

        <Marker
          key={shop.id}
          position={[shop.latitude, shop.longitude]}
        >
          <Popup>
            <strong>{shop.shop_name}</strong>
          </Popup>
        </Marker>

      ))}

    </MapContainer>

  );

}