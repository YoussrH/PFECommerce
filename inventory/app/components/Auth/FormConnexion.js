"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const FormConnexion = ({ formData, setFormData, handleLogin, onForgotPassword }) => {
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleSubmit = async (e) => {
  e.preventDefault(); // Prevent default form submission behavior
  try {
    await handleLogin();
  } catch (error) {
    console.error('Login error:', error);
  }
};

  return (
    <form className="space-y-4" onSubmit={handleSubmit} method="POST">
      <div className="w-64 mx-auto">
        <label className="block text-black font-medium mb-2 text-xs">
          Email <span className="text-yellow-500">*</span>
        </label>
        <Input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full text-xs"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="w-64 mx-auto">
        <label className="block text-black font-medium mb-2 text-xs">
          Mot de passe <span className="text-yellow-500">*</span>
        </label>
        <Input
          type="password"
          name="mot_de_passe"
          placeholder="Mot de passe"
          className="w-full text-xs"
          value={formData.mot_de_passe}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex items-center justify-between w-64 mx-auto">
        <div className="flex items-center space-x-2">
          <Checkbox id="remember" />
          <label htmlFor="remember" className="text-xs text-black">
            Rester connecté
          </label>
        </div>
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={onForgotPassword}
        >
          Mot de passe oublié ?
        </button>
      </div>

      <div className="w-64 mx-auto">
        <Button
          type="submit"
          className="w-full bg-black text-white border border-black hover:bg-white hover:text-black text-xs"
        >
          Se connecter
        </Button>
      </div>

      {/* Role Icons - bottom right */}
      <div className="w-64 mx-auto flex justify-end space-x-3 pt-2">
        <div
          onClick={() => router.push("/admin/authentification")}
          className="cursor-pointer hover:scale-110  transition-transform"
        >
          <Image
            src="/administrator.png"
            alt="Admin"
            width={28}
            height={28}
            className="invisible "
          />
        </div>

      </div>
    </form>
  );
};

export default FormConnexion;
