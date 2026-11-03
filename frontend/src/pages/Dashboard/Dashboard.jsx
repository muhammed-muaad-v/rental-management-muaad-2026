
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Package,
  ClipboardList,
  Wallet,
  TrendingUp,
  IndianRupee,
  Tag,
  Receipt,
  CalendarDays,
  RefreshCw,
  Menu,
  Sun,
  AlertCircle,
} from "lucide-react";
import "./Dashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const API = {
  customers: `${API_BASE}/api/customers/customers/`,
  equipment: `${API_BASE}/api/inventory/equipment/`,
  rentals: `${API_BASE}/api/rentals/rentals/`,
  payments: `${API_BASE}/api/finance/payments/`,
  expenses: `${API_BASE}/api/finance/expenses/`,
};
const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const amount = (value) => Number(value ?? 0) || 0;

const getMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount(value));

const getDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateKey = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const todayKey = () => dateKey(new Date());

const getPaymentAmount = (payment) =>
  amount(
    payment.amount ??
      payment.paid_amount ??
      payment.payment_amount
  );

const getRentalTotal = (rental) =>
  amount(
    rental.total_amount ??
      rental.grand_total ??
      rental.total_rent ??
      rental.amount
  );

const getCustomerId = (item) => {
  const customer = item.customer;
  if (customer && typeof customer === "object") {
    return customer.id ?? customer.pk;
  }
  return customer ?? item.customer_id ?? null;
};

const getCustomerName = (customer) =>
  customer.name ??
  customer.full_name ??
  customer.customer_name ??
  customer.username ??
  "Unknown customer";

const getExpenseAmount = (expense) =>
  amount(
    expense.amount ??
      expense.total_amount ??
      expense.expense_amount
  );

