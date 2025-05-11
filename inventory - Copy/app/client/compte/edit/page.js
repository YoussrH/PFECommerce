"use client";
import React, { useState, useEffect } from "react";
import axios from "axios"; 
import { useRouter } from "next/navigation";
import { toast } from "sonner"; 

export default function MonProfil() {
  const router = useRouter();
  const [user, setUser] = useState({
    prefix: "",
    nom: "", 
    prenom: "",
    email: "",
    newsletter: false,
  });
  const [modifyPassword, setModifyPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/auth/utilisateur", {
          withCredentials: true,
        });
        if (response.data.user) {
          setUser(response.data.user); 
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Failed to fetch user data. Please try again.");
      }
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      if (modifyPassword && newPassword !== confirmNewPassword) {
        toast.error("Les mots de passe ne correspondent pas.");
        return;
      }
  
      if (modifyPassword) {
        const verifyResponse = await axios.post(
          "http://localhost:5000/utilisateur/verify-password",
          { currentPassword },
          { withCredentials: true }
        );
  
        if (!verifyResponse.data.isValid) {
          toast.error("Le mot de passe actuel est incorrect.");
          return;
        }
      }
  
      const updatedData = {
        prefixe: user.prefix, 
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        newsletter: user.newsletter,
      };
  
      if (modifyPassword) {
        updatedData.password = newPassword;
      }
  
      console.log("Updated Data:", updatedData); 
  
      const updateResponse = await axios.put(
        `http://localhost:5000/utilisateur/users/${user.id}`,
        updatedData,
        { withCredentials: true }
      );
  
      toast.success("Profil mis à jour avec succès !");
      setModifyPassword(false);
      setCurrentPassword(""); 
      setNewPassword(""); 
      setConfirmNewPassword(""); 
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Échec de la mise à jour du profil. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-2">
      <h6 className="text-sm font-semibold ">Informations du compte</h6>

      <form onSubmit={handleSubmit} className="p-6 ">
            <div className="mb-4">
                <label className="block text-xs font-medium mb-2">Préfixe *</label>
                <div className="flex space-x-4">
                <label className="flex items-center">
                    <input
                    type="radio"
                    name="prefix"
                    value="Madame"
                    checked={user.prefix === "Madame"}
                    onChange={(e) => setUser({ ...user, prefix: e.target.value })}
                    className="mr-2 "
                    />
                    Madame
                </label>
                <label className="flex items-center text-xs">
                    <input
                    type="radio"
                    name="prefix"
                    value="Monsieur"
                    checked={user.prefix === "Monsieur"}
                    onChange={(e) => setUser({ ...user, prefix: e.target.value })}
                    className="mr-2"
                    />
                    Monsieur
                </label>
                <label className="flex items-center text-xs">
                    <input
                    type="radio"
                    name="prefix"
                    value="MLLE"
                    checked={user.prefix === "MLLE"}
                    onChange={(e) => setUser({ ...user, prefix: e.target.value })}
                    className="mr-2"
                    />
                    Mlle
                </label>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-medium mb-2">Nom *</label>
                <input
                type="text"
                value={user.nom}
                onChange={(e) => setUser({ ...user, nom: e.target.value })}
                className="w-80 p-2 border border-gray-300 "
                required
                />
            </div>

            <div className="mb-4">
                <label className="block text-xs font-medium mb-2">Prénom *</label>
                <input
                type="text"
                value={user.prenom}
                onChange={(e) => setUser({ ...user, prenom: e.target.value })}
                className="w-80 p-2 border border-gray-300 "
                required
                />
            </div>

            <div className="mb-4">
                <label className="block text-xs font-medium mb-2">Adresse mail *</label>
                <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                className="w-80 p-2 border border-gray-300 "
                required
                />
            </div>

            <div className="mb-4">
                <label className="flex items-center text-xs">
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
                    className="w-80 p-2 border border-gray-300 "
                    required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-medium mb-2">
                    Nouveau mot de passe *
                    </label>
                    <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-80 p-2 border border-gray-300 "
                    required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-medium mb-2">
                    Confirmer le nouveau mot de passe *
                    </label>
                    <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-80 p-2 border border-gray-300 "
                    required
                    />
                </div>
                </>
            )}

            <p className="text-xs text-gray-600 mb-6">* Champs obligatoires</p>
            <div className="grid grid-cols-4 gap-20 justify-between">
                <button
                type="button"
                onClick={() => router.back()} 
                className="text-black px-2 py-2 text-xs hover:underline border border-black"
                >
                Retour
                </button>
                <button
                type="submit"
                disabled={isLoading}
                className="text-white bg-black text-xs px-3 py-2 hover:underline"
                >
                {isLoading ? "Sauvegarde en cours..." : "Sauvegarder"}
                </button>
            </div>
            </form>
                </div>
  );
}