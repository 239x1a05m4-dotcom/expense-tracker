import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Charts from "../components/Charts";
import {
  collection,
  getDocs
} from "firebase/firestore";
import {
  auth,
  db
} from "../firebase/config";

import Papa from "papaparse";
import jsPDF from "jspdf";

function Reports() {

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  // Selected month
  const [selectedMonth, setSelectedMonth] =
    useState(
      new Date().toISOString().slice(0, 7)
    );

  // Report mode: "month" or "range"
  const [reportMode, setReportMode] =
    useState("month");

  const todayStr = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] =
    useState(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0]
    );

  const [endDate, setEndDate] =
    useState(todayStr);

  useEffect(() => {

    const loadData = async () => {

      if (!auth.currentUser) return;

      try {

        const snapshot =
          await getDocs(
            collection(
              db,
              "users",
              auth.currentUser.uid,
              "transactions"
            )
          );

        const data =
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }));

        setTransactions(data);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }
    };

    loadData();

  }, []);


  // -----------------------------------
  // MONTHLY TRANSACTIONS
  // -----------------------------------

  const monthlyTransactions =
    reportMode === "range"
      ? transactions.filter(
          (item) =>
            item.date &&
            item.date >= startDate &&
            item.date <= endDate
        )
      : transactions.filter(
          (item) =>
            item.date &&
            item.date.startsWith(selectedMonth)
        );


  // -----------------------------------
  // INCOME
  // -----------------------------------

  const income =
    monthlyTransactions
      .filter(
        (item) =>
          item.type === "income"
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );


  // -----------------------------------
  // EXPENSES
  // -----------------------------------

  const expenses =
    monthlyTransactions
      .filter(
        (item) =>
          item.type === "expense"
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );


  // -----------------------------------
  // BALANCE
  // -----------------------------------

  const balance =
    income - expenses;


  // -----------------------------------
  // CURRENCY FORMAT
  // -----------------------------------

  const formatCurrency = (value) =>
    `₹${Number(value).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;


  // -----------------------------------
  // EXPENSE TRANSACTIONS
  // -----------------------------------

  const expenseTransactions =
    monthlyTransactions.filter(
      (item) =>
        item.type === "expense"
    );


  // -----------------------------------
  // CATEGORY TOTALS
  // -----------------------------------

  const categoryTotals = {};

  expenseTransactions.forEach(
    (item) => {

      const category =
        item.category || "Other";

      if (
        !categoryTotals[category]
      ) {

        categoryTotals[category] = 0;

      }

      categoryTotals[category] +=
        Number(item.amount || 0);

    }
  );


  // -----------------------------------
  // SORT CATEGORIES
  // -----------------------------------

  const categories =
    Object.entries(
      categoryTotals
    ).sort(
      (a, b) =>
        b[1] - a[1]
    );


  // -----------------------------------
  // MONTH NAME
  // -----------------------------------

  const monthName =
    new Date(
      `${selectedMonth}-01`
    ).toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric"
      }
    );

  // -----------------------------------
  // PERIOD LABEL (works for both modes)
  // -----------------------------------

  const periodLabel =
    reportMode === "range"
      ? `${startDate} to ${endDate}`
      : monthName;

  const periodSlug =
    reportMode === "range"
      ? `${startDate}_to_${endDate}`
      : selectedMonth;


  // -----------------------------------
  // SPENDING ANALYSIS
  // -----------------------------------

  let analysis =
    "Add transactions to generate your spending analysis.";

  if (expenses > 0) {

    if (balance < 0) {

      analysis =
        "Your expenses are currently higher than your recorded income. Review your spending categories and consider reducing unnecessary expenses.";

    } else if (
      categories.length > 0
    ) {

      analysis =
        `Your highest spending category is ${categories[0][0]}, with ${formatCurrency(categories[0][1])} spent in this category. Your current balance is ${formatCurrency(balance)}.`;

    }

  } else if (
    monthlyTransactions.length > 0
  ) {

    analysis =
      `You have no recorded expenses for ${periodLabel}. Your current balance is ${formatCurrency(balance)}.`;

  }


  // -----------------------------------
  // EXPORT CSV
  // -----------------------------------

  const exportCSV = () => {

    if (
      monthlyTransactions.length === 0
    ) {

      alert(
        "No transactions available for this month."
      );

      return;
    }


    const csvData =
      monthlyTransactions.map(
        (item) => ({

          Date:
            item.date || "",

          Type:
            item.type || "",

          Description:
            item.description || "",

          Category:
            item.category || "Other",

          Amount:
            Number(
              item.amount || 0
            ).toFixed(2)

        })
      );


    const csv =
      Papa.unparse(csvData);


    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    link.href = url;


    link.download =
      `expense-report-${periodSlug}.csv`;


    document.body.appendChild(link);


    link.click();


    document.body.removeChild(link);


    URL.revokeObjectURL(url);

  };


  // -----------------------------------
  // EXPORT PDF
  // -----------------------------------

  const exportPDF = () => {

    if (
      monthlyTransactions.length === 0
    ) {

      alert(
        "No transactions available for this month."
      );

      return;
    }


    const doc =
      new jsPDF();


    // Title
    doc.setFontSize(18);

    doc.text(
      "Expense Tracker - Monthly Report",
      20,
      20
    );


    // Month
    doc.setFontSize(12);

    doc.text(
      `Period: ${periodLabel}`,
      20,
      32
    );


    // Summary
    doc.text(
      `Total Income: ${formatCurrency(income)}`,
      20,
      45
    );

    doc.text(
      `Total Expenses: ${formatCurrency(expenses)}`,
      20,
      55
    );

    doc.text(
      `Net Balance: ${formatCurrency(balance)}`,
      20,
      65
    );


    // Transactions
    doc.setFontSize(14);

    doc.text(
      "Transactions",
      20,
      82
    );


    let y = 92;

    doc.setFontSize(9);


    monthlyTransactions.forEach(
      (item, index) => {

        const text =
          `${index + 1}. ${item.date || ""} | ` +
          `${item.type || ""} | ` +
          `${item.category || "Other"} | ` +
          `${item.description || ""} | ` +
          `₹${Number(item.amount || 0).toFixed(2)}`;


        const lines =
          doc.splitTextToSize(
            text,
            170
          );


        doc.text(
          lines,
          20,
          y
        );


        y +=
          6 * lines.length;


        if (y > 270) {

          doc.addPage();

          y = 20;

        }

      }
    );


    // Spending analysis
    doc.setFontSize(14);

    doc.text(
      "Spending Analysis",
      20,
      y + 10
    );


    doc.setFontSize(10);


    const analysisLines =
      doc.splitTextToSize(
        analysis,
        170
      );


    doc.text(
      analysisLines,
      20,
      y + 20
    );


    // Save
    doc.save(
      `expense-report-${periodSlug}.pdf`
    );

  };


  return (

    <div className="app-layout">

      <Navbar />

      <main className="main-content">


        {/* HEADER */}

        <header className="page-header">

          <div>

            <h1>
              Monthly Reports
            </h1>

            <p>
              Analyze your financial activity
              and spending patterns.
            </p>

          </div>


          {/* MONTH / RANGE + EXPORT */}

          <div className="report-controls">

            <div>

              <label>
                Report Type
              </label>

              <div className="report-mode-toggle">
                <button
                  type="button"
                  className={
                    reportMode === "month"
                      ? "secondary-btn active"
                      : "secondary-btn"
                  }
                  onClick={() => setReportMode("month")}
                >
                  Month
                </button>

                <button
                  type="button"
                  className={
                    reportMode === "range"
                      ? "secondary-btn active"
                      : "secondary-btn"
                  }
                  onClick={() => setReportMode("range")}
                >
                  Date Range
                </button>
              </div>

            </div>

            {reportMode === "month" ? (
              <div>

                <label>
                  Select Month
                </label>

                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(
                      e.target.value
                    )
                  }
                />

              </div>
            ) : (
              <>
                <div>
                  <label>From</label>

                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(e) =>
                      setStartDate(e.target.value)
                    }
                  />
                </div>

                <div>
                  <label>To</label>

                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={todayStr}
                    onChange={(e) =>
                      setEndDate(e.target.value)
                    }
                  />
                </div>
              </>
            )}


            <div className="report-actions">

              <button
                className="secondary-btn"
                onClick={exportCSV}
              >
                Export CSV
              </button>


              <button
                className="primary-btn"
                onClick={exportPDF}
              >
                Export PDF
              </button>

            </div>

          </div>

        </header>


        {loading ? (

          <div className="loading-box">

            Loading reports...

          </div>

        ) : (

          <>


            {/* SUMMARY */}

            <div className="summary-grid">


              <div className="summary-card">

                <div className="summary-icon income">
                  ↗
                </div>

                <div>

                  <p>
                    Total Income
                  </p>

                  <h2>
                    {formatCurrency(income)}
                  </h2>

                </div>

              </div>


              <div className="summary-card">

                <div className="summary-icon expense">
                  ↘
                </div>

                <div>

                  <p>
                    Total Expenses
                  </p>

                  <h2>
                    {formatCurrency(expenses)}
                  </h2>

                </div>

              </div>


              <div className="summary-card">

                <div className="summary-icon balance">
                  ₹
                </div>

                <div>

                  <p>
                    Net Balance
                  </p>

                  <h2>
                    {formatCurrency(balance)}
                  </h2>

                </div>

              </div>


            </div>


            {/* REPORT + CHART */}

            <div className="report-grid">


              <section className="content-card">

                <div className="card-header">

                  <div>

                    <h2>
                      Expense Distribution
                    </h2>

                    <p>
                      Category-wise spending
                      for {periodLabel}.
                    </p>

                  </div>

                </div>


                <Charts
                  transactions={
                    monthlyTransactions
                  }
                />

              </section>


              {/* CATEGORY SUMMARY */}

              <section className="content-card">

                <div className="card-header">

                  <div>

                    <h2>
                      Category Summary
                    </h2>

                    <p>
                      Expense breakdown
                      for {periodLabel}.
                    </p>

                  </div>

                </div>


                {categories.length === 0 ? (

                  <div className="empty-state">

                    <p>
                      No expense records
                      available for this month.
                    </p>

                  </div>

                ) : (

                  <div className="category-summary">

                    {categories.map(
                      ([name, value]) => (

                        <div
                          className="category-summary-item"
                          key={name}
                        >

                          <span>
                            {name}
                          </span>

                          <strong>
                            {formatCurrency(value)}
                          </strong>

                        </div>

                      )
                    )}

                  </div>

                )}

              </section>


            </div>


            {/* SPENDING ANALYSIS */}

            <section className="content-card analysis-card">

              <div className="card-header">

                <div>

                  <h2>
                    Spending Analysis
                  </h2>

                  <p>
                    Automated monthly overview
                    of your transactions.
                  </p>

                </div>

              </div>


              <p className="analysis-text">
                {analysis}
              </p>


            </section>


          </>

        )}

      </main>

    </div>

  );

}

export default Reports;
