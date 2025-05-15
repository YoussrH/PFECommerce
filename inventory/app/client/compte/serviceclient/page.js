"use client"
import { useState, useEffect } from "react"
import { Mail, Clock, CheckCircle, ChevronRight, ChevronLeft, Search, Filter, X } from "lucide-react"

// Mock data for messages - in a real app, this would come from an API
const mockMessages = [
  {
    id: "msg-001",
    subject: "Question sur ma commande #ORD-2023-1234",
    message:
      "Bonjour, je n'ai toujours pas reçu ma commande passée il y a 10 jours. Pouvez-vous me donner des informations sur sa livraison ?",
    response:
      "Bonjour, nous avons vérifié votre commande #ORD-2023-1234. Elle a été expédiée le 12/05/2023 et devrait être livrée demain. Le numéro de suivi est 1Z999AA10123456784. N'hésitez pas à nous contacter si vous avez d'autres questions.",
    status: "answered",
    date: "2023-05-15T14:30:00",
    responseDate: "2023-05-15T16:45:00",
    category: "commande",
  },
  {
    id: "msg-002",
    subject: "Retour produit défectueux",
    message:
      "J'ai reçu un article défectueux dans ma dernière commande. La fermeture éclair de la veste ne fonctionne pas correctement. Comment puis-je procéder pour un retour ?",
    response:
      "Bonjour, nous sommes désolés pour ce désagrément. Vous pouvez initier un retour directement depuis votre compte client dans la section 'Mes commandes'. Sélectionnez la commande concernée, puis 'Retourner un article'. Nous vous enverrons une étiquette de retour prépayée par email. Dès réception de l'article, nous procéderons à un remboursement ou à un échange selon votre préférence.",
    status: "answered",
    date: "2023-05-10T09:15:00",
    responseDate: "2023-05-10T11:30:00",
    category: "retour",
  },
  {
    id: "msg-003",
    subject: "Disponibilité d'un produit",
    message:
      "Bonjour, je souhaiterais savoir quand le pull en cachemire bleu marine sera de nouveau disponible en taille M ?",
    response:
      "Bonjour, merci pour votre intérêt pour notre pull en cachemire. Nous prévoyons un réapprovisionnement de ce modèle en taille M d'ici 2 semaines. Vous pouvez utiliser la fonction 'Prévenez-moi' sur la page du produit pour recevoir une notification dès qu'il sera de nouveau disponible.",
    status: "answered",
    date: "2023-05-05T16:20:00",
    responseDate: "2023-05-06T10:15:00",
    category: "produit",
  },
  {
    id: "msg-004",
    subject: "Problème de connexion à mon compte",
    message:
      "Je n'arrive plus à me connecter à mon compte depuis hier. J'ai essayé de réinitialiser mon mot de passe mais je ne reçois pas l'email de réinitialisation.",
    response:
      "Bonjour, nous avons identifié un problème technique temporaire avec notre système d'envoi d'emails. Le problème est maintenant résolu. Nous vous avons envoyé un nouveau lien de réinitialisation de mot de passe. Si vous rencontrez toujours des difficultés, n'hésitez pas à nous contacter.",
    status: "answered",
    date: "2023-05-02T11:45:00",
    responseDate: "2023-05-02T14:20:00",
    category: "compte",
  },
  {
    id: "msg-005",
    subject: "Question sur les frais de livraison",
    message:
      "Bonjour, je souhaite commander plusieurs articles mais je me demande si les frais de livraison sont calculés par article ou par commande ?",
    response: "",
    status: "pending",
    date: "2023-05-18T08:30:00",
    responseDate: null,
    category: "autre",
  },
]

