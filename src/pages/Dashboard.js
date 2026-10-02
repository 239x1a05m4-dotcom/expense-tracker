import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import Navbar from "../components/Navbar";
import Charts from "../components/Charts";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from "firebase/firestore";

import { auth, db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { processRecurringTransactions } from "../utils/recurring";

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Education",
  "Entertainment",
  "Health",
  "Other"
];

function Dashboard() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);

  const [editData, setEditData] = useState({
    description: "",
    amount: "",
    category: "",
    date: "",
    type: "expense"
  });

  // ---------------------------------
  // SEARCH / FILTER / SORT
  // ---------------------------------

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  // ---------------------------------
  // MONTHLY BUDGET
  // ---------------------------------

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);

  const loadBudget = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      const budgetRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "budgets",
        currentMonth
      );

      const snapshot = await getDoc(budgetRef);

      if (snapshot.exists()) {
        setMonthlyBudget(Number(snapshot.data().amount || 0));
      } else {
        setMonthlyBudget(0);
      }
    } catch (error) {
      console.error("Error loading budget:", error);
    }
  }, [currentMonth]);

  const saveBudget = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) return;
    if (!budgetInput || Number(budgetInput) < 0) return;

    try {
      setSavingBudget(true);

      await setDoc(
        doc(
          db,
          "users",
          auth.currentUser.uid,
          "budgets",
          currentMonth
        ),
        { amount: Number(budgetInput) },
        { merge: true }
      );

      setMonthlyBudget(Number(budgetInput));
      setShowBudgetModal(false);
    } catch (error) {
      console.error("Error saving budget:", error);
    } finally {
      setSavingBudget(false);
    }
  };

  const openBudgetModal = () => {
    setBudgetInput(monthlyBudget ? String(monthlyBudget) : "");
    setShowBudgetModal(true);
  };

  const loadTransactions = useCallback(async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const userId = auth.currentUser.uid;

      // Turn any due recurring templates into real transactions
      // before reading the list, so today's entries show up.
      await processRecurringTransactions(userId);

      const transactionsRef = collection(
        db,
        "users",
        userId,
        "transactions"
      );

      const snapshot = await getDocs(
        transactionsRef
      );

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      data.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);

        return dateB - dateA;
      });

      setTransactions(data);
    } catch (error) {
      console.error(
        "Error loading transactions:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadBudget();
  }, [loadTransactions, loadBudget]);

  const income = transactions
    .filter(
      (item) => item.type === "income"
    )
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const expense = transactions
    .filter(
      (item) => item.type === "expense"
    )
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const balance = income - expense;

  const formatCurrency = (value) =>
    `₹${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  // ---------------------------------
  // BUDGET PROGRESS (current month)
  // ---------------------------------

  const monthlyExpense = transactions
    .filter(
      (item) =>
        item.type === "expense" &&
        item.date &&
        item.date.startsWith(currentMonth)
    )
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  const budgetPercent =
    monthlyBudget > 0
      ? Math.min(
          100,
          Math.round((monthlyExpense / monthlyBudget) * 100)
        )
      : 0;

  const budgetStatus =
    monthlyBudget > 0 && monthlyExpense >= monthlyBudget
      ? "over"
      : monthlyBudget > 0 && monthlyExpense >= monthlyBudget * 0.8
      ? "warning"
      : "ok";

  // ---------------------------------
  // SEARCH / FILTER / SORT
  // ---------------------------------

  const isFiltering =
    searchTerm.trim() !== "" ||
    filterType !== "all" ||
    filterCategory !== "all" ||
    sortBy !== "date-desc";

  const visibleTransactions = transactions
    .filter((item) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        (item.description || "")
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase()) ||
        (item.category || "")
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());

      const matchesType =
        filterType === "all" || item.type === filterType;

      const matchesCategory =
        filterCategory === "all" ||
        item.category === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "date-asc") {
        return new Date(a.date || 0) - new Date(b.date || 0);
      }

      if (sortBy === "amount-desc") {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }

      if (sortBy === "amount-asc") {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }

      // default: date-desc
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

  const transactionsToShow = isFiltering
    ? visibleTransactions
    : visibleTransactions.slice(0, 6);

  const deleteTransaction = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) return;

    if (!auth.currentUser) return;

    try {
      await deleteDoc(
        doc(
          db,
          "users",
          auth.currentUser.uid,
          "transactions",
          id
        )
      );

      await loadTransactions();
    } catch (error) {
      console.error(
        "Error deleting transaction:",
        error
      );
    }
  };

  const openEdit = (transaction) => {
    setEditing(transaction.id);

    setEditData({
      description:
        transaction.description || "",
      amount:
        transaction.amount || "",
      category:
        transaction.category || "",
      date:
        transaction.date || "",
      type:
        transaction.type || "expense"
    });
  };

  const saveEdit = async () => {
    if (!editing) return;

    if (!auth.currentUser) return;

    try {
      await updateDoc(
        doc(
          db,
          "users",
          auth.currentUser.uid,
          "transactions",
          editing
        ),
        {
          description:
            editData.description.trim(),

          amount:
            Number(editData.amount),

          category:
            editData.category,

          date:
            editData.date,

          type:
            editData.type
        }
      );

      setEditing(null);

      await loadTransactions();
    } catch (error) {
      console.error(
        "Error updating transaction:",
        error
      );
    }
  };

  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content">

        <header className="page-header">
          <div>
            <h1>Dashboard</h1>

            <p>
              Track your income and expenses in one place.
            </p>
          </div>

          <div className="date-display">
            {new Date().toLocaleDateString(
              "en-IN",
              {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric"
              }
            )}
          </div>
        </header>

        <div className="summary-grid">

          <div className="summary-card">
            <div className="summary-icon income">
              ↗
            </div>

            <div>
              <p>Total Income</p>

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
              <p>Total Expenses</p>

              <h2>
                {formatCurrency(expense)}
              </h2>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon balance">
              ₹
            </div>

            <div>
              <p>Current Balance</p>

              <h2>
                {formatCurrency(balance)}
              </h2>
            </div>
          </div>

        </div>

        <section className="content-card budget-card">

          <div className="card-header">
            <div>
              <h2>Monthly Budget</h2>
              <p>
                Spending progress for{" "}
                {new Date(`${currentMonth}-01`).toLocaleDateString(
                  "en-IN",
                  { month: "long", year: "numeric" }
                )}
                .
              </p>
            </div>

            <button className="view-btn" onClick={openBudgetModal}>
              {monthlyBudget > 0 ? "Edit Budget" : "Set Budget"}
            </button>
          </div>

          {monthlyBudget > 0 ? (
            <>
              {budgetStatus === "over" && (
                <div className="error-message budget-alert">
                  You've gone over your monthly budget of{" "}
                  {formatCurrency(monthlyBudget)}.
                </div>
              )}

              {budgetStatus === "warning" && (
                <div className="budget-alert budget-alert-warning">
                  You've used {budgetPercent}% of your monthly
                  budget — keep an eye on your spending.
                </div>
              )}

              <div className="chart-track budget-track">
                <div
                  className={
                    budgetStatus === "over"
                      ? "chart-bar budget-bar-over"
                      : budgetStatus === "warning"
                      ? "chart-bar budget-bar-warning"
                      : "chart-bar"
                  }
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>

              <div className="budget-summary-row">
                <span>
                  {formatCurrency(monthlyExpense)} spent of{" "}
                  {formatCurrency(monthlyBudget)}
                </span>
                <span>{budgetPercent}%</span>
              </div>
            </>
          ) : (
            <p className="analysis-text">
              You haven't set a budget for this month yet. Set one
              to get spending alerts.
            </p>
          )}

        </section>

        <div className="dashboard-grid">

          <section className="content-card">

            <div className="card-header">

              <div>
                <h2>
                  {isFiltering
                    ? "Transactions"
                    : "Recent Transactions"}
                </h2>

                <p>
                  {isFiltering
                    ? `${transactionsToShow.length} matching transaction${
                        transactionsToShow.length === 1 ? "" : "s"
                      }.`
                    : "Your latest financial activities."}
                </p>
              </div>

              <button
                className="view-btn"
                onClick={() =>
                  navigate("/reports")
                }
              >
                View Reports
              </button>

            </div>

            {transactions.length > 0 && (
              <div className="search-filter-bar">

                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by description or category..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                />

                <select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value)
                  }
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) =>
                    setFilterCategory(e.target.value)
                  }
                >
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Amount: High to Low</option>
                  <option value="amount-asc">Amount: Low to High</option>
                </select>

              </div>
            )}

            {loading ? (
              <div className="loading-box">
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="empty-state">

                <div className="empty-icon">
                  ₹
                </div>

                <h3>
                  No transactions yet
                </h3>

                <p>
                  Add your first income or expense
                  to get started.
                </p>

              </div>
            ) : transactionsToShow.length === 0 ? (
              <div className="empty-state">
                <h3>No matching transactions</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="transaction-list">

                {transactionsToShow
                  .map((transaction) => (

                    <div
                      className="transaction-item"
                      key={transaction.id}
                    >

                      <div className="transaction-info">

                        <div
                          className={
                            transaction.type === "income"
                              ? "transaction-icon income"
                              : "transaction-icon expense"
                          }
                        >
                          {transaction.type === "income"
                            ? "+"
                            : "−"}
                        </div>

                        <div>

                          <h4>
                            {transaction.description ||
                              "Transaction"}
                            {transaction.recurring && (
                              <span
                                className="recurring-badge"
                                title={`Repeats ${transaction.frequency || "monthly"}`}
                              >
                                ⟳
                              </span>
                            )}
                          </h4>

                          <p>
                            {transaction.category ||
                              "Other"}
                            {" • "}
                            {transaction.date || ""}
                          </p>

                        </div>

                      </div>

                      <div className="transaction-right">

                        <strong
                          className={
                            transaction.type === "income"
                              ? "income-text"
                              : "expense-text"
                          }
                        >
                          {transaction.type === "income"
                            ? "+"
                            : "−"}

                          {formatCurrency(
                            Number(
                              transaction.amount || 0
                            )
                          )}
                        </strong>

                        <div className="mini-actions">

                          <button
                            onClick={() =>
                              openEdit(transaction)
                            }
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteTransaction(
                                transaction.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

              </div>
            )}

          </section>

          <section className="content-card">

            <div className="card-header">

              <div>
                <h2>
                  Spending by Category
                </h2>

                <p>
                  Category-wise expense overview.
                </p>
              </div>

            </div>

            <Charts
              transactions={transactions}
            />

          </section>

        </div>

        <section className="content-card">

          <div className="card-header">

            <div>
              <h2>Quick Actions</h2>

              <p>
                Manage your financial records.
              </p>
            </div>

          </div>

          <div className="quick-actions">

            <button
              onClick={() =>
                navigate("/add-income")
              }
              className="quick-action income-action"
            >
              <span>+</span>
              Add Income
            </button>

            <button
              onClick={() =>
                navigate("/add-expense")
              }
              className="quick-action expense-action"
            >
              <span>−</span>
              Add Expense
            </button>

            <button
              onClick={() =>
                navigate("/reports")
              }
              className="quick-action report-action"
            >
              <span>◴</span>
              View Reports
            </button>

          </div>

        </section>

        {editing && (

          <div className="modal-overlay">

            <div className="modal">

              <div className="modal-header">

                <div>
                  <h2>
                    Edit Transaction
                  </h2>

                  <p>
                    Update transaction details.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEditing(null)
                  }
                  className="close-btn"
                >
                  ×
                </button>

              </div>

              <div className="input-group">

                <label>
                  Description
                </label>

                <input
                  value={
                    editData.description
                  }
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      description:
                        e.target.value
                    })
                  }
                />

              </div>

              <div className="input-group">

                <label>
                  Amount
                </label>

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={editData.amount}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      amount:
                        e.target.value
                    })
                  }
                />

              </div>

              <div className="input-group">

                <label>
                  Category
                </label>

                <select
                  value={
                    editData.category
                  }
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      category:
                        e.target.value
                    })
                  }
                >
                  <option value="Food">
                    Food
                  </option>

                  <option value="Transport">
                    Transport
                  </option>

                  <option value="Shopping">
                    Shopping
                  </option>

                  <option value="Bills">
                    Bills
                  </option>

                  <option value="Education">
                    Education
                  </option>

                  <option value="Entertainment">
                    Entertainment
                  </option>

                  <option value="Health">
                    Health
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

              <div className="input-group">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  value={
                    editData.date
                  }
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      date:
                        e.target.value
                    })
                  }
                />

              </div>

              <div className="modal-actions">

                <button
                  className="secondary-btn"
                  onClick={() =>
                    setEditing(null)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-btn"
                  onClick={saveEdit}
                >
                  Save Changes
                </button>

              </div>

            </div>

          </div>

        )}

        {showBudgetModal && (

          <div className="modal-overlay">

            <div className="modal">

              <div className="modal-header">
                <div>
                  <h2>Set Monthly Budget</h2>
                  <p>
                    Get alerted as your spending gets close to this
                    limit.
                  </p>
                </div>

                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveBudget}>
                <div className="input-group">
                  <label>Budget Amount</label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="₹ 0.00"
                    value={budgetInput}
                    onChange={(e) =>
                      setBudgetInput(e.target.value)
                    }
                    autoFocus
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowBudgetModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={savingBudget}
                  >
                    {savingBudget ? "Saving..." : "Save Budget"}
                  </button>
                </div>
              </form>

            </div>

          </div>

        )}

      </main>
    </div>
  );
}

export default Dashboard;