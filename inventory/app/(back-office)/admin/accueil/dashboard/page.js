"use client";
import React, { useState } from 'react';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import data from './data.json';
import PowerBIFrame from '@/components/PowerBIFrame';

export default function Dashboard() {
  const [tableData, setTableData] = useState(data);

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6 p-4">

      {/* Embedded Power BI Dashboard */}
      <div className="col-span-12">
        <PowerBIFrame/>
      </div>

    </div>
  );
}
