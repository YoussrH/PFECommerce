"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/contexts/AuthContext";

const FormMotpasseOublie = ({ onBackToLogin, onSuccess = () => {} }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { success } = await forgotPassword(email);
      if (success) {
        onSuccess(email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="w-64 mx-auto">
        <label className="block text-black font-medium mb-2 text-xs">
          Email <span className="text-yellow-500">*</span>
        </label>
        <Input
          type="email"
          placeholder="Votre email"
          className="w-full text-xs"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="w-64 mx-auto">
        <Button
          type="submit"
          className="w-full bg-black text-white border border-black hover:bg-white hover:text-black text-xs"
          disabled={isLoading}
        >
          {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
        </Button>
      </div>

      <div className="text-center">
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={onBackToLogin}
        >
          Retour à la connexion
        </button>
      </div>
    </form>
  );
};

export default FormMotpasseOublie;