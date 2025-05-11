// components/Auth/SignUpForm.js
"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import PrefixCheckbox from "./PrefixCheckbox";

const FormInscri = ({ formData, setFormData, handleSignUp }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault(); // This prevents page refresh
    console.log('Form submitted with data:', formData); // Debug log
    await handleSignUp();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} method="POST">
      <PrefixCheckbox formData={formData} setFormData={setFormData} />

      <div className="w-64 mx-auto">
        <label className="block text-black font-medium mb-1 text-xs">
          Nom <span className="text-yellow-500">*</span>
        </label>
        <Input
          type="text"
          name="nom"
          placeholder="Nom"
          className="w-full text-xs"
          value={formData.nom}
          onChange={handleChange}
          required
        />
      </div>

      <div className="w-64 mx-auto">
        <label className="block text-black font-medium mb-1 text-xs">
          Prénom <span className="text-yellow-500">*</span>
        </label>
        <Input
          type="text"
          name="prenom"
          placeholder="Prénom"
          className="w-full text-xs"
          value={formData.prenom}
          onChange={handleChange}
          required
        />
      </div>

      <div className="w-64 mx-auto">
        <label className="block text-black font-medium mb-1 text-xs">
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

      <p className="mt-1 text-xs text-black text-center">
        N&apos;oubliez pas de valider votre adresse e-mail.
      </p>

      <div className="w-64 mx-auto">
        <label className="block text-black font-medium mb-1 text-xs">
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

      <div className="flex items-center space-x-2 w-64 mx-auto">
        <Checkbox
          id="newsletter"
          name="newsletter"
          checked={formData.newsletter}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, newsletter: checked })
          }
        />
        <label htmlFor="newsletter" className="text-xs text-black">
          Je m&apos;inscris à la newsletter
        </label>
      </div>

      <div className="w-64 mx-auto">
        <Button
          type="submit"
          className="w-full bg-black text-white border border-black hover:bg-white hover:text-black text-xs"
        >
          S&apos;inscrire
        </Button>
      </div>
    </form>
  );
};

export default FormInscri;