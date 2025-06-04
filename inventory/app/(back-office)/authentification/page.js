"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import ForgotPasswordForm from "@/app/components/Auth/FormMotpasseOublie";
import ResetCodeForm from "@/app/components/Auth/FormVerifCode";
import ResetPasswordForm from "@/app/components/Auth/FormReinitialisationMotpass";

const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  mot_de_passe: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export default function LoginPage() {
  const router = useRouter();
  const { loginAdmin, authLoading, forgotPassword, verifyResetCode, resetPassword } = useAuth();
  const [resetData, setResetData] = useState({
    email: '',
    token: '',
    step: 'request'
  });
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      mot_de_passe: "",
    },
  });

  async function onSubmit(values) {
    setIsSubmitting(true);
    const toastId = toast.loading("Connexion en cours...");
    
    try {
      const result = await loginAdmin(values.email, values.mot_de_passe);
      
      if (result.success) {
        toast.success("Connexion réussie ! Redirection en cours...", { id: toastId });
        router.push('/admin');
      } else {
        toast.error(result.error || "Échec de la connexion", { id: toastId });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Une erreur est survenue", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleForgotPassword = async (email) => {
    const toastId = toast.loading("Envoi du code de réinitialisation...");
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        toast.success("Code envoyé à votre email", { id: toastId });
        setResetData({
          email: email,
          token: '',
          step: 'verify'
        });
      }
    } catch (error) {
      toast.error(error.message || "Échec de l'envoi du code", { id: toastId });
    }
  };

  const handleVerifyResetCode = async (code) => {
    const toastId = toast.loading("Vérification du code...");
    try {
      const result = await verifyResetCode(resetData.email, code);
      if (result.success) {
        toast.success("Code validé", { id: toastId });
        setResetData(prev => ({
          ...prev,
          token: result.token,
          step: 'reset'
        }));
      }
    } catch (error) {
      toast.error(error.message || "Code invalide", { id: toastId });
    }
  };

  const handleResetPassword = async (newPassword) => {
    const toastId = toast.loading("Réinitialisation du mot de passe...");
    try {
      const result = await resetPassword(resetData.token, newPassword);
      if (result.success) {
        toast.success("Mot de passe réinitialisé avec succès", { id: toastId });
        setIsForgotPasswordOpen(false);
        setResetData({
          email: '',
          token: '',
          step: 'request'
        });
      }
    } catch (error) {
      toast.error(error.message || "Échec de la réinitialisation", { id: toastId });
    }
  };

  const getTitle = () => {
    switch (resetData.step) {
      case 'request': return "Mot de passe oublié";
      case 'verify': return "Vérification du code";
      case 'reset': return "Nouveau mot de passe";
      default: return "Réinitialisation";
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans antialiased">
      {/* Left Section - Illustration */}
      <div className="relative w-full lg:w-1/2">
        <Image
          src="/illustration.png"
          alt="Illustration"
          width={900}
          height={400}
          className="w-full h-screen object-cover"
        />
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md bg-white rounded-lg p-6 sm:p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Connectez-vous à votre compte
          </h2>
          <p className="text-gray-600 mb-8">
            Voir ce qui se passe dans votre entreprise
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                {...form.register("email")}
                placeholder="votre.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ease-in-out"
                required
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  {...form.register("mot_de_passe")}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ease-in-out pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {form.formState.errors.mot_de_passe && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.mot_de_passe.message}
                </p>
              )}
            </div>

            <div className="flex justify-end mb-6">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-sm text-[#7F265B] hover:text-orange-800 font-medium transition duration-200 ease-in-out"
              >
                Mot de passe oublié?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full bg-[#7F265B] hover:border-[#7F265B] hover:bg-white hover:text-[#7F265B] text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex justify-center items-center"
            >
              {isSubmitting || authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : "Se Connecter"}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {getTitle()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 tracking-wide">
            {resetData.step === 'request' && (
              <ForgotPasswordForm 
                onBackToLogin={() => setIsForgotPasswordOpen(false)}
                onSuccess={handleForgotPassword}
                isLoading={authLoading}
              />
            )}
            {resetData.step === 'verify' && (
              <ResetCodeForm
                email={resetData.email}
                onBack={() => setResetData({...resetData, step: 'request'})}
                onSubmit={handleVerifyResetCode}
                isLoading={authLoading}
              />
            )}
            {resetData.step === 'reset' && (
              <ResetPasswordForm 
                onBack={() => setResetData({...resetData, step: 'verify'})}
                onSubmit={handleResetPassword}
                isLoading={authLoading}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}