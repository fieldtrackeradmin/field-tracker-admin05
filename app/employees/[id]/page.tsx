"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MapView from "@/components/MapView";

export default function EmployeeDetails() {

  const params = useParams();
  const id = params.id as string;

  const [logs, setLogs] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const calculateDistance = (
    lat1:number,
    lon1:number,
    lat2:number,
    lon2:number
  ) => {

    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat/2)*Math.sin(dLat/2) +
      Math.cos(lat1*Math.PI/180) *
      Math.cos(lat2*Math.PI/180) *
      Math.sin(dLon/2) *
      Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));

    return R * c;
  };

  const fetchData = async () => {

    const { data: route } = await supabase
      .from("travel_logs")
      .select("*")
      .eq("employee_id", id)
      .order("created_at", { ascending: true });

    if(route){

      setLogs(route);

      let total = 0;

      for(let i=1;i<route.length;i++){

        total += calculateDistance(
          route[i-1].latitude,
          route[i-1].longitude,
          route[i].latitude,
          route[i].longitude
        );

      }

      setDistance(total);
    }

    const { data: shopData } = await supabase
      .from("shops")
      .select("*")
      .eq("employee_id", id);

    if(shopData) setShops(shopData);

  };

  return (

    <div className="page">

      <h1 className="title">Employee Tracking</h1>

      <p>Total Distance: {distance.toFixed(2)} KM</p>

      <div style={{ height: 500, marginTop: 20 }}>
        <MapView />
      </div>

    </div>

  );

}