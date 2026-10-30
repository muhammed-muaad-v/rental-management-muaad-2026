import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  CreditCard,
  Receipt,
  Wallet,
  Settings,
  Bell,
  Search,
  Menu,
  ArrowUpRight,
  IndianRupee,
  RefreshCw,
  FolderOpen,
  Activity,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

import Dashboard from "./pages/Dashboard/Dashboard";
import Customers from "./pages/Customers/Customers";
import Inventory from "./pages/Inventory/Inventory";
import Bills from "./pages/Bills/Bills";

import Rentals from "./pages/Rentals/Rentals";
import Payments from "./pages/Payments/Payments";
import Expenses from "./pages/Expenses/Expenses";

import Outstanding from "./pages/Outstanding/Outstanding";
import Collections from "./pages/Collections/Collections";
import Receivables from "./pages/Receivables/Receivables";
import CustomerLedger from "./pages/Receivables/CustomerLedger";

import Ledger from "./pages/Ledger/Ledger";
import Categories from "./pages/Categories/Categories";
import UsersPage from "./pages/Users/Users";
import ActivityLog from "./pages/ActivityLog/ActivityLog";
import SettingsPage from "./pages/Settings/Settings";

import Login from "./pages/Login/Login";
import "./App.css";


// =====================================================
// API URLS
// =====================================================

const CUSTOMERS_API =
  "http://127.0.0.1:8000/api/customers/customers/";

const EQUIPMENT_API =
  "http://127.0.0.1:8000/api/inventory/equipment/";

const RENTALS_API =
  "http://127.0.0.1:8000/api/rentals/rentals/";

const PAYMENTS_API =
  "http://127.0.0.1:8000/api/finance/payments/";


// =====================================================
// HELPERS
// =====================================================

const getList = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};


const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};


const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


// =====================================================
// APP
// =====================================================

