"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // First try with token
      const token = localStorage.getItem('adminToken');
      if (token) {
        const response = await axios.get('http://localhost:5000/auth/utilisateur', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        });
        
        if (response.data.utilisateur) {
          setUser({
            ...response.data.utilisateur,
            token
          });
          return;
        }
      }
      
      // Fallback to session check
      const sessionResponse = await axios.get('http://localhost:5000/auth/utilisateur', {
        withCredentials: true,
      });
      
      if (sessionResponse.data.utilisateur) {
        setUser(sessionResponse.data.utilisateur);
      }
    } catch (error) {
      localStorage.removeItem('adminToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkAuth]);
  
  const register = async (userData) => {
    try {
      setAuthLoading(true);
      const response = await axios.post(
        'http://localhost:5000/auth/inscription',
        userData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        return { success: true };
      }
      throw new Error(response.data.message || "Échec de l'inscription");
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Échec de l'inscription";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };

  const verifyOtp = async (otp) => {
    try {
      setAuthLoading(true);
      const response = await axios.post(
        'http://localhost:5000/auth/verifier-otp',
        { otp },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUser(response.data.utilisateur);
        toast.success(response.data.message);
        return { 
          success: true,
          user: response.data.utilisateur
        };
      }
      throw new Error(response.data.message || 'Échec de vérification OTP');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Échec de vérification OTP';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async (email, mot_de_passe) => {
    try {
      setAuthLoading(true);
      const response = await axios.post(
        'http://localhost:5000/auth/connexion',
        { email, mot_de_passe },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUser(response.data.utilisateur);
        toast.success(response.data.message);
        return { success: true, user: response.data.utilisateur };
      }
      throw new Error(response.data.message || 'Échec de la connexion');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Échec de la connexion';
      
      // Specific error handling
      if (error.response?.status === 401) {
        toast.error("Identifiants invalides");
      } else if (error.response?.status === 403) {
        toast.error("Compte non vérifié");
      } else {
        toast.error(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };

  const loginAdmin = async (email, mot_de_passe) => {
    try {
      setAuthLoading(true);
      const response = await axios.post(
        'http://localhost:5000/auth/connexion-admin',
        { email, mot_de_passe },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Store both user data and token
        const userData = {
          ...response.data.utilisateur,
          token: response.data.token // Make sure this is coming from backend
        };
        
        setUser(userData);
        localStorage.setItem('adminToken', response.data.token); // Store token
        
        toast.success(response.data.message);
        return { success: true, user: userData };
      }
      throw new Error(response.data.message || 'Échec de la connexion admin');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Échec de la connexion admin';
      
      if (error.response?.status === 401) {
        toast.error("Identifiants admin invalides");
      } else if (error.response?.status === 403) {
        toast.error("Accès réservé aux administrateurs");
      } else {
        toast.error(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      setAuthLoading(true);
      await axios.post(
        'http://localhost:5000/auth/deconnexion', 
        {}, 
        { withCredentials: true }
      );
  
      setUser(null);
      localStorage.removeItem('adminToken'); // Clear token
      toast.success("Déconnexion réussie");
      router.push('/');
  
    } catch (error) {
      setUser(null);
      localStorage.removeItem('adminToken');
      router.push('/');
    } finally {
      setAuthLoading(false);
  
      // 🌀 Refresh the page after redirect
      setTimeout(() => {
        window.location.reload();
      }, 100); // slight delay ensures router finishes redirect
    }
  };
  




  const verifyCurrentPassword = async (currentPassword) => {
    try {
      setAuthLoading(true);
      const response = await axios.post(
        'http://localhost:5000/mot-de-passe/verifier-mot-de-passe',
        { mot_de_passe_actuel: currentPassword },
        { withCredentials: true }
      );
      
      return { 
        success: true,
        isValid: response.data.estValide,
        message: response.data.message 
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Échec de la vérification du mot de passe";
      return { success: false, error: errorMessage };
    } finally {
      setAuthLoading(false);
    }
  };
  
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setAuthLoading(true);
      
      // First verify current password
      const verification = await verifyCurrentPassword(currentPassword);
      if (!verification.success || !verification.isValid) {
        throw new Error(verification.error || "Mot de passe actuel incorrect");
      }
  
      // Then change password
      const response = await axios.post(
        'http://localhost:5000/mot-de-passe/changer-mot-de-passe',
        { nouveau_mot_de_passe: newPassword },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        return { success: true };
      }
      throw new Error(response.data.message || "Échec du changement de mot de passe");
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  };
// Mot de passe oublié
const forgotPassword = async (email) => {
  try {
    setAuthLoading(true);
    const response = await axios.post(
      'http://localhost:5000/mot-de-passe/mot-de-passe-oublie',
      { email },
      { withCredentials: true }
    );
    
    if (response.data.success) {
      toast.success("Email de réinitialisation envoyé");
      return { success: true, email };
    }
    throw new Error(response.data.message || "Erreur lors de l'envoi de l'email");
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Erreur système";
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    setAuthLoading(false);
  }
};

// Vérification du code
const verifyResetCode = async (email, code) => {
  try {
    setAuthLoading(true);
    const response = await axios.post(
      'http://localhost:5000/mot-de-passe/verifier-code-reinitialisation',
      { email, code },
      { withCredentials: true }
    );
    
    if (response.data.success) {
      toast.success("Code validé");
      return { success: true, token: response.data.token };
    }
    throw new Error(response.data.message || "Code invalide");
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Erreur de vérification";
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    setAuthLoading(false);
  }
};

// Réinitialisation du mot de passe
const resetPassword = async (token, newPassword) => {
  try {
    setAuthLoading(true);
    const response = await axios.post(
      'http://localhost:5000/mot-de-passe/reinitialiser-mot-de-passe',
      { token, nouveau_mot_de_passe: newPassword },
      { withCredentials: true }
    );
    
    if (response.data.success) {
      toast.success("Mot de passe réinitialisé");
      return { success: true };
    }
    throw new Error(response.data.message || "Erreur de réinitialisation");
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Erreur système";
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    setAuthLoading(false);
  }
};
  return (
    <AuthContext.Provider 
      value={{ 
        user,
        loading,
        authLoading,
        login,
        loginAdmin,
        logout,
        register,
        verifyOtp,
        checkAuth,
        forgotPassword,
        verifyResetCode,
        resetPassword,
        changePassword,
        verifyCurrentPassword,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin" || user?.role === "super_admin",
        token: user?.token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};