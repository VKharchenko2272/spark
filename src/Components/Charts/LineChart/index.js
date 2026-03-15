import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,           // For customizing tooltips
  Filler,            // For filling the area under the line
  Legend             // For customizing the legend
} from "chart.js";

// Register required components for the chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);
const createGradient = (ctx, area) => {
  const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
  gradient.addColorStop(0, "rgba(47,124,250,0.3)"); // Start with a transparent color
  gradient.addColorStop(1, "rgba(47,124,250,0.7)"); // End with a more opaque color
  return gradient;
};


export default function LineChart({ scores }) {
  const topicNameMap = {
    1: "Collaboration",
    2: "Conflict Resolution",
    3: "Task Manager",
    4: "Adapting to Change",
    5: "Mentoring",
    6: "Documentation",
    7: "Formatting Standards",
    8: "Naming",
    9: "Syntax and Organization",
    10: "Engagement",
    11: "Verbal Communication",
    12: "Written Communication",
    13: "Providing Feedback",
    14: "Receiving Feedback",
    15: "Testing",
    16: "Refactoring/Readability",
    17: "Defensive Programming",
    18: "Performance",
    19: "Security",
    20: "Strategy and Critical Thinking Comments",
    21: "Debugging Techniques",
    22: "Tool Selection and Usage"
};
  // Gradient background
  
  const roundToHalf = (num) => {
    return Math.round(num * 2) / 2;
};
const roundedScores = scores.map(score => roundToHalf(score));
  // Data for the chart
  const data = {
    labels: Object.keys(topicNameMap),
    datasets: [
      {
        label: "Points",
        data: roundedScores,  // Use the scores prop for the data points
        fill: true,
        backgroundColor: (context) => {
          const { chart } = context;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return null;
          }
          return createGradient(ctx, chartArea);
        },
        borderColor: "rgba(47,124,250,1)",  // Line color
        borderWidth: 2,  // Thickness of the line
        pointBackgroundColor: "rgba(47,124,250,1)",  // Color of the points
        tension: 0.4,  // Curve of the line (0 for straight lines)
        pointRadius: 5,  // Size of the points
      }
    ]
  };

  // Chart options for styling
  const options = {
    scales: {
      y: {
        beginAtZero: true,
        max: 5,  // Adjust this to match your chart
        ticks: {
          stepSize: 1,  // Interval of the ticks on y-axis
          callback: function (value) {
            return value;  // Display the value directly
          }
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
            return `Points: ${tooltipItem.raw}`;  // Custom label format
          },
          title: function (tooltipItems) {
            const labelIndex = tooltipItems[0].label;  // Get the label index
            return `Topic: ${topicNameMap[labelIndex]}`;  // Map numeric label to topic name
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
      <Line data={data} options={options} />
    </div>
  );
}
