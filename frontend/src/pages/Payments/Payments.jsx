import { useEffect, useState } from "react";
import {
  CreditCard,
  Plus,
  Search,
  X,
  IndianRupee,
  Trash2,
  Banknote,
  Smartphone,
  Building2,
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  FileText,
  Wallet,
  Phone,
  Eye,
} from "lucide-react";

import "./Payments.css";

const PAYMENTS_API =
  "http://127.0.0.1:8000/api/finance/payments/";

const CUSTOMERS_API =
  "http://127.0.0.1:8000/api/customers/customers/";

const RENTALS_API =
  "http://127.0.0.1:8000/api/rentals/rentals/";

// =====================================================
// HELPERS
// =====================================================

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const getRelationId = (value) => {
  if (value && typeof value === "object") {
    return value.id;
  }

  return value;
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "-";

  // Avoid shifting date-only strings because of timezone.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));

  const date = dateOnly
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getMethodLabel = (method) => {
  const labels = {
    cash: "Cash",
    upi: "UPI",
    bank: "Bank Transfer",
    card: "Card",
  };

  return labels[String(method || "").toLowerCase()] ||
    method ||
    "Unknown";
};

// =====================================================
// PAYMENTS COMPONENT
// =====================================================

function Payments({ onBackToBills }) {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rentals, setRentals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Clicking a payment card opens this detail view.
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [formData, setFormData] = useState({
    customer: "",
    rental: "",
    amount: "",
    payment_method: "cash",
    notes: "",
  });

  // =====================================================
  // FETCH PAYMENTS, CUSTOMERS, RENTALS
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        paymentsResponse,
        customersResponse,
        rentalsResponse,
      ] = await Promise.all([
        fetch(PAYMENTS_API),
        fetch(CUSTOMERS_API),
        fetch(RENTALS_API),
      ]);

      const [
        paymentsData,
        customersData,
        rentalsData,
      ] = await Promise.all([
        paymentsResponse.json(),
        customersResponse.json(),
        rentalsResponse.json(),
      ]);

      if (!paymentsResponse.ok) {
        throw new Error(
          paymentsData?.detail ||
            "Payments load cheyyan kazhinjilla."
        );
      }

      if (!customersResponse.ok) {
        throw new Error(
          customersData?.detail ||
            "Customers load cheyyan kazhinjilla."
        );
      }

      if (!rentalsResponse.ok) {
        throw new Error(
          rentalsData?.detail ||
            "Rentals load cheyyan kazhinjilla."
        );
      }

      setPayments(getList(paymentsData));
      setCustomers(getList(customersData));
      setRentals(getList(rentalsData));
    } catch (err) {
      console.error("Payments fetch error:", err);

      setError(
        err.message || "Data load cheyyan kazhinjilla."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // FIND CUSTOMER AND RENTAL
  // =====================================================

  const getCustomer = (payment) => {
    if (payment?.customer && typeof payment.customer === "object") {
      return payment.customer;
    }

    const customerId = getRelationId(payment?.customer);

    return customers.find(
      (customer) =>
        String(customer.id) === String(customerId)
    );
  };

  const getCustomerName = (payment) => {
    return (
      payment?.customer_name ||
      getCustomer(payment)?.name ||
      "Customer"
    );
  };

  const getCustomerPhone = (payment) => {
    const customer = getCustomer(payment);

    return (
      payment?.customer_phone ||
      customer?.phone ||
      customer?.mobile ||
      customer?.mobile_number ||
      "-"
    );
  };

  const getRental = (payment) => {
    if (payment?.rental && typeof payment.rental === "object") {
      return payment.rental;
    }

    const rentalId = getRelationId(payment?.rental);

    return rentals.find(
      (rental) =>
        String(rental.id) === String(rentalId)
    );
  };

  const getPaymentsForRental = (rentalId) => {
    return payments.filter(
      (payment) =>
        String(getRelationId(payment.rental)) ===
        String(rentalId)
    );
  };

  // =====================================================
  // OPEN / CLOSE PAYMENT DETAILS
  // =====================================================

  const openPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setError("");
  };

  const closePaymentDetails = () => {
    setSelectedPayment(null);
    setError("");
  };

  // =====================================================
  // ADD PAYMENT MODAL
  // =====================================================

  const openModal = () => {
    setError("");

    setFormData({
      customer: "",
      rental: "",
      amount: "",
      payment_method: "cash",
      notes: "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "rental") {
      const selectedRental = rentals.find(
        (rental) => String(rental.id) === String(value)
      );

      if (selectedRental) {
        const rentalTotal = Number(
          selectedRental.total_amount || 0
        );

        const alreadyPaid = getPaymentsForRental(
          selectedRental.id
        ).reduce(
          (total, payment) =>
            total +
            Number(
              payment.amount ??
                payment.paid_amount ??
                payment.payment_amount ??
                0
            ),
          0
        );

        const remainingAmount = Math.max(
          rentalTotal - alreadyPaid,
          0
        );

        setFormData((previous) => ({
          ...previous,
          rental: value,
          amount:
            remainingAmount > 0
              ? remainingAmount.toFixed(2)
              : "",
        }));

        return;
      }
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE PAYMENT
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.customer) {
      setError("Please select a customer.");
      return;
    }

    if (!formData.rental) {
      setError("Please select a rental.");
      return;
    }

    if (
      !formData.amount ||
      !Number.isFinite(Number(formData.amount)) ||
      Number(formData.amount) <= 0
    ) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customer: Number(formData.customer),
        rental: Number(formData.rental),
        amount: Number(formData.amount),
        payment_method: formData.payment_method,
        notes: formData.notes.trim(),
      };

      const response = await fetch(PAYMENTS_API, {
        method: "POST",
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
          "Payment create cheyyan kazhinjilla.";

        throw new Error(message);
      }

      setPayments((previous) => [data, ...previous]);
      setShowModal(false);

      setFormData({
        customer: "",
        rental: "",
        amount: "",
        payment_method: "cash",
        notes: "",
      });
    } catch (err) {
      console.error("Payment create error:", err);

      setError(
        err.message || "Payment create cheyyan kazhinjilla."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE PAYMENT
  // =====================================================

  const handleDelete = async (payment) => {
    const confirmed = window.confirm(
      `Delete payment of ₹${formatMoney(payment.amount)}?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${PAYMENTS_API}${payment.id}/`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data?.detail ||
            "Payment delete cheyyan kazhinjilla."
        );
      }

      setPayments((previous) =>
        previous.filter(
          (item) => String(item.id) !== String(payment.id)
        )
      );

      setSelectedPayment((previous) =>
        previous &&
        String(previous.id) === String(payment.id)
          ? null
          : previous
      );
    } catch (err) {
      console.error("Delete payment error:", err);

      setError(
        err.message || "Payment delete cheyyan kazhinjilla."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // FILTER PAYMENTS
  // =====================================================

  const filteredPayments = payments.filter((payment) => {
    const value = search.trim().toLowerCase();

    const customerName =
      getCustomerName(payment).toLowerCase();

    const phone =
      String(getCustomerPhone(payment)).toLowerCase();

    const method =
      String(payment.payment_method || "").toLowerCase();

    const notes =
      String(payment.notes || "").toLowerCase();

    const rental = getRental(payment);

    const rentalText = rental
      ? `#${rental.id} ${rental.site_name || ""}`.toLowerCase()
      : "";

    const matchesSearch =
      !value ||
      customerName.includes(value) ||
      phone.includes(value) ||
      method.includes(value) ||
      notes.includes(value) ||
      rentalText.includes(value) ||
      String(payment.id).includes(value);

    const matchesMethod =
      methodFilter === "all" ||
      String(payment.payment_method || "").toLowerCase() ===
        methodFilter;

    return matchesSearch && matchesMethod;
  });

  // =====================================================
  // SUMMARY VALUES
  // =====================================================

  const totalCollection = payments.reduce(
    (total, payment) =>
      total +
      Number(
        payment.amount ??
          payment.paid_amount ??
          payment.payment_amount ??
          0
      ),
    0
  );

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const todayCollection = payments.reduce(
    (total, payment) => {
      if (String(payment.payment_date || "").startsWith(todayString)) {
        return (
          total +
          Number(
            payment.amount ??
              payment.paid_amount ??
              payment.payment_amount ??
              0
          )
        );
      }

      return total;
    },
    0
  );

  const methodCounts = {
    all: payments.length,

    cash: payments.filter(
      (payment) =>
        String(payment.payment_method || "").toLowerCase() === "cash"
    ).length,

    upi: payments.filter(
      (payment) =>
        String(payment.payment_method || "").toLowerCase() === "upi"
    ).length,

    bank: payments.filter(
      (payment) =>
        String(payment.payment_method || "").toLowerCase() === "bank"
    ).length,

    card: payments.filter(
      (payment) =>
        String(payment.payment_method || "").toLowerCase() === "card"
    ).length,
  };

  
  // =====================================================
  // PAYMENT CLICK - BILL NOT FOUND SCREEN
  // =====================================================

  
if (selectedPayment) {
  return (
    <section className="bill-not-found-page">
      <div className="bill-not-found-content">
        <h2>Bill not found.</h2>

        <button
          type="button"
          className="bill-not-found-back"
          onClick={() => {
            setSelectedPayment(null);

            if (onBackToBills) {
              onBackToBills();
            }
          }}
        >
          <span aria-hidden="true">←</span> Back to Bills
        </button>
      </div>
    </section>
  );
}


    
  

  // =====================================================
  // PAYMENTS LIST PAGE
  // =====================================================

  return (
    <div className="payments-page">
      {/* HEADER */}

      <div className="payments-header">
        <div>
          <h1>Payments</h1>
          <p>{payments.length} payment records</p>
        </div>

        <button
          type="button"
          className="payments-add-button"
          onClick={openModal}
        >
          <Plus size={18} />
          Add Payment
        </button>
      </div>

      {/* ERROR */}

      {error && !showModal && (
        <div className="payments-error">
          {error}

          <button
            type="button"
            onClick={fetchData}
          >
            Retry
          </button>
        </div>
      )}

      {/* PAYMENT METHOD CARDS */}

      <div className="payment-method-grid">
        <button
          type="button"
          className={`payment-method-card ${
            methodFilter === "all" ? "active" : ""
          }`}
          onClick={() => setMethodFilter("all")}
        >
          <div className="payment-method-icon all-icon">
            <CreditCard size={20} />
          </div>

          <span>All Payments</span>
          <strong>{methodCounts.all}</strong>
        </button>

        <button
          type="button"
          className={`payment-method-card ${
            methodFilter === "cash" ? "active" : ""
          }`}
          onClick={() => setMethodFilter("cash")}
        >
          <div className="payment-method-icon cash-icon">
            <Banknote size={20} />
          </div>

          <span>Cash</span>
          <strong>{methodCounts.cash}</strong>
        </button>

        <button
          type="button"
          className={`payment-method-card ${
            methodFilter === "upi" ? "active" : ""
          }`}
          onClick={() => setMethodFilter("upi")}
        >
          <div className="payment-method-icon upi-icon">
            <Smartphone size={20} />
          </div>

          <span>UPI</span>
          <strong>{methodCounts.upi}</strong>
        </button>

        <button
          type="button"
          className={`payment-method-card ${
            methodFilter === "bank" ? "active" : ""
          }`}
          onClick={() => setMethodFilter("bank")}
        >
          <div className="payment-method-icon bank-icon">
            <Building2 size={20} />
          </div>

          <span>Bank Transfer</span>
          <strong>{methodCounts.bank}</strong>
        </button>

        <button
          type="button"
          className={`payment-method-card ${
            methodFilter === "card" ? "active" : ""
          }`}
          onClick={() => setMethodFilter("card")}
        >
          <div className="payment-method-icon card-icon">
            <CreditCard size={20} />
          </div>

          <span>Card</span>
          <strong>{methodCounts.card}</strong>
        </button>
      </div>

      {/* COLLECTION SUMMARY */}

      <div className="payments-summary">
        <div>
          <span>Total Collection</span>
          <strong>₹{formatMoney(totalCollection)}</strong>
        </div>

        <div>
          <span>Today's Collection</span>
          <strong>₹{formatMoney(todayCollection)}</strong>
        </div>

        <div>
          <span>Showing</span>
          <strong>{filteredPayments.length}</strong>
        </div>
      </div>

      {/* SEARCH */}

      <div className="payments-toolbar">
        <div className="payments-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search customer, phone, payment..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <span>{filteredPayments.length} payments</span>
      </div>

      {/* PAYMENT LIST */}

      {loading ? (
        <div className="payments-empty">
          Loading payments...
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="payments-empty">
          <CreditCard size={42} />

          <h3>No payments found</h3>

          <p>
            Payments save cheythaal ivide kaanikkum.
          </p>
        </div>
      ) : (
        <div className="payments-list">
          {filteredPayments.map((payment) => {
            const customerName = getCustomerName(payment);
            const customerPhone = getCustomerPhone(payment);
            const rental = getRental(payment);
            const method = String(
              payment.payment_method || "cash"
            ).toLowerCase();

            return (
              <div
                  className="payment-card"
                  key={payment.id}
                  onClick={() => openPaymentDetails(payment)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openPaymentDetails(payment);
                    }
                  }}
                >
                {/* CUSTOMER */}

                <div className="payment-customer">
                  <div className="payment-avatar">
                    {customerName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{customerName}</h3>

                    <p>
                      {customerPhone !== "-" ? (
                        <>
                          <Phone size={12} />
                          {customerPhone}
                        </>
                      ) : (
                        "Customer"
                      )}
                    </p>
                  </div>
                </div>

                {/* AMOUNT */}

                <div className="payment-card-amount">
                  <span>Amount</span>

                  <strong>
                    ₹
                    {formatMoney(
                      payment.amount ??
                        payment.paid_amount ??
                        payment.payment_amount ??
                        0
                    )}
                  </strong>
                </div>

                {/* PAYMENT DATE, METHOD, RENTAL */}

                <div className="payment-card-details">
                  <span>{formatDate(payment.payment_date)}</span>

                  <span>•</span>

                  <span className={`payment-method-badge ${method}`}>
                    {getMethodLabel(method)}
                  </span>

                  <span>•</span>

                  <span>
                    {rental
                      ? `#${rental.id}`
                      : `Rental #${getRelationId(payment.rental) || "-"}`}
                  </span>
                </div>

                {/* FOOTER */}

                <div className="payment-card-bottom">
                  <div>
                    <span>
                      {rental?.site_name ||
                        `Payment #${payment.id}`}
                    </span>

                    {payment.notes && (
                      <small>{payment.notes}</small>
                    )}
                  </div>

                  <div className="payment-card-actions">
                    

                    <button
                      type="button"
                      className="payment-delete-button"
                      title="Delete payment"
                      aria-label="Delete payment"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(payment);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD PAYMENT MODAL */}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="modal-header">
              <div>
                <h2>Add Payment</h2>
                <p>Record a payment from a customer</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="modal-form"
            >
              <div className="form-group">
                <label>Customer</label>

                <select
                  name="customer"
                  value={formData.customer}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select customer</option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Rental</label>

                <select
                  name="rental"
                  value={formData.rental}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select rental</option>

                  {rentals
                    .filter((rental) => {
                      if (!formData.customer) return true;

                      return (
                        String(getRelationId(rental.customer)) ===
                        String(formData.customer)
                      );
                    })
                    .map((rental) => (
                      <option
                        key={rental.id}
                        value={rental.id}
                      >
                        #{rental.id} -{" "}
                        {rental.site_name || "Rental"} -{" "}
                        {rental.customer_name || "Customer"}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Payment Amount</label>

                <div className="input-with-icon">
                  <IndianRupee size={17} />

                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Payment Method</label>

                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>

                <textarea
                  name="notes"
                  rows="3"
                  placeholder="Optional notes..."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;