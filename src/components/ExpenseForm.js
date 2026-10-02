import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { advanceDate } from "../utils/recurring";

function ExpenseForm({ type = "expense" }) {
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [category, setCategory] = useState(
    type === "income" ? "Salary" : "Food"
  );

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("monthly");

  const expenseCategories = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Education",
    "Entertainment",
    "Health",
    "Other"
  ];

  const incomeCategories = [
    "Salary",
    "Freelance",
    "Business",
    "Investment",
    "Other"
  ];

  const categories =
    type === "income"
      ? incomeCategories
      : expenseCategories;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!auth.currentUser) {
      setError("Please login again.");
      return;
    }

    try {
      setLoading(true);

      const user = auth.currentUser;

      /*
        Save every transaction inside the
        logged-in user's transactions collection.

        Firestore path:

        users
          └── user UID
                └── transactions
                      └── transaction
      */

      await addDoc(
        collection(
          db,
          "users",
          user.uid,
          "transactions"
        ),
        {
          type: type,

          description: description.trim(),

          amount: Number(amount),

          category: category,

          date: date,

          recurring: isRecurring,

          frequency: isRecurring ? frequency : null,

          nextDate: isRecurring
            ? advanceDate(date, frequency)
            : null,

          createdAt: serverTimestamp()
        }
      );

      /*
        Clear form after successful save
      */
      setDescription("");
      setAmount("");

      /*
        Go directly to Dashboard
      */
      navigate("/dashboard");

    } catch (err) {
      console.error(
        "Error saving transaction:",
        err
      );

      setError(
        "Unable to save transaction. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">

      <div className="form-heading">

        <div
          className={
            type === "income"
              ? "large-icon income-icon"
              : "large-icon expense-icon"
          }
        >
          {type === "income" ? "+" : "−"}
        </div>

        <div>
          <h2>
            {type === "income"
              ? "Add Income"
              : "Add Expense"}
          </h2>

          <p>
            {type === "income"
              ? "Record a new source of income."
              : "Record a new expense transaction."}
          </p>
        </div>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* DESCRIPTION */}

        <div className="input-group">

          <label>
            Description
          </label>

          <input
            type="text"
            placeholder={
              type === "income"
                ? "e.g. Monthly salary"
                : "e.g. Grocery shopping"
            }
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

        </div>

        {/* AMOUNT + DATE */}

        <div className="input-row">

          <div className="input-group">

            <label>
              Amount
            </label>

            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="₹ 0.00"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
            />

          </div>

          <div className="input-group">

            <label>
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
            />

          </div>

        </div>

        {/* CATEGORY */}

        <div className="input-group">

          <label>
            Category
          </label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >
            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

        </div>

        {/* RECURRING */}

        <div className="input-group recurring-group">

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) =>
                setIsRecurring(e.target.checked)
              }
            />
            Make this a recurring transaction
          </label>

          {isRecurring && (
            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value)
              }
              className="recurring-frequency"
            >
              <option value="daily">Repeats Daily</option>
              <option value="weekly">Repeats Weekly</option>
              <option value="monthly">Repeats Monthly</option>
            </select>
          )}

        </div>

        {/* SUBMIT */}

        <button
          type="submit"
          className={
            type === "income"
              ? "primary-btn income-submit"
              : "primary-btn"
          }
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : type === "income"
            ? "Add Income"
            : "Add Expense"}
        </button>

      </form>

    </div>
  );
}

export default ExpenseForm;