import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { auth, db } from "../firebase/config";
import Navbar from "../components/Navbar";
import "./Home.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function Home() {
  const navigate = useNavigate();

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoryNames = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Education",
    "Entertainment",
    "Health",
    "Other"
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const user = auth.currentUser;

        if (!user) {
          setIncome([]);
          setExpenses([]);
          setLoading(false);
          return;
        }

        const uid = user.uid;

        // Get income for current user
        const incomeQuery = query(
          collection(db, "income"),
          where("userId", "==", uid)
        );

        // Get expenses for current user
        const expenseQuery = query(
          collection(db, "expenses"),
          where("userId", "==", uid)
        );

        const [incomeSnapshot, expenseSnapshot] =
          await Promise.all([
            getDocs(incomeQuery),
            getDocs(expenseQuery)
          ]);

        const incomeData = incomeSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data()
          })
        );

        const expenseData = expenseSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data()
          })
        );

        setIncome(incomeData);
        setExpenses(expenseData);

      } catch (error) {
        console.error(
          "Error loading dashboard data:",
          error
        );

        setIncome([]);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // -----------------------------
  // TOTALS
  // -----------------------------

  const totalIncome = income.reduce(
    (total, item) =>
      total + Number(item.amount || 0),
    0
  );

  const totalExpenses = expenses.reduce(
    (total, item) =>
      total + Number(item.amount || 0),
    0
  );

  const balance = totalIncome - totalExpenses;

  const totalTransactions =
    income.length + expenses.length;

  // -----------------------------
  // USER NAME
  // -----------------------------

  const user = auth.currentUser;

  const userName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

  // -----------------------------
  // CATEGORY TOTALS
  // -----------------------------

  const categoryTotals = {};

  categoryNames.forEach((category) => {
    categoryTotals[category] = 0;
  });

  expenses.forEach((expense) => {
    const category = expense.category || "Other";

    if (
      Object.prototype.hasOwnProperty.call(
        categoryTotals,
        category
      )
    ) {
      categoryTotals[category] += Number(
        expense.amount || 0
      );
    } else {
      categoryTotals["Other"] += Number(
        expense.amount || 0
      );
    }
  });

  // -----------------------------
  // CHART DATA
  // -----------------------------

  const chartData = {
    labels: categoryNames,

    datasets: [
      {
        data: categoryNames.map(
          (category) =>
            categoryTotals[category]
        ),

        backgroundColor: [
          "#3B82F6",
          "#F59E0B",
          "#10B981",
          "#8B5CF6",
          "#14B8A6",
          "#EC4899",
          "#EF4444",
          "#64748B"
        ],

        borderWidth: 0,

        hoverOffset: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,

    maintainAspectRatio: false,

    cutout: "58%",

    plugins: {
      legend: {
        display: true,

        position: "right",

        labels: {
          usePointStyle: true,

          pointStyle: "circle",

          padding: 18,

          font: {
            size: 13
          }
        }
      },

      tooltip: {
        callbacks: {
          label: function (context) {
            const value =
              Number(context.raw || 0);

            return ` ${context.label}: ₹${value.toLocaleString(
              "en-IN"
            )}`;
          }
        }
      }
    }
  };

  // -----------------------------
  // RECENT TRANSACTIONS
  // -----------------------------

  const recentTransactions = [
    ...income.map((item) => ({
      ...item,
      transactionType: "income"
    })),

    ...expenses.map((item) => ({
      ...item,
      transactionType: "expense"
    }))
  ]
    .sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";

      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);

  // -----------------------------
  // HIGHEST / LOWEST EXPENSE
  // -----------------------------

  const highestExpense =
    expenses.length > 0
      ? expenses.reduce((highest, current) =>
          Number(current.amount || 0) >
          Number(highest.amount || 0)
            ? current
            : highest
        )
      : null;

  const lowestExpense =
    expenses.length > 0
      ? expenses.reduce((lowest, current) =>
          Number(current.amount || 0) <
          Number(lowest.amount || 0)
            ? current
            : lowest
        )
      : null;

  // -----------------------------
  // FORMAT CURRENCY
  // -----------------------------

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN"
    )}`;
  };

  // -----------------------------
  // FORMAT DATE
  // -----------------------------

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          year: "numeric",
          month: "short",
          day: "numeric"
        }
      );
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Navbar />

        <main className="main-content home-page">
          <div className="home-loading">
            Loading your financial data...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content home-page">

        {/* HEADER */}
        <div className="home-header">
          <div>
            <h1>
              Hello, {userName} 👋
            </h1>

            <p>
              Here's your financial overview.
            </p>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="summary-grid">

          {/* INCOME */}
          <div className="summary-card">

            <div className="summary-icon income-summary-icon">
              ↗
            </div>

            <div className="summary-content">

              <span>
                Total Income
              </span>

              <strong>
                {formatCurrency(totalIncome)}
              </strong>

              <small className="income-text">
                {income.length > 0
                  ? "↑ Income recorded"
                  : "No income added"}
              </small>

            </div>

          </div>

          {/* EXPENSE */}
          <div className="summary-card">

            <div className="summary-icon expense-summary-icon">
              ↘
            </div>

            <div className="summary-content">

              <span>
                Total Expenses
              </span>

              <strong>
                {formatCurrency(totalExpenses)}
              </strong>

              <small className="expense-text">
                {expenses.length > 0
                  ? "↓ Expenses recorded"
                  : "No expenses added"}
              </small>

            </div>

          </div>

          {/* BALANCE */}
          <div className="summary-card">

            <div className="summary-icon balance-summary-icon">
              ₹
            </div>

            <div className="summary-content">

              <span>
                Available Balance
              </span>

              <strong>
                {formatCurrency(balance)}
              </strong>

              <small className="balance-text">
                {totalTransactions > 0
                  ? "↑ Current balance"
                  : "No financial activity"}
              </small>

            </div>

          </div>

          {/* TRANSACTIONS */}
          <div className="summary-card transaction-card">

            <div className="summary-icon transaction-summary-icon">
              ▦
            </div>

            <div className="summary-content">

              <span>
                Total Transactions
              </span>

              <strong>
                {totalTransactions}
              </strong>

              <small className="transaction-text">
                {totalTransactions > 0
                  ? "All transactions"
                  : "No transactions"}
              </small>

            </div>

          </div>

        </div>

        {/* MAIN DASHBOARD GRID */}
        <div className="dashboard-grid">

          {/* PIE CHART */}
          <section className="chart-card">

            <div className="section-heading">

              <h2>
                Spending by Category
              </h2>

              <p>
                Your expense distribution
              </p>

            </div>

            <div className="chart-wrapper">

              {totalExpenses > 0 ? (
                <Doughnut
                  data={chartData}
                  options={chartOptions}
                />
              ) : (
                <div className="empty-chart">

                  <div className="empty-doughnut">
                    <div>
                      <strong>₹0</strong>
                      <span>
                        Total Expenses
                      </span>
                    </div>
                  </div>

                  <div className="empty-legend">

                    {categoryNames.map(
                      (category, index) => (
                        <div
                          className="legend-row"
                          key={category}
                        >

                          <span
                            className="legend-dot"
                            style={{
                              backgroundColor:
                                chartData.datasets[0]
                                  .backgroundColor[
                                  index
                                ]
                            }}
                          />

                          <span>
                            {category}
                          </span>

                          <strong>
                            ₹0
                          </strong>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            </div>

          </section>

          {/* RIGHT SIDE */}
          <div className="right-dashboard">

            {/* MESSAGE CARD */}
            <div className="goal-card">

              <div className="goal-icon">
                🌱
              </div>

              <h3>
                Small steps lead to big
                financial goals!
              </h3>

              <p>
                Track your expenses, save
                more and live better.
              </p>

            </div>

            {/* QUICK ACTIONS */}
            <div className="quick-actions-card">

              <div className="quick-title">
                <span>⚡</span>

                <h3>
                  Quick Actions
                </h3>
              </div>

              <div className="quick-buttons">

                <button
                  className="add-income-btn"
                  onClick={() =>
                    navigate("/add-income")
                  }
                >
                  + Add Income
                </button>

                <button
                  className="add-expense-btn"
                  onClick={() =>
                    navigate("/add-expense")
                  }
                >
                  − Add Expense
                </button>

              </div>

            </div>

            {/* QUICK STATS */}
            <div className="quick-stats-card">

              <div className="quick-title">
                <span>📊</span>

                <h3>
                  Quick Stats
                </h3>
              </div>

              {expenses.length === 0 ? (
                <div className="no-expense-data">
                  No expense data yet.
                </div>
              ) : (
                <div className="stats-list">

                  <div className="stat-item">

                    <div>
                      <span>
                        Highest Expense
                      </span>

                      <strong>
                        {highestExpense?.category ||
                          "Other"}
                      </strong>
                    </div>

                    <b>
                      {formatCurrency(
                        highestExpense?.amount
                      )}
                    </b>

                  </div>

                  <div className="stat-item">

                    <div>
                      <span>
                        Lowest Expense
                      </span>

                      <strong>
                        {lowestExpense?.category ||
                          "Other"}
                      </strong>
                    </div>

                    <b>
                      {formatCurrency(
                        lowestExpense?.amount
                      )}
                    </b>

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* RECENT TRANSACTIONS */}
        <section className="recent-card">

          <div className="recent-heading">

            <div>
              <h2>
                Recent Transactions
              </h2>

              <p>
                Your latest financial activities.
              </p>
            </div>

            {totalTransactions > 0 && (
              <button
                className="view-reports-btn"
                onClick={() =>
                  navigate("/reports")
                }
              >
                View Reports
              </button>
            )}

          </div>

          {recentTransactions.length === 0 ? (
            <div className="no-transactions">
              <span>💰</span>

              <h3>
                No transactions yet
              </h3>

              <p>
                Add your first income or
                expense to see it here.
              </p>
            </div>
          ) : (
            <div className="transactions-list">

              {recentTransactions.map(
                (transaction) => {

                  const isIncome =
                    transaction.transactionType ===
                    "income";

                  return (
                    <div
                      className="transaction-row"
                      key={
                        `${transaction.transactionType}-${transaction.id}`
                      }
                    >

                      <div
                        className={
                          isIncome
                            ? "transaction-icon transaction-income"
                            : "transaction-icon transaction-expense"
                        }
                      >
                        {isIncome ? "+" : "−"}
                      </div>

                      <div className="transaction-details">

                        <strong>
                          {transaction.title ||
                            transaction.description ||
                            "Transaction"}
                        </strong>

                        <span>
                          {transaction.category ||
                            "Other"}
                          {" • "}
                          {formatDate(
                            transaction.date
                          )}
                        </span>

                      </div>

                      <div
                        className={
                          isIncome
                            ? "transaction-amount income-amount"
                            : "transaction-amount expense-amount"
                        }
                      >
                        {isIncome ? "+" : "−"}
                        {formatCurrency(
                          transaction.amount
                        )}
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default Home;