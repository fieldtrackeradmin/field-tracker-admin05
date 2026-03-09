"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  users?: {
    name: string;
  };
};

export default function TasksPage() {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------- FETCH TASKS ----------------

  const fetchTasks = async () => {

    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        users(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Fetch error:", error);
      return;
    }

    setTasks((data as Task[]) || []);
    setLoading(false);
  };

  // ---------------- DELETE TASK ----------------

  const deleteTask = async (id: string) => {

    const confirmDelete = confirm("Are you sure you want to delete this task?");

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("Delete error:", error);
      alert("Failed to delete task");
      return;
    }

    setTasks(tasks.filter((task) => task.id !== id));
  };

  // ---------------- REALTIME ----------------

  useEffect(() => {

    fetchTasks();

    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  if (loading) return <p style={{ padding: 30 }}>Loading tasks...</p>;

  return (

    <div style={{ padding: 30 }}>

      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        📋 Tasks
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
          gap: 25,
          marginTop: 25
        }}
      >

        {tasks.map((task: Task) => (

          <div
            key={task.id}
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              border: "1px solid #eee"
            }}
          >

            <h3 style={{ fontSize: 20, marginBottom: 10 }}>
              {task.title}
            </h3>

            <p>
              👤 <b>Employee:</b> {task.users?.name || "Unknown"}
            </p>

            <p>
              📌 <b>Task Type:</b> {task.task_type}
            </p>

            {task.task_type === "shop_visit" && (
              <>
                <p>
                  📍 <b>Area:</b> {task.area_name || "N/A"}
                </p>

                <p>
                  🏬 <b>Target Shops:</b> {task.target_shops || 0}
                </p>

                <p>
                  📦 <b>Target Orders:</b> {task.target_orders || 0}
                </p>
              </>
            )}

            {task.task_type === "delivery" && (
              <>
                <p>
                  📍 <b>Delivery Location:</b>
                </p>

                <a
                  href={task.delivery_location}
                  target="_blank"
                  style={{
                    color: "#2563eb",
                    fontSize: 14,
                    wordBreak: "break-all"
                  }}
                >
                  {task.delivery_location}
                </a>

                <p style={{ marginTop: 6 }}>
                  📦 <b>Item:</b> {task.delivery_item}
                </p>
              </>
            )}

            <p style={{ marginTop: 10 }}>
              ⚡ <b>Status:</b>{" "}
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background:
                    task.status === "completed"
                      ? "#16a34a"
                      : task.status === "in_progress"
                      ? "#f59e0b"
                      : "#6b7280",
                  color: "#fff",
                  fontSize: 13
                }}
              >
                {task.status}
              </span>
            </p>

            <button
              onClick={() => deleteTask(task.id)}
              style={{
                marginTop: 15,
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              🗑 Delete Task
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}
