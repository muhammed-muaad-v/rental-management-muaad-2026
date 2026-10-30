
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  UserRound,
  CalendarDays,
  Activity,
} from "lucide-react";
import "./ActivityLog.css";

const ACTIVITY_API = "http://127.0.0.1:8000/api/activity-log/";
const USERS_API = "http://127.0.0.1:8000/api/users/users/";
const REFRESH_API = "http://127.0.0.1:8000/api/users/token/refresh/";

const TYPE_OPTIONS = [
  "Rental",
  "Return",
  "Bill",
  "Payment",
  "Customer",
  "Commodity",
  "Category",
  "Stock Adjustment",
  "Expense",
  "Expense Category",
  "Shop Settings",
];

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "CANCEL",
  "COMPLETE",
  "START",
  "RESTORE",
  "LOGIN",
  "LOGOUT",
];

function normalizeResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.logs)) return data.logs;
  if (Array.isArray(data?.activities)) return data.activities;
  return [];
}

function getAction(item) {
  return String(
    item.action || item.action_type || item.type || "OTHER"
  ).toUpperCase();
}

function getDescription(item) {
  return (
    item.description ||
    item.message ||
    item.details ||
    "Activity recorded"
  );
}

function getCategory(item) {
  return (
    item.category ||
    item.model_name ||
    item.object_type ||
    item.entity_type ||
    "General"
  );
}

