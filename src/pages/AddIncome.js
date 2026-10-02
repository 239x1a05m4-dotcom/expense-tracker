import React from "react";
import Navbar from "../components/Navbar";
import ExpenseForm from "../components/ExpenseForm";

function AddIncome() {
  return (
    <div className="app-layout">

      <Navbar />

      <main className="main-content">

        <header className="page-header">

          <div>
            <h1>Add Income</h1>
            <p>
              Record your income and other earnings.
            </p>
          </div>

        </header>

        <ExpenseForm type="income" />

      </main>

    </div>
  );
}

export default AddIncome;