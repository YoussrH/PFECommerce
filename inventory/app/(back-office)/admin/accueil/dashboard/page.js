"use client";
import React, { useState } from 'react';
import PowerBIFrame from '@/components/PowerBIFrame';

export default function Dashboard() {

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6 p-4">

      {/* Embedded Power BI Dashboard */}
      <div className="col-span-12">
        <PowerBIFrame/>
      </div>

    </div>
  );
}
