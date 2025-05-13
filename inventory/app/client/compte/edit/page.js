"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from '@/app/contexts/AuthContext';
import { useClient } from "@/hooks/useClient";

export default function MonProfil() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, changePassword } = useAuth();
  const { updateProfile } = useClient();
  
  const [user, setUser] = useState({
    prefix: "",
    nom: "",
    prenom: "",
    email: "",
  });
  
  const [modifyPassword, setModifyPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  useEffect(() => {
    if (authUser && !authLoading) {
      setUser({
        prefix: authUser.prefix || "",
        nom: authUser.nom || "",
        prenom: authUser.prenom || "",
        email: authUser.email || "",
      });
    }
  }, [authUser, authLoading]);

  const validatePasswordChange = () => {
    const errors = {
      current: "",
      new: "",
      confirm: ""
    };
    let isValid = true;

    if (!currentPassword) {
      errors.current = "Le mot de passe actuel est requis";
      isValid = false;
    }

    if (!newPassword) {
      errors.new = "Le nouveau mot de passe est requis";
      isValid = false;
    } else if (newPassword.length < 8) {
      errors.new = "Le mot de passe doit contenir au moins 8 caractères";
      isValid = false;
    }

    if (newPassword !== confirmNewPassword) {
      errors.confirm = "Les mots de passe ne correspondent pas";
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Handle password change if enabled
      if (modifyPassword) {
        if (!validatePasswordChange()) {
          setIsLoading(false);
          return;
        }

        const result = await changePassword(currentPassword, newPassword);
        if (!result.success) {
          if (result.isCurrentPasswordInvalid) {
            setPasswordErrors(prev => ({
              ...prev,
              current: "Mot de passe actuel incorrect"
            }));
          }
          setIsLoading(false);
          return;
        }
      }

      // Update profile information
      const { success, error } = await updateProfile({
        prefix: user.prefix,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
      });
      
      if (success) {
        toast.success("Profil mis à jour avec succès !");
        if (modifyPassword) {
          setModifyPassword(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setPasswordErrors({
            current: "",
            new: "",
            confirm: ""
          });
        }
      } else {
        throw new Error(error || "Échec de la mise à jour du profil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-2">
      <h6 className="text-sm font-semibold">Informations du compte</h6>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-4">
          <label className="block text-xs font-medium mb-2">Préfixe *</label>
          <div className="flex space-x-4">
            {["Madame", "Monsieur", "Mlle"].map((prefix) => (
              <label key={prefix} className="flex items-center text-xs">
                <input
                  type="radio"
                  name="prefix"
                  value={prefix}
                  checked={user.prefix === prefix}
                  onChange={(e) => setUser({ ...user, prefix: e.target.value })}
                  className="mr-2"
                />
                {prefix}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-2">Nom *</label>
          <input
            type="text"
            value={user.nom}
            onChange={(e) => setUser({ ...user, nom: e.target.value })}
            className="w-80 p-2 border border-gray-300"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-2">Prénom *</label>
          <input
            type="text"
            value={user.prenom}
            onChange={(e) => setUser({ ...user, prenom: e.target.value })}
            className="w-80 p-2 border border-gray-300"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-2">Adresse mail *</label>
          <input
            type="email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            className="w-80 p-2 border border-gray-300"
            required
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={modifyPassword}
              onChange={(e) => setModifyPassword(e.target.checked)}
              className="mr-2"
            />
            Modifier le mot de passe
          </label>
        </div>

        {modifyPassword && (
          <>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2">
                Mot de passe actuel *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-80 p-2 border ${passwordErrors.current ? "border-red-500" : "border-gray-300"}`}
                required
              />
              {passwordErrors.current && (
                <p className="text-red-500 text-xs mt-1">{passwordErrors.current}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium mb-2">
                Nouveau mot de passe *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-80 p-2 border ${passwordErrors.new ? "border-red-500" : "border-gray-300"}`}
                required
              />
              {passwordErrors.new && (
                <p className="text-red-500 text-xs mt-1">{passwordErrors.new}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium mb-2">
                Confirmer le nouveau mot de passe *
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={`w-80 p-2 border ${passwordErrors.confirm ? "border-red-500" : "border-gray-300"}`}
                required
              />
              {passwordErrors.confirm && (
                <p className="text-red-500 text-xs mt-1">{passwordErrors.confirm}</p>
              )}
            </div>
          </>
        )}

        <p className="text-xs text-gray-600 mb-6">* Champs obligatoires</p>
        <div className="grid grid-cols-4 gap-20 justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-black px-2 py-2 text-xs hover:underline border border-black"
            disabled={isLoading}
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="text-white bg-black text-xs px-3 py-2 hover:underline disabled:opacity-50"
          >
            {isLoading ? "Sauvegarde en cours..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  );
}