import React from 'react'
import WeeklySalesChart from './WeeklySalesChart'
import BestSellingProductChart from './BestSellingProductChart'

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 ">
      <WeeklySalesChart />
      <BestSellingProductChart />
    </div>
  );
}

