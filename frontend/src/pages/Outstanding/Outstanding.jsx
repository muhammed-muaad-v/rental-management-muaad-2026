import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Search,
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  Phone,
  Mail,
  MapPin,
  SlidersHorizontal,
  CalendarDays,
} from "lucide-react";

import "./Outstanding.css";

const RENTALS_API =
  "http://127.0.0.1:8000/api/rentals/rentals/";

const PAYMENTS_API =
  "http://127.0.0.1:8000/api/finance/payments/";

const CUSTOMERS_API =
  "http://127.0.0.1:8000/api/customers/customers/";

// =====================================================
// HELPERS
// =====================================================

const getList = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const getRelationId = (value) => {
  if (value && typeof value === "object") {
    return value.id ?? value.pk ?? null;
  }

  return value ?? null;
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return "—";

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(
    String(date)
  );

  const parsedDate = dateOnly
    ? new Date(`${date}T12:00:00`)
    : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name) => {
  return String(name || "Customer")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

// =====================================================
// OUTSTANDING COMPONENT
// =====================================================

const Outstanding = () => {
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Customer ledger page
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  // Edit customer page
  const [isEditingCustomer, setIsEditingCustomer] =
    useState(false);

  const [editTargetCustomer, setEditTargetCustomer] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Add More Details
  const [showMoreDetails, setShowMoreDetails] =
    useState(false);

  const [reference, setReference] = useState("");

  const [isActive, setIsActive] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        rentalsResponse,
        paymentsResponse,
        customersResponse,
      ] = await Promise.all([
        fetch(RENTALS_API),
        fetch(PAYMENTS_API),
        fetch(CUSTOMERS_API),
      ]);

      const [
        rentalsData,
        paymentsData,
        customersData,
      ] = await Promise.all([
        rentalsResponse.json(),
        paymentsResponse.json(),
        customersResponse.json(),
      ]);

      if (!rentalsResponse.ok) {
        throw new Error(
          "Rentals load cheyyan kazhinjilla."
        );
      }

      if (!paymentsResponse.ok) {
        throw new Error(
          "Payments load cheyyan kazhinjilla."
        );
      }

      if (!customersResponse.ok) {
        throw new Error(
          "Customers load cheyyan kazhinjilla."
        );
      }

      setRentals(getList(rentalsData));
      setPayments(getList(paymentsData));
      setCustomers(getList(customersData));
    } catch (err) {
      console.error("Outstanding fetch error:", err);

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
  // PAYMENT HELPERS
  // =====================================================

  const getPaymentRentalId = (payment) => {
    return (
      getRelationId(payment.rental) ??
      payment.rental_id ??
      null
    );
  };

  const getPaymentAmount = (payment) => {
    return Number(
      payment.amount ??
        payment.paid_amount ??
        payment.payment_amount ??
        0
    );
  };

  const getPaymentDate = (payment) => {
    return (
      payment.payment_date ||
      payment.date ||
      payment.created_at ||
      payment.created ||
      null
    );
  };

  // =====================================================
  // CUSTOMER HELPERS
  // =====================================================

  const getRentalCustomerId = (rental) => {
    return (
      getRelationId(rental.customer) ??
      rental.customer_id ??
      null
    );
  };

  const getCustomerName = (rental) => {
    if (
      rental.customer &&
      typeof rental.customer === "object"
    ) {
      return (
        rental.customer.name ||
        rental.customer.customer_name ||
        rental.customer.full_name ||
        rental.customer_name ||
        "Unknown Customer"
      );
    }

    return rental.customer_name || "Unknown Customer";
  };

  const getCustomerKey = (rental) => {
    const customerId = getRentalCustomerId(rental);

    if (
      customerId !== null &&
      customerId !== undefined
    ) {
      return `customer-${customerId}`;
    }

    return `name-${getCustomerName(rental)
      .trim()
      .toLowerCase()}`;
  };

  const findCustomerRecord = (customer) => {
    if (!customer) return null;

    const customerId =
      customer.customerId ??
      getRelationId(customer.customer);

    if (
      customerId !== null &&
      customerId !== undefined
    ) {
      const match = customers.find(
        (item) =>
          String(item.id) === String(customerId)
      );

      if (match) return match;
    }

    const name = String(
      customer.customerName ||
        customer.name ||
        ""
    )
      .trim()
      .toLowerCase();

    return (
      customers.find(
        (item) =>
          String(item.name || "")
            .trim()
            .toLowerCase() === name
      ) || null
    );
  };

  // =====================================================
  // CALCULATE OUTSTANDING PER RENTAL
  // =====================================================

  const outstandingData = useMemo(() => {
    return rentals
      .map((rental) => {
        const rentalPayments = payments.filter(
          (payment) =>
            String(getPaymentRentalId(payment)) ===
            String(rental.id)
        );

        const paidAmount = rentalPayments.reduce(
          (total, payment) =>
            total + getPaymentAmount(payment),
          0
        );

        const totalAmount = Number(
          rental.total_amount ??
            rental.total ??
            rental.amount ??
            rental.grand_total ??
            0
        );

        const balance = Math.max(
          totalAmount - paidAmount,
          0
        );

        const customerId =
          getRentalCustomerId(rental);

        return {
          ...rental,
          customerId,
          customerName: getCustomerName(rental),
          customerKey: getCustomerKey(rental),
          paidAmount,
          balance,
          rentalPayments,
        };
      })
      .filter((rental) => rental.balance > 0);
  }, [rentals, payments]);

  // =====================================================
  // GROUP BY CUSTOMER
  // =====================================================

  const outstandingCustomers = useMemo(() => {
    const grouped = {};

    outstandingData.forEach((rental) => {
      const key = rental.customerKey;

      if (!grouped[key]) {
        grouped[key] = {
          customerKey: key,
          customerId: rental.customerId,
          customerName: rental.customerName,
          totalOutstanding: 0,
          billsCount: 0,
          rentals: [],
          lastPaymentDate: null,
        };
      }

      grouped[key].totalOutstanding += rental.balance;
      grouped[key].billsCount += 1;
      grouped[key].rentals.push(rental);

      // Keep the customer ID from any linked rental.
      if (
        !grouped[key].customerId &&
        rental.customerId
      ) {
        grouped[key].customerId = rental.customerId;
      }

      rental.rentalPayments.forEach((payment) => {
        const paymentDate = getPaymentDate(payment);

        if (!paymentDate) return;

        const parsed = new Date(paymentDate);

        if (Number.isNaN(parsed.getTime())) return;

        const existingDate = grouped[key].lastPaymentDate
          ? new Date(grouped[key].lastPaymentDate)
          : null;

        if (
          !existingDate ||
          parsed.getTime() > existingDate.getTime()
        ) {
          grouped[key].lastPaymentDate = paymentDate;
        }
      });
    });

    return Object.values(grouped).sort(
      (a, b) =>
        b.totalOutstanding - a.totalOutstanding
    );
  }, [outstandingData]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return outstandingCustomers;
    }

    return outstandingCustomers.filter((customer) => {
      return (
        customer.customerName
          .toLowerCase()
          .includes(keyword) ||
        customer.rentals.some((rental) =>
          String(rental.site_name || "")
            .toLowerCase()
            .includes(keyword)
        )
      );
    });
  }, [outstandingCustomers, search]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalOutstanding = outstandingCustomers.reduce(
    (total, customer) =>
      total + customer.totalOutstanding,
    0
  );

  const customersWithDue = outstandingCustomers.length;

  const tenKAndAbove = outstandingCustomers.filter(
    (customer) => customer.totalOutstanding >= 10000
  ).length;

  const belowTenK = outstandingCustomers.filter(
    (customer) => customer.totalOutstanding < 10000
  ).length;

  // =====================================================
  // OPEN CUSTOMER LEDGER
  // =====================================================

  const openCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsEditingCustomer(false);
    setEditTargetCustomer(null);
    setEditError("");
  };

  const closeCustomerDetails = () => {
    setSelectedCustomer(null);
    setIsEditingCustomer(false);
    setEditTargetCustomer(null);
    setEditError("");
  };

  // =====================================================
  // OPEN EDIT CUSTOMER PAGE
  // =====================================================

  const openEditCustomer = () => {
    const customerRecord =
      findCustomerRecord(selectedCustomer);

    if (!customerRecord) {
      setEditError(
        "Ee customer-inde record kandethaan kazhinjilla. Customer ID API data-il undennu check cheyyuka."
      );
      return;
    }

    setEditTargetCustomer(customerRecord);

    setFormData({
      name: customerRecord.name || "",
      phone: customerRecord.phone || "",
      email: customerRecord.email || "",
      address: customerRecord.address || "",
      notes: customerRecord.notes || "",
    });

    setReference(
      customerRecord.reference ||
        customerRecord.id_reference ||
        customerRecord.reference_number ||
        ""
    );

    setIsActive(customerRecord.is_active !== false);

    // First show only name and phone.
    setShowMoreDetails(false);
    setEditError("");
    setIsEditingCustomer(true);
  };

  // =====================================================
  // CLOSE EDIT CUSTOMER PAGE
  // =====================================================

  const closeEditCustomer = () => {
    if (saving) return;

    setIsEditingCustomer(false);
    setEditTargetCustomer(null);
    setShowMoreDetails(false);
    setEditError("");
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE CUSTOMER CHANGES
  // =====================================================

  const handleSaveCustomer = async (event) => {
    event.preventDefault();
    setEditError("");

    if (!editTargetCustomer?.id) {
      setEditError(
        "Customer ID kandethaan kazhinjilla."
      );
      return;
    }

    if (!formData.name.trim()) {
      setEditError("Full name is required.");
      return;
    }

    if (!formData.phone.trim()) {
      setEditError("Mobile number is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim(),
        is_active: isActive,
        reference: reference.trim(),
      };

      const response = await fetch(
        `${CUSTOMERS_API}${editTargetCustomer.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.detail ||
          Object.values(data || {})
            .flat()
            .join(" ") ||
          "Customer update cheyyan kazhinjilla.";

        throw new Error(message);
      }

      const updatedCustomer = {
        ...editTargetCustomer,
        ...data,
        name: data.name ?? payload.name,
        phone: data.phone ?? payload.phone,
        email: data.email ?? payload.email,
        address: data.address ?? payload.address,
        notes: data.notes ?? payload.notes,
        is_active: data.is_active ?? payload.is_active,
      };

      setCustomers((previous) =>
        previous.map((item) =>
          String(item.id) ===
          String(updatedCustomer.id)
            ? updatedCustomer
            : item
        )
      );

      setSelectedCustomer((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          customerName: updatedCustomer.name,
          customerId: updatedCustomer.id,
          customer: updatedCustomer,
        };
      });

      setIsEditingCustomer(false);
      setEditTargetCustomer(null);
      setShowMoreDetails(false);
      setEditError("");

      // Refresh the latest outstanding values.
      await fetchData();
    } catch (err) {
      console.error("Update customer error:", err);

      setEditError(
        err.message || "Customer update cheyyan kazhinjilla."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE CUSTOMER
  // =====================================================

  const handleDeleteCustomer = async () => {
    const customerRecord =
      findCustomerRecord(selectedCustomer);

    if (!customerRecord?.id) {
      setEditError(
        "Customer record kandethaan kazhinjilla."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete ${customerRecord.name || "this customer"}?`
    );

    if (!confirmed) return;

    try {
      setEditError("");

      const response = await fetch(
        `${CUSTOMERS_API}${customerRecord.id}/`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data?.detail ||
            "Customer delete cheyyan kazhinjilla."
        );
      }

      setSelectedCustomer(null);
      setIsEditingCustomer(false);

      await fetchData();
    } catch (err) {
      console.error("Delete customer error:", err);

      setEditError(
        err.message || "Customer delete cheyyan kazhinjilla."
      );
    }
  };

  // =====================================================
  // EDIT CUSTOMER SCREEN
  // =====================================================

  if (isEditingCustomer && editTargetCustomer) {
    return (
      <section className="outstanding-edit-page">
        <div className="outstanding-edit-breadcrumb">
          <button
            type="button"
            onClick={closeEditCustomer}
            disabled={saving}
            aria-label="Back to customer ledger"
          >
            <ArrowLeft size={18} />
          </button>

          <span>Customer</span>
          <span className="outstanding-edit-slash">/</span>
          <strong>Edit Customer</strong>
        </div>

        <div className="outstanding-edit-card">
          <div className="outstanding-edit-title">
            <h1>Edit Customer</h1>
          </div>

          {editError && (
            <div className="outstanding-edit-error">
              {editError}
            </div>
          )}

          <form
            className="outstanding-edit-form"
            onSubmit={handleSaveCustomer}
          >
            {/* FULL NAME */}

            <div className="outstanding-edit-field">
              <label>
                Full Name <span className="required">*</span>
              </label>

              <input
                type="text"
                name="name"
                placeholder="Customer's full name"
                value={formData.name}
                onChange={handleFormChange}
                required
                autoFocus
              />
            </div>

            {/* MOBILE NUMBER */}

            <div className="outstanding-edit-field">
              <label>
                Mobile Number <span className="required">*</span>
              </label>

              <div className="outstanding-edit-phone">
                <span>+91</span>

                <input
                  type="tel"
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleFormChange}
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            {/* ADD MORE DETAILS */}

            {!showMoreDetails && (
              <button
                type="button"
                className="outstanding-edit-more-btn"
                onClick={() => setShowMoreDetails(true)}
              >
                <SlidersHorizontal size={19} />
                <span>Add More Details</span>
              </button>
            )}

            {/* EXTRA DETAILS */}

            {showMoreDetails && (
              <div className="outstanding-edit-extra">
                <div className="outstanding-edit-field">
                  <label>
                    Email <span>(optional)</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="customer@email.com"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="outstanding-edit-field">
                  <label>
                    Address <span>(optional)</span>
                  </label>

                  <input
                    type="text"
                    name="address"
                    placeholder="Customer address"
                    value={formData.address}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="outstanding-edit-field">
                  <label>
                    ID / Reference <span>(optional)</span>
                  </label>

                  <input
                    type="text"
                    name="reference"
                    placeholder="e.g. Aadhaar 1234, PAN ABC123"
                    value={reference}
                    onChange={(event) =>
                      setReference(event.target.value)
                    }
                  />
                </div>

                <div className="outstanding-edit-field">
                  <label>
                    Notes <span>(optional)</span>
                  </label>

                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Any notes about this customer..."
                    value={formData.notes}
                    onChange={handleFormChange}
                  />
                </div>

                {/* ACTIVE CUSTOMER - EDIT ONLY */}

                <label className="outstanding-edit-active">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) =>
                      setIsActive(event.target.checked)
                    }
                  />

                  <span>Active customer</span>
                </label>
              </div>
            )}

            {/* ACTIONS */}

            <div className="outstanding-edit-actions">
              <button
                type="submit"
                className="outstanding-edit-save"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="outstanding-edit-cancel"
                onClick={closeEditCustomer}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

  // =====================================================
  // CUSTOMER LEDGER SCREEN
  // =====================================================

  if (selectedCustomer) {
    const customerRecord =
      findCustomerRecord(selectedCustomer);

    const customerName =
      customerRecord?.name ||
      selectedCustomer.customerName ||
      "Customer";

    const customerPhone =
      customerRecord?.phone ||
      selectedCustomer.phone ||
      "";

    const memberSince =
      customerRecord?.created_at ||
      customerRecord?.date_joined ||
      customerRecord?.created ||
      null;

    const totalBilled = selectedCustomer.rentals.reduce(
      (total, rental) =>
        total +
        Number(
          rental.total_amount ??
            rental.total ??
            rental.amount ??
            rental.grand_total ??
            0
        ),
      0
    );

    const totalReceived = selectedCustomer.rentals.reduce(
      (total, rental) =>
        total + Number(rental.paidAmount || 0),
      0
    );

    const active = customerRecord?.is_active !== false;

    return (
      <section className="outstanding-customer-details">
        {/* BREADCRUMB */}

        <div className="outstanding-details-breadcrumb">
          <button
            type="button"
            className="outstanding-details-back"
            onClick={closeCustomerDetails}
          >
            <ArrowLeft size={17} />
            Customers
          </button>

          <span>/</span>
          <strong>{customerName}</strong>
        </div>

        {/* ACTIONS */}

        <div className="outstanding-details-actions">
          <button
            type="button"
            className="outstanding-delete-btn"
            onClick={handleDeleteCustomer}
          >
            <Trash2 size={16} />
            Delete
          </button>

          <button
            type="button"
            className="outstanding-edit-btn"
            onClick={openEditCustomer}
          >
            <Pencil size={16} />
            Edit
          </button>
        </div>

        {editError && (
          <div className="outstanding-edit-error">
            {editError}
          </div>
        )}

        {/* CUSTOMER PROFILE */}

        <div className="outstanding-profile-card">
          <div className="outstanding-profile-avatar">
            {getInitials(customerName)}
          </div>

          <h1>{customerName}</h1>

          <p>
            {customerPhone || "Customer"}
          </p>

          <span
            className={`outstanding-profile-status ${
              active ? "active" : "inactive"
            }`}
          >
            {active ? "Active" : "Inactive"}
          </span>

          <div className="outstanding-profile-divider" />

          <div className="outstanding-profile-member">
            <span>MEMBER SINCE</span>
            <strong>{formatDate(memberSince)}</strong>
          </div>
        </div>

        {/* CUSTOMER STATS */}

        <div className="outstanding-customer-stats">
          <div>
            <span>TOTAL BILLED</span>
            <strong>
              ₹{formatMoney(totalBilled)}
            </strong>
          </div>

          <div>
            <span>TOTAL RECEIVED</span>
            <strong className="received">
              ₹{formatMoney(totalReceived)}
            </strong>
          </div>

          <div>
            <span>OUTSTANDING</span>
            <strong className="due">
              ₹{formatMoney(
                selectedCustomer.totalOutstanding
              )}
            </strong>
          </div>
        </div>

        {/* RENTALS */}

        <div className="outstanding-ledger-rentals">
          <div className="outstanding-ledger-title">
            <div>
              <FileText size={19} />
              <h2>Rentals</h2>
            </div>

            <span>
              {selectedCustomer.rentals.length} total
            </span>
          </div>

          {selectedCustomer.rentals.map((rental) => {
            const total = Number(
              rental.total_amount ??
                rental.total ??
                rental.amount ??
                rental.grand_total ??
                0
            );

            const rentalStatus =
              rental.status ||
              (rental.balance > 0
                ? "Active"
                : "Completed");

            return (
              <div
                className="outstanding-ledger-rental"
                key={rental.id}
              >
                <div className="outstanding-ledger-rental-top">
                  <strong>
                    {rental.rental_number ||
                      rental.invoice_number ||
                      `RNT-${String(rental.id).padStart(3, "0")}`}
                  </strong>

                  <span
                    className={`outstanding-ledger-status ${
                      rental.balance > 0
                        ? "active"
                        : "completed"
                    }`}
                  >
                    {rentalStatus}
                  </span>
                </div>

                <div className="outstanding-ledger-rental-site">
                  <MapPin size={15} />
                  <span>{rental.site_name || "—"}</span>
                </div>

                <div className="outstanding-ledger-rental-meta">
                  <span>
                    <CalendarDays size={14} />
                    {formatDate(rental.rental_date)}
                  </span>

                  <span>
                    {rental.quantity || 0} item(s)
                  </span>
                </div>

                <div className="outstanding-ledger-rental-amounts">
                  <div>
                    <span>Total</span>
                    <strong>₹{formatMoney(total)}</strong>
                  </div>

                  <div>
                    <span>Received</span>
                    <strong className="received">
                      ₹{formatMoney(rental.paidAmount)}
                    </strong>
                  </div>

                  <div>
                    <span>Outstanding</span>
                    <strong className="due">
                      ₹{formatMoney(rental.balance)}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // =====================================================
  // OUTSTANDING CUSTOMERS LIST
  // =====================================================

  return (
    <section className="outstanding-page">
      {/* HEADER */}

      <div className="outstanding-header">
        <div className="outstanding-header-text">
          <h1>Outstanding Customers</h1>

          <p>
            {customersWithDue}{" "}
            {customersWithDue === 1
              ? "customer"
              : "customers"}{" "}
            with pending dues
          </p>
        </div>
      </div>

      {/* FILTER CARDS */}

      <div className="outstanding-filter-grid">
        <div className="outstanding-filter-card active">
          <div>
            <span>All Due Customers</span>
            <strong>{customersWithDue}</strong>

            <b>
              ₹{formatMoney(totalOutstanding)}
            </b>
          </div>
        </div>

        <div className="outstanding-filter-card">
          <div>
            <span>₹10k and above</span>
            <strong>{tenKAndAbove}</strong>
          </div>
        </div>

        <div className="outstanding-filter-card outstanding-below-10k">
          <div>
            <span>Below ₹10k</span>
            <strong>{belowTenK}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH */}

      <div className="outstanding-search-row">
        <div className="outstanding-search-box">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search customer..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
      </div>

      {/* ERRORS */}

      {error && (
        <div className="outstanding-edit-error">
          {error}

          <button
            type="button"
            onClick={fetchData}
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING / CUSTOMER LIST */}

      {loading ? (
        <div className="outstanding-empty-state">
          <h3>Loading outstanding customers...</h3>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="outstanding-empty-state">
          <Wallet size={38} />
          <h3>No outstanding customers</h3>
          <p>All rental payments are settled.</p>
        </div>
      ) : (
        <div className="outstanding-customer-list">
          {filteredCustomers.map((customer) => (
            <article
              className="outstanding-customer-card"
              key={customer.customerKey}
              role="button"
              tabIndex={0}
              onClick={() =>
                openCustomerDetails(customer)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  openCustomerDetails(customer);
                }
              }}
            >
              <div className="outstanding-customer-top">
                <div>
                  <h2>{customer.customerName}</h2>

                  <p>
                    {customer.billsCount}{" "}
                    {customer.billsCount === 1
                      ? "bill"
                      : "bills"}{" "}
                    · Last payment:{" "}
                    {formatDate(customer.lastPaymentDate)}
                  </p>
                </div>

                <strong className="outstanding-customer-amount">
                  ₹{formatMoney(customer.totalOutstanding)}
                </strong>
              </div>

              <div className="outstanding-customer-bottom">
                <span>View Ledger →</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Outstanding;