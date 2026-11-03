import React, { useEffect, useMemo, useState } from "react";

import {
  Search,
  Wallet,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import "./Receivables.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const RENTALS_API = `${API_BASE}/api/rentals/rentals/`;
const PAYMENTS_API = `${API_BASE}/api/finance/payments/`;
const CUSTOMERS_API = `${API_BASE}/api/customers/customers/`;

const Receivables = ({ onViewLedger }) => {
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH DATA
  // =========================================================

  useEffect(() => {
    fetchData();
  }, []);

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

      if (!rentalsResponse.ok) {
        throw new Error("Failed to fetch rentals");
      }

      if (!paymentsResponse.ok) {
        throw new Error("Failed to fetch payments");
      }

      if (!customersResponse.ok) {
        throw new Error("Failed to fetch customers");
      }

      const rentalsData = await rentalsResponse.json();
      const paymentsData = await paymentsResponse.json();
      const customersData = await customersResponse.json();

      const rentalList = Array.isArray(rentalsData)
        ? rentalsData
        : rentalsData.results || [];

      const paymentList = Array.isArray(paymentsData)
        ? paymentsData
        : paymentsData.results || [];

      const customerList = Array.isArray(customersData)
        ? customersData
        : customersData.results || [];

      setRentals(rentalList);
      setPayments(paymentList);
      setCustomers(customerList);
    } catch (err) {
      console.error("Receivables error:", err);
      setError("Unable to load receivables.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CUSTOMER ID
  // =========================================================

  const getCustomerId = (rental) => {
    if (
      rental.customer &&
      typeof rental.customer === "object"
    ) {
      return rental.customer.id;
    }

    return (
      rental.customer_id ??
      (typeof rental.customer === "number"
        ? rental.customer
        : null)
    );
  };

  // =========================================================
  // CUSTOMER NAME
  // =========================================================

  const getCustomerName = (rental) => {
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

    const customerId = getCustomerId(rental);

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

    if (rental.customer_name) {
      return rental.customer_name;
    }

    return "Unknown Customer";
  };

  // =========================================================
  // CUSTOMER OBJECT
  // =========================================================

  const getCustomerObject = (rental) => {
    if (
      rental.customer &&
      typeof rental.customer === "object"
    ) {
      return rental.customer;
    }

    const customerId = getCustomerId(rental);

    if (
      customerId !== null &&
      customerId !== undefined
    ) {
      return (
        customers.find(
          (item) =>
            String(item.id) === String(customerId)
        ) || null
      );
    }

    return null;
  };

  // =========================================================
  // RENTAL NUMBER
  // =========================================================

  const getRentalName = (rental) => {
    if (rental.rental_number) {
      return rental.rental_number;
    }

    if (rental.invoice_number) {
      return rental.invoice_number;
    }

    if (rental.id) {
      return `RNT-${String(rental.id).padStart(3, "0")}`;
    }

    return "-";
  };

  // =========================================================
  // RENTAL TOTAL
  // =========================================================

  const getRentalAmount = (rental) => {
    return Number(
      rental.total_amount ??
        rental.total ??
        rental.amount ??
        rental.grand_total ??
        rental.total_rent ??
        0
    );
  };

  // =========================================================
  // PAYMENT RENTAL ID
  // =========================================================

  const getPaymentRentalId = (payment) => {
    if (
      payment.rental &&
      typeof payment.rental === "object"
    ) {
      return payment.rental.id;
    }

    return (
      payment.rental_id ??
      (typeof payment.rental === "number"
        ? payment.rental
        : null)
    );
  };

  // =========================================================
  // PAYMENT AMOUNT
  // =========================================================

  const getPaymentAmount = (payment) => {
    return Number(
      payment.amount ??
        payment.paid_amount ??
        payment.payment_amount ??
        0
    );
  };

  // =========================================================
  // PAID AMOUNT
  // =========================================================

  const getPaidAmount = (rentalId) => {
    return payments
      .filter((payment) => {
        const paymentRentalId =
          getPaymentRentalId(payment);

        return (
          paymentRentalId !== null &&
          paymentRentalId !== undefined &&
          String(paymentRentalId) ===
            String(rentalId)
        );
      })
      .reduce(
        (total, payment) =>
          total + getPaymentAmount(payment),
        0
      );
  };

  // =========================================================
  // RECEIVABLE RENTALS
  // =========================================================

  const receivables = useMemo(() => {
    return rentals.map((rental) => {
      const totalAmount =
        getRentalAmount(rental);

      const paidAmount =
        getPaidAmount(rental.id);

      const balance = Math.max(
        totalAmount - paidAmount,
        0
      );

      let status = "Paid";

      if (paidAmount > totalAmount) {
        status = "Overpaid";
      } else if (
        balance > 0 &&
        paidAmount === 0
      ) {
        status = "Due";
      } else if (
        balance > 0 &&
        paidAmount > 0
      ) {
        status = "Partial";
      }

      return {
        ...rental,
        customerId: getCustomerId(rental),
        customerName: getCustomerName(rental),
        customerObject: getCustomerObject(rental),
        rentalName: getRentalName(rental),
        totalAmount,
        paidAmount,
        balance,
        status,
      };
    });
  }, [rentals, payments, customers]);

  // =========================================================
  // CUSTOMER GROUPS
  // =========================================================

  const customerReceivables = useMemo(() => {
    const grouped = {};

    receivables.forEach((item) => {
      const key =
        item.customerId ??
        item.customerName;

      if (!grouped[key]) {
        grouped[key] = {
          customerId: item.customerId,
          customerName: item.customerName,
          customerObject: item.customerObject,
          rentals: [],
          totalAmount: 0,
          paidAmount: 0,
          balance: 0,
        };
      }

      grouped[key].rentals.push(item);

      grouped[key].totalAmount +=
        item.totalAmount;

      grouped[key].paidAmount +=
        item.paidAmount;

      grouped[key].balance +=
        item.balance;

      if (
        !grouped[key].customerObject &&
        item.customerObject
      ) {
        grouped[key].customerObject =
          item.customerObject;
      }
    });

    return Object.values(grouped).filter(
      (customer) => customer.balance > 0
    );
  }, [receivables]);

  // =========================================================
  // SEARCH + STATUS FILTER
  // =========================================================

  const filteredCustomers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return customerReceivables
      .map((customer) => {
        const filteredRentals =
          customer.rentals.filter((item) => {
            if (
              statusFilter !== "all" &&
              item.status.toLowerCase() !==
                statusFilter.toLowerCase()
            ) {
              return false;
            }

            if (!query) {
              return true;
            }

            return (
              item.customerName
                .toLowerCase()
                .includes(query) ||
              item.rentalName
                .toLowerCase()
                .includes(query)
            );
          });

        const totalAmount =
          filteredRentals.reduce(
            (sum, item) =>
              sum + item.totalAmount,
            0
          );

        const paidAmount =
          filteredRentals.reduce(
            (sum, item) =>
              sum + item.paidAmount,
            0
          );

        const balance =
          filteredRentals.reduce(
            (sum, item) =>
              sum + item.balance,
            0
          );

        return {
          ...customer,
          rentals: filteredRentals,
          totalAmount,
          paidAmount,
          balance,
        };
      })
      .filter(
        (customer) =>
          customer.rentals.length > 0 &&
          customer.balance > 0
      );
  }, [
    customerReceivables,
    search,
    statusFilter,
  ]);

  // =========================================================
  // STATS
  // =========================================================

  const totalReceivable = useMemo(() => {
    return receivables.reduce(
      (total, item) =>
        total + item.balance,
      0
    );
  }, [receivables]);

  const totalPaid = useMemo(() => {
    return receivables.reduce(
      (total, item) =>
        total + item.paidAmount,
      0
    );
  }, [receivables]);

  const totalBilling = useMemo(() => {
    return receivables.reduce(
      (total, item) =>
        total + item.totalAmount,
      0
    );
  }, [receivables]);

  // =========================================================
  // FORMAT MONEY
  // =========================================================

  const formatAmount = (amount) => {
    return Number(
      amount || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (
      Number.isNaN(parsedDate.getTime())
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // LAST BILL
  // =========================================================

  const getLastBill = (customer) => {
    if (!customer.rentals.length) {
      return null;
    }

    return [...customer.rentals].sort(
      (a, b) => {
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
      }
    )[0];
  };

  // =========================================================
  // OUTSTANDING DAYS
  // =========================================================

  const getOutstandingDays = (date) => {
    if (!date) return 0;

    const billDate = new Date(date);

    if (
      Number.isNaN(billDate.getTime())
    ) {
      return 0;
    }

    const today = new Date();

    const difference =
      today.getTime() -
      billDate.getTime();

    return Math.max(
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24)
      ),
      0
    );
  };

  // =========================================================
  // OVER 30 DAYS
  // =========================================================

  const over30DaysCount = useMemo(() => {
    return customerReceivables.filter(
      (customer) => {
        const lastBill =
          getLastBill(customer);

        const date =
          lastBill?.rental_date ||
          lastBill?.created_at;

        return (
          customer.balance > 0 &&
          getOutstandingDays(date) > 30
        );
      }
    ).length;
  }, [customerReceivables]);

  // =========================================================
  // 30 DAYS OR LESS
  // =========================================================

  const within30DaysCount = useMemo(() => {
    return customerReceivables.filter(
      (customer) => {
        const lastBill =
          getLastBill(customer);

        const date =
          lastBill?.rental_date ||
          lastBill?.created_at;

        const days =
          getOutstandingDays(date);

        return (
          customer.balance > 0 &&
          days <= 30
        );
      }
    ).length;
  }, [customerReceivables]);

  // =========================================================
  // VIEW LEDGER
  // =========================================================

  const handleViewLedger = (customer) => {
    if (onViewLedger) {
      onViewLedger(customer);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="receivables-page">

      {/* =====================================================
          REPORT HEADER
      ===================================================== */}

      <div className="receivables-report-header">
  <div className="receivables-report-title">
    <h1>Receivables Report</h1>

    <p>
      Customers with outstanding balances
    </p>
  </div>

  <div className="total-receivable-box">
    <span>Total</span>
    <span>Receivable</span>

    <strong>
      ₹{formatAmount(totalReceivable)}
    </strong>
  </div>
</div>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="receivable-summary-grid">

        {/* ALL RECEIVABLES */}

        <div className="receivable-summary-card active">

          <span>
            All Receivables
          </span>

          <strong>
            {customerReceivables.length}
          </strong>

          <small>
            ₹{formatAmount(totalReceivable)}
          </small>

        </div>


        {/* OVER 30 DAYS */}

        <div className="receivable-summary-card">

          <span>
            Over 30 days
          </span>

          <strong className="red-number">
            {over30DaysCount}
          </strong>

        </div>


        {/* 30 DAYS OR LESS */}

        <div className="receivable-summary-card">

          <span>
            30 days or less
          </span>

          <strong className="orange-number">
            {within30DaysCount}
          </strong>

        </div>

      </div>

      {/* =====================================================
          CUSTOMER CARDS
      ===================================================== */}

      <div className="receivables-customers">

        {loading ? (

          <div className="receivables-empty">
            Loading receivables...
          </div>

        ) : error ? (

          <div className="receivables-empty error">
            {error}
          </div>

        ) : filteredCustomers.length === 0 ? (

          <div className="receivables-empty">

            <CheckCircle size={34} />

            <h3>
              No receivables found
            </h3>

            <p>
              All customer payments are
              settled.
            </p>

          </div>

        ) : (

          filteredCustomers.map(
            (customer) => {

              const lastBill =
                getLastBill(customer);

              const lastBillDate =
                lastBill?.rental_date ||
                lastBill?.created_at;

              const outstandingDays =
                getOutstandingDays(
                  lastBillDate
                );

              return (
                <div
                  className="receivable-report-card"
                  key={
                    customer.customerId ??
                    customer.customerName
                  }
                >

                  <div className="receivable-report-info">

                    <h3>
                      {customer.customerName}
                    </h3>

                    <p>
                      Last bill:{" "}
                      {formatDate(
                        lastBillDate
                      )}
                      {" "}•{" "}
                      {outstandingDays}d
                      {" "}outstanding
                    </p>

                    <button
                      className="report-view-ledger"
                      onClick={() =>
                        handleViewLedger(
                          customer
                        )
                      }
                    >
                      View Ledger
                      <ArrowRight size={16} />
                    </button>

                  </div>


                  <div className="receivable-report-amount">
                    ₹
                    {formatAmount(
                      customer.balance
                    )}
                  </div>

                </div>
              );
            }
          )

        )}

      </div>

    </div>
  );
};

export default Receivables;