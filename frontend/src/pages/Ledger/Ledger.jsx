import React, { useEffect, useMemo, useState } from "react";

import "./Ledger.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const RENTALS_API =
  `${API_BASE}/api/rentals/rentals/`;

const PAYMENTS_API =
  `${API_BASE}/api/finance/payments/`;

const EXPENSES_API =
  `${API_BASE}/api/finance/expenses/`;


const formatCurrency = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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


const getArray = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};


const Ledger = () => {

  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const [filter, setFilter] = useState("all");


  useEffect(() => {
    fetchLedgerData();
  }, []);


  const fetchLedgerData = async () => {

    try {

      setLoading(true);
      setError("");

      const [
        rentalsRes,
        paymentsRes,
        expensesRes
      ] = await Promise.all([

        fetch(RENTALS_API),

        fetch(PAYMENTS_API),

        fetch(EXPENSES_API),

      ]);


      if (
        !rentalsRes.ok ||
        !paymentsRes.ok ||
        !expensesRes.ok
      ) {
        throw new Error(
          "Failed to load ledger data."
        );
      }


      const rentalsData =
        await rentalsRes.json();

      const paymentsData =
        await paymentsRes.json();

      const expensesData =
        await expensesRes.json();


      setRentals(
        getArray(rentalsData)
      );

      setPayments(
        getArray(paymentsData)
      );

      setExpenses(
        getArray(expensesData)
      );

    } catch (err) {

      setError(
        err.message ||
        "Something went wrong."
      );

    } finally {

      setLoading(false);

    }
  };


  const entries = useMemo(() => {

    const billEntries = rentals.map(
      (rental) => {

        const customerName =
          rental.customer_name ||
          rental.customer?.name ||
          rental.customer ||
          "Unknown Customer";


        const rentalId = rental.id
          ? `RNT-${String(rental.id).padStart(3, "0")}`
          : "RNT-000";


        return {

          id: `bill-${rental.id}`,

          type: "bill",

          date: rental.rental_date,

          title:
            `Bill to ${customerName}`,

          reference: rentalId,

          amount:
            Number(
              rental.total_amount || 0
            ),
        };
      }
    );


    const paymentEntries = payments.map(
      (payment) => {

        const customerName =
          payment.customer_name ||
          payment.customer?.name ||
          payment.customer ||
          "Unknown Customer";


        const rentalId =
          payment.rental_id ||
          payment.rental?.id ||
          payment.rental;


        return {

          id: `payment-${payment.id}`,

          type: "payment",

          date: payment.payment_date,

          title:
            `Payment from ${customerName}`,

          reference: rentalId
            ? `RNT-${String(rentalId).padStart(3, "0")}`
            : "Payment",

          amount:
            Number(
              payment.amount || 0
            ),
        };
      }
    );


    const expenseEntries =
      expenses.map((expense) => {

        return {

          id:
            `expense-${expense.id}`,

          type: "expense",

          date:
            expense.expense_date,

          title:
            expense.title ||
            "Expense",

          reference:
            "Expense",

          amount:
            Number(
              expense.amount || 0
            ),
        };
      });


    return [

      ...billEntries,

      ...paymentEntries,

      ...expenseEntries,

    ].sort((a, b) => {

      return (
        new Date(b.date || 0) -
        new Date(a.date || 0)
      );

    });

  }, [
    rentals,
    payments,
    expenses
  ]);


  const filteredEntries =
    useMemo(() => {

      return entries.filter(
        (entry) => {

          const matchesType =
            filter === "all" ||
            entry.type === filter;


          const entryDate =
            entry.date
              ? new Date(
                  `${entry.date}T00:00:00`
                )
              : null;


          const matchesFrom =
            !fromDate ||
            (
              entryDate &&
              entryDate >=
                new Date(
                  `${fromDate}T00:00:00`
                )
            );


          const matchesTo =
            !toDate ||
            (
              entryDate &&
              entryDate <=
                new Date(
                  `${toDate}T23:59:59`
                )
            );


          return (
            matchesType &&
            matchesFrom &&
            matchesTo
          );
        }
      );

    }, [
      entries,
      filter,
      fromDate,
      toDate
    ]);


  const stats = useMemo(() => {

    const bills =
      filteredEntries.filter(
        (entry) =>
          entry.type === "bill"
      );


    const paymentEntries =
      filteredEntries.filter(
        (entry) =>
          entry.type === "payment"
      );


    const expenseEntries =
      filteredEntries.filter(
        (entry) =>
          entry.type === "expense"
      );


    /*
      IMPORTANT

      Total In = Payments ONLY

      Bills are not counted as money received.
    */

    const totalIn =
      paymentEntries.reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );


    const totalOut =
      expenseEntries.reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );


    const net =
      totalIn - totalOut;


    return {

      all:
        filteredEntries.length,

      bills:
        bills.length,

      payments:
        paymentEntries.length,

      expenses:
        expenseEntries.length,

      totalIn,

      totalOut,

      net,

    };

  }, [filteredEntries]);


  return (

    <div className="ledger-page">


      {/* HEADER */}

      <div className="ledger-header">

        <div>

          <div className="ledger-title-row">

            <div className="ledger-title-icon">
              ₹
            </div>


            <div>

              <h1>
                Ledger
              </h1>

              <p>
                Every bill, payment and expense
                recorded in the selected period
              </p>

            </div>

          </div>

        </div>

      </div>



      {/* STAT CARDS */}

      <div className="ledger-stat-grid">


        <div
          className={`ledger-stat-card all ${
            filter === "all"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setFilter("all")
          }
        >

          <span>
            All Entries
          </span>

          <strong>
            {stats.all}
          </strong>

        </div>



        <div
          className={`ledger-stat-card bills ${
            filter === "bill"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setFilter("bill")
          }
        >

          <span>
            Bills
          </span>

          <strong>
            {stats.bills}
          </strong>

        </div>



        <div
          className={`ledger-stat-card payments ${
            filter === "payment"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setFilter("payment")
          }
        >

          <span>
            Payments
          </span>

          <strong>
            {stats.payments}
          </strong>

        </div>



        <div
          className={`ledger-stat-card expenses ${
            filter === "expense"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setFilter("expense")
          }
        >

          <span>
            Expenses
          </span>

          <strong>
            {stats.expenses}
          </strong>

        </div>


      </div>



      {/* DATE FILTER */}

      <div className="ledger-filter-panel">


        <div className="ledger-filter-item">

          <label>
            From
          </label>

          <input
            type="date"
            value={fromDate}
            onChange={(e) =>
              setFromDate(
                e.target.value
              )
            }
          />

        </div>



        <div className="ledger-filter-item">

          <label>
            To
          </label>

          <input
            type="date"
            value={toDate}
            onChange={(e) =>
              setToDate(
                e.target.value
              )
            }
          />

        </div>



        <button
          className="ledger-clear-btn"
          onClick={() => {

            setFromDate("");
            setToDate("");
            setFilter("all");

          }}
        >

          Clear

        </button>


      </div>



      {/* MONEY SUMMARY */}

      <div className="ledger-money-grid">


        <div className="ledger-money-card total-in">

          <span>
            Total In
          </span>

          <strong>
            {formatCurrency(
              stats.totalIn
            )}
          </strong>

        </div>



        <div className="ledger-money-card total-out">

          <span>
            Total Out
          </span>

          <strong>
            {formatCurrency(
              stats.totalOut
            )}
          </strong>

        </div>



        <div className="ledger-money-card net">

          <span>
            Net
          </span>

          <strong>
            {formatCurrency(
              stats.net
            )}
          </strong>

        </div>


      </div>



      {/* TRANSACTIONS */}

      <div className="ledger-list-panel">


        <div className="ledger-list-header">

          <div>

            <h2>
              Transactions
            </h2>

            <span>
              {filteredEntries.length}
              {" "}
              entries
            </span>

          </div>

        </div>



        {loading && (

          <div className="ledger-message">

            Loading ledger...

          </div>

        )}



        {!loading &&
          error && (

            <div className="ledger-message error">

              {error}

            </div>

          )}



        {!loading &&
          !error &&
          filteredEntries.length === 0 && (

            <div className="ledger-message">

              No transactions found
              for the selected period.

            </div>

          )}



        {!loading &&
          !error &&
          filteredEntries.map(
            (entry) => (

              <div
                className={`ledger-entry ${entry.type}`}
                key={entry.id}
              >


                <div className="ledger-entry-left">


                  <div
                    className={`ledger-entry-badge ${entry.type}`}
                  >

                    {entry.type === "bill" &&
                      "Bill"}

                    {entry.type === "payment" &&
                      "Payment"}

                    {entry.type === "expense" &&
                      "Expense"}

                  </div>



                  <div className="ledger-entry-info">

                    <h3>
                      {entry.title}
                    </h3>

                    <p>

                      {formatDate(
                        entry.date
                      )}

                      {entry.reference &&
                        ` • ${entry.reference}`}

                    </p>

                  </div>


                </div>



                <div
                  className={`ledger-entry-amount ${entry.type}`}
                >

                  {entry.type === "expense"
                    ? "-"
                    : "+"}

                  {formatCurrency(
                    entry.amount
                  )}

                </div>


              </div>

            )
          )}


      </div>


    </div>

  );
};


export default Ledger;