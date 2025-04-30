"use client";
import React, { useState } from 'react';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import data from './data.json'; // Import the data.json file

export default function Dashboard() {
  const [tableData, setTableData] = useState(data); // Use the data from data.json

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6 p-4">
      {/* Metrics Cards */}
      <div className="col-span-12">
        <SectionCards />
      </div>

      {/* Interactive Charts */}
      <div className="col-span-12 xl:col-span-6">
        <ChartAreaInteractive />
      </div>

      <div className="col-span-12 xl:col-span-6">
        <ChartAreaInteractive />
      </div>

      {/* Data Table */}
      <div className="col-span-12">
        <DataTable data={tableData} />
      </div>
    </div>
  );
}