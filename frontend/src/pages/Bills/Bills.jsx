import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Eye,
  X,
  Printer,
  CreditCard,
  CalendarDays,
  IndianRupee,
  Tag,
  Users,
  MapPin,
  Trash2,
  Ban,
  MessageCircle,
  Pencil,
} from "lucide-react";

import "./Bills.css";

const API_BASE = "http://127.0.0.1:8000/api";

const BILL_PAYMENT_API =
  `${API_BASE}/finance/payments/`;

const RENTAL_ITEMS_API =
  `${API_BASE}/rentals/rental-items/`;

const RENTALS_API =
  `${API_BASE}/rentals/rentals/`;

const PAYMENTS_API =
  `${API_BASE}/finance/payments/`;

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

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getTodayDate = () => {
  const now = new Date();

  const localDate = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// BILLS COMPONENT
// =====================================================

const Bills = () => {
  // DATA
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [rentalItems, setRentalItems] = useState([]);

  // LIST
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // SELECTED BILL
  const [selectedBill, setSelectedBill] = useState(null);

  // PAYMENT MODAL
  const [showCollectPaymentModal, setShowCollectPaymentModal] =
    useState(false);

  const [paymentSaving, setPaymentSaving] = useState(false);
  const [collectPaymentError, setCollectPaymentError] =
    useState("");

  // DISCOUNT
  const [discountType, setDiscountType] = useState("days");
  const [discountDays, setDiscountDays] = useState("0");
  const [discountValue, setDiscountValue] = useState("0");

  // PAYMENT FORM
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "cash",
    payment_date: getTodayDate(),
    reference_number: "",
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
        itemsResponse,
      ] = await Promise.all([
        fetch(RENTALS_API),
        fetch(PAYMENTS_API),
        fetch(RENTAL_ITEMS_API),
      ]);

      if (
        !rentalsResponse.ok ||
        !paymentsResponse.ok ||
        !itemsResponse.ok
      ) {
        throw new Error("Failed to load bill data.");
      }

      const [
        rentalsData,
        paymentsData,
        itemsData,
      ] = await Promise.all([
        rentalsResponse.json(),
        paymentsResponse.json(),
        itemsResponse.json(),
      ]);

      setRentals(getList(rentalsData));
      setPayments(getList(paymentsData));
      setRentalItems(getList(itemsData));
    } catch (err) {
      console.error("Bills fetch error:", err);

      setError(
        err.message || "Unable to load bills."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // BILL DATA
  // =====================================================

  const bills = useMemo(() => {
    return rentals.map((rental) => {
      const rentalPayments = payments.filter(
        (payment) =>
          Number(getRelationId(payment.rental)) ===
          Number(rental.id)
      );

      const paidAmount = rentalPayments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount ??
              payment.paid_amount ??
              payment.payment_amount ??
              0
          ),
        0
      );

      const totalAmount = Number(
        rental.total_amount || 0
      );

      const outstanding = Math.max(
        totalAmount - paidAmount,
        0
      );

      let status = "Unpaid";

      if (rental.status === "cancelled") {
        status = "Cancelled";
      } else if (
        totalAmount > 0 &&
        outstanding <= 0
      ) {
        status = "Paid";
      } else if (paidAmount > 0) {
        status = "Partially Paid";
      }

      return {
        ...rental,
        paidAmount,
        outstanding,
        status,
        rentalPayments,
      };
    });
  }, [rentals, payments]);

  // =====================================================
  // COUNTS
  // =====================================================

  const allBills = bills.length;

  const unpaidBills = bills.filter(
    (bill) => bill.status === "Unpaid"
  ).length;

  const partialBills = bills.filter(
    (bill) => bill.status === "Partially Paid"
  ).length;

  const paidBills = bills.filter(
    (bill) => bill.status === "Paid"
  ).length;

  const cancelledBills = bills.filter(
    (bill) => bill.status === "Cancelled"
  ).length;

  // =====================================================
  // TOTALS
  // =====================================================

  const totalBilled = bills.reduce(
    (sum, bill) =>
      sum + Number(bill.total_amount || 0),
    0
  );

  const totalPaid = bills.reduce(
    (sum, bill) =>
      sum + Number(bill.paidAmount || 0),
    0
  );

  const totalOutstanding = bills.reduce(
    (sum, bill) =>
      sum + Number(bill.outstanding || 0),
    0
  );

  // =====================================================
  // FILTER
  // =====================================================

  const filteredBills = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return bills.filter((bill) => {
      const matchesSearch =
        String(bill.customer_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(bill.site_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(bill.id || "")
          .toLowerCase()
          .includes(searchText);

      let matchesFilter = true;

      if (filter === "unpaid") {
        matchesFilter = bill.status === "Unpaid";
      }

      if (filter === "partial") {
        matchesFilter =
          bill.status === "Partially Paid";
      }

      if (filter === "paid") {
        matchesFilter = bill.status === "Paid";
      }

      if (filter === "cancelled") {
        matchesFilter = bill.status === "Cancelled";
      }

      return matchesSearch && matchesFilter;
    });
  }, [bills, search, filter]);

  // =====================================================
  // SELECT BILL
  // =====================================================

  const handleViewBill = (bill) => {
    const items = rentalItems.filter(
      (item) =>
        Number(getRelationId(item.rental)) ===
        Number(bill.id)
    );

    const billPayments = payments.filter(
      (payment) =>
        Number(getRelationId(payment.rental)) ===
        Number(bill.id)
    );

    setSelectedBill({
      ...bill,
      rentalItems: items,
      rentalPayments: billPayments,
    });

    setShowCollectPaymentModal(false);
    setCollectPaymentError("");
  };

  const closeBillDetails = () => {
    if (paymentSaving) return;

    setShowCollectPaymentModal(false);
    setSelectedBill(null);
    setCollectPaymentError("");
  };

  // =====================================================
  // PAYMENT MODAL CALCULATIONS
  // =====================================================

  const selectedBillItems = useMemo(() => {
    if (!selectedBill) return [];

    return rentalItems.filter(
      (item) =>
        Number(getRelationId(item.rental)) ===
        Number(selectedBill.id)
    );
  }, [selectedBill, rentalItems]);

  const grossTotal = Number(
    selectedBill?.gross_total ??
      selectedBill?.subtotal ??
      selectedBill?.total_amount ??
      0
  );

  // Daily Rate × Quantity
  const dailyRentalTotal = selectedBillItems.reduce(
    (total, item) => {
      const rate = Number(
        item.daily_rent ??
          item.daily_rate ??
          0
      );

      const quantity = Number(item.quantity || 0);

      return total + rate * quantity;
    },
    0
  );

  let calculatedDiscount = 0;

  if (discountType === "days") {
    calculatedDiscount =
      dailyRentalTotal *
      Math.max(Number(discountDays || 0), 0);
  } else if (discountType === "fixed") {
    calculatedDiscount =
      Math.max(Number(discountValue || 0), 0);
  } else if (discountType === "percentage") {
    calculatedDiscount =
      grossTotal *
      Math.min(
        Math.max(Number(discountValue || 0), 0),
        100
      ) /
      100;
  }

  calculatedDiscount = Math.min(
    calculatedDiscount,
    grossTotal
  );

  const netPayable = Math.max(
    grossTotal - calculatedDiscount,
    0
  );

  const previouslyPaid = Number(
    selectedBill?.paidAmount || 0
  );

  const balanceBeforePayment = Math.max(
    netPayable - previouslyPaid,
    0
  );

  const currentPayment = Number(
    paymentForm.amount || 0
  );

  const balanceAfterPayment = Math.max(
    balanceBeforePayment - currentPayment,
    0
  );

  // =====================================================
  // OPEN / CLOSE PAYMENT MODAL
  // =====================================================

  const openCollectPayment = () => {
    if (!selectedBill) return;

    setDiscountType("days");
    setDiscountDays("0");
    setDiscountValue("0");

    setPaymentForm({
      amount: String(
        Math.max(
          Number(selectedBill.total_amount || 0) -
            Number(selectedBill.paidAmount || 0),
          0
        )
      ),
      payment_method: "cash",
      payment_date: getTodayDate(),
      reference_number: "",
      notes: "",
    });

    setCollectPaymentError("");
    setShowCollectPaymentModal(true);
  };

  const closeCollectPayment = () => {
    if (paymentSaving) return;

    setShowCollectPaymentModal(false);
    setCollectPaymentError("");
  };

  const handlePaymentFormChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Update the amount whenever the discount changes.
  useEffect(() => {
    if (!showCollectPaymentModal) return;

    setPaymentForm((previous) => ({
      ...previous,
      amount: String(balanceBeforePayment),
    }));
  }, [
    showCollectPaymentModal,
    balanceBeforePayment,
  ]);

  // =====================================================
  // SAVE PAYMENT
  // =====================================================

  const handleCollectPaymentSubmit = async (event) => {
    event.preventDefault();
    setCollectPaymentError("");

    if (!selectedBill) {
      setCollectPaymentError("Please select a bill.");
      return;
    }

    const amount = Number(paymentForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setCollectPaymentError(
        "Enter a valid payment amount."
      );
      return;
    }

    if (amount > balanceBeforePayment + 0.001) {
      setCollectPaymentError(
        "Payment amount cannot exceed the balance due."
      );
      return;
    }

    if (!paymentForm.payment_date) {
      setCollectPaymentError(
        "Payment date is required."
      );
      return;
    }

    try {
      setPaymentSaving(true);

      const response = await fetch(
        BILL_PAYMENT_API,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rental: Number(selectedBill.id),

            customer: Number(
              typeof selectedBill.customer === "object"
                ? selectedBill.customer?.id
                : selectedBill.customer
            ),

            amount,
            payment_method: paymentForm.payment_method,
            payment_date: paymentForm.payment_date,
            reference_number: paymentForm.reference_number.trim(),
            notes: paymentForm.notes.trim(),
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.detail ||
          Object.values(data || {})
            .flat()
            .join(" ") ||
          "Unable to collect payment.";

        throw new Error(message);
      }

      setShowCollectPaymentModal(false);
      setCollectPaymentError("");

      // Refresh the actual saved payment records.
      await fetchData();

      const updatedPaidAmount =
        previouslyPaid + amount;

      const updatedOutstanding = Math.max(
        Number(selectedBill.total_amount || 0) -
          updatedPaidAmount,
        0
      );

      setSelectedBill((previous) => ({
        ...previous,
        paidAmount: updatedPaidAmount,
        outstanding: updatedOutstanding,
        status:
          updatedOutstanding <= 0
            ? "Paid"
            : updatedPaidAmount > 0
            ? "Partially Paid"
            : "Unpaid",
      }));
    } catch (err) {
      console.error("Payment save error:", err);

      setCollectPaymentError(
        err.message ||
          "Unable to collect payment."
      );
    } finally {
      setPaymentSaving(false);
    }
  };

  // =====================================================
  // PRINT
  // =====================================================

  const handlePrintBill = () => {
    window.print();
  };


  // ========================================
  // OPEN CUSTOMER WHATSAPP
  // ========================================

  const handleWhatsApp = async () => {
    if (!selectedBill) return;

    try {
      let phone =
        selectedBill.customer_phone ||
        selectedBill.phone ||
        (typeof selectedBill.customer === "object"
          ? selectedBill.customer?.phone
          : "");

      // Customer phone rental data-il illenkil
      // Customers API-il ninnu fetch cheyyum.
      if (!phone) {
        const response = await fetch(
          `${API_BASE}/customers/customers/`
        );

        if (!response.ok) {
          throw new Error("Unable to load customer phone number.");
        }

        const data = await response.json();
        const customerList = getList(data);

        const customerId = getRelationId(
          selectedBill.customer
        );

        let customer = customerId
          ? customerList.find(
              (item) =>
                String(item.id) === String(customerId)
            )
          : null;

        // ID kittiyillenkil customer name use cheyyum.
        if (!customer && selectedBill.customer_name) {
          customer = customerList.find(
            (item) =>
              String(item.name || "").trim().toLowerCase() ===
              String(selectedBill.customer_name)
                .trim()
                .toLowerCase()
          );
        }

        phone =
          customer?.phone ||
          customer?.mobile ||
          customer?.mobile_number ||
          "";
      }

      if (!phone) {
        window.alert(
          "Customer phone number kittiyilla. Customers page-il mobile number save cheythittundo enn check cheyyuka."
        );
        return;
      }

      // India mobile number format
      let digits = String(phone).replace(/\D/g, "");

      if (digits.startsWith("0") && digits.length === 11) {
        digits = digits.slice(1);
      }

      if (digits.length === 10) {
        digits = `91${digits}`;
      }

      if (digits.length < 11) {
        window.alert("Valid WhatsApp mobile number illa.");
        return;
      }

      const message = [
        `Hello ${selectedBill.customer_name || "Customer"},`,
        "",
        `Bill No: #${selectedBill.id}`,
        `Total Amount: ${formatCurrency(selectedBill.total_amount)}`,
        `Paid Amount: ${formatCurrency(selectedBill.paidAmount)}`,
        `Balance Due: ${formatCurrency(selectedBill.outstanding)}`,
        "",
        "Please contact us regarding your bill. Thank you.",
      ].join("\n");

      const whatsappUrl =
        `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

      window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error("WhatsApp error:", error);

      window.alert(
        error.message || "WhatsApp open cheyyan kazhinjilla."
      );
    }
  };

  // =====================================================
  // BILL DETAILS
  // =====================================================

  const renderBillDetails = () => {
  if (!selectedBill) {
    return (
      <section className="bill-not-found-page">
        <div className="bill-not-found-content">
          <h2>Bill not found.</h2>

          <button
            type="button"
            className="bill-not-found-back"
            onClick={closeBillDetails}
          >
            ← Back to Bills
          </button>
        </div>
      </section>
    );
  }

  // Existing bill details JSX ivide thanne continue cheyyanam.

    const bill = selectedBill;

    const billItems = selectedBillItems;

    const billPayments = payments.filter(
      (payment) =>
        Number(getRelationId(payment.rental)) ===
        Number(bill.id)
    );

    const billTotal = Number(
      bill.total_amount || 0
    );

    const billPaid = billPayments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.amount ??
            payment.paid_amount ??
            payment.payment_amount ??
            0
        ),
      0
    );

    const billBalance = Math.max(
      billTotal - billPaid,
      0
    );

    return (
      <section className="bill-details-page bill-print-area">
        {/* BACK BUTTON */}

        <button
          type="button"
          className="bill-details-back no-print"
          onClick={closeBillDetails}
        >
          ← Back to Bills
        </button>

        {/* HEADER */}

        <div className="bill-details-header">
          <div className="bill-details-title-row">
            <h1>#{bill.id}</h1>

            <span
              className={`bill-status-badge ${
                billBalance <= 0
                  ? "paid"
                  : billPaid > 0
                  ? "partially-paid"
                  : "unpaid"
              }`}
            >
              {bill.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS */}

        <div className="bill-details-actions no-print">
          <button
            type="button"
            className="bill-cancel-btn"
            onClick={() =>
              window.alert(
                "Rental cancellation must be connected to your backend."
              )
            }
          >
            <Ban size={15} />
            Cancel
          </button>

          <button
            type="button"
            className="bill-delete-btn"
            onClick={() =>
              window.alert(
                "Bill deletion must be connected to your backend."
              )
            }
          >
            <Trash2 size={15} />
            Delete
          </button>

          <button
            type="button"
            className="bill-print-button"
            onClick={handlePrintBill}
          >
            <Printer size={15} />
            Print
          </button>

          <button
            type="button"
            className="bill-whatsapp-btn no-print"
            onClick={handleWhatsApp}
          >
            <MessageCircle size={15} />
            WhatsApp
          </button>

          <button
            type="button"
            className="bill-collect-payment-button"
            onClick={openCollectPayment}
            disabled={billBalance <= 0}
          >
            <CreditCard size={16} />
            Collect Payment
          </button>
        </div>

        {/* BILL SUMMARY */}

        <div className="bill-details-card bill-summary-main">
          <div className="bill-summary-top">
            <div>
              <span>Customer</span>

              <h2>{bill.customer_name || "-"}</h2>

              <p>
                #{bill.id} · {formatDate(bill.rental_date)}
              </p>
            </div>

            <div className="bill-balance-box">
              <span>Balance Due</span>

              <strong>
                {formatCurrency(billBalance)}
              </strong>
            </div>
          </div>

          <div className="bill-summary-row">
            <span>Sub Total</span>

            <strong>
              {formatCurrency(billTotal)}
            </strong>
          </div>

          <div className="bill-summary-row">
            <div>
              <span>Discount</span>
              <strong>None</strong>
            </div>

            <button
              type="button"
              className="bill-discount-edit no-print"
              onClick={() =>
                window.alert(
                  "Use Collect Payment to calculate a discount for this payment."
                )
              }
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>

          <button
            type="button"
            className="bill-collect-large no-print"
            onClick={openCollectPayment}
            disabled={billBalance <= 0}
          >
            <CreditCard size={16} />
            Collect Payment
          </button>
        </div>

        {/* BILL ITEMS */}

        <div className="bill-details-card bill-items-card">
          <div className="bill-section-header">
            <h2>Bill Items</h2>
          </div>

          {billItems.length > 0 ? (
            billItems.map((item) => (
              <div
                className="bill-item-row"
                key={item.id}
              >
                <div>
                  <strong>
                    {item.equipment_name ||
                      item.commodity_name ||
                      "Equipment"}
                  </strong>

                  <span>
                    {item.quantity || 0} items
                  </span>
                </div>

                <strong>
                  {formatCurrency(
                    item.amount ??
                      Number(item.quantity || 0) *
                        Number(
                          item.daily_rent ||
                            item.daily_rate ||
                            0
                        )
                  )}
                </strong>
              </div>
            ))
          ) : (
            <div className="bill-no-items">
              No bill items found.
            </div>
          )}

          <div className="bill-total-row">
            <span>Sub Total</span>
            <strong>{formatCurrency(billTotal)}</strong>
          </div>

          <div className="bill-total-row grand-total">
            <span>Grand Total</span>
            <strong>{formatCurrency(billTotal)}</strong>
          </div>
        </div>

        {/* PAYMENTS RECEIVED */}

        <div className="bill-details-card bill-payments-card">
          <div className="bill-section-header">
            <h2>Payments Received</h2>
            <strong>
              {billPayments.length}{" "}
              {billPayments.length === 1
                ? "payment"
                : "payments"}
            </strong>
          </div>

          {billPayments.length > 0 ? (
            billPayments.map((payment) => (
              <div
                className="bill-payment-row"
                key={payment.id}
              >
                <div>
                  <strong>
                    {formatCurrency(
                      payment.amount ??
                        payment.paid_amount ??
                        payment.payment_amount ??
                        0
                    )}
                  </strong>

                  <span>
                    {formatDate(payment.payment_date)}
                  </span>
                </div>

                <div>
                  <span>
                    {payment.payment_method || "Cash"}
                  </span>

                  {payment.reference_number && (
                    <small>
                      Ref: {payment.reference_number}
                    </small>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bill-payments-empty">
              No payments recorded yet.
            </div>
          )}
        </div>

        {/* =====================================
            COLLECT PAYMENT MODAL
        ===================================== */}

        {showCollectPaymentModal && (
          <div
            className="collect-payment-overlay no-print"
            onClick={closeCollectPayment}
          >
            <div
              className="collect-payment-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {/* MODAL HEADER */}

              <div className="collect-payment-header">
                <h2>Collect Payment</h2>

                <button
                  type="button"
                  onClick={closeCollectPayment}
                  disabled={paymentSaving}
                  aria-label="Close payment modal"
                >
                  <X size={22} />
                </button>
              </div>

              <form
                className="collect-payment-form"
                onSubmit={handleCollectPaymentSubmit}
              >
                {/* BILL + GROSS TOTAL */}

                <div className="collect-payment-bill-summary">
                  <div>
                    <span>Bill</span>

                    <strong>
                      {bill.bill_number ||
                        bill.invoice_number ||
                        `#${bill.id}`}
                    </strong>
                  </div>

                  <div>
                    <span>Gross Total</span>
                    <strong>
                      {formatCurrency(grossTotal)}
                    </strong>
                  </div>
                </div>

                {/* DISCOUNT TYPE */}

                <div className="collect-payment-field">
                  <label htmlFor="discount-type">
                    Discount Type
                  </label>

                  <select
                    id="discount-type"
                    value={discountType}
                    onChange={(event) =>
                      setDiscountType(event.target.value)
                    }
                  >
                    <option value="days">Days</option>
                    <option value="fixed">
                      Fixed Amount (₹)
                    </option>
                    <option value="percentage">
                      Percentage (%)
                    </option>
                  </select>
                </div>

                {/* DISCOUNT VALUE */}

                <div className="collect-payment-field">
                  <label htmlFor="discount-value">
                    {discountType === "days"
                      ? "Discount Days"
                      : discountType === "fixed"
                      ? "Discount Amount (₹)"
                      : "Discount Percentage (%)"}
                  </label>

                  <div className="collect-payment-input-icon">
                    <Tag size={18} />

                    <input
                      id="discount-value"
                      type="number"
                      min="0"
                      max={
                        discountType === "percentage"
                          ? 100
                          : discountType === "fixed"
                          ? grossTotal
                          : undefined
                      }
                      step={
                        discountType === "days"
                          ? "1"
                          : "0.01"
                      }
                      value={
                        discountType === "days"
                          ? discountDays
                          : discountValue
                      }
                      onChange={(event) => {
                        if (discountType === "days") {
                          setDiscountDays(
                            event.target.value
                          );
                        } else {
                          setDiscountValue(
                            event.target.value
                          );
                        }
                      }}
                    />
                  </div>

                  <small>
                    Current discount:{" "}
                    {formatCurrency(calculatedDiscount)}
                  </small>
                </div>

                {/* CALCULATION BOX */}

                <div className="collect-payment-calculation">
                  <div className="calculation-row">
                    <span>Gross Total</span>
                    <strong>
                      {formatCurrency(grossTotal)}
                    </strong>
                  </div>

                  <div className="calculation-row discount-row">
                    <span>Discount (-)</span>

                    <strong>
                      −{formatCurrency(calculatedDiscount)}
                      {discountType === "days" &&
                        Number(discountDays) > 0 &&
                        ` (${discountDays} days)`}
                    </strong>
                  </div>

                  <div className="calculation-row net-payable-row">
                    <span>Net Payable</span>
                    <strong>
                      {formatCurrency(netPayable)}
                    </strong>
                  </div>

                  <div className="calculation-row current-payment-row">
                    <span>This Payment (-)</span>
                    <strong>
                      −{formatCurrency(currentPayment)}
                    </strong>
                  </div>

                  <div className="calculation-row balance-after-row">
                    <span>Balance After Payment</span>
                    <strong>
                      {formatCurrency(balanceAfterPayment)}
                    </strong>
                  </div>
                </div>

                {/* AMOUNT TO COLLECT */}

                <div className="collect-payment-field">
                  <label htmlFor="payment-amount">
                    Amount to Collect (₹) <span>*</span>
                  </label>

                  <input
                    id="payment-amount"
                    type="number"
                    name="amount"
                    min="0.01"
                    max={balanceBeforePayment}
                    step="0.01"
                    placeholder="Enter amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentFormChange}
                    required
                  />

                  <small>
                    Remaining balance:{" "}
                    {formatCurrency(balanceBeforePayment)}
                  </small>
                </div>

                {/* PAYMENT METHOD */}

                <div className="collect-payment-field">
                  <label htmlFor="payment-method">
                    Payment Method <span>*</span>
                  </label>

                  <div className="collect-payment-input-icon">
                    <CreditCard size={18} />

                    <select
                      id="payment-method"
                      name="payment_method"
                      value={paymentForm.payment_method}
                      onChange={handlePaymentFormChange}
                      required
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank">
                        Bank Transfer
                      </option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                </div>

                {/* PAYMENT DATE */}

                <div className="collect-payment-field">
                  <label htmlFor="payment-date">
                    Payment Date <span>*</span>
                  </label>

                  <div className="collect-payment-input-icon">
                    <CalendarDays size={18} />

                    <input
                      id="payment-date"
                      type="date"
                      name="payment_date"
                      value={paymentForm.payment_date}
                      onChange={handlePaymentFormChange}
                      required
                    />
                  </div>
                </div>

                {/* REFERENCE NUMBER */}

                <div className="collect-payment-field">
                  <label htmlFor="payment-reference">
                    Reference Number (optional)
                  </label>

                  <input
                    id="payment-reference"
                    type="text"
                    name="reference_number"
                    placeholder="UPI ID, cheque no..."
                    value={paymentForm.reference_number}
                    onChange={handlePaymentFormChange}
                  />
                </div>

                {/* NOTES */}

                <div className="collect-payment-field">
                  <label htmlFor="payment-notes">
                    Notes (optional)
                  </label>

                  <textarea
                    id="payment-notes"
                    name="notes"
                    rows="3"
                    placeholder="Optional notes..."
                    value={paymentForm.notes}
                    onChange={handlePaymentFormChange}
                  />
                </div>

                {/* ERRORS */}

                {collectPaymentError && (
                  <div className="collect-payment-error">
                    {collectPaymentError}
                  </div>
                )}

                {/* FOOTER ACTIONS */}

                <div className="collect-payment-actions">
                  <button
                    type="button"
                    className="collect-payment-cancel"
                    onClick={closeCollectPayment}
                    disabled={paymentSaving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="collect-payment-submit"
                    disabled={
                      paymentSaving ||
                      balanceBeforePayment <= 0
                    }
                  >
                    {paymentSaving
                      ? "Saving..."
                      : `Collect ${formatCurrency(
                          currentPayment
                        )}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    );
  };

  // =====================================================
  // BILL DETAILS SCREEN
  // =====================================================

  if (selectedBill) {
    return renderBillDetails();
  }

  // =====================================================
  // BILLS LIST SCREEN
  // =====================================================

  return (
    <div className="bills-page">
      {/* HEADER */}

      <div className="bills-header">
        <div className="bills-title-section">
          <div className="bills-title-icon">
            <FileText size={22} />
          </div>

          <div>
            <h1>Bills</h1>
            <p>{allBills} total bills</p>
          </div>
        </div>
      </div>

      {/* STATUS CARDS */}

      <div className="bill-status-grid">
        <button
          className={`bill-status-card all ${
            filter === "all" ? "active" : ""
          }`}
          onClick={() => setFilter("all")}
        >
          <span>All Bills</span>
          <strong>{allBills}</strong>
        </button>

        <button
          className={`bill-status-card unpaid ${
            filter === "unpaid" ? "active" : ""
          }`}
          onClick={() => setFilter("unpaid")}
        >
          <span>Unpaid</span>
          <strong>{unpaidBills}</strong>
        </button>

        <button
          className={`bill-status-card partial ${
            filter === "partial" ? "active" : ""
          }`}
          onClick={() => setFilter("partial")}
        >
          <span>Partially Paid</span>
          <strong>{partialBills}</strong>
        </button>

        <button
          className={`bill-status-card paid ${
            filter === "paid" ? "active" : ""
          }`}
          onClick={() => setFilter("paid")}
        >
          <span>Paid</span>
          <strong>{paidBills}</strong>
        </button>

        <button
          className={`bill-status-card cancelled ${
            filter === "cancelled" ? "active" : ""
          }`}
          onClick={() => setFilter("cancelled")}
        >
          <span>Cancelled</span>
          <strong>{cancelledBills}</strong>
        </button>
      </div>

      {/* SEARCH */}

      <div className="bills-search-row">
        <div className="bills-search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by bill # or customer..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
      </div>

      {/* FILTER BUTTONS */}

      <div className="bill-filter-buttons">
        {[
          ["all", "All"],
          ["unpaid", "Unpaid"],
          ["partial", "Partial"],
          ["paid", "Paid"],
          ["cancelled", "Cancelled"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TOTAL SUMMARY */}

      <div className="bill-summary-grid">
        <div className="bill-summary-card">
          <span>Total Billed</span>
          <strong>{formatCurrency(totalBilled)}</strong>
        </div>

        <div className="bill-summary-card paid-summary">
          <span>Total Paid</span>
          <strong>{formatCurrency(totalPaid)}</strong>
        </div>

        <div className="bill-summary-card outstanding-summary">
          <span>Total Outstanding</span>
          <strong>{formatCurrency(totalOutstanding)}</strong>
        </div>
      </div>

      {/* LOADING */}

      {loading && (
        <div className="bills-message">
          Loading bills...
        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div className="bills-message error">
          <p>{error}</p>

          <button onClick={fetchData}>
            Retry
          </button>
        </div>
      )}

      {/* BILL CARDS */}

      {!loading && !error && (
        <div className="bills-list">
          {filteredBills.map((bill) => (
            <div
              className="bill-card"
              key={bill.id}
              onClick={() => handleViewBill(bill)}
            >
              <div className="bill-card-top">
                <div>
                  <span className="bill-number">
                    #{bill.id}
                  </span>

                  <h2>{bill.customer_name || "-"}</h2>
                </div>

                <span
                  className={`bill-status-badge ${
                    bill.status
                      .toLowerCase()
                      .replace(" ", "-")
                  }`}
                >
                  {bill.status.toUpperCase()}
                </span>
              </div>

              <div className="bill-card-details">
                <div>
                  <span>Site</span>
                  <strong>{bill.site_name || "-"}</strong>
                </div>

                <div>
                  <span>Bill Date</span>
                  <strong>{formatDate(bill.rental_date)}</strong>
                </div>
              </div>

              <div className="bill-card-amounts">
                <div>
                  <span>Total</span>
                  <strong>
                    {formatCurrency(bill.total_amount)}
                  </strong>
                </div>

                <div>
                  <span>Paid</span>
                  <strong className="bill-paid">
                    {formatCurrency(bill.paidAmount)}
                  </strong>
                </div>

                <div>
                  <span>Balance</span>

                  <strong
                    className={
                      bill.outstanding > 0
                        ? "bill-balance-due"
                        : "bill-balance-clear"
                    }
                  >
                    {formatCurrency(bill.outstanding)}
                  </strong>
                </div>
              </div>

              <div className="bill-card-bottom">
                <span>Rental #{bill.id}</span>

                <button
                  type="button"
                  className="bill-view-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleViewBill(bill);
                  }}
                >
                  <Eye size={16} />
                  View
                </button>
              </div>
            </div>
          ))}

          {filteredBills.length === 0 && (
            <div className="bills-empty">
              No bills found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Bills;