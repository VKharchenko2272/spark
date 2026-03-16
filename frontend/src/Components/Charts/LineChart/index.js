import React from "react";
import PropTypes from "prop-types";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
} from "chart.js";

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
  gradient.addColorStop(0, "rgba(47,124,250,0.3)");
  gradient.addColorStop(1, "rgba(47,124,250,0.7)");
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
  const roundToHalf = (num) => {
    return Math.round(num * 2) / 2;
};
const roundedScores = scores.map(score => roundToHalf(score));
  const data = {
    labels: Object.keys(topicNameMap),
    datasets: [
      {
        label: "Points",
        data: roundedScores,
        fill: true,
        backgroundColor: (context) => {
          const { chart } = context;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return null;
          }
          return createGradient(ctx, chartArea);
        },
        borderColor: "rgba(47,124,250,1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(47,124,250,1)",
        tension: 0.4,
        pointRadius: 5,
      }
    ]
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            return value;
          }
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
            return `Points: ${tooltipItem.raw}`;
          },
          title: function (tooltipItems) {
            const labelIndex = tooltipItems[0].label;
            return `Topic: ${topicNameMap[labelIndex]}`;
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
      <Line data={data} options={options} />
    </div>
  );
}

LineChart.propTypes = {
  scores: PropTypes.arrayOf(PropTypes.number).isRequired,
};
