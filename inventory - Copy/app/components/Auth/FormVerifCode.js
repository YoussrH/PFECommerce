"use client";
import React, { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

const FormVerifCode = ({ email, onBack, onSubmit, isLoading }) => {
  const [code, setCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(code);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="w-full">
        <label className="block text-sm font-medium mb-2">
          Code de vérification <span className="text-red-500">*</span>
        </label>
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => setCode(value)}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Entrez le code à 6 chiffres reçu à l&apos;adresse {email}
        </p>
      </div>

      <div className="w-full">
        <Button
          type="submit"
          className="w-full bg-black text-white hover:bg-yellow-500 hover:text-black text-xs"
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? "Vérification en cours..." : "Vérifier le code"}
        </Button>
      </div>

      <div className="text-center">
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={onBack}
          disabled={isLoading}
        >
          Retour
        </button>
      </div>
    </form>
  );
};

export default FormVerifCode;