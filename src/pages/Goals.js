import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import Navbar from "../components/Navbar";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [fundingId, setFundingId] = useState(null);
  const [fundAmount, setFundAmount] = useState("");

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const loadGoals = useCallback(async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const snapshot = await getDocs(
        collection(db, "users", auth.currentUser.uid, "goals")
      );

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      data.sort((a, b) => {
        const dateA = a.targetDate ? new Date(a.targetDate) : new Date(8640000000000000);
        const dateB = b.targetDate ? new Date(b.targetDate) : new Date(8640000000000000);
        return dateA - dateB;
      });

      setGoals(data);
    } catch (err) {
      console.error("Error loading goals:", err);
      setError("Unable to load savings goals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a goal name.");
      return;
    }

    if (!targetAmount || Number(targetAmount) <= 0) {
      setError("Please enter a valid target amount.");
      return;
    }

    if (!auth.currentUser) return;

    try {
      setSaving(true);

      await addDoc(
        collection(db, "users", auth.currentUser.uid, "goals"),
        {
          name: name.trim(),
          targetAmount: Number(targetAmount),
          savedAmount: 0,
          targetDate: targetDate || "",
          createdAt: serverTimestamp()
        }
      );

      setName("");
      setTargetAmount("");
      setTargetDate("");
      setShowForm(false);

      await loadGoals();
    } catch (err) {
      console.error("Error adding goal:", err);
      setError("Unable to save this goal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this savings goal? This cannot be undone."
    );

    if (!confirmDelete || !auth.currentUser) return;

    try {
      await deleteDoc(
        doc(db, "users", auth.currentUser.uid, "goals", id)
      );

      await loadGoals();
    } catch (err) {
      console.error("Error deleting goal:", err);
    }
  };

  const openFunding = (goal) => {
    setFundingId(goal.id);
    setFundAmount("");
  };

  const handleAddFunds = async (goal) => {
    if (!fundAmount || Number(fundAmount) <= 0) return;
    if (!auth.currentUser) return;

    try {
      const newSaved =
        Number(goal.savedAmount || 0) + Number(fundAmount);

      await updateDoc(
        doc(db, "users", auth.currentUser.uid, "goals", goal.id),
        { savedAmount: newSaved }
      );

      setFundingId(null);
      setFundAmount("");

      await loadGoals();
    } catch (err) {
      console.error("Error updating goal funds:", err);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1>Savings Goals</h1>
            <p>Set targets and track your progress toward them.</p>
          </div>

          <button
            className="primary-btn goal-add-btn"
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? "Cancel" : "+ New Goal"}
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}

        {showForm && (
          <section className="content-card">
            <form onSubmit={handleAddGoal}>
              <div className="input-group">
                <label>Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Fund"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Target Amount</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="₹ 0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Target Date (optional)</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Create Goal"}
              </button>
            </form>
          </section>
        )}

        {loading ? (
          <div className="loading-box">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="content-card empty-state">
            <div className="empty-icon">◎</div>
            <h3>No savings goals yet</h3>
            <p>Create a goal to start tracking your progress.</p>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map((goal) => {
              const saved = Number(goal.savedAmount || 0);
              const target = Number(goal.targetAmount || 0);
              const percent =
                target > 0
                  ? Math.min(100, Math.round((saved / target) * 100))
                  : 0;
              const reached = saved >= target && target > 0;

              return (
                <div className="goal-card content-card" key={goal.id}>
                  <div className="goal-card-header">
                    <div>
                      <h3>{goal.name}</h3>

                      {goal.targetDate && (
                        <p className="goal-date">
                          Target: {goal.targetDate}
                        </p>
                      )}
                    </div>

                    <button
                      className="close-btn goal-delete-btn"
                      onClick={() => handleDeleteGoal(goal.id)}
                      aria-label="Delete goal"
                    >
                      ×
                    </button>
                  </div>

                  <div className="goal-amounts">
                    <strong>{formatCurrency(saved)}</strong>
                    <span> of {formatCurrency(target)}</span>
                  </div>

                  <div className="chart-track goal-track">
                    <div
                      className={
                        reached
                          ? "chart-bar goal-bar-complete"
                          : "chart-bar"
                      }
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="goal-footer">
                    <span className="chart-percent">
                      {percent}% funded
                    </span>

                    {reached ? (
                      <span className="goal-reached-badge">
                        Goal reached 🎉
                      </span>
                    ) : fundingId === goal.id ? (
                      <div className="goal-fund-input">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="Amount"
                          value={fundAmount}
                          onChange={(e) =>
                            setFundAmount(e.target.value)
                          }
                        />
                        <button
                          className="primary-btn"
                          onClick={() => handleAddFunds(goal)}
                        >
                          Add
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() => setFundingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="view-btn"
                        onClick={() => openFunding(goal)}
                      >
                        + Add Funds
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Goals;
