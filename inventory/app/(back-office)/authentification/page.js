"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useAuth } from "@/app/contexts/AuthContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ForgotPasswordForm from "@/app/components/Auth/FormMotpasseOublie";
import ResetCodeForm from "@/app/components/Auth/FormVerifCode";
import ResetPasswordForm from "@/app/components/Auth/FormReinitialisationMotpass";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  mot_de_passe: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin, authLoading, forgotPassword, verifyResetCode, resetPassword } = useAuth();
  const [resetData, setResetData] = useState({
    email: '',
    token: '',
    step: 'request'
  });
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      mot_de_passe: "",
    },
  });

  async function onSubmit(values) {
    const result = await loginAdmin(values.email, values.mot_de_passe);
    if (result.success) {
      router.push('/admin');
    }
  }

  const handleForgotPassword = async (email) => {
    try {
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
    }
  };

  const handleVerifyResetCode = async (code) => {
    try {
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
    }
  };

  const handleResetPassword = async (newPassword) => {
    try {
      const result = await resetPassword(resetData.token, newPassword);
      if (result.success) {
        toast.success("Mot de passe réinitialisé avec succès");
        setIsForgotPasswordOpen(false);
        setResetData({
          email: '',
          token: '',
          step: 'request'
        });
      }
    } catch (error) {
      toast.error(error.message);
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
    <>
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Connexion Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} method="POST" className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="admin@exemple.com" 
                        {...field} 
                        autoComplete="email"
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mot_de_passe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <Image src="/slasheye.png" width={20} height={20} alt="Hide password icon" className="h-5 w-5 opacity-70 hover:opacity-100" />
                          ) : (
                            <Image src="/eye.png" width={20} height={20} alt="Hide password icon" className="h-5 w-5 opacity-70 hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={authLoading}
              >
                {authLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            <button
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-blue-600 hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}