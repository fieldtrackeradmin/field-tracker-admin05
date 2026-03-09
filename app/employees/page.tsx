"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Employee = {
  id: string;
  name: string;
  email: string;
  last_active: string | null;
};

export default function EmployeesPage() {

  const [employees, setEmployees] = useState<Employee[]>([]);
  const router = useRouter();

  useEffect(() => {

    fetchEmployees();

    const channel = supabase
      .channel("employees-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          fetchEmployees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  const fetchEmployees = async () => {

    const { data, error } = await supabase
      .from("users")
      .select("id,name,email,last_active")
      .eq("role", "employee");

    if (error) {
      console.log(error);
      return;
    }

    setEmployees((data as Employee[]) || []);

  };

  const getStatus = (lastActive: string | null) => {

    if (!lastActive) return "Offline";

    const now = Date.now();
    const last = Date.parse(lastActive);

    const diff = (now - last) / 1000;

    return diff <= 60 ? "Online" : "Offline";

  };

  return (

    <div className="page">

      <h1 className="pageTitle">Employees</h1>

      <div className="tableCard">

        <table className="employeeTable">

          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {employees.map((emp: Employee) => {

              const status = getStatus(emp.last_active);

              return (

                <tr
                  key={emp.id}
                  className="row"
                  onClick={() => router.push(`/employees/${emp.id}`)}
                >

                  <td className="nameCell">

                    <div className="avatar">
                      {emp.name?.charAt(0)}
                    </div>

                    {emp.name}

                  </td>

                  <td>{emp.email}</td>

                  <td>

                    <span
                      className={
                        status === "Online"
                          ? "status online"
                          : "status offline"
                      }
                    >
                      {status}
                    </span>

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    </div>

  );

}