"use client";
import React from "react";
import { PieChart } from "@mui/x-charts/PieChart";

export default function BestSellingProductChart() {
  const chartData = [
    { id: "Armoires", value: 12, color: "rgb(255, 87, 51)" },
    { id: "Chaises", value: 19, color: "rgb(51, 255, 87)" },
    { id: "Tables", value: 3, color: "rgb(51, 87, 255)" },
    { id: "Lits", value: 5, color: "rgb(255, 51, 166)" },
    { id: "Bureaux", value: 2, color: "rgb(244, 208, 63)" },
    { id: "Canapés", value: 3, color: "rgb(142, 68, 173)" },
  ];

  return (
    <div className="  p-8 rounded-lg relative">
    <h2 className="text-md  font-bold mb-2 text-center">
      Produits les plus vendus
    </h2>

      <div className="flex justify-center items-start flex-wrap gap-2 mb-2 ">
        {chartData.map((product) => (
          <div key={product.id} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: product.color }}
            ></span>
            <span className="font-medium text-sm text-gray-800">
              {product.id}: <span className="text-md">{product.value}</span>
            </span>
          </div>
        ))}
      </div>

      <div style={{ width: 300, height: 300, margin: "0 auto" }}>
        <PieChart
          series={[
            {
              data: chartData,
              innerRadius: 30,
              outerRadius: 100,
              paddingAngle: 5,
              cornerRadius: 5,
              startAngle: -45,
              endAngle: 225,
              cx: 150,
              cy: 150,
              tooltip: {
                formatter: (params) => {
                  return `${params.id}: ${params.value} ventes`;
                },
              },
            },
          ]}
          width={600}
          height={600}
        />
      </div>
    </div>
  );
}
