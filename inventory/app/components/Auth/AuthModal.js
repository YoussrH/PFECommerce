"use client";
import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import FormOtpVerification from './FormOtpVerification';
import FormInscri from './FormInscri';
import FormConnexion from './FormConnexion';
import FormMotpasseOublie from './FormMotpasseOublie';
import FormVerifCode from './FormVerifCode';
import FormReinitialisationMotpass from './FormReinitialisationMotpass';



const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const { register, login, verifyOtp, forgotPassword, verifyResetCode, resetPassword } = useAuth();
  const [authMode, setAuthMode] = useState('signup');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    prefix: '',
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    newsletter: false,
  });
  const [resetData, setResetData] = useState({
    email: '',
    token: '',
    step: 'request'
  });
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');
  const urlMode = searchParams.get('mode');

  React.useEffect(() => {
    if (urlMode === 'reset' && urlToken) {
      setAuthMode('forgot');
      setResetData({
        email: '',
        token: urlToken,
        step: 'reset'
      });
    }
  }, [urlMode, urlToken]);

  const handleSignUp = async () => {
    try {
      console.log('handleSignUp called with formData:', formData); // Debug log
      setIsLoading(true);
      const result = await register(formData);
      console.log('Registration result:', result); // Debug log
      
      if (result.success) {
        if (result.requiresOtp) {
          console.log('OTP required, showing OTP modal'); // Debug log
          toast.success("Un code OTP a été envoyé à votre email");
          setIsOtpSent(true);
        } else {
          console.log('No OTP required, completing auth'); // Debug log
          onAuthSuccess();
          onClose();
        }
      }
    } catch (error) {
      console.error('Signup error:', error); // Debug log
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setIsLoading(true);
      const result = await verifyOtp(otp);
      if (result.success) {
        onAuthSuccess(result.user);
        onClose();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await login(formData.email, formData.mot_de_passe);
      if (result.success) {
        onAuthSuccess(result.user);
        onClose();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (email) => {
    try {
      setIsLoading(true);
      const result = await forgotPassword(email);
      if (result.success) {
        setResetData({
          email: email,
          token: '',
          step: 'verify'
        });
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetCode = async (code) => {
    try {
      setIsLoading(true);
      const result = await verifyResetCode(resetData.email, code);
      if (result.success) {
        setResetData(prev => ({
          ...prev,
          token: result.token,
          step: 'reset'
        }));
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (newPassword) => {
    try {
      setIsLoading(true);
      const result = await resetPassword(resetData.token, newPassword);
      if (result.success) {
        toast.success("Mot de passe réinitialisé avec succès");
        setAuthMode('login');
        setResetData({
          email: '',
          token: '',
          step: 'request'
        });
        onClose();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (authMode) {
      case 'signup': return isOtpSent ? "Vérification du code" : "Création de compte";
      case 'login': return "Connexion";
      case 'forgot': 
        return resetData.step === 'request' ? "Mot de passe oublié" :
               resetData.step === 'verify' ? "Vérification du code" :
               "Nouveau mot de passe";
      default: return "Authentification";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 tracking-wide">
          {authMode !== 'forgot' && (
            <div className="flex justify-center space-x-8 relative">
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setIsOtpSent(false);
                }}
                className={`text-sm font-medium ${authMode === 'signup' ? "text-black" : "text-gray-500"}`}
              >
                S&apos;inscrire
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`text-sm font-medium ${authMode === 'login' ? "text-black" : "text-gray-500"}`}
              >
                Se connecter
              </button>
              <div
                className={`absolute -bottom-1 h-0.5 bg-yellow-500 transition-all duration-300 ${
                  authMode === 'signup' ? "left-[calc(32%-60px)] w-[80px]" : "left-[calc(37%+20px)] w-[90px]"
                }`}
              ></div>
            </div>
          )}
  
          {(() => {
            if (authMode === 'signup') {
              return isOtpSent ? (
                <FormOtpVerification 
                  otp={otp} 
                  setOtp={setOtp} 
                  handleVerifyOtp={handleVerifyOtp}
                  isLoading={isLoading}
                />
              ) : (
                <FormInscri 
                  formData={formData} 
                  setFormData={setFormData}  
                  handleSignUp={handleSignUp}
                  isLoading={isLoading}
                />
              );
            } else if (authMode === 'login') {
              return (
                <FormConnexion 
                  formData={formData} 
                  setFormData={setFormData} 
                  handleLogin={handleLogin}
                  onForgotPassword={() => setAuthMode('forgot')}
                  isLoading={isLoading}
                />
              );
            } else if (authMode === 'forgot') {
              if (resetData.step === 'request') {
                return (
                  <FormMotpasseOublie 
                    onBackToLogin={() => setAuthMode('login')}
                    onSuccess={handleForgotPassword}
                    isLoading={isLoading}
                  />
                );
              } else if (resetData.step === 'verify') {
                return (
                  <FormVerifCode
                    email={resetData.email}
                    onBack={() => setResetData({...resetData, step: 'request'})}
                    onSubmit={handleVerifyResetCode}
                    isLoading={isLoading}
                  />
                );
              } else {
                return (
                  <FormReinitialisationMotpass 
                    onBack={() => {
                      if (urlToken) {
                        setAuthMode('login');
                        setResetData({ email: '', token: '', step: 'request' });
                      } else {
                        setResetData({...resetData, step: 'verify'});
                      }
                    }}
                    onSubmit={handleResetPassword}
                    isLoading={isLoading}
                  />
                );
              }
            }
            return null;
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;