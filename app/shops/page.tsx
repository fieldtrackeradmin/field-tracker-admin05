"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ShopsPage() {

  const [shops, setShops] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    const { data: shopData } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: userData } = await supabase
      .from("users")
      .select("id,name");

    setShops(shopData || []);
    setEmployees(userData || []);
    setLoading(false);
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : "Unknown";
  };

  if (loading) return <div style={{ padding: 40 }}>Loading shops...</div>;

  return (

    <div style={{ padding: 40 }}>

      <h1 style={{ fontSize: 28, fontWeight: 600 }}>
        Visited Shops
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(350px,1fr))",
          gap: 25,
          marginTop: 30
        }}
      >

        {shops.map((shop) => (

          <div
            key={shop.id}
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
              border: "1px solid #eee"
            }}
          >

            <h2> {shop.shop_name}</h2>

            <p>
              <b>Employee:</b> {getEmployeeName(shop.employee_id)}
            </p>

            <p>
              <b>Owner:</b> {shop.owner_name || "N/A"}
            </p>

            <p>
              <b>Contact:</b> {shop.contact_number || "N/A"}
            </p>

            <p>
              <b>location:</b> {shop.latitude}, {shop.longitude}
            </p>

            <p>
              <b>Shop Type:</b> {shop.shop_type || "N/A"}
            </p>

            <p>
              <b>Timing:</b> {shop.shop_timing || "N/A"}
            </p>

            <p>
               <b>Agreed:</b> {shop.agreed_to_shop_smart || "N/A"}
            </p>

            {shop.backout_reason && (
              <p>
                ❌ <b>Backout:</b> {shop.backout_reason}
              </p>
            )}

            {shop.shop_photo && (
              <img
                src={shop.shop_photo}
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                  borderRadius: 10,
                  marginTop: 10
                }}
              />
            )}

            {shop.voice_note && (
              <audio controls style={{ width: "100%", marginTop: 10 }}>
                <source src={shop.voice_note} />
              </audio>
            )}

          </div>

        ))}

      </div>

    </div>

  );
}
