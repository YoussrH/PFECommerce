"use client";
import React from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

const FormOtpVerification = ({ otp, setOtp, handleVerifyOtp, isLoading }) => {
  return (
    <form className="space-y-4" onSubmit={handleVerifyOtp}>
      <div className="w-64 mx-auto">
        <label className="block text-black font-medium mb-1 text-xs">
          OTP <span className="text-yellow-500">*</span>
        </label>
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}
          disabled={isLoading} // Disable input when loading
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

      <div className="w-64 mx-auto">
        <Button
          type="submit"
          className="w-full bg-black text-white hover:bg-yellow-500 hover:text-black text-xs"
          disabled={isLoading} // Disable button when loading
        >
          {isLoading ? "Vérification..." : "Vérifier OTP"}
        </Button>
      </div>
    </form>
  );
};

export default FormOtpVerification;