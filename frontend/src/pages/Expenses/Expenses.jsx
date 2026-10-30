import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  IndianRupee,
  Receipt,
  WalletCards,
  Smartphone,
  Landmark,
  CreditCard,
  CalendarDays,
} from "lucide-react";

import "./Expenses.css";

const EXPENSES_API =
  "http://127.0.0.1:8000/api/finance/expenses/";

// Get today's date in local timezone.
const getTodayDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const emptyForm = {
  category: "",
  title: "",
  amount: "",
  expense_date: getTodayDate(),
  payment_method: "Cash",
  description: "",
};

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (date) => {
  if (!date) return "-";

  // Avoid timezone shifts for date-only values.
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date))
    ? new Date(`${date}T12:00:00`)
    : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH EXPENSES
  // =====================================================

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(EXPENSES_API);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to fetch expenses."
        );
      }

      setExpenses(getList(data));
    } catch (err) {
      console.error("Fetch expenses error:", err);

      setError(
        err.message || "Unable to load expenses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // =====================================================
  // PAYMENT METHOD HELPER
  // =====================================================

  const getPaymentMethod = (expense) =>
    String(
      expense.payment_method ||
        expense.method ||
        "Cash"
    );

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredExpenses = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return expenses;

    return expenses.filter((expense) => {
      return (
        String(expense.title || "")
          .toLowerCase()
          .includes(keyword) ||
        String(expense.category || "")
          .toLowerCase()
          .includes(keyword) ||
        String(expense.description || "")
          .toLowerCase()
          .includes(keyword) ||
        getPaymentMethod(expense)
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [expenses, search]);

  // =====================================================
  // TOTAL EXPENSES
  // =====================================================

  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0
    );
  }, [expenses]);

  // =====================================================
  // MONTHLY EXPENSES
  // =====================================================

  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    return expenses.reduce((total, expense) => {
      if (
        String(expense.expense_date || "").startsWith(
          thisMonth
        )
      ) {
        return total + Number(expense.amount || 0);
      }

      return total;
    }, 0);
  }, [expenses]);

  // =====================================================
  // TODAY'S EXPENSES
  // =====================================================

  const todayExpenses = useMemo(() => {
    const today = getTodayDate();

    return expenses.reduce((total, expense) => {
      if (
        String(expense.expense_date || "").startsWith(today)
      ) {
        return total + Number(expense.amount || 0);
      }

      return total;
    }, 0);
  }, [expenses]);

  // =====================================================
  // PAYMENT METHOD COUNTS
  // =====================================================

  const cashCount = expenses.filter(
    (expense) =>
      getPaymentMethod(expense).toLowerCase() === "cash"
  ).length;

  const upiCount = expenses.filter(
    (expense) =>
      getPaymentMethod(expense).toLowerCase() === "upi"
  ).length;

  const bankCount = expenses.filter((expense) => {
    const method = getPaymentMethod(expense).toLowerCase();

    return method === "bank" || method === "bank transfer";
  }).length;

  const cardCount = expenses.filter(
    (expense) =>
      getPaymentMethod(expense).toLowerCase() === "card"
  ).length;

  // =====================================================
  // OPEN ADD EXPENSE FORM
  // =====================================================

  const openAddModal = () => {
    setEditingExpense(null);

    setFormData({
      ...emptyForm,
      expense_date: getTodayDate(),
    });

    setError("");
    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT EXPENSE FORM
  // =====================================================

  const openEditModal = (expense) => {
    setEditingExpense(expense);

    setFormData({
      category: expense.category || "",
      title: expense.title || "",
      amount: expense.amount ?? "",
      expense_date:
        expense.expense_date || getTodayDate(),
      payment_method:
        expense.payment_method ||
        expense.method ||
        "Cash",
      description: expense.description || "",
    });

    setError("");
    setShowModal(true);
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      ...emptyForm,
      expense_date: getTodayDate(),
    });
    setError("");
  };

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE / UPDATE EXPENSE
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.category.trim()) {
      setError("Please select an expense category.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Expense title is required.");
      return;
    }

    const amount = Number(formData.amount);

    if (
      formData.amount === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    if (!formData.expense_date) {
      setError("Expense date is required.");
      return;
    }

    if (!formData.payment_method) {
      setError("Please select a payment method.");
      return;
    }

    try {
      setSaving(true);

      const url = editingExpense
        ? `${EXPENSES_API}${editingExpense.id}/`
        : EXPENSES_API;

      const method = editingExpense ? "PUT" : "POST";

      const payload = {
        category: formData.category.trim(),
        title: formData.title.trim(),
        amount,
        expense_date: formData.expense_date,
        payment_method: formData.payment_method,
        description: formData.description.trim(),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.detail ||
          Object.values(data || {})
            .flat()
            .join(" ") ||
          "Unable to save expense.";

        throw new Error(message);
      }

      // Close directly after a successful save.
      // Calling closeModal here would be blocked while saving.
      setShowModal(false);
      setEditingExpense(null);
      setFormData({
        ...emptyForm,
        expense_date: getTodayDate(),
      });
      setError("");

      await fetchExpenses();
    } catch (err) {
      console.error("Save expense error:", err);

      setError(
        err.message || "Unable to save expense."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE EXPENSE
  // =====================================================

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(
      `Delete "${expense.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `${EXPENSES_API}${expense.id}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data?.detail || "Unable to delete expense."
        );
      }

      await fetchExpenses();
    } catch (err) {
      console.error("Delete expense error:", err);

      setError(
        err.message || "Unable to delete expense."
      );
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="page expenses-page">
      {/* HEADER */}

      <div className="expense-page-header">
        <div>
          <h1>Expenses</h1>

          <p>
            {filteredExpenses.length} expenses
            <span> • </span>
            Total: ₹{formatMoney(totalExpenses)}
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          <Plus size={17} />
          Add Expense
        </button>
      </div>

      {/* ERROR */}

      {error && !showModal && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="stats-grid">
        <div className="stat-card expense-method-card active">
          <div className="expense-stat-icon">
            <Receipt size={19} />
          </div>

          <div>
            <span>All Expenses</span>
            <strong>{expenses.length}</strong>
            <small>₹{formatMoney(totalExpenses)}</small>
          </div>
        </div>

        <div className="stat-card expense-method-card">
          <div className="expense-stat-icon">
            <WalletCards size={19} />
          </div>

          <div>
            <span>Cash</span>
            <strong>{cashCount}</strong>
          </div>
        </div>

        <div className="stat-card expense-method-card">
          <div className="expense-stat-icon">
            <Smartphone size={19} />
          </div>

          <div>
            <span>UPI</span>
            <strong>{upiCount}</strong>
          </div>
        </div>

        <div className="stat-card expense-method-card">
          <div className="expense-stat-icon">
            <Landmark size={19} />
          </div>

          <div>
            <span>Bank Transfer</span>
            <strong>{bankCount}</strong>
          </div>
        </div>

        <div className="stat-card expense-method-card">
          <div className="expense-stat-icon">
            <CreditCard size={19} />
          </div>

          <div>
            <span>Card</span>
            <strong>{cardCount}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH */}

      <div className="content-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <span className="result-count">
          {filteredExpenses.length} expenses
        </span>
      </div>

      {/* EXPENSE HISTORY */}

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Expense History</h2>
            <p>Recent business expenses</p>
          </div>

          <div className="expense-history-summary">
            <span>This Month</span>
            <strong>₹{formatMoney(monthlyExpenses)}</strong>
            <span>Today: ₹{formatMoney(todayExpenses)}</span>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading expenses...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <Receipt size={40} />

            <h3>
              {expenses.length === 0
                ? "No expenses yet"
                : "No expenses found"}
            </h3>

            <p>
              Track your shop expenses here.
            </p>

            <button
              type="button"
              className="primary-button empty-add-expense-btn"
              onClick={openAddModal}
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>
        ) : (
          <div className="expense-responsive-list">
            {/* Desktop table */}
            <div className="table-wrapper expense-desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Notes</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">
                            <Receipt size={15} />
                          </div>
                          <span>{expense.title}</span>
                        </div>
                      </td>

                      <td>{expense.category || "—"}</td>

                      <td>
                        <strong className="payment-amount">
                          ₹{formatMoney(expense.amount)}
                        </strong>
                      </td>

                      <td>{formatDate(expense.expense_date)}</td>
                      <td>{getPaymentMethod(expense)}</td>
                      <td>{expense.description || "—"}</td>

                      <td>
                        <div className="customer-card-actions">
                          <button
                            type="button"
                            className="customer-action edit"
                            title="Edit"
                            aria-label={`Edit ${expense.title}`}
                            onClick={() => openEditModal(expense)}
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            className="customer-action delete"
                            title="Delete"
                            aria-label={`Delete ${expense.title}`}
                            onClick={() => handleDelete(expense)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile expense cards */}
            <div className="expense-mobile-list">
              {filteredExpenses.map((expense) => (
                <article className="expense-mobile-card" key={expense.id}>
                  <div className="expense-mobile-card-top">
                    <div className="expense-mobile-title">
                      <div className="customer-avatar">
                        <Receipt size={15} />
                      </div>

                      <div className="expense-mobile-title-text">
                        <h3>{expense.title}</h3>
                        <span>{expense.category || "Uncategorized"}</span>
                      </div>
                    </div>

                    <strong className="expense-mobile-amount">
                      ₹{formatMoney(expense.amount)}
                    </strong>
                  </div>

                  <div className="expense-mobile-details">
                    <div>
                      <span>Date</span>
                      <strong>{formatDate(expense.expense_date)}</strong>
                    </div>

                    <div>
                      <span>Payment</span>
                      <strong>{getPaymentMethod(expense)}</strong>
                    </div>
                  </div>

                  {expense.description && (
                    <div className="expense-mobile-notes">
                      <span>Notes</span>
                      <p>{expense.description}</p>
                    </div>
                  )}

                  <div className="expense-mobile-actions">
                    <button
                      type="button"
                      className="customer-action edit"
                      onClick={() => openEditModal(expense)}
                      aria-label={`Edit ${expense.title}`}
                    >
                      <Pencil size={15} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="customer-action delete"
                      onClick={() => handleDelete(expense)}
                      aria-label={`Delete ${expense.title}`}
                    >
                      <Trash2 size={15} />
                      <span>Delete</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT EXPENSE FORM */}

      {showModal && (
        <div
          className="expense-form-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="expense-form-page"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-form-title"
          >
            {/* FORM HEADER */}

            <div className="expense-form-header">
              <div>
                <h1 id="expense-form-title">
                  {editingExpense
                    ? "Edit Expense"
                    : "Add Expense"}
                </h1>

                <p>Record a new shop expense</p>
              </div>

              <button
                type="button"
                className="expense-form-close"
                aria-label="Close expense form"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={22} />
              </button>
            </div>

            {/* FORM BODY */}

            <form
              className="expense-form-content"
              onSubmit={handleSubmit}
            >
              <h2>Expense Details</h2>

              {/* CATEGORY */}

              <div className="expense-form-field">
                <label htmlFor="expense-category">
                  Category <span>*</span>
                </label>

                <select
                  id="expense-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Search or select category
                  </option>
                  <option value="Electricity">Electricity</option>
                  <option value="Transport">Transport</option>
                  <option value="Rent">Rent</option>
                  <option value="Salary">Salary</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Repairs">Repairs</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Phone / Internet">
                    Phone / Internet
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* TITLE */}

              <div className="expense-form-field">
                <label htmlFor="expense-title">
                  Title <span>*</span>
                </label>

                <input
                  id="expense-title"
                  type="text"
                  name="title"
                  placeholder="e.g. Electricity bill"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* AMOUNT + DATE */}

              <div className="expense-form-two-columns">
                <div className="expense-form-field">
                  <label htmlFor="expense-amount">
                    Amount (₹) <span>*</span>
                  </label>

                  <div className="expense-form-input-icon">
                    <IndianRupee size={18} />

                    <input
                      id="expense-amount"
                      type="number"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      placeholder="0"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="expense-form-field">
                  <label htmlFor="expense-date">
                    Date <span>*</span>
                  </label>

                  <div className="expense-form-input-icon expense-date-input">
                    <CalendarDays size={18} />

                    <input
                      id="expense-date"
                      type="date"
                      name="expense_date"
                      value={formData.expense_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD */}

              <div className="expense-form-field">
                <label htmlFor="expense-payment-method">
                  Payment Method <span>*</span>
                </label>

                <select
                  id="expense-payment-method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">
                    Bank Transfer
                  </option>
                  <option value="Card">Card</option>
                </select>
              </div>

              {/* NOTES */}

              <div className="expense-form-field">
                <label htmlFor="expense-description">
                  Notes (optional)
                </label>

                <textarea
                  id="expense-description"
                  name="description"
                  rows={4}
                  placeholder="Any additional details..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* ERROR */}

              {error && (
                <div className="expense-form-error">
                  {error}
                </div>
              )}

              {/* FOOTER BUTTONS */}

              <div className="expense-form-actions">
                <button
                  type="button"
                  className="expense-form-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="expense-form-save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingExpense
                    ? "Save Changes"
                    : "Save Expense"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default Expenses;