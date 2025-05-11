"use client";
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function WeeklySalesForTopProducts() {
  const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const product1Sales = [50, 60, 55, 20, 75, 95, 50];
  const product2Sales = [40, 45, 50, 60, 70, 85, 90];
  const product3Sales = [30, 35, 40, 50, 60, 75, 80];

  const data = {
    labels: daysOfWeek,
    datasets: [
      {
        label: "Produit 1",
        data: product1Sales,
        borderColor: "rgb(51, 87, 255)", 
        backgroundColor: "rgba(51, 87, 255, 0.2)", 
        tension: 0.4, 
      },
      {
        label: "Produit 2",
        data: product2Sales,
        borderColor: "rgb(255, 99, 71)",
        backgroundColor: "rgba(255, 99, 71, 0.2)",
        tension: 0.4,
      },
      {
        label: "Produit 3",
        data: product3Sales,
        borderColor: "rgb(50, 205, 50)", 
        backgroundColor: "rgba(50, 205, 50, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
        text: "Ventes hebdomadaires - Top 3 Produits",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Jours de la semaine",
        },
      },
      y: {
        title: {
          display: true,
          text: "Ventes (DT)",
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className=" p-8 rounded-lg ">
      <h2 className="text-md font-bold mb-8 text-center">
        Ventes hebdomadaires - Top 3 Produits
      </h2>
      <div style={{ width: "100%", height: "auto", margin: "0 auto" }}>
        <Line  className="mt-5 " data={data} options={options} />
      </div>
    </div>
  );
}
