"use client";
import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useUtilisateur } from '@/hooks/useUtilisateur';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ChangePasswordModal from '@/app/components/DashboardComponents/parametre/ChangePasswordModal.jsx';

export default function InformationsPersonnelles() {
  const { user, loading: authLoading, changePassword, token } = useAuth();
  const { mettreAJourUtilisateur, loading: userLoading } = useUtilisateur();
  const [formData, setFormData] = useState({
    nomComplet: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Initialize form with user data when loaded
  React.useEffect(() => {
    if (user) {
      setFormData({
        nomComplet: `${user.prenom || ''} ${user.nom || ''}`.trim(),
        email: user.email || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Split full name into first and last name
      const [prenom, ...nomParts] = formData.nomComplet.split(' ');
      const nom = nomParts.join(' ');

      const updates = {
        prenom,
        nom,
        email: formData.email
      };

      // Call the update function from useUtilisateur
      const updatedUser = await mettreAJourUtilisateur(user.id, updates, token);
      
      // Update local auth state if needed
      if (updatedUser) {
        // You might want to update the auth context here if needed
      }

      toast.success("Informations mises à jour avec succès");
    } catch (error) {
      toast.error(error.message || "Erreur lors de la mise à jour des informations");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || userLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className=" mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Informations Personnelles</h1>
      
      <Card className="max-w-5xl w-screen">
        <CardHeader>
          <CardTitle>Profil Administrateur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              {/* Nom complet */}
              <div className="space-y-2">
                <Label htmlFor="nomComplet">Nom complet</Label>
                <Input
                  id="nomComplet"
                  name="nomComplet"
                  value={formData.nomComplet}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* Mot de passe section */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Mot de passe</Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    ********
                  </span>
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)}
                    disabled={isSubmitting}
                  >
                    Changer le mot de passe
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  // Reset form to original values
                  setFormData({
                    nomComplet: `${user.prenom || ''} ${user.nom || ''}`.trim(),
                    email: user.email || ''
                  });
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onChangePassword={changePassword}
      />
    </div>
  );
}