function App() {

  // ===================================================
  // PAGE
  // ===================================================

  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("access"))
  );
  const [page, setPage] = useState("dashboard");
  const [selectedCustomer, setSelectedCustomer] = useState(null);


  // ===================================================
  // DATA
  // ===================================================

  const [customers, setCustomers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);


  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("vk-rent-theme") || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("vk-rent-theme", theme);
    } catch {
      // Browser storage unavailable
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  


  // ===================================================
  // DASHBOARD STATE
  // ===================================================

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState("");


  // ===================================================
  // FETCH DASHBOARD DATA
  // ===================================================

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError("");

      const [
        customersResponse,
        equipmentResponse,
        rentalsResponse,
        paymentsResponse,
      ] = await Promise.all([
        fetch(CUSTOMERS_API),
        fetch(EQUIPMENT_API),
        fetch(RENTALS_API),
        fetch(PAYMENTS_API),
      ]);


      // -------------------------------
      // CUSTOMERS
      // -------------------------------

      let customersData = [];

      if (customersResponse.ok) {
        const data = await customersResponse.json();
        customersData = getList(data);
      }


      // -------------------------------
      // EQUIPMENT
      // -------------------------------

      let equipmentData = [];

      if (equipmentResponse.ok) {
        const data = await equipmentResponse.json();
        equipmentData = getList(data);
      }


      // -------------------------------
      // RENTALS
      // -------------------------------

      let rentalsData = [];

      if (rentalsResponse.ok) {
        const data = await rentalsResponse.json();
        rentalsData = getList(data);
      }


      // -------------------------------
      // PAYMENTS
      // -------------------------------

      let paymentsData = [];

      if (paymentsResponse.ok) {
        const data = await paymentsResponse.json();
        paymentsData = getList(data);
      }


      // -------------------------------
      // SET DATA
      // -------------------------------

      setCustomers(customersData);
      setEquipment(equipmentData);
      setRentals(rentalsData);
      setPayments(paymentsData);


      // -------------------------------
      // ALL API FAILED
      // -------------------------------

      if (
        !customersResponse.ok &&
        !equipmentResponse.ok &&
        !rentalsResponse.ok &&
        !paymentsResponse.ok
      ) {
        throw new Error(
          "Dashboard API connect cheyyan kazhinjilla."
        );
      }

    } catch (error) {
      console.error("Dashboard error:", error);

      setDashboardError(
        "Dashboard data load cheyyan kazhinjilla."
      );

    } finally {
      setDashboardLoading(false);
    }
  };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (page === "dashboard") {
      fetchDashboardData();
    }
  }, [page]);


  // ===================================================
  // DASHBOARD CALCULATIONS
  // ===================================================

  const totalCustomers = customers.length;


  const totalEquipmentStock = equipment.reduce(
    (total, item) =>
      total + Number(item.total_stock || 0),
    0
  );


  const totalAvailableStock = equipment.reduce(
    (total, item) =>
      total + Number(item.available_stock || 0),
    0
  );


  const totalRentedStock = Math.max(
    totalEquipmentStock - totalAvailableStock,
    0
  );


  const activeRentals = rentals.filter(
    (rental) => rental.status === "active"
  ).length;


  const completedRentals = rentals.filter(
    (rental) => rental.status === "completed"
  ).length;


  const cancelledRentals = rentals.filter(
    (rental) => rental.status === "cancelled"
  ).length;


  const totalCollections = payments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0
  );


  // ===================================================
  // RECENT RENTALS
  // ===================================================

  const recentRentals = useMemo(() => {
    return [...rentals]
      .sort((a, b) => {
        const dateA = new Date(
          a.rental_date ||
          a.created_at ||
          0
        ).getTime();

        const dateB = new Date(
          b.rental_date ||
          b.created_at ||
          0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [rentals]);


  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className={`app theme-${theme}`}>

      
      {/* =================================================
    SIDEBAR
================================================= */}

<aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

  {/* LOGO */}
  <div className="logo">
    <div className="logo-icon">
      VK
    </div>

    <div>
      <h2>VK RENT</h2>
      <span>Rental Management</span>
    </div>
  </div>


  {/* MENU */}
  <nav className="sidebar-menu">

    {/* MAIN */}
    <p className="menu-title">
      MAIN
    </p>

    {/* DASHBOARD */}
    <button
      className={`menu-item ${
        page === "dashboard" ? "active" : ""
      }`}
      onClick={() => {
        setPage("dashboard");
        setSidebarOpen(false);
      }}
    >
      <LayoutDashboard size={20} />
      <span>Dashboard</span>
    </button>


    {/* INVENTORY */}
    <p className="menu-title">
      INVENTORY
    </p>

    {/* COMMODITIES */}
    <button
      className={`menu-item ${
        page === "inventory" ? "active" : ""
      }`}
      onClick={() => {
        setPage("inventory");
        setSidebarOpen(false);
      }}
    >
      <Package size={20} />
      <span>Commodities</span>
    </button>


    {/* CUSTOMERS */}
    <button
      className={`menu-item ${
        page === "customers" ? "active" : ""
      }`}
      onClick={() => {
        setPage("customers");
        setSidebarOpen(false);
      }}
    >
      <Users size={20} />
      <span>Customers</span>
    </button>


    {/* OPERATIONS */}
    <p className="menu-title">
      OPERATIONS
    </p>

    {/* RENTALS */}
    <button
      className={`menu-item ${
        page === "rentals" ? "active" : ""
      }`}
      onClick={() => {
        setPage("rentals");
        setSidebarOpen(false);
      }}
    >
      <ClipboardList size={20} />
      <span>Rentals</span>
    </button>


    {/* BILLS */}
    <button
      className={`menu-item ${
        page === "bills" ? "active" : ""
      }`}
      onClick={() => {
        setPage("bills");
        setSidebarOpen(false);
      }}
    >
      <Receipt size={20} />
      <span>Bills</span>
    </button>


    {/* PAYMENTS */}
    <button
      className={`menu-item ${
        page === "payments" ? "active" : ""
      }`}
      onClick={() => {
        setPage("payments");
        setSidebarOpen(false);
      }}
    >
      <CreditCard size={20} />
      <span>Payments</span>
    </button>


    {/* OUTSTANDING */}
    <button
      className={`menu-item ${
        page === "outstanding" ? "active" : ""
      }`}
      onClick={() => {
        setPage("outstanding");
        setSidebarOpen(false);
      }}
    >
      <Wallet size={20} />
      <span>Outstanding</span>
    </button>


    {/* FINANCE */}
    <p className="menu-title">
      FINANCE
    </p>

    {/* EXPENSES */}
    <button
      className={`menu-item ${
        page === "expenses" ? "active" : ""
      }`}
      onClick={() => {
        setPage("expenses");
        setSidebarOpen(false);
      }}
    >
      <Receipt size={20} />
      <span>Expenses</span>
    </button>


    {/* COLLECTIONS */}
    <button
      className={`menu-item ${
        page === "collections" ? "active" : ""
      }`}
      onClick={() => {
        setPage("collections");
        setSidebarOpen(false);
      }}
    >
      <CreditCard size={20} />
      <span>Collections</span>
    </button>


    {/* RECEIVABLES */}
    <button
      className={`menu-item ${
        page === "receivables" ? "active" : ""
      }`}
      onClick={() => {
        setPage("receivables");
        setSidebarOpen(false);
      }}
    >
      <Wallet size={20} />
      <span>Receivables</span>
    </button>


    {/* LEDGER */}
    <button
      className={`menu-item ${
        page === "ledger" ? "active" : ""
      }`}
      onClick={() => {
        setPage("ledger");
        setSidebarOpen(false);
      }}
    >
      <Receipt size={20} />
      <span>Ledger</span>
    </button>


    {/* ADMIN */}

    <p className="menu-title">ADMIN</p>

    <button
      className={`menu-item ${
        page === "categories" ? "active" : ""
      }`}
      onClick={() => {
        setPage("categories");
        setSidebarOpen(false);
      }}
    >
      <FolderOpen size={20} />
      <span>Categories</span>
    </button>

    <button
      className={`menu-item ${
        page === "users" ? "active" : ""
      }`}
      onClick={() => {
        setPage("users");
        setSidebarOpen(false);
      }}
    >
      <Users size={20} />
      <span>Users</span>
    </button>

    <button
      className={`menu-item ${
        page === "activity-log" ? "active" : ""
      }`}
      onClick={() => {
        setPage("activity-log");
        setSidebarOpen(false);
      }}
    >
      <Activity size={20} />
      <span>Activity Log</span>
    </button>

    <button
      className={`menu-item ${
        page === "settings" ? "active" : ""
      }`}
      onClick={() => {
        setPage("settings");
        setSidebarOpen(false);
      }}
    >
      <Settings size={20} />
      <span>Settings</span>
    </button>

  </nav>


  {/* SIDEBAR USER */}
  <div className="sidebar-bottom">
    <div className="sidebar-profile">
      <div className="user-avatar">AM</div>

      <div className="sidebar-user-info">
        <strong>Abdul Manaf</strong>
        <span>RENTAL OWNER</span>
      </div>
    </div>

    <button
      type="button"
      className="sidebar-logout"
      onClick={() => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        window.location.reload();
      }}
    >
      <LogOut size={22} />
      <span>Log out</span>
    </button>
  </div>

</aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="main-content">


        
{/* =================================================
    TOPBAR
================================================= */}

<header className="topbar">
  {/* Mobile menu */}
  <button
    type="button"
    className="mobile-menu"
    onClick={() => setSidebarOpen(!sidebarOpen)}
    aria-label="Toggle menu"
  >
    <Menu size={24} />
  </button>

  {/* Page title */}
  <div className="topbar-page-title">
    {page === "dashboard" && (
      <>
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening today.</p>
      </>
    )}
  </div>

  {/* Header actions */}
  <div className="topbar-actions">
    <button
      type="button"
      className="icon-button topbar-search"
      aria-label="Search"
    >
      <Search size={20} />
    </button>

    {/* Night / Light Mode Toggle */}
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={() =>
        setTheme((current) =>
          current === "dark" ? "light" : "dark"
        )
      }
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Night Mode"}
      aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Night Mode"}
    >
      {theme === "dark" ? (
        <Sun size={20} />
      ) : (
        <Moon size={20} />
      )}
    </button>

    <div className="profile topbar-profile">
      <div className="profile-avatar">M</div>
      <div>
        <strong>Admin</strong>
        <small>Administrator</small>
      </div>
    </div>
  </div>
</header>


        {page === "dashboard" && (
          <Dashboard onNavigate={setPage} />
        )}

        {/* =================================================
            CUSTOMERS
        ================================================= */}

        {page === "customers" && (
          <Customers />
        )}


        {/* =================================================
            INVENTORY
        ================================================= */}

        {page === "inventory" && (
          <Inventory />
        )}



        {page === "rentals" && (
          <Rentals />
        )}

        {page === "payments" && (
          <Payments onBackToBills={() => setPage("bills")} />
        )}

        {page === "bills" && <Bills />}

        {page === "expenses" && <Expenses />}

        {page === "collections" && <Collections />}

        {page === "receivables" && (
          <Receivables
            onViewLedger={(customer) => {
              setSelectedCustomer(customer);
              setPage("customer-ledger");
            }}
          />
        )}

        {page === "customer-ledger" && (
            <CustomerLedger
              customer={selectedCustomer}
              onBack={() => {
                setSelectedCustomer(null);
                setPage("receivables");
              }}
            />
          )}

        {page === "ledger" && <Ledger />}

        {page === "outstanding" && (
          <Outstanding />
        )}

        {page === "categories" && <Categories />}

        {/* USERS PAGE */}
        {page === "users" && <UsersPage />}

       
      {/* =================================================
          SETTINGS
      ================================================= */}

      {page === "settings" && <SettingsPage />}

      {page === "activity-log" && <ActivityLog />}

      </main>

    </div>
  );
}


export default App;