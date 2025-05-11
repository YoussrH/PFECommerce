'use client'
import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { usePanier } from '@/hooks/use-panier'
import ResumeCommande from '@/app/components/caisse/CartSummary'
import { toast } from 'sonner'

const CheckoutAuthForm = () => {
  const router = useRouter()
  const { login, register, verifyOtp, authLoading } = useAuth()
  const { initialiserCommande } = usePanier()
  
  const [isSignUp, setIsSignUp] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [formData, setFormData] = useState({
    prefix: 'Monsieur',
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '', // Changed from 'password' to match backend
    newsletter: false,
  })
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [formValid, setFormValid] = useState(false)

  // Validate form on change
  useEffect(() => {
    if (isSignUp) {
      const isValid = 
        formData.prefix && 
        formData.nom.trim() && 
        formData.prenom.trim() && 
        validateEmail(formData.email) && 
        validatePassword(formData.mot_de_passe)
      setFormValid(isValid)
    } else {
      setFormValid(
        validateEmail(formData.email) && 
        formData.mot_de_passe.length >= 6
      )
    }
  }, [formData, isSignUp])

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePassword = (password) => {
    return password.length >= 6
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    
    if (!formValid) {
      toast.error('Veuillez remplir tous les champs requis correctement')
      return
    }

    try {
      const registrationData = {
        prefix: formData.prefix,
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.toLowerCase().trim(),
        mot_de_passe: formData.mot_de_passe, // Using correct field name
        newsletter: formData.newsletter
      }

      console.log('Registration data being sent:', registrationData) // Debug log

      const result = await register(registrationData)

      if (result.success) {
        setIsOtpSent(true)
        toast.success('Code de vérification envoyé à votre email')
      } else {
        // Handle specific backend validation errors
        if (result.error.includes('email')) {
          setErrors(prev => ({ ...prev, email: result.error }))
        } else if (result.error.includes('mot_de_passe')) {
          setErrors(prev => ({ ...prev, mot_de_passe: result.error }))
        } else {
          toast.error(result.error || "Échec de l'inscription")
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.message || "Une erreur s'est produite lors de l'inscription")
    }
  }

  /* const handleVerifyOtp = async (e) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      toast.error('Veuillez entrer un code OTP valide (6 chiffres)')
      return
    }

    try {
      const result = await verifyOtp(otp)
      
      if (result.success) {
        toast.success('Compte vérifié avec succès')
        
        // Initialize checkout after successful verification
        try {
          const nextStep = await initialiserCommande(true)
          if (nextStep) {
            router.push(nextStep)
          } else {
            router.push('/caisse/adresse')
          }
        } catch (error) {
          console.error('Checkout initialization error:', error)
          toast.error("Erreur lors de l'initialisation de la commande")
          router.push('/panier')
        }
      } else {
        toast.error(result.error || 'Code OTP invalide')
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      toast.error(error.response?.data?.message || "Une erreur s'est produite lors de la vérification")
    }
  } */
    const handleVerifyOtp = async (e) => {
      e.preventDefault();
      
      if (otp.length !== 6) {
        toast.error('Veuillez entrer un code OTP valide (6 chiffres)');
        return;
      }
    
      try {
        // 1. Verify OTP first
        const result = await verifyOtp(otp);
        
        if (!result.success) {
          toast.error(result.error || 'Code OTP invalide');
          return;
        }
    
        toast.success('Compte vérifié avec succès');
        
        // 2. Small delay to ensure auth state is updated
        await new Promise(resolve => setTimeout(resolve, 500));
    
        // 3. Initialize checkout with retry logic
        let retryCount = 0;
        const maxRetries = 2;
        let lastError = null;
    
        while (retryCount < maxRetries) {
          try {
            const nextStep = await initialiserCommande(true);
            
            if (nextStep) {
              router.push(nextStep);
              return;
            }
            
            // If no specific next step, go to address by default
            router.push('/caisse/adresse');
            return;
          } catch (error) {
            console.error(`Checkout init attempt ${retryCount + 1} failed:`, error);
            lastError = error;
            retryCount++;
            
            // Refresh cart before retrying
            await usePanier.getState().recupererPanier();
            
            // Small delay between retries
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
    
        // All retries failed
        toast.error(lastError?.message || "Erreur lors de l'initialisation de la commande");
        router.push('/panier');
        
      } catch (error) {
        console.error('OTP verification error:', error);
        toast.error(error.response?.data?.message || "Une erreur s'est produite lors de la vérification");
      }
    };
  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!formValid) {
      toast.error('Veuillez entrer un email et mot de passe valides')
      return
    }

    try {
      const result = await login(
        formData.email.toLowerCase().trim(),
        formData.mot_de_passe // Using correct field name
      )

      if (result.success) {
        toast.success('Connexion réussie')
        
        // Initialize checkout after successful login
        try {
          const nextStep = await initialiserCommande(true)
          if (nextStep) {
            router.push(nextStep)
          } else {
            router.push('/caisse/adresse')
          }
        } catch (error) {
          console.error('Checkout initialization error:', error)
          toast.error("Erreur lors de l'initialisation de la commande")
          router.push('/panier')
        }
      } else {
        toast.error(result.error || 'Échec de la connexion')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.message || "Une erreur s'est produite lors de la connexion")
    }
  }

  const handlePrevious = () => {
    router.push('/caisse/panier')
  }

  const getInputClass = (hasError) => 
    `w-full text-xs bg-white border rounded-none ${hasError ? 'border-red-500' : 'border-black'}`

  return (
    <div className="flex w-full max-w-4xl mx-72 pl-8 gap-5">
      <div className="flex-1 max-w-lg">
        <div className="flex w-full justify-start space-x-2 relative mb-6">
          <button
            onClick={() => !authLoading && setIsSignUp(false)}
            className={`text-sm font-medium px-9 w-96 py-2 border ${!isSignUp ? 'border-black text-black' : 'border-gray-300 text-gray-500'} ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={authLoading}
          >
            DÉJÀ CLIENT ?
          </button>
          <button
            onClick={() => !authLoading && setIsSignUp(true)}
            className={`text-sm font-medium w-96 px-8 py-2 border ${isSignUp ? 'border-black text-black' : 'border-gray-300 text-gray-500'} ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={authLoading}
          >
            Nouveau client ?
          </button>
        </div>

        <div className="transition-all duration-300">
          {isOtpSent ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="w-64 ml-32">
                <label className="block text-black font-medium mb-1 text-xs">
                  Code de vérification <span className="text-yellow-500">*</span>
                </label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  className="bg-white border border-black"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="mt-2 text-xs text-gray-500">
                  Entrez le code à 6 chiffres envoyé à votre email
                </p>
              </div>

              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="text-xs rounded-none border border-black"
                  disabled={authLoading}
                >
                  Étape précédente
                </Button>
                <Button
                  type="submit"
                  className="text-xs rounded-none bg-black text-white border border-black hover:bg-white hover:text-black"
                  disabled={authLoading || otp.length !== 6}
                >
                  {authLoading ? 'Vérification...' : 'Vérifier le code'}
                </Button>
              </div>
            </form>
          ) : isSignUp ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="w-full">
                <label className="block text-black font-medium mb-1 text-xs">
                  Civilité <span className="text-yellow-500">*</span>
                </label>
                <div className="flex items-center space-x-4">
                {['Madame', 'Monsieur', 'Mlle'].map((title) => ( // Changed from 'MLLE' to 'Mlle'
                    <label key={title} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="prefix"
                        value={title}
                        checked={formData.prefix === title}
                        onChange={handleChange}
                        className="form-radio h-4 w-4 text-black rounded-sm focus:ring-black focus:border-white"
                        disabled={authLoading}
                      />
                      <span className="text-xs text-black">{title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-full">
                <label className="block text-black font-medium mb-1 text-xs">
                  Nom <span className="text-yellow-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nom"
                  placeholder="Nom"
                  className={getInputClass(errors.nom)}
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  disabled={authLoading}
                />
                {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
              </div>

              <div className="w-full">
                <label className="block text-black font-medium mb-1 text-xs">
                  Prénom <span className="text-yellow-500">*</span>
                </label>
                <Input
                  type="text"
                  name="prenom"
                  placeholder="Prénom"
                  className={getInputClass(errors.prenom)}
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  disabled={authLoading}
                />
                {errors.prenom && <p className="text-xs text-red-500 mt-1">{errors.prenom}</p>}
              </div>

              <div className="w-full">
                <label className="block text-black font-medium mb-1 text-xs">
                  Email <span className="text-yellow-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={getInputClass(errors.email)}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={authLoading}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                <p className="mt-1 text-xs text-black text-start">
                  N&apos;oubliez pas de valider votre adresse e-mail.
                </p>
              </div>

              <div className="w-full">
                <label className="block text-black font-medium mb-1 text-xs">
                  Mot de passe <span className="text-yellow-500">*</span>
                </label>
                <Input
                  type="password"
                  name="mot_de_passe" // Changed to match backend
                  placeholder="Mot de passe (6 caractères minimum)"
                  className={getInputClass(errors.mot_de_passe)}
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  required
                  disabled={authLoading}
                />
                {errors.mot_de_passe && <p className="text-xs text-red-500 mt-1">{errors.mot_de_passe}</p>}
              </div>

              <div className="flex items-center space-x-2 w-64">
                <Checkbox
                  id="newsletter"
                  name="newsletter"
                  checked={formData.newsletter}
                  onCheckedChange={(checked) => setFormData({ ...formData, newsletter: checked })}
                  className="bg-white border border-black rounded-none"
                  disabled={authLoading}
                />
                <label htmlFor="newsletter" className="text-xs text-black">
                  Je m&apos;inscris à la newsletter
                </label>
              </div>

              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="text-xs rounded-none border border-black"
                  disabled={authLoading}
                >
                  Étape précédente
                </Button>
                <Button
                  type="submit"
                  className="text-xs rounded-none bg-black text-white border border-black hover:bg-white hover:text-black"
                  disabled={authLoading || !formValid}
                >
                  {authLoading ? 'Inscription en cours...' : "S'inscrire"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="w-full">
                <label className="block text-black font-medium mb-2 text-xs">
                  Email <span className="text-yellow-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={getInputClass(errors.email)}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={authLoading}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div className="w-full">
                <label className="block text-black font-medium mb-2 text-xs">
                  Mot de passe <span className="text-yellow-500">*</span>
                </label>
                <Input
                  type="password"
                  name="mot_de_passe" // Changed to match backend
                  placeholder="Mot de passe"
                  className={getInputClass(errors.mot_de_passe)}
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  required
                  disabled={authLoading}
                />
                {errors.mot_de_passe && <p className="text-xs text-red-500 mt-1">{errors.mot_de_passe}</p>}
              </div>

              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    className="bg-white border border-black rounded-none" 
                    disabled={authLoading}
                  />
                  <label htmlFor="remember" className="text-xs text-black">
                    Rester connecté
                  </label>
                </div>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => router.push('/mot-de-passe-oublie')}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="text-xs rounded-none border border-black"
                  disabled={authLoading}
                >
                  Étape précédente
                </Button>
                <Button
                  type="submit"
                  className="text-xs rounded-none bg-black text-white border border-black hover:bg-white hover:text-black"
                  disabled={authLoading || !formValid}
                >
                  {authLoading ? 'Connexion en cours...' : 'Se connecter'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <div className="hidden md:block">
        <ResumeCommande 
          showPromoCode={false}
          showCheckoutButton={false}
        />
      </div>
    </div>
  )
}

export default CheckoutAuthForm