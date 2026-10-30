import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "../../utils/authenticatedFetch";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Phone,
  ShieldCheck,
  Store,
  UserRound,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  X,
  Save,
  RefreshCw,
} from "lucide-react";
import "./Users.css";

const USERS_API = "http://localhost:8000/api/users/users/";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  role: "SHOPKEEPER",
  is_active: true,
  password: "",
  confirmPassword: "",
};

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.users)) return data.users;
  return [];
};

const getName = (user) =>
  user?.name ||
  user?.full_name ||
  user?.username ||
  user?.first_name ||
  "Unnamed User";

const getPhone = (user) => user?.phone || user?.mobile || "";

const getRole = (user) =>
  String(user?.role || user?.user_type || "SHOPKEEPER").toUpperCase();

const isActive = (user) =>
  user?.is_active !== false &&
  user?.is_active !== 0 &&
  user?.status !== "inactive";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authenticatedFetch(USERS_API);

      if (!response.ok) {
        throw new Error(`Unable to load users. Status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(getList(data));
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const activeUsers = users.filter(isActive);
  const inactiveUsers = users.filter((user) => !isActive(user));
  const owners = users.filter((user) => getRole(user) === "OWNER");

  const shopkeepers = users.filter((user) =>
    ["SHOPKEEPER", "SHOP_KEEPER"].includes(getRole(user))
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      [
        getName(user),
        getPhone(user),
        getRole(user),
        user?.email || "",
      ].some((value) => String(value).toLowerCase().includes(query))
    );
  }, [users, search]);

  const openAddForm = () => {
    setEditingUser(null);
    setFormData({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setEditingUser(user);

    setFormData({
      ...emptyForm,
      name: getName(user) === "Unnamed User" ? "" : getName(user),
      phone: getPhone(user),
      email: user?.email || "",
      role: getRole(user),
      is_active: isActive(user),
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ ...emptyForm });
    setError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter the full name.");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Please enter the mobile number.");
      return;
    }

    if (!editingUser && formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (
      !editingUser &&
      formData.password !== formData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      role: formData.role,
      is_active: formData.is_active,
    };

    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    try {
      const url = editingUser
        ? `${USERS_API}${editingUser.id}/`
        : USERS_API;

      const response = await authenticatedFetch(url, {
        method: editingUser ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.detail ||
          Object.values(data || {}).flat().join(" ") ||
          "Unable to save user.";

        throw new Error(message);
      }

      closeForm();
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${getName(user)}?`)) return;

    try {
      const response = await authenticatedFetch(
        `${USERS_API}${user.id}/`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Unable to delete user.");
      }

      setUsers((previous) =>
        previous.filter((item) => item.id !== user.id)
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to delete user.");
    }
  };

  const stats = [
    {
      label: "All Members",
      count: users.length,
      type: "all",
      icon: UsersIcon,
    },
    {
      label: "Active",
      count: activeUsers.length,
      type: "active",
      icon: CheckCircle2,
    },
    {
      label: "Inactive",
      count: inactiveUsers.length,
      type: "inactive",
      icon: XCircle,
    },
    {
      label: "Owners",
      count: owners.length,
      type: "owners",
      icon: ShieldCheck,
    },
    {
      label: "Shopkeepers",
      count: shopkeepers.length,
      type: "shopkeepers",
      icon: Store,
    },
  ];

  return (
    <main className="users-page">
      {showForm ? (
        /* ADD / EDIT SHOPKEEPER FORM */
        <section className="shopkeeper-form-page">
          <header className="shopkeeper-form-header">
            <h1>{editingUser ? "Edit User" : "Add Shopkeeper"}</h1>
            <p>
              Create a new shopkeeper account for your rental shop.
            </p>
          </header>

          {error && (
            <div className="users-error">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Close error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="users-form shopkeeper-form"
          >
            <section className="users-details-panel shopkeeper-details-panel">
              <h2 className="users-details-title">User Details</h2>

              <div className="users-details-fields shopkeeper-details-fields">
                <label>
                  <span>
                    Full Name <b className="users-required">*</b>
                  </span>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Ravi Kumar"
                    autoComplete="name"
                    required
                  />
                </label>

                <label>
                  <span>
                    Mobile Number <b className="users-required">*</b>
                  </span>
                  <div className="users-phone-input">
                    <span>+91</span>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      required
                    />
                  </div>
                </label>

                <label>
                  <span>Email (optional)</span>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="shopkeeper@example.com"
                    autoComplete="email"
                  />
                </label>

                {!editingUser && (
                  <>
                    <label>
                      <span>
                        Password <b className="users-required">*</b>
                      </span>
                      <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 8 characters"
                        minLength={8}
                        autoComplete="new-password"
                        required
                      />
                    </label>

                    <label>
                      <span>
                        Confirm Password{" "}
                        <b className="users-required">*</b>
                      </span>
                      <input
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        minLength={8}
                        autoComplete="new-password"
                        required
                      />
                    </label>
                  </>
                )}

                {!editingUser && (
                  <p className="users-form-note">
                    The new user will be created with the Shopkeeper
                    role and can be promoted to Owner from the Users page.
                  </p>
                )}

                <div className="users-form-actions">
                  <button
                    type="button"
                    className="users-cancel-button"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    <X size={16} />
                    Cancel
                  </button>

                  <button
                      type="submit"
                      className="users-save-button"
                      disabled={saving}
                    >
                      {saving
                        ? "Creating..."
                        : editingUser
                          ? "Save Changes"
                          : "Create Shopkeeper"}
                    </button>
                </div>
              </div>
            </section>
          </form>
        </section>
      ) : (
        /* USERS LIST PAGE */
        <>
          <header className="users-page-header users-heading">
            <div>
              <h1>Users</h1>
              <p>
                {users.length}{" "}
                {users.length === 1 ? "team member" : "team members"}
              </p>
            </div>

            <button
              type="button"
              className="users-add-button"
              onClick={openAddForm}
            >
              <UserPlus size={18} />
              <span>Add Shopkeeper</span>
            </button>
          </header>

          {error && (
            <div className="users-error">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Close error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <section className="users-stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  className={`users-stat-card ${stat.type}`}
                  key={stat.label}
                >
                  <div className="users-stat-heading users-stat-top">
                    <span>{stat.label}</span>
                    <Icon size={18} />
                  </div>
                  <strong>{stat.count}</strong>
                </article>
              );
            })}
          </section>

          <section className="users-list-section users-members-section">
            <div className="users-list-heading users-members-heading">
              <div>
                <h2>Team Members</h2>
                <p>Manage your owners and shopkeepers</p>
              </div>

              <button
                type="button"
                className="users-refresh-button"
                onClick={fetchUsers}
                title="Refresh users"
              >
                <RefreshCw size={17} />
              </button>
            </div>

            <div className="users-search-box users-search-row">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search name, phone or role..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {loading ? (
              <div className="users-message">
                <RefreshCw
                  className="users-loading-icon"
                  size={24}
                />
                <p>Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="users-message">
                <UsersIcon size={30} />
                <h3>
                  {search ? "No matching users" : "No team members yet"}
                </h3>
                <p>
                  {search
                    ? "No users found for your search."
                    : "Click Add Shopkeeper to create a user."}
                </p>
              </div>
            ) : (
              <div className="users-list users-members-list">
                {filteredUsers.map((user) => {
                  const active = isActive(user);
                  const role = getRole(user);

                  return (
                    <article
                      className="users-member-card"
                      key={user.id}
                    >
                      <div className="users-member-avatar">
                        <UserRound size={23} />
                      </div>

                      <div className="users-member-info users-member-details">
                        <h3>{getName(user)}</h3>

                        <p className="users-member-phone">
                          <Phone size={14} />
                          {getPhone(user) || "No phone number"}
                        </p>

                        <span
                          className={`users-role-badge ${
                            role === "OWNER" ? "owner" : "shopkeeper"
                          }`}
                        >
                          {role === "SHOP_KEEPER" ? "Shopkeeper" : role}
                        </span>
                      </div>

                      <div className="users-member-actions users-member-right">
                        <span
                          className={`users-status-badge users-status ${
                            active ? "active" : "inactive"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </span>

                        <div className="users-action-buttons">
                          <button
                            type="button"
                            className="users-edit-button"
                            onClick={() => openEditForm(user)}
                            title="Edit user"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="users-delete-button"
                            onClick={() => handleDelete(user)}
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}