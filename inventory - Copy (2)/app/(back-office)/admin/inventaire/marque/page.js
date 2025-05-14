
"use client";

import MarqueTable from '@/app/components/DashboardComponents/MarqueCom/MarqueTables';
import React from 'react';
import { useForm } from 'react-hook-form';

export default function Marque() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  function onSubmit(data) {
    console.log(data);
  }

  return (
    <div>
      <MarqueTable/>   
    </div>
  )
}
