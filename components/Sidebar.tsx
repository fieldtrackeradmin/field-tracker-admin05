"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Map,
  Store,
  ListChecks,
  PlusCircle
} from "lucide-react";

export default function Sidebar() {

  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Employees", path: "/employees", icon: Users },
    { name: "Live Map", path: "/live-map", icon: Map },
    { name: "Shops", path: "/shops", icon: Store },
    { name: "Tasks", path: "/tasks", icon: ListChecks },
    { name: "Create Task", path: "/create-task", icon: PlusCircle },
  ];

  return (

    <div className="sidebar">

      <h2 className="logo">Field Admin</h2>

      <nav>

        {menu.map((item) => {

          const Icon = item.icon;

          return (

            <Link
              key={item.path}
              href={item.path}
              className={`menuItem ${
                pathname === item.path ? "active" : ""
              }`}
            >

              <Icon size={18} />

              {item.name}

            </Link>

          );

        })}

      </nav>

    </div>

  );

}