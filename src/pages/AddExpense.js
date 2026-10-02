import React from "react";
import Navbar from "../components/Navbar";
import ExpenseForm from "../components/ExpenseForm";

function AddExpense() {
  return (
    <div className="app-layout">

      <Navbar />

      <main className="main-content">

        <header className="page-header">

          <div>
            <h1>Add Expense</h1>
            <p>
              Record and organize your daily expenses.
            </p>
          </div>

        </header>

        <ExpenseForm type="expense" />

      </main>

    </div>
  );
}

export default AddExpense;