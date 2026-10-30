import React, { useEffect, useMemo, useState } from "react";

import {
  IndianRupee,
  CalendarDays,
} from "lucide-react";

import "./Collections.css";

const PAYMENTS_API =
  "http://127.0.0.1:8000/api/finance/payments/";

const CUSTOMERS_API =
  "http://127.0.0.1:8000/api/customers/customers/";

const RENTALS_API =
  "http://127.0.0.1:8000/api/rentals/rentals/";

const Collections = () => {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rentals, setRentals] = useState([]);

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

  // =========================================================
  // FETCH
  // =========================================================

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
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

      if (!paymentsResponse.ok) {
        throw new Error("Failed to fetch payments");
      }

      if (!customersResponse.ok) {
        throw new Error("Failed to fetch customers");
      }

      if (!rentalsResponse.ok) {
        throw new Error("Failed to fetch rentals");
      }

      const paymentsData =
        await paymentsResponse.json();

      const customersData =
        await customersResponse.json();

      const rentalsData =
        await rentalsResponse.json();

      setPayments(
        Array.isArray(paymentsData)
          ? paymentsData
          : paymentsData.results || []
      );

      setCustomers(
        Array.isArray(customersData)
          ? customersData
          : customersData.results || []
      );

      setRentals(
        Array.isArray(rentalsData)
          ? rentalsData
          : rentalsData.results || []
      );
    } catch (err) {
      console.error("Collections error:", err);
      setError("Unable to load collections.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // AMOUNT
  // =========================================================

  const getAmount = (payment) => {
    return Number(
      payment.amount ??
        payment.paid_amount ??
        payment.payment_amount ??
        0
    );
  };

  // =========================================================
  // CUSTOMER
  // =========================================================

  const getCustomerName = (payment) => {
    if (
      payment.customer &&
      typeof payment.customer === "object"
    ) {
      return (
        payment.customer.name ||
        payment.customer.customer_name ||
        payment.customer.full_name ||
        "Unknown Customer"
      );
    }

    const customerId =
      payment.customer_id ??
      (typeof payment.customer === "number"
        ? payment.customer
        : null);

    if (
      customerId !== null &&
      customerId !== undefined
    ) {
      const customer = customers.find(
        (item) =>
          String(item.id) === String(customerId)
      );

      if (customer) {
        return (
          customer.name ||
          customer.customer_name ||
          customer.full_name ||
          "Unknown Customer"
        );
      }
    }

    if (
      payment.rental?.customer &&
      typeof payment.rental.customer === "object"
    ) {
      return (
        payment.rental.customer.name ||
        payment.rental.customer.customer_name ||
        payment.rental.customer.full_name ||
        "Unknown Customer"
      );
    }

    if (payment.rental?.customer_name) {
      return payment.rental.customer_name;
    }

    const rentalId =
      payment.rental_id ??
      (typeof payment.rental === "number"
        ? payment.rental
        : null);

    if (
      rentalId !== null &&
      rentalId !== undefined
    ) {
      const rental = rentals.find(
        (item) =>
          String(item.id) === String(rentalId)
      );

      if (rental) {
        if (
          rental.customer &&
          typeof rental.customer === "object"
        ) {
          return (
            rental.customer.name ||
            rental.customer.customer_name ||
            rental.customer.full_name ||
            "Unknown Customer"
          );
        }

        const rentalCustomerId =
          rental.customer_id ?? rental.customer;

        if (
          rentalCustomerId !== null &&
          rentalCustomerId !== undefined &&
          typeof rentalCustomerId !== "object"
        ) {
          const customer = customers.find(
            (item) =>
              String(item.id) ===
              String(rentalCustomerId)
          );

          if (customer) {
            return (
              customer.name ||
              customer.customer_name ||
              customer.full_name ||
              "Unknown Customer"
            );
          }
        }

        if (rental.customer_name) {
          return rental.customer_name;
        }
      }
    }

    return "Unknown Customer";
  };

  // =========================================================
  // RENTAL
  // =========================================================

  const getRentalName = (payment) => {
    if (
      payment.rental &&
      typeof payment.rental === "object"
    ) {
      if (payment.rental.rental_number) {
        return payment.rental.rental_number;
      }

      if (payment.rental.invoice_number) {
        return payment.rental.invoice_number;
      }

      if (payment.rental.id) {
        return `RNT-${String(
          payment.rental.id
        ).padStart(3, "0")}`;
      }
    }

    if (typeof payment.rental === "string") {
      return payment.rental;
    }

    const rentalId =
      payment.rental_id ??
      (typeof payment.rental === "number"
        ? payment.rental
        : null);

    if (
      rentalId !== null &&
      rentalId !== undefined
    ) {
      const rental = rentals.find(
        (item) =>
          String(item.id) === String(rentalId)
      );

      if (rental) {
        if (rental.rental_number) {
          return rental.rental_number;
        }

        if (rental.invoice_number) {
          return rental.invoice_number;
        }

        return `RNT-${String(
          rental.id
        ).padStart(3, "0")}`;
      }

      return `RNT-${String(
        rentalId
      ).padStart(3, "0")}`;
    }

    return "-";
  };

  // =========================================================
  // DATE
  // =========================================================

  const getPaymentDate = (payment) => {
    return (
      payment.payment_date ||
      payment.date ||
      payment.created_at ||
      payment.created ||
      null
    );
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // METHOD
  // =========================================================

  const getPaymentMethod = (payment) => {
    return (
      payment.payment_method ||
      payment.method ||
      "Cash"
    );
  };

  // =========================================================
  // REFERENCE
  // =========================================================

  const getPaymentReference = (payment) => {
    return (
      payment.payment_number ||
      payment.payment_id ||
      payment.reference_number ||
      payment.reference ||
      payment.transaction_id ||
      payment.receipt_number ||
      payment.id ||
      "-"
    );
  };

  // =========================================================
  // FILTER
  // =========================================================

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const paymentDate = getPaymentDate(payment);

      if (!paymentDate) {
        return !fromDate && !toDate;
      }

      const date = new Date(paymentDate);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      if (fromDate) {
        const from = new Date(
          `${fromDate}T00:00:00`
        );

        if (date < from) {
          return false;
        }
      }

      if (toDate) {
        const to = new Date(
          `${toDate}T23:59:59`
        );

        if (date > to) {
          return false;
        }
      }

      return true;
    });
  }, [payments, fromDate, toDate]);

  // =========================================================
  // TOTAL
  // =========================================================

  const totalCollections = useMemo(() => {
    return filteredPayments.reduce(
      (total, payment) =>
        total + getAmount(payment),
      0
    );
  }, [filteredPayments]);

  // =========================================================
  // METHOD COUNT
  // =========================================================

  const methodCounts = useMemo(() => {
    const counts = {
      cash: 0,
      upi: 0,
      bank: 0,
      card: 0,
    };

    filteredPayments.forEach((payment) => {
      const method = getPaymentMethod(payment)
        .toLowerCase()
        .trim();

      if (method.includes("cash")) {
        counts.cash++;
      } else if (method.includes("upi")) {
        counts.upi++;
      } else if (
        method.includes("bank") ||
        method.includes("transfer")
      ) {
        counts.bank++;
      } else if (method.includes("card")) {
        counts.card++;
      }
    });

    return counts;
  }, [filteredPayments]);

  // =========================================================
  // FORMAT AMOUNT
  // =========================================================

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="collections-page">

      {/* REPORT HEADER */}

      <div className="collections-report-header">
        <h1>Collections Report</h1>

        <p>
          Payments received in the selected period
        </p>
      </div>

      {/* SUMMARY */}

      <div className="collections-report-grid">

        <div className="report-card all-collections">
          <span>All Collections</span>

          <strong>
            {filteredPayments.length}
          </strong>

          <small>
            ₹{formatAmount(totalCollections)}
          </small>
        </div>

        <div className="report-card">
          <span>Cash</span>

          <strong>
            {methodCounts.cash}
          </strong>
        </div>

        <div className="report-card">
          <span>UPI</span>

          <strong>
            {methodCounts.upi}
          </strong>
        </div>

        <div className="report-card">
          <span>Bank Transfer</span>

          <strong>
            {methodCounts.bank}
          </strong>
        </div>

        <div className="report-card">
          <span>Card</span>

          <strong className="card-count">
            {methodCounts.card}
          </strong>
        </div>

      </div>

      {/* DATES */}

      <div className="collections-dates">

        <div className="date-field">
          <label>From</label>

          <div className="date-input-wrapper">
            <CalendarDays size={16} />

            <input
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(e.target.value)
              }
            />
          </div>
        </div>

        <div className="date-field">
          <label>To</label>

          <div className="date-input-wrapper">
            <CalendarDays size={16} />

            <input
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(e.target.value)
              }
            />
          </div>
        </div>

      </div>

      {/* TOTAL */}

      <div className="collections-total-box">
        ₹{formatAmount(totalCollections)}
      </div>

      {/* PAYMENTS */}

      <div className="collections-payment-list">

        {loading ? (
          <div className="collections-empty">
            Loading collections...
          </div>
        ) : error ? (
          <div className="collections-empty error">
            {error}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="collections-empty">
            <IndianRupee size={30} />

            <h3>
              No collections found
            </h3>

            <p>
              Payments will appear here once
              they are recorded.
            </p>
          </div>
        ) : (
          filteredPayments.map(
            (payment, index) => (
              <div
                className="collection-payment-card"
                key={payment.id || index}
              >

                {/* TOP */}

                <div className="payment-card-top">

                  <span className="payment-reference">
                    {getPaymentReference(payment)}
                  </span>

                  <strong>
                    ₹{formatAmount(
                      getAmount(payment)
                    )}
                  </strong>

                </div>

                {/* MIDDLE */}

                <div className="payment-card-middle">

                  <span>
                    {formatDate(
                      getPaymentDate(payment)
                    )}
                  </span>

                  <span className="payment-dot">
                    •
                  </span>

                  <span>
                    {getPaymentMethod(payment)}
                  </span>

                </div>

                {/* BOTTOM */}

                {/* <div className="payment-extra-info">

                  <span>
                    {getCustomerName(payment)}
                  </span>

                  <span>•</span>

                  <span>
                    {getRentalName(payment)}
                  </span>

                </div> */}

              </div>
            )
          )
        )}

      </div>

    </div>
  );
};

export default Collections;