function getUser(item) {
  const user = item.user_details || item.user;

  if (typeof user === "string") {
    if (user.toLowerCase() === "system") {
      return "Abdul Manaf (9746094576)";
    }
    return user;
  }

  if (user && typeof user === "object") {
    const name =
      user.full_name ||
      user.name ||
      user.username ||
      [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ") ||
      "Unknown user";

    const phone = user.phone || user.phone_number;

    if (name.toLowerCase() === "system") {
      return "Abdul Manaf (9746094576)";
    }

    return phone ? `${name} (${phone})` : name;
  }

  const fallbackUser = item.username || item.user_name || "Unknown user";

  if (fallbackUser.toLowerCase() === "system") {
    return "Abdul Manaf (9746094576)";
  }

  return fallbackUser;
}
function getAccountUser(user) {
  const name =
    user.full_name ||
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username ||
    user.email ||
    `User ${user.id ?? user.pk ?? ""}`.trim();

  const phone = user.phone || user.phone_number;
  return phone ? `${name} (${phone})` : name;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Refresh the access token if it has expired.
async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;

  try {
    const response = await fetch(REFRESH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return false;

    const data = await response.json();

    if (!data.access) return false;

    localStorage.setItem("access", data.access);

    if (data.refresh) {
      localStorage.setItem("refresh", data.refresh);
    }

    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

// Send a request with the current token.
// If it returns 401, refresh the token and retry once.
async function authenticatedFetch(url) {
  const sendRequest = () => {
    const token = localStorage.getItem("access");

    return fetch(url, {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    });
  };

  let response = await sendRequest();

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");

      window.location.reload();
      throw new Error("Session expired. Please log in again.");
    }

    response = await sendRequest();
  }

  return response;
}

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const today = new Date();

  const formatInputDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [fromDate, setFromDate] = useState(() =>
    formatInputDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
    )
  );

  const [toDate, setToDate] = useState(() =>
    formatInputDate(today)
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authenticatedFetch(ACTIVITY_API);

      if (!response.ok) {
        throw new Error(`Activity API returned ${response.status}`);
      }

      const data = await response.json();
      const list = normalizeResults(data);

      setActivities(list);
    } catch (err) {
      setActivities([]);
      setError(
        err.message || "Unable to load activities."
      );
      console.error("Activity API error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersError("");

    try {
      const response = await authenticatedFetch(USERS_API);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Admin permission required to view users."
          );
        }

        throw new Error(`Users API returned ${response.status}`);
      }

      const data = await response.json();
      setAvailableUsers(normalizeResults(data));
    } catch (err) {
      setAvailableUsers([]);
      setUsersError(err.message || "Unable to load users.");
      console.error("Users API error:", err);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchUsers();
  }, [fetchActivities, fetchUsers]);

  const typeOptions = useMemo(() => {
    const existingTypes = activities.map(getCategory);

    return [...new Set([...TYPE_OPTIONS, ...existingTypes])].sort(
      (a, b) => {
        const indexA = TYPE_OPTIONS.indexOf(a);
        const indexB = TYPE_OPTIONS.indexOf(b);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        return a.localeCompare(b);
      }
    );
  }, [activities]);

  const userOptions = useMemo(() => {
    const accountUsers = availableUsers.map(getAccountUser);
    const activityUsers = activities
      .map(getUser)
      .filter((user) => user !== "Unknown user");

    return [
      ...new Set([...accountUsers, ...activityUsers].filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));
  }, [availableUsers, activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const action = getAction(item);
      const category = getCategory(item);
      const description = getDescription(item);
      const user = getUser(item);
      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        `${description} ${user} ${category} ${action}`
          .toLowerCase()
          .includes(query);

      const matchesAction =
        actionFilter === "all" || action === actionFilter;

      const matchesType =
        typeFilter === "all" ||
        category.toLowerCase() === typeFilter.toLowerCase();

      const selectedUserName = userFilter.split(" (")[0];
      const activityUserName = user.split(" (")[0];

      const matchesUser =
        userFilter === "all" ||
        user === userFilter ||
        activityUserName === selectedUserName;

      const rawDate =
        item.created_at ||
        item.timestamp ||
        item.date ||
        item.created ||
        item.updated_at;

      const date = rawDate ? new Date(rawDate) : null;

      const matchesFrom =
        !fromDate ||
        (date &&
          !Number.isNaN(date.getTime()) &&
          date >= new Date(`${fromDate}T00:00:00`));

      const matchesTo =
        !toDate ||
        (date &&
          !Number.isNaN(date.getTime()) &&
          date <= new Date(`${toDate}T23:59:59.999`));

      return (
        matchesSearch &&
        matchesAction &&
        matchesType &&
        matchesUser &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    activities,
    search,
    actionFilter,
    typeFilter,
    userFilter,
    fromDate,
    toDate,
  ]);

  const handleRefresh = () => {
    fetchActivities();
    fetchUsers();
  };

  return (
    <main className="activity-log-page">
      <header className="activity-log-header">
        <h1>Activity Log</h1>
        <p>Complete audit trail of actions in your rental shop</p>
      </header>

      <section className="activity-log-filters">
        <label className="activity-log-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search description, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select
          aria-label="Filter by action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">All Actions</option>
          {ACTIONS.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
          {activities.some((item) => getAction(item) === "OTHER") && (
            <option value="OTHER">OTHER</option>
          )}
        </select>

        <select
          aria-label="Filter by type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        
        <select
          aria-label="Filter by user"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          <option value="all">All Users</option>
          <option value="Abdul Manaf (9746094576)">
            Abdul Manaf 
          </option>
        </select>


        <label className="activity-log-date">
          <CalendarDays size={16} />
          <input
            type="date"
            aria-label="From date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>

        <label className="activity-log-date">
          <CalendarDays size={16} />
          <input
            type="date"
            aria-label="To date"
            min={fromDate || undefined}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </section>
      
      {error && (
        <div className="activity-log-error">
          <span>{error}</span>
          <button type="button" onClick={fetchActivities}>
            Retry
          </button>
        </div>
      )}

      {usersError && (
        <p className="activity-log-user-error">{usersError}</p>
      )}

      <section className="activity-log-list">
        {loading ? (
          <div className="activity-log-state">
            <RefreshCw
              className="activity-log-spin"
              size={25}
            />
            <p>Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="activity-log-state">
            <Activity size={30} />
            <h3>No activities found</h3>
            <p>Search or filters maatti nokku.</p>
          </div>
        ) : (
          filteredActivities.map((item, index) => {
            const action = getAction(item);
            const timestamp =
              item.created_at ||
              item.timestamp ||
              item.date ||
              item.created ||
              item.updated_at;

            return (
              <article
                className="activity-log-card"
                key={item.id ?? item.pk ?? `${timestamp}-${index}`}
              >
                <div className="activity-log-card-top">
                  <div className="activity-log-card-labels">
                    <span
                      className={`activity-action-badge ${action.toLowerCase()}`}
                    >
                      {action}
                    </span>

                    <strong className="activity-log-category">
                      {getCategory(item)}
                    </strong>
                  </div>

                  <time className="activity-log-time">
                    {formatDate(timestamp)}
                  </time>
                </div>

                <p className="activity-log-description">
                  {getDescription(item)}
                </p>

                <div className="activity-log-user">
                  <UserRound size={17} />
                  <span>{getUser(item)}</span>
                </div>
              </article>
            );
          })
        )}
      </section>

      {!loading && !error && (
        <p className="activity-log-count">
          Showing {filteredActivities.length} of {activities.length} activities
        </p>
      )}
    </main>
  );
}
