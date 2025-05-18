"use client";

import { Toaster } from "sonner";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {children}
      <Toaster theme="light" position="top-center" richColors />
    </div>
  );
}