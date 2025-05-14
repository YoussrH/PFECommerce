// src/components/StatusBadge.js
"use client";

import { Badge } from "@/components/ui/badge";

export const StatusBadge = ({ status }) => {
    const statusOptions = [
        { value: "en_attente", label: "En attente", color: "bg-yellow-500" },
        { value: "confirmee", label: "Confirmée", color: "bg-blue-500" },
        { value: "en_preparation", label: "En préparation", color: "bg-purple-500" },
        { value: "expediee", label: "Expédiée", color: "bg-orange-500" },
        { value: "livree", label: "Livrée", color: "bg-green-500" },
        { value: "annulee", label: "Annulée", color: "bg-red-500" },
      ];

  const config = statusConfig[status] || {
    label: status,
    color: "bg-gray-500 hover:bg-gray-500/80",
  };

  return (
    <Badge className={`${config.color} text-white`}>
      {config.label}
    </Badge>
  );
};