function StatCard({ title, value, subtitle, icon: Icon, color, onClick }) {
  return (
    <div
      className={`dash-stat-card ${color}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="dash-stat-icon">
        <Icon size={23} />
      </div>

      <div className="dash-stat-content">
        <span className="dash-stat-title">{title}</span>
        <strong>{value}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  );
}


function Dashboard({ onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return dateKey(date);
  });

  const [endDate, setEndDate] = useState(todayKey);
  const [appliedStart, setAppliedStart] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return dateKey(date);
  });
  const [appliedEnd, setAppliedEnd] = useState(todayKey);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const requests = await Promise.allSettled(
        Object.values(API).map(async (url) => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`API request failed: ${url}`);
          }
          return response.json();
        })
      );

      const setters = [
        setCustomers,
        setEquipment,
        setRentals,
        setPayments,
        setExpenses,
      ];

      const failed = [];

      requests.forEach((result, index) => {
        if (result.status === "fulfilled") {
          setters[index](getArray(result.value));
        } else {
          setters[index]([]);
          failed.push(Object.keys(API)[index]);
        }
      });

      if (failed.length) {
        setError(
          `Data unavailable: ${failed.join(", ")}. Check these API endpoints.`
        );
      }
    } catch {
      setError("Unable to load dashboard data. Check your Django server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const periodPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const date = getDate(
          payment.payment_date ??
            payment.date ??
            payment.created_at
        );
        if (!date) return false;
        const key = dateKey(date);
        return key >= appliedStart && key <= appliedEnd;
      }),
    [payments, appliedStart, appliedEnd]
  );

  const periodRentals = useMemo(
    () =>
      rentals.filter((rental) => {
        const date = getDate(
          rental.rental_date ??
            rental.created_at ??
            rental.date
        );
        if (!date) return false;
        const key = dateKey(date);
        return key >= appliedStart && key <= appliedEnd;
      }),
    [rentals, appliedStart, appliedEnd]
  );

  const periodExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const date = getDate(
          expense.expense_date ??
            expense.date ??
            expense.created_at
        );
        if (!date) return false;
        const key = dateKey(date);
        return key >= appliedStart && key <= appliedEnd;
      }),
    [expenses, appliedStart, appliedEnd]
  );

  const totalCollections = periodPayments.reduce(
    (sum, payment) => sum + getPaymentAmount(payment),
    0
  );

  const todaysCollections = payments
    .filter((payment) => {
      const date = getDate(
        payment.payment_date ??
          payment.date ??
          payment.created_at
      );
      return date && dateKey(date) === todayKey();
    })
    .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

  const grossRevenue = periodRentals.reduce(
    (sum, rental) => sum + getRentalTotal(rental),
    0
  );

  const totalExpenses = periodExpenses.reduce(
    (sum, expense) => sum + getExpenseAmount(expense),
    0
  );

  const totalDiscounts = periodRentals.reduce(
    (sum, rental) =>
      sum +
      amount(
        rental.discount_amount ??
          rental.discount ??
          rental.discount_total
      ),
    0
  );

  const netRevenue = grossRevenue - totalDiscounts;

  const paidByRental = useMemo(() => {
    const map = new Map();

    payments.forEach((payment) => {
      const rentalId =
        payment.rental?.id ??
        payment.rental ??
        payment.rental_id;

      if (rentalId == null) return;

      map.set(
        String(rentalId),
        (map.get(String(rentalId)) || 0) +
          getPaymentAmount(payment)
      );
    });

    return map;
  }, [payments]);

  const pendingCustomers = useMemo(() => {
    const map = new Map();

    rentals.forEach((rental) => {
      const customerId = getCustomerId(rental);
      if (customerId == null) return;

      const rentalId = rental.id ?? rental.pk;
      const total = getRentalTotal(rental);
      const paid =
        rentalId != null
          ? paidByRental.get(String(rentalId)) || 0
          : 0;

      const balance = Math.max(
        0,
        total - paid
      );

      if (!balance) return;

      const key = String(customerId);
      const customer = customers.find(
        (item) =>
          String(item.id ?? item.pk) === key
      );

      const current = map.get(key) || {
        id: key,
        name: customer
          ? getCustomerName(customer)
          : rental.customer_name || "Customer",
        balance: 0,
        count: 0,
      };

      current.balance += balance;
      current.count += 1;
      map.set(key, current);
    });

    return [...map.values()]
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [rentals, customers, paidByRental]);

  const totalStock = equipment.reduce(
    (sum, item) =>
      sum +
      amount(
        item.total_stock ??
          item.quantity ??
          item.stock
      ),
    0
  );

  const availableStock = equipment.reduce(
    (sum, item) =>
      sum +
      amount(
        item.available_stock ??
          item.available_quantity ??
          item.available
      ),
    0
  );

  const rentedStock = Math.max(
    0,
    totalStock - availableStock
  );

  const availabilityPercent = totalStock
    ? Math.round((availableStock / totalStock) * 100)
    : 0;

  const monthlyCollections = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - 11 + index,
        1
      );

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const value = payments
        .filter((payment) => {
          const paymentDate = getDate(
            payment.payment_date ??
              payment.date ??
              payment.created_at
          );

          return (
            paymentDate &&
            `${paymentDate.getFullYear()}-${String(
              paymentDate.getMonth() + 1
            ).padStart(2, "0")}` === key
          );
        })
        .reduce(
          (sum, payment) =>
            sum + getPaymentAmount(payment),
          0
        );

      return {
        label: date.toLocaleDateString("en-IN", {
          month: "short",
        }),
        value,
      };
    });
  }, [payments]);

  const maxMonthlyValue = Math.max(
    1,
    ...monthlyCollections.map((item) => item.value)
  );

  const dateLabel = (value) => {
    const date = getDate(value);
    return date
      ? date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : value;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 17) return "Good afternoon!";
    return "Good evening!";
  };

  const activeRentals = rentals.filter(
    (rental) =>
      rental.is_active === true ||
      rental.status === "active" ||
      rental.status === "ongoing" ||
      rental.status === "Active"
  ).length;

  const outstanding = pendingCustomers.reduce(
    (sum, customer) => sum + customer.balance,
    0
  );

  return (

    <div className="owner-dashboard">
      
      <main className="dash-main">
        <section className="dash-welcome">
          <h1>
            {greeting()} <span>👋</span>
          </h1>
          <p>Track your rental business at a glance</p>
        </section>

        <section className="dash-period">
          <p className="dash-period-label">
            Period: {dateLabel(appliedStart)} –{" "}
            {dateLabel(appliedEnd)}
          </p>

          <div className="dash-date-controls">
            <CalendarDays size={21} />

            <input
              type="date"
              aria-label="Start date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
            />

            <span>to</span>

            <input
              type="date"
              aria-label="End date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />

            <button
              type="button"
              onClick={() => {
                if (
                  startDate &&
                  endDate &&
                  startDate <= endDate
                ) {
                  setAppliedStart(startDate);
                  setAppliedEnd(endDate);
                }
              }}
            >
              Apply
            </button>
          </div>
        </section>

        {error && (
          <div className="dash-error">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        
        <section className="dash-section">
          <h2>OVERVIEW</h2>

          <div className="dash-stats-grid">
            <StatCard
              title="Customers"
              value={customers.length}
              icon={Users}
              color="blue"
              onClick={() => onNavigate("customers")}
            />

            <StatCard
              title="Commodities"
              value={equipment.length}
              icon={Package}
              color="purple"
              onClick={() => onNavigate("inventory")}
            />

            <StatCard
              title="Active Rentals"
              value={activeRentals}
              icon={ClipboardList}
              color="orange"
              onClick={() => onNavigate("rentals")}
            />

            <StatCard
              title="Outstanding"
              value={getMoney(outstanding)}
              icon={IndianRupee}
              color="pink"
              onClick={() => onNavigate("outstanding")}
            />
          </div>
        </section>

        <section className="dash-section">
          <h2>
            PERIOD SUMMARY ({dateLabel(appliedStart)} –{" "}
            {dateLabel(appliedEnd)})
          </h2>

          <div className="dash-stats-grid">
            <StatCard
              title="Today's Collections"
              value={getMoney(todaysCollections)}
              icon={Wallet}
              color="green"
              onClick={() => onNavigate("collections")}
            />

            <StatCard
              title="Collections"
              value={getMoney(totalCollections)}
              subtitle={`${periodPayments.length} payment records`}
              icon={TrendingUp}
              color="cyan"
              onClick={() => onNavigate("collections")}
            />

            <StatCard
              title="Gross Revenue"
              value={getMoney(grossRevenue)}
              subtitle={`${periodRentals.length} rentals created in period`}
              icon={IndianRupee}
              color="purple"
              onClick={() => onNavigate("collections")}
            />

            <StatCard
              title={`Discounts${
                grossRevenue
                  ? ` (${((totalDiscounts / grossRevenue) * 100).toFixed(1)}%)`
                  : ""
              }`}
              value={getMoney(totalDiscounts)}
              icon={Tag}
              color="pink"
              onClick={() => onNavigate("bills")}
            />

            <StatCard
              title="Net Revenue"
              value={getMoney(netRevenue)}
              icon={TrendingUp}
              color="green"
              onClick={() => onNavigate("collections")}
            />

            <StatCard
              title="Expenses"
              value={getMoney(totalExpenses)}
              subtitle={`${periodExpenses.length} expense records`}
              icon={Receipt}
              color="orange"
              onClick={() => onNavigate("expenses")}
            />
          </div>
        </section>

        <section className="dash-revenue-breakdown">
          <h2>
            REVENUE BREAKDOWN — {dateLabel(appliedStart)} –{" "}
            {dateLabel(appliedEnd)}
          </h2>

          <div className="dash-revenue-items">
            <div>
              <strong>{getMoney(grossRevenue)}</strong>
              <span>Gross Revenue</span>
            </div>
            <div>
              <strong className="negative">
                −{getMoney(totalDiscounts)}
              </strong>
              <span>Discounts</span>
            </div>
            <div>
              <strong className="positive">
                {getMoney(netRevenue)}
              </strong>
              <span>Net Revenue</span>
            </div>
          </div>
        </section>

        <section className="dash-panel">
          <div className="dash-panel-heading">
            <div>
              <h2>Collections (Last 12 Months)</h2>
              <p>Monthly collection history</p>
            </div>
            <TrendingUp size={24} />
          </div>

          <div className="dash-chart">
            <div className="dash-chart-ylabels">
              <span>{getMoney(maxMonthlyValue)}</span>
              <span>{getMoney(maxMonthlyValue * 0.66)}</span>
              <span>{getMoney(maxMonthlyValue * 0.33)}</span>
              <span>₹0</span>
            </div>

            <div className="dash-chart-bars">
              {monthlyCollections.map((month) => (
                <div
                  className="dash-chart-column"
                  key={month.label + month.value}
                >
                  <span className="dash-bar-value">
                    {month.value > 0
                      ? `₹${Math.round(month.value).toLocaleString("en-IN")}`
                      : ""}
                  </span>
                  <div className="dash-bar-track">
                    <div
                      className="dash-bar"
                      style={{
                        height: `${
                          (month.value / maxMonthlyValue) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="dash-month-label">
                    {month.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dash-panel dash-pending-panel">
  <div className="dash-panel-heading">
    <div>
      <h2>Top Pending Customers</h2>
    </div>
  </div>

  {pendingCustomers.length > 0 ? (
    <div className="dash-pending-list">
      {pendingCustomers.map((customer) => (
        <div className="dash-pending-row" key={customer.id}>
          <div className="dash-customer-info">
            <strong>{customer.name}</strong>
          </div>

          <strong className="dash-customer-balance">
            {getMoney(customer.balance)}
          </strong>
        </div>
      ))}
    </div>
  ) : (
    <p className="dash-empty">
      {loading
        ? "Loading pending customers..."
        : "No pending balances found."}
    </p>
  )}
</section>

        {loading && (
          <p className="dash-loading">Loading dashboard data...</p>
        )}
      </main>
    </div>
  );
}

export default Dashboard;