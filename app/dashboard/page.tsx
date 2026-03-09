"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {

  const [stats, setStats] = useState({
    employees: 0,
    shops: 0,
    tasks: 0,
    online: 0
  });

  useEffect(() => {

    fetchStats();

    // realtime updates
    const channel = supabase
      .channel("dashboard-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        fetchStats
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shops" },
        fetchStats
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  const fetchStats = async () => {

    // employees count
    const { count: employeeCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "employee");

    // shops count
    const { count: shopCount } = await supabase
      .from("shops")
      .select("*", { count: "exact", head: true });

    // tasks count
    const { count: taskCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true });

    // fetch employees for online check
    const { data: employees } = await supabase
      .from("users")
      .select("last_active")
      .eq("role", "employee");

    let online = 0;

    if (employees) {

      const now = Date.now();

      employees.forEach((emp:any) => {

        if (!emp.last_active) return;

        const diff = (now - Date.parse(emp.last_active)) / 1000;

        if (diff <= 60) online++;

      });

    }

    setStats({
      employees: employeeCount || 0,
      shops: shopCount || 0,
      tasks: taskCount || 0,
      online: online
    });

  };

  return (

    <div className="page">

      <h1 className="title">Dashboard</h1>

      <div className="statsGrid">

        <div className="statCard">
          <h3>Total Employees</h3>
          <p>{stats.employees}</p>
        </div>

        <div className="statCard">
          <h3>Total Shops</h3>
          <p>{stats.shops}</p>
        </div>

        <div className="statCard">
          <h3>Total Tasks</h3>
          <p>{stats.tasks}</p>
        </div>

        <div className="statCard">
          <h3>Online Employees</h3>
          <p>{stats.online}</p>
        </div>

      </div>

    </div>

  );

}