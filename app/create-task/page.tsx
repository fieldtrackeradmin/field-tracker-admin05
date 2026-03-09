"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Employee = {
  id: string;
  name: string;
};

export default function CreateTaskPage() {

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("");
  const [employee, setEmployee] = useState("");

  const [area, setArea] = useState("");
  const [targetShops, setTargetShops] = useState("");
  const [targetOrders, setTargetOrders] = useState("");

  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryItem, setDeliveryItem] = useState("");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  /* FETCH EMPLOYEES */

  const fetchEmployees = async () => {

    const { data, error } = await supabase
      .from("users")
      .select("id,name")
      .eq("role", "employee");

    if (error) {
      console.log("Employee fetch error:", error);
      return;
    }

    setEmployees(data || []);
  };

  /* RESET FORM */

  const resetForm = () => {
    setTitle("");
    setTaskType("");
    setEmployee("");
    setArea("");
    setTargetShops("");
    setTargetOrders("");
    setDeliveryLocation("");
    setDeliveryItem("");
  };

  /* CREATE TASK */

  const handleCreate = async () => {

    if (!title || !taskType || !employee) {
      alert("Please fill required fields");
      return;
    }

    setLoading(true);

    try {

      let taskData: any = {
        title: title.trim(),
        task_type: taskType,
        employee_id: employee,
        status: "pending",
        created_at: new Date().toISOString()
      };

      /* SHOP VISIT TASK */

      if (taskType === "shop_visit") {

        if (!area || !targetShops || !targetOrders) {
          alert("Fill shop visit details");
          setLoading(false);
          return;
        }

        taskData.area_name = area;
        taskData.target_shops = Number(targetShops);
        taskData.target_orders = Number(targetOrders);
      }

      /* DELIVERY TASK */

      if (taskType === "delivery") {

        if (!deliveryLocation || !deliveryItem) {
          alert("Fill delivery details");
          setLoading(false);
          return;
        }

        taskData.delivery_location = deliveryLocation;
        taskData.delivery_item = deliveryItem;
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select();

      if (error) {
        console.log("Task creation error:", error);
        alert(error.message);
        setLoading(false);
        return;
      }

      console.log("Task created:", data);

      alert("Task Created Successfully");

      resetForm();

    } catch (err) {

      console.log(err);
      alert("Something went wrong");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div style={{ padding: 30 }}>

      <h1>Create Task</h1>

      {/* TITLE */}

      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: 10, width: 300 }}
        />
      </div>

      {/* EMPLOYEE */}

      <div style={{ marginTop: 20 }}>
        <select
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
          style={{ padding: 10, width: 300 }}
        >
          <option value="">Select Employee</option>

          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}

        </select>
      </div>

      {/* TASK TYPE */}

      <div style={{ marginTop: 20 }}>
        <select
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          style={{ padding: 10, width: 300 }}
        >
          <option value="">Select Task Type</option>
          <option value="shop_visit">Shop Visit Task</option>
          <option value="delivery">Delivery Task</option>
        </select>
      </div>

      {/* SHOP VISIT FORM */}

      {taskType === "shop_visit" && (

        <div style={{ marginTop: 20 }}>

          <input
            type="text"
            placeholder="Area Name (Example: Whitefield)"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            style={{ padding: 10, width: 300 }}
          />

          <div style={{ marginTop: 15 }}>
            <input
              type="number"
              placeholder="Target Shops"
              value={targetShops}
              onChange={(e) => setTargetShops(e.target.value)}
              style={{ padding: 10, width: 300 }}
            />
          </div>

          <div style={{ marginTop: 15 }}>
            <input
              type="number"
              placeholder="Target Orders"
              value={targetOrders}
              onChange={(e) => setTargetOrders(e.target.value)}
              style={{ padding: 10, width: 300 }}
            />
          </div>

        </div>

      )}

      {/* DELIVERY FORM */}

      {taskType === "delivery" && (

        <div style={{ marginTop: 20 }}>

          <input
            type="text"
            placeholder="Delivery Location"
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)}
            style={{ padding: 10, width: 300 }}
          />

          <div style={{ marginTop: 15 }}>
            <input
              type="text"
              placeholder="Delivery Item"
              value={deliveryItem}
              onChange={(e) => setDeliveryItem(e.target.value)}
              style={{ padding: 10, width: 300 }}
            />
          </div>

        </div>

      )}

      {/* CREATE BUTTON */}

      <button
        onClick={handleCreate}
        disabled={loading}
        style={{
          marginTop: 30,
          padding: "10px 20px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 5,
          cursor: "pointer"
        }}
      >
        {loading ? "Creating..." : "Create Task"}
      </button>

    </div>

  );
}