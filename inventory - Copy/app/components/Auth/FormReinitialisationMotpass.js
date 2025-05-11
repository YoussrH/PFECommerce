"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FormReinitialisationMotpass = ({ onBack, onSubmit }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    
    setIsLoading(true);
    try {
      await onSubmit(newPassword);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4"  method="POST" onSubmit={handleSubmit}>
      <div className="w-64 mx-auto">
        <label className="block text-black font-medium mb-2 text-xs">
          Nouveau mot de passe <span className="text-yellow-500">*</span>
        </label>
        <Input
          type="password"
          placeholder="Nouveau mot de passe"
          className="w-full text-xs"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>

      <div className="w-64 mx-auto">
        <label className="block text-black font-medium mb-2 text-xs">
          Confirmer le mot de passe <span className="text-yellow-500">*</span>
        </label>
        <Input
          type="password"
          placeholder="Confirmer le mot de passe"
          className="w-full text-xs"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>

      <div className="w-64 mx-auto">
        <Button
          type="submit"
          className="w-full bg-black text-white border border-black hover:bg-white hover:text-black text-xs"
          disabled={isLoading}
        >
          {isLoading ? "En cours..." : "Réinitialiser le mot de passe"}
        </Button>
      </div>

      <div className="text-center">
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={onBack}
        >
          Retour
        </button>
      </div>
    </form>
  );
};

export default FormReinitialisationMotpass;