export default function ServiceClient() {
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")

  // Simulate API call to fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true)
      // Simulate API delay
      setTimeout(() => {
        setMessages(mockMessages)
        setIsLoading(false)
      }, 1000)
    }

    fetchMessages()
  }, [])

  // Filter messages based on search term and filters
  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || message.status === filterStatus

    const matchesCategory = filterCategory === "all" || message.category === filterCategory

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Format date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get status badge color and text
  const getStatusBadge = (status) => {
    switch (status) {
      case "answered":
        return {
          color: "bg-green-100 text-green-800",
          text: "Répondu",
          icon: <CheckCircle className="w-3 h-3 mr-1" />,
        }
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          text: "En attente",
          icon: <Clock className="w-3 h-3 mr-1" />,
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          text: "Inconnu",
          icon: null,
        }
    }
  }

  // Get category display name
  const getCategoryName = (category) => {
    const categories = {
      commande: "Commande",
      retour: "Retour ou échange",
      produit: "Information produit",
      compte: "Mon compte",
      autre: "Autre",
    }
    return categories[category] || "Autre"
  }

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-2">Mes messages</h2>
        <p className="text-sm text-gray-600">Consultez l&apos;historique de vos échanges avec notre service client.</p>
      </div>

      {/* Filters and search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans vos messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative w-full sm:w-40">
              <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm text-sm appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="answered">Répondus</option>
                <option value="pending">En attente</option>
              </select>
            </div>

            <div className="relative w-full sm:w-48">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm text-sm appearance-none"
              >
                <option value="all">Toutes les catégories</option>
                <option value="commande">Commande</option>
                <option value="retour">Retour ou échange</option>
                <option value="produit">Information produit</option>
                <option value="compte">Mon compte</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : selectedMessage ? (
        // Message detail view
        <div className="border border-gray-200 rounded-sm overflow-hidden">
          <div className="bg-gray-50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => setSelectedMessage(null)}
              className="flex items-center text-sm text-gray-600 hover:text-black"
            >
              <ChevronLeft size={16} className="mr-1" />
              Retour à la liste
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{formatDate(selectedMessage.date)}</span>
              <span
                className={`px-2 py-1 text-xs rounded-full flex items-center ${getStatusBadge(selectedMessage.status).color}`}
              >
                {getStatusBadge(selectedMessage.status).icon}
                {getStatusBadge(selectedMessage.status).text}
              </span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-md font-medium mb-1">{selectedMessage.subject}</h3>
            <p className="text-xs text-gray-500 mb-4">Catégorie: {getCategoryName(selectedMessage.category)}</p>

            <div className="mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">Moi</span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{selectedMessage.message}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(selectedMessage.date)}</p>
                </div>
              </div>
            </div>

            {selectedMessage.status === "answered" && (
              <div className="mt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-black text-white p-3 rounded-lg">
                      <p className="text-sm whitespace-pre-line">{selectedMessage.response}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(selectedMessage.responseDate)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-sm">
          <Mail size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-md font-medium mb-2">Aucun message trouvé</h3>
          <p className="text-sm text-gray-500">
            {searchTerm || filterStatus !== "all" || filterCategory !== "all"
              ? "Aucun message ne correspond à vos critères de recherche."
              : "Vous n'avez pas encore envoyé de message à notre service client."}
          </p>
          {(searchTerm || filterStatus !== "all" || filterCategory !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("")
                setFilterStatus("all")
                setFilterCategory("all")
              }}
              className="mt-4 text-sm text-black underline hover:no-underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        // Messages list view
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className="border border-gray-200 rounded-sm overflow-hidden hover:border-gray-300 transition-colors cursor-pointer"
              onClick={() => setSelectedMessage(message)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-medium">{message.subject}</h3>
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded-full flex items-center whitespace-nowrap ${getStatusBadge(message.status).color}`}
                  >
                    {getStatusBadge(message.status).icon}
                    {getStatusBadge(message.status).text}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-2">
                  Catégorie: {getCategoryName(message.category)} • {formatDate(message.date)}
                </p>

                <p className="text-sm text-gray-700 line-clamp-2 mb-2">{message.message}</p>

                <div className="flex justify-between items-center">
                  {message.status === "answered" ? (
                    <p className="text-xs text-gray-500">Répondu le {formatDate(message.responseDate)}</p>
                  ) : (
                    <p className="text-xs text-yellow-600">En attente de réponse</p>
                  )}

                  <button className="text-xs flex items-center text-black hover:underline">
                    Voir détails <ChevronRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
