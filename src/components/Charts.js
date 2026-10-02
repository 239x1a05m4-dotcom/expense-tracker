import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function Charts({ transactions = [] }) {
  const categories = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Education",
    "Entertainment",
    "Health",
    "Other"
  ];

  const categoryTotals = categories.map((category) =>
    transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category === category
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      )
  );

  const hasExpenses = categoryTotals.some(
    (amount) => amount > 0
  );

  const chartData = {
    labels: categories,
    datasets: [
      {
        data: categoryTotals,
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#2ECC71",
          "#95A5A6"
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "bottom",

        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },

      tooltip: {
        callbacks: {
          label: function (context) {
            const value = Number(context.raw || 0);

            return ` ₹${value.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
          }
        }
      }
    },

    cutout: "60%"
  };

  return (
    <div
      style={{
        width: "100%",
        height: "360px",
        position: "relative"
      }}
    >
      {hasExpenses ? (
        <Doughnut
          data={chartData}
          options={chartOptions}
        />
      ) : (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#64748b"
          }}
        >
          <p>No expense data</p>
        </div>
      )}
    </div>
  );
}

export default Charts;