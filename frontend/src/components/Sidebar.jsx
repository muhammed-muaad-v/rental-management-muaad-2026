import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  CreditCard,
  Receipt,
  Wallet,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    icon: Users,
  },
  {
    name: "Equipment",
    icon: Package,
  },
  {
    name: "Rentals",
    icon: ClipboardList,
  },
  {
    name: "Payments",
    icon: CreditCard,
  },
  {
    name: "Expenses",
    icon: Receipt,
  },
  {
    name: "Outstanding",
    icon: Wallet,
  },
  {
    name: "Settings",
    icon: Settings,
  },
];

function Sidebar({ sidebarOpen }) {
  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">VK</div>

        <div>
          <h2>VK RENT</h2>
          <span>Rental Management</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`sidebar-item ${
                item.name === "Dashboard" ? "active" : ""
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">M</div>

        <div>
          <strong>Admin</strong>
          <span>Administrator</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;