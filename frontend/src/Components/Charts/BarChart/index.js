import React from "react";
import PropTypes from "prop-types";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function BarChart({ categories }) {
  const categoryNameMap = {
    1: "Teamwork",
    2: "Communication",
    3: "Knowledge Application and Problem Solving",
    4: "Code Aesthetics",
    5: "Best Practices"
  };

  const labels = categories.map(category => categoryNameMap[category.category_id] || `Category ${category.category_id}`);
  const dataValues = categories.map(category => category.total_score);

  const data = {
    labels,
    datasets: [
      {
        label: "Total Score",
        data: dataValues,
        backgroundColor: "rgba(47,124,250,0.7)",
        borderColor: "rgba(47,124,250,1)",
        borderWidth: 1,
      }
    ]
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
        },
        grid: {
          display: true,
          drawBorder: false,
          color: "rgba(200,200,200,0.3)",
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(255,255,255,0.9)",
        titleColor: "#333",
        bodyColor: "#333",
        borderColor: "rgba(47,124,250,1)",
        borderWidth: 1,
        callbacks: {
          label: function (tooltipItem) {
            return `Total Score: ${tooltipItem.raw}`;
          },
          title: function (tooltipItems) {
            return `Category: ${tooltipItems[0].label}`;
          }
        }
      },
      legend: {
        display: false,
      }
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="Chart"> 
      <Bar data={data} options={options} />
    </div>
  );
}

BarChart.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      category_id: PropTypes.number.isRequired,
      total_score: PropTypes.number.isRequired,
    })
  ).isRequired,
};
