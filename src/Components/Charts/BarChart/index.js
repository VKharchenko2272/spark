import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

// Register required components for the chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function BarChart({ categories }) {
  // Category names for the horizontal axis
  const categoryNameMap = {
    1: "Teamwork",
    2: "Code Aesthetics",
    3: "Communication",
    4: "Best Practices",
    5: "Knowledge Application and Problem Solving"
  };

  // Extract category names and their total scores
  const labels = categories.map(category => categoryNameMap[category.category_id] || `Category ${category.category_id}`);
  const dataValues = categories.map(category => category.total_score);

  // Data for the chart
  const data = {
    labels,  // Categories on the horizontal axis
    datasets: [
      {
        label: "Total Score",
        data: dataValues,  // Use the total scores for the bars
        backgroundColor: "rgba(47,124,250,0.7)",  // Color of the bars
        borderColor: "rgba(47,124,250,1)",  // Border color of the bars
        borderWidth: 1,  // Thickness of the border
      }
    ]
  };

  // Chart options for styling
  const options = {
    scales: {
      y: {
        beginAtZero: true,// Set the maximum value for the vertical axis
        ticks: {
          stepSize: 5,  // Interval of the ticks on y-axis
        },
        grid: {
          display: true,  // Show grid lines
          drawBorder: false,  // Hide the axis line
          color: "rgba(200,200,200,0.3)",  // Light grid lines
        }
      },
      x: {
        grid: {
          display: false,  // Hide grid lines for x-axis
        }
      }
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(255,255,255,0.9)",  // Light background for tooltip
        titleColor: "#333",  // Dark text for tooltip title
        bodyColor: "#333",  // Dark text for tooltip body
        borderColor: "rgba(47,124,250,1)",  // Border color around tooltip
        borderWidth: 1,  // Thickness of the border
        callbacks: {
          label: function (tooltipItem) {
            return `Total Score: ${tooltipItem.raw}`;  // Custom label format
          },
          title: function (tooltipItems) {
            return `Category: ${tooltipItems[0].label}`;  // Custom title format
          }
        }
      },
      legend: {
        display: false,  // Hide the legend
      }
    },
    maintainAspectRatio: false,  // Allows the chart to be responsive
    responsive: true,  // Make the chart responsive
  };

  return (
    <div className="Chart"> 
      <Bar data={data} options={options} />
    </div>
  );
}
