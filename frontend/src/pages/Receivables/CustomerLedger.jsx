import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Pencil,
  User,
  Phone,
  CalendarDays,
  FileText,
  MapPinned,
  Ban,
  SlidersHorizontal,
} from "lucide-react";

import "./CustomerLedger.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const RENTALS_API =
  `${API_BASE}/api/rentals/rentals/`;

const PAYMENTS_API =
  `${API_BASE}/api/finance/payments/`;

const CUSTOMERS_API =
  `${API_BASE}/api/customers/customers/`;

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
    return value.id ?? value.pk ?? null;
  }

  return value ?? null;
};

const getRentalAmount = (rental) =>
  Number(
    rental.total_amount ??
      rental.total ??
      rental.amount ??
      rental.grand_total ??
      rental.total_rent ??
      0
  );

const getPaymentRentalId = (payment) =>
  getRelationId(payment.rental) ??
  payment.rental_id ??
  null;

const getPaymentAmount = (payment) =>
  Number(
    payment.amount ??
      payment.paid_amount ??
      payment.payment_amount ??
      0
  );

const formatDate = (date) => {
  if (!date) return "-";

  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(
    String(date)
  )
    ? new Date(`${date}T12:00:00`)
    : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getRentalNumber = (rental) =>
  rental.rental_number ||
  rental.rental_no ||
  rental.invoice_number ||
  rental.code ||
  (rental.id
    ? `RNT-${String(rental.id).padStart(3, "0")}`
    : "-");

const getSiteName = (rental) =>
  rental.site_name ||
  rental.site?.name ||
  rental.site ||
  rental.location ||
  "-";

const getItemCount = (rental) => {
  if (Array.isArray(rental.items)) {
    return rental.items.length;
  }

  if (Array.isArray(rental.rental_items)) {
    return rental.rental_items.length;
  }

  if (Array.isArray(rental.rentalItems)) {
    return rental.rentalItems.length;
  }

  return Number(
    rental.item_count ??
      rental.items_count ??
      rental.total_items ??
      0
  );
};

const getRentalStatus = (rental) => {
  const status = String(
    rental.status || rental.rental_status || ""
  ).toLowerCase();

  if (status.includes("cancel")) {
    return "Cancelled";
  }

  if (
    status.includes("complete") ||
    status.includes("return")
  ) {
    return "Completed";
  }

  return "Active";
};

// =====================================================
// CUSTOMER LEDGER
// =====================================================

const CustomerLedger = ({
  customer,
  onBack,
  onCustomerUpdated,
}) => {
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState("");

  // Updated customer is kept locally after saving.
  const [customerOverride, setCustomerOverride] =
    useState(null);

  // Edit form state.
  const [isEditingCustomer, setIsEditingCustomer] =
    useState(false);

  const [showMoreDetails, setShowMoreDetails] =
    useState(false);

  const [savingCustomer, setSavingCustomer] =
    useState(false);

  const [editError, setEditError] = useState("");

  const [reference, setReference] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  // =====================================================
  // CUSTOMER OBJECT AND ID
  // =====================================================

  const customerData =
    customerOverride ||
    customer?.customerObject ||
    (customer?.customer &&
    typeof customer.customer === "object"
      ? customer.customer
      : null) ||
    (customer?.id ? customer : {}) ||
    {};

  const customerId =
    customerData.id ??
    customer?.customerObject?.id ??
    customer?.customerId ??
    customer?.customer_id ??
    (typeof customer?.customer === "number"
      ? customer.customer
      : null);

  const customerName =
    customerData.name ||
    customerData.customer_name ||
    customerData.full_name ||
    customer?.customerName ||
    "Unknown Customer";

  const phone =
    customerData.phone ||
    customerData.mobile ||
    customerData.mobile_number ||
    customerData.phone_number ||
    customer?.phone ||
    "-";

  const memberSince =
    customerData.created_at ||
    customerData.joined_date ||
    customerData.date_joined ||
    customerData.created ||
    null;

  const active = customerData.is_active !== false;

  // =====================================================
  // FETCH RENTALS AND PAYMENTS
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    const fetchLedgerData = async () => {
      if (
        customerId === null ||
        customerId === undefined ||
        customerId === ""
      ) {
        setRentals([]);
        setPayments([]);
        setLoading(false);
        setLedgerError(
          "Customer ID kandethaan kazhinjilla."
        );
        return;
      }

      try {
        setLoading(true);
        setLedgerError("");

        const [
          rentalsResponse,
          paymentsResponse,
        ] = await Promise.all([
          fetch(RENTALS_API),
          fetch(PAYMENTS_API),
        ]);

        if (!rentalsResponse.ok) {
          throw new Error("Failed to fetch rentals.");
        }

        if (!paymentsResponse.ok) {
          throw new Error("Failed to fetch payments.");
        }

        const [
          rentalsData,
          paymentsData,
        ] = await Promise.all([
          rentalsResponse.json(),
          paymentsResponse.json(),
        ]);

        const rentalList = getList(rentalsData);
        const paymentList = getList(paymentsData);

        const customerRentals = rentalList.filter(
          (rental) => {
            const rentalCustomerId =
              rental.customer_id ??
              getRelationId(rental.customer);

            return (
              rentalCustomerId !== null &&
              rentalCustomerId !== undefined &&
              String(rentalCustomerId) ===
                String(customerId)
            );
          }
        );

        if (isMounted) {
          setRentals(customerRentals);
          setPayments(paymentList);
        }
      } catch (error) {
        console.error("Customer ledger error:", error);

        if (isMounted) {
          setLedgerError(
            error.message ||
              "Customer ledger load cheyyan kazhinjilla."
          );
          setRentals([]);
          setPayments([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLedgerData();

    return () => {
      isMounted = false;
    };
  }, [customerId]);

  // =====================================================
  // AMOUNT CALCULATIONS
  // =====================================================

  const getPaidAmount = (rentalId) => {
    return payments
      .filter(
        (payment) =>
          String(getPaymentRentalId(payment)) ===
          String(rentalId)
      )
      .reduce(
        (total, payment) =>
          total + getPaymentAmount(payment),
        0
      );
  };

  const totalBilled = useMemo(
    () =>
      rentals.reduce(
        (total, rental) =>
          total + getRentalAmount(rental),
        0
      ),
    [rentals]
  );

  const totalReceived = useMemo(
    () =>
      rentals.reduce(
        (total, rental) =>
          total + getPaidAmount(rental.id),
        0
      ),
    [rentals, payments]
  );

  const outstanding = Math.max(
    totalBilled - totalReceived,
    0
  );

  // =====================================================
  // OPEN EDIT CUSTOMER
  // =====================================================

  const openEditCustomer = () => {
    setEditForm({
      name: customerName === "Unknown Customer"
        ? ""
        : customerName,
      phone: phone === "-" ? "" : phone,
      email: customerData.email || "",
      address: customerData.address || "",
      notes: customerData.notes || "",
    });

    setReference(
      customerData.reference ||
        customerData.id_reference ||
        customerData.reference_number ||
        ""
    );

    setIsActive(customerData.is_active !== false);

    // Edit click cheyyumbol first two fields mathram.
    setShowMoreDetails(false);
    setEditError("");
    setIsEditingCustomer(true);
  };

  // =====================================================
  // CLOSE EDIT FORM
  // =====================================================

  const closeEditCustomer = () => {
    if (savingCustomer) return;

    setIsEditingCustomer(false);
    setShowMoreDetails(false);
    setEditError("");
  };

  // =====================================================
  // HANDLE FORM INPUTS
  // =====================================================

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
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

    if (!customerId) {
      setEditError(
        "Customer ID kandethaan kazhinjilla."
      );
      return;
    }

    if (!editForm.name.trim()) {
      setEditError("Full Name is required.");
      return;
    }

    if (!editForm.phone.trim()) {
      setEditError("Mobile Number is required.");
      return;
    }

    try {
      setSavingCustomer(true);

      const payload = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        address: editForm.address.trim(),
        notes: editForm.notes.trim(),
        reference: reference.trim(),
        is_active: isActive,
      };

      const response = await fetch(
        `${CUSTOMERS_API}${customerId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          data?.detail ||
          Object.entries(data || {})
            .map(([key, value]) => {
              const message = Array.isArray(value)
                ? value.join(", ")
                : String(value);

              return `${key}: ${message}`;
            })
            .join(" ") ||
          "Customer update cheyyan kazhinjilla.";

        throw new Error(errorMessage);
      }

      const updatedCustomer = {
        ...customerData,
        ...payload,
        ...data,
        id: data.id ?? customerId,
        name: data.name ?? payload.name,
        phone: data.phone ?? payload.phone,
        email: data.email ?? payload.email,
        address: data.address ?? payload.address,
        notes: data.notes ?? payload.notes,
        reference: data.reference ?? payload.reference,
        is_active: data.is_active ?? payload.is_active,
      };

      setCustomerOverride(updatedCustomer);

      // Parent support undenkil updated customer parent-ilum update cheyyum.
      if (typeof onCustomerUpdated === "function") {
        onCustomerUpdated(updatedCustomer);
      }

      setIsEditingCustomer(false);
      setShowMoreDetails(false);
      setEditError("");
    } catch (error) {
      console.error("Update customer error:", error);

      setEditError(
        error.message ||
          "Customer update cheyyan kazhinjilla."
      );
    } finally {
      setSavingCustomer(false);
    }
  };

  // =====================================================
  // BACK BUTTON WHEN CUSTOMER IS MISSING
  // =====================================================

  if (!customer) {
    return (
      <div className="customer-ledger-page">
        <button
          type="button"
          className="ledger-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Customers
        </button>

        <div className="ledger-no-customer">
          No customer selected.
        </div>
      </div>
    );
  }

  // =====================================================
  // EDIT CUSTOMER SCREEN
  // =====================================================

  if (isEditingCustomer) {
    return (
      <div className="customer-ledger-page ledger-edit-page">
        <div className="ledger-edit-breadcrumb">
          <button
            type="button"
            onClick={closeEditCustomer}
            disabled={savingCustomer}
          >
            <ArrowLeft size={18} />
            <span>Customer</span>
          </button>

          <span className="ledger-edit-slash">/</span>

          <strong>Edit Customer</strong>
        </div>

        <section className="ledger-edit-card">
          <h1>Edit Customer</h1>

          {editError && (
            <div className="ledger-edit-error">
              {editError}
            </div>
          )}

          <form
            className="ledger-edit-form"
            onSubmit={handleSaveCustomer}
          >
            {/* FULL NAME */}

            <div className="ledger-edit-field">
              <label htmlFor="ledger-edit-name">
                Full Name <span>*</span>
              </label>

              <input
                id="ledger-edit-name"
                type="text"
                name="name"
                placeholder="Customer's full name"
                value={editForm.name}
                onChange={handleEditChange}
                required
              />
            </div>

            {/* MOBILE NUMBER */}

            <div className="ledger-edit-field">
              <label htmlFor="ledger-edit-phone">
                Mobile Number <span>*</span>
              </label>

              <div className="ledger-edit-phone">
                <span>+91</span>

                <input
                  id="ledger-edit-phone"
                  type="tel"
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            {/* ADD MORE DETAILS BUTTON */}

            {!showMoreDetails && (
              <button
                type="button"
                className="ledger-add-more-btn"
                onClick={() => setShowMoreDetails(true)}
              >
                <SlidersHorizontal size={20} />
                <span>Add More Details</span>
              </button>
            )}

            {/* EXTRA FIELDS */}

            {showMoreDetails && (
              <div className="ledger-extra-details">
                <div className="ledger-edit-field">
                  <label htmlFor="ledger-edit-email">
                    Email <span>(optional)</span>
                  </label>

                  <input
                    id="ledger-edit-email"
                    type="email"
                    name="email"
                    placeholder="customer@email.com"
                    value={editForm.email}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="ledger-edit-field">
                  <label htmlFor="ledger-edit-address">
                    Address <span>(optional)</span>
                  </label>

                  <input
                    id="ledger-edit-address"
                    type="text"
                    name="address"
                    placeholder="Customer address"
                    value={editForm.address}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="ledger-edit-field">
                  <label htmlFor="ledger-edit-reference">
                    ID / Reference <span>(optional)</span>
                  </label>

                  <input
                    id="ledger-edit-reference"
                    type="text"
                    placeholder="e.g. Aadhaar 1234, PAN ABC123"
                    value={reference}
                    onChange={(event) =>
                      setReference(event.target.value)
                    }
                  />
                </div>

                <div className="ledger-edit-field">
                  <label htmlFor="ledger-edit-notes">
                    Notes <span>(optional)</span>
                  </label>

                  <textarea
                    id="ledger-edit-notes"
                    name="notes"
                    rows={4}
                    placeholder="Any notes about this customer..."
                    value={editForm.notes}
                    onChange={handleEditChange}
                  />
                </div>

                {/* ACTIVE CUSTOMER - EDIT FORM ONLY */}

                <label className="ledger-active-customer">
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

            {/* SAVE AND CANCEL */}

            <div className="ledger-edit-actions">
              <button
                type="submit"
                className="ledger-save-btn"
                disabled={savingCustomer}
              >
                {savingCustomer
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                type="button"
                className="ledger-cancel-btn"
                onClick={closeEditCustomer}
                disabled={savingCustomer}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // =====================================================
  // CUSTOMER LEDGER SCREEN
  // =====================================================

  return (
    <div className="customer-ledger-page">
      {/* BREADCRUMB */}

      <div className="ledger-top">
        <button
          type="button"
          className="ledger-breadcrumb-button"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Customers
        </button>

        <span className="ledger-slash">/</span>

        <strong>{customerName}</strong>
      </div>

      {/* ACTION BUTTONS */}

      <div className="ledger-actions">
        <button
          type="button"
          className="ledger-delete-btn"
        >
          <Trash2 size={15} />
          Delete
        </button>

        <button
          type="button"
          className="ledger-edit-btn"
          onClick={openEditCustomer}
        >
          <Pencil size={15} />
          Edit
        </button>
      </div>

      {/* CUSTOMER PROFILE */}

      <section className="ledger-profile-card">
        <div className="ledger-profile-avatar">
          {customerName
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>

        <h1>{customerName}</h1>

        <div className="ledger-phone">
          {phone}
        </div>

        <div
          className={`ledger-active ${
            active ? "" : "inactive"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </div>

        <div className="ledger-profile-divider" />

        <div className="member-since">
          <span>MEMBER SINCE</span>
          <strong>{formatDate(memberSince)}</strong>
        </div>
      </section>

      {/* SUMMARY CARDS */}

      <section className="ledger-summary">
        <div className="ledger-summary-card billed">
          <span>
            TOTAL
            <br />
            BILLED
          </span>

          <strong>
            ₹{formatAmount(totalBilled)}
          </strong>
        </div>

        <div className="ledger-summary-card received">
          <span>
            TOTAL
            <br />
            RECEIVED
          </span>

          <strong>
            ₹{formatAmount(totalReceived)}
          </strong>
        </div>

        <div className="ledger-summary-card outstanding">
          <span>OUTSTANDING</span>

          <strong>
            ₹{formatAmount(outstanding)}
          </strong>
        </div>
      </section>

      {/* RENTALS */}

      <section className="rentals-card">
        <div className="rentals-header">
          <div className="rentals-title">
            <FileText size={18} />
            <strong>Rentals</strong>
          </div>

          <span>{rentals.length} total</span>
        </div>

        {loading ? (
          <div className="rentals-loading">
            Loading rentals...
          </div>
        ) : ledgerError ? (
          <div className="rentals-empty">
            {ledgerError}
          </div>
        ) : rentals.length === 0 ? (
          <div className="rentals-empty">
            No rentals found for this customer.
          </div>
        ) : (
          <div className="rentals-list">
            {rentals.map((rental) => {
              const status = getRentalStatus(rental);
              const rentalNumber = getRentalNumber(rental);
              const siteName = getSiteName(rental);

              const rentalDate =
                rental.rental_date ||
                rental.created_at ||
                rental.date;

              const itemCount = getItemCount(rental);
              const rentalTotal = getRentalAmount(rental);
              const rentalPaid = getPaidAmount(rental.id);

              const rentalBalance = Math.max(
                rentalTotal - rentalPaid,
                0
              );

              return (
                <div
                  className="rental-item"
                  key={rental.id}
                >
                  <div className="rental-top-row">
                    <strong className="rental-number">
                      {rentalNumber}
                    </strong>

                    <span
                      className={`rental-status ${status.toLowerCase()}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="rental-site">
                    <MapPinned size={14} />
                    <span>{siteName}</span>
                  </div>

                  <div className="rental-meta">
                    <span>
                      <CalendarDays size={13} />
                      {formatDate(rentalDate)}
                    </span>

                    <span>{itemCount} item(s)</span>
                  </div>

                  <div className="rental-amount-summary">
                    <div>
                      <span>Total</span>
                      <strong>
                        ₹{formatAmount(rentalTotal)}
                      </strong>
                    </div>

                    <div>
                      <span>Received</span>
                      <strong>
                        ₹{formatAmount(rentalPaid)}
                      </strong>
                    </div>

                    <div>
                      <span>Outstanding</span>
                      <strong>
                        ₹{formatAmount(rentalBalance)}
                      </strong>
                    </div>
                  </div>

                  {status === "Active" && (
                    <button
                      type="button"
                      className="cancel-rental-btn"
                    >
                      <Ban size={14} />
                      Cancel Rental
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerLedger;