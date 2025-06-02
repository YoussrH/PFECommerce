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
      console.log('[Auth] Checking server session...');
      setLoading(true);
      
      const response = await axios.get('http://localhost:5000/auth/utilisateur', {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.utilisateur) {
        console.log('[Auth] Server session valid');
        setUser(response.data.utilisateur);

           // For admin users, ensure they have proper privileges
      if (["admin", "super_admin"].includes(response.data.utilisateur.role)) {
        console.log('[Auth] Admin privileges confirmed');
      }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); 




useEffect(() => {
    checkAuth();
    
    // Check auth when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkAuth]);

  const login = async (email, mot_de_passe) => {
    try {
      console.log('[Auth] Starting login process for email:', email);
      setAuthLoading(true);
      
      const response = await axios.post(
        'http://localhost:5000/auth/connexion',
        { email, mot_de_passe },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log('[Auth] Login response:', response.data);
      
      if (response.data.success) {
        const userData = {
          ...response.data.utilisateur,
          client: response.data.client
        };
        
        console.log('[Auth] Login successful, setting user:', userData);
        setUser(userData);
        
        // Verify session immediately after login
        console.log('[Auth] Verifying session after login...');
        await checkAuth();
        
        toast.success("Connexion réussie ! Bienvenue !");
        return { success: true, user: userData };
      }
      
      console.log('[Auth] Login failed - server response not successful');
      throw new Error(response.data.message || 'Échec de la connexion');
    } catch (error) {
      console.error('[Auth] Login error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Échec de la connexion';
      
      if (error.response?.status === 401) {
        toast.error("Email ou mot de passe incorrect");
      } else if (error.response?.status === 403) {
        toast.error("Ce compte a été désactivé. Contactez l'administrateur.");
      } else {
        toast.error(errorMessage);
      }
      
      return { 
        success: false, 
        error: errorMessage,
      };
    } finally {
      console.log('[Auth] Login process completed');
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
      toast.success("Déconnexion réussie");
      router.push('/');
  
    } catch (error) {
      setUser(null);
      router.push('/');
    } finally {
      setAuthLoading(false);
      // Force a full page reload to clear any client-side state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };
  const register = async (userData) => {
    try {
      console.log('Starting registration with data:', userData);
      setAuthLoading(true);
      const response = await axios.post(
        'http://localhost:5000/auth/inscription',
        userData,
        { withCredentials: true }
      );
      
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        toast.success(response.data.message);
        return { 
          success: true,
          requiresOtp: true,
          message: response.data.message
        };
      }
      throw new Error(response.data.message || "Échec de l'inscription");
    } catch (error) {
      console.error('Registration error:', error);
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
// AuthContext.js

const loginAdmin = async (email, mot_de_passe) => {
  try {
    setAuthLoading(true);
    
    // Debug: Log the login attempt
    console.log('[Auth] Attempting admin login for:', email);
    
    const response = await axios.post(
      'http://localhost:5000/auth/connexion-admin',
      { email, mot_de_passe },
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Debug: Inspect the full response
    console.log('[Auth] Login response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });

    if (response.data.success) {
      if (!response.data.token) {
        console.error('[Auth] No token received in response');
        throw new Error('Authentication token missing');
      }

      // Debug: Verify token structure before storing
      const tokenParts = response.data.token.split('.');
      if (tokenParts.length !== 3) {
        console.error('[Auth] Malformed token received:', response.data.token);
        throw new Error('Invalid token format');
      }

      const userData = {
        ...response.data.utilisateur,
        token: response.data.token
      };

      // Debug before state update
      console.log('[Auth] Updating user state with:', {
        user: userData,
        tokenLength: userData.token.length
      });

      setUser(userData);

      // Verify token is stored correctly
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow state to update
      console.log('[Auth] Current user token after set:', user?.token);

      // Perform auth check with the new token
      await checkAuth();

      toast.success("Connexion admin réussie ! Bienvenue !");
      return { 
        success: true, 
        user: userData 
      };
    }
    
    throw new Error(response.data.message || 'Échec de la connexion admin');
  } catch (error) {
    console.error('[Auth] Admin login error:', {
      error: error.message,
      response: error.response?.data
    });
    
    toast.error(error.response?.data?.message || 'Échec de la connexion admin');
    return { 
      success: false, 
      error: error.message 
    };
  } finally {
    setAuthLoading(false);
  }
};
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
      
      if (!currentPassword || !newPassword) {
        throw new Error("Veuillez fournir le mot de passe actuel et le nouveau mot de passe");
      }

      if (currentPassword === newPassword) {
        throw new Error("Le nouveau mot de passe doit être différent de l'actuel");
      }

      const response = await axios.post(
        'http://localhost:5000/mot-de-passe/changer-mot-de-passe',
        { 
          motDePasseActuel: currentPassword,
          nouveauMotDePasse: newPassword 
        },
        { 
          withCredentials: true,
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
        }
      );

      if (response.data.success) {
        toast.success("Mot de passe changé avec succès");
        return { success: true };
      }
      
      throw new Error(response.data.message || "Échec du changement de mot de passe");
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Échec du changement de mot de passe";
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        isCurrentPasswordInvalid: error.response?.status === 401
      };
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