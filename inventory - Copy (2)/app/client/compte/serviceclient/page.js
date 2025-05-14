"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, MessageSquare, HelpCircle, Send } from 'lucide-react';

export default function ServiceClient() {
  const [contactMethod, setContactMethod] = useState("email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Votre message a été envoyé avec succès");
      setSubject("");
      setMessage("");
    }, 1500);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-2">Service Client</h2>
        <p className="text-sm text-gray-600">
          Nous sommes là pour vous aider. Choisissez votre méthode de contact préférée.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div 
          className={`p-4 border rounded-sm cursor-pointer transition-colors ${
            contactMethod === "email" ? "border-black bg-gray-50" : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setContactMethod("email")}
        >
          <div className="flex items-center gap-3 mb-2">
            <Mail size={20} className={contactMethod === "email" ? "text-black" : "text-gray-500"} />
            <h3 className="font-medium">Email</h3>
          </div>
          <p className="text-sm text-gray-600">
            Envoyez-nous un message et nous vous répondrons dans les 24 heures.
          </p>
        </div>

        <div 
          className={`p-4 border rounded-sm cursor-pointer transition-colors ${
            contactMethod === "phone" ? "border-black bg-gray-50" : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setContactMethod("phone")}
        >
          <div className="flex items-center gap-3 mb-2">
            <Phone size={20} className={contactMethod === "phone" ? "text-black" : "text-gray-500"} />
            <h3 className="font-medium">Téléphone</h3>
          </div>
          <p className="text-sm text-gray-600">
            Appelez-nous au 01 23 45 67 89 du lundi au vendredi, de 9h à 18h.
          </p>
        </div>

        <div 
          className={`p-4 border rounded-sm cursor-pointer transition-colors ${
            contactMethod === "chat" ? "border-black bg-gray-50" : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setContactMethod("chat")}
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={20} className={contactMethod === "chat" ? "text-black" : "text-gray-500"} />
            <h3 className="font-medium">Chat en direct</h3>
          </div>
          <p className="text-sm text-gray-600">
            Discutez en direct avec un conseiller, disponible de 10h à 17h.
          </p>
        </div>

        <div 
          className={`p-4 border rounded-sm cursor-pointer transition-colors ${
            contactMethod === "faq" ? "border-black bg-gray-50" : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setContactMethod("faq")}
        >
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle size={20} className={contactMethod === "faq" ? "text-black" : "text-gray-500"} />
            <h3 className="font-medium">FAQ</h3>
          </div>
          <p className="text-sm text-gray-600">
            Consultez notre base de connaissances pour des réponses rapides.
          </p>
        </div>
      </div>

      {contactMethod === "email" && (
        <div className="border border-gray-200 rounded-sm p-4 md:p-6">
          <h3 className="text-md font-medium mb-4">Envoyez-nous un message</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1">
                Sujet
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                required
              >
                <option value="">Sélectionnez un sujet</option>
                <option value="commande">Question sur ma commande</option>
                <option value="retour">Retour ou échange</option>
                <option value="produit">Information produit</option>
                <option value="compte">Mon compte</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? "Envoi en cours..." : "Envoyer"} 
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {contactMethod === "faq" && (
        <div className="border border-gray-200 rounded-sm p-4 md:p-6">
          <h3 className="text-md font-medium mb-4">Questions fréquemment posées</h3>
          
          <div className="space-y-4">
            {[
              {
                question: "Comment suivre ma commande ?",
                answer: "Vous pouvez suivre votre commande dans la section 'Mes commandes' de votre compte client. Un numéro de suivi vous sera fourni dès que votre colis sera expédié."
              },
              {
                question: "Comment effectuer un retour ?",
                answer: "Pour effectuer un retour, rendez-vous dans la section 'Mes commandes', sélectionnez la commande concernée et cliquez sur 'Retourner un article'. Vous recevrez ensuite les instructions par email."
              },
              {
                question: "Quels sont les délais de livraison ?",
                answer: "Les délais de livraison varient selon le mode de livraison choisi. En général, comptez 2-3 jours ouvrés pour une livraison standard et 1 jour ouvré pour une livraison express."
              },
              {
                question: "Comment modifier mes informations personnelles ?",
                answer: "Vous pouvez modifier vos informations personnelles dans la section 'Mon profil' de votre compte client."
              }
            ].map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <h4 className="font-medium text-sm mb-2">{item.question}</h4>
                <p className="text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
