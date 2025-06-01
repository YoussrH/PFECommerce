"use client";
import { useState, useEffect } from "react";
import { Mail, Clock, CheckCircle, ChevronRight, ChevronLeft, Search, Filter, X, Download } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/app/contexts/AuthContext";

export default function ServiceClient() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, limit: 10 });

  const API_BASE_URL = "http://localhost:5000/clients/reclamations";

  useEffect(() => {
    const fetchReclamations = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Map frontend filter values to backend expected values
        const backendStatus = filterStatus === "repondu" ? "traite" : 
                            filterStatus === "en_attente" ? "nouveau" : 
                            undefined;

        const response = await axios.get(`${API_BASE_URL}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: pagination.page,
            limit: pagination.limit,
            statut: filterStatus !== "all" ? backendStatus : undefined,
            search: searchTerm || undefined,
            categorie: filterCategory !== "all" ? filterCategory : undefined
          },
        });

        const formattedMessages = response.data.data.reclamations.map((reclamation) => ({
          id: reclamation.id,
          reference: reclamation.reference,
          subject: reclamation.sujet,
          message: reclamation.message,
          response: reclamation.reponse,
          status: reclamation.statut === "traite" ? "repondu" : "en_attente",
          date: reclamation.created_at,
          responseDate: reclamation.date_reponse,
          category: reclamation.categorie,
          files: reclamation.fichiers || [],
          responseFiles: reclamation.fichiers?.filter(f => f.url.includes("/reponses/")) || []
        }));

        setMessages(formattedMessages);
        setPagination({
          ...pagination,
          totalPages: response.data.data.pagination.totalPages,
        });
      } catch (error) {
        console.error("Error fetching reclamations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReclamations();
  }, [pagination.page, filterStatus, filterCategory, searchTerm, user, token]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "repondu":
        return {
          color: "bg-green-100 text-green-800",
          text: "Répondu",
          icon: <CheckCircle className="w-3 h-3 mr-1" />,
        };
      case "en_attente":
        return {
          color: "bg-yellow-100 text-yellow-800",
          text: "En attente",
          icon: <Clock className="w-3 h-3 mr-1" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          text: "Inconnu",
          icon: null,
        };
    }
  };

  const getCategoryName = (category) => {
    const categories = {
      commande: "Commande",
      retour: "Retour ou échange",
      produit: "Information produit",
      compte: "Mon compte",
      autre: "Autre",
    };
    return categories[category] || "Autre";
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleDownload = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
        <div className="text-center py-12">
          <h3 className="text-md font-medium mb-2">Veuillez vous connecter</h3>
          <p className="text-sm text-gray-500">Vous devez être connecté pour accéder à vos messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-2">Mes réclamations</h2>
        <p className="text-sm text-gray-600">Consultez l&apos;historique de vos échanges avec notre service client.</p>
      </div>

      {/* Filters and search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par sujet, message ou référence..."
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
                <option value="repondu">Répondu</option>
                <option value="en_attente">En attente</option>
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
              <span className={`px-2 py-1 text-xs rounded-full flex items-center ${getStatusBadge(selectedMessage.status).color}`}>
                {getStatusBadge(selectedMessage.status).icon}
                {getStatusBadge(selectedMessage.status).text}
              </span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-md font-medium mb-1">{selectedMessage.subject}</h3>
            <p className="text-xs text-gray-500 mb-4">
              Référence: {selectedMessage.reference} • Catégorie: {getCategoryName(selectedMessage.category)}
            </p>

            {/* Original message */}
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
                  
                  {/* Display attached files */}
                  {selectedMessage.files.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Pièces jointes:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMessage.files.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                            onClick={() => handleDownload(file.url, file.name)}
                          >
                            <Download size={12} />
                            {file.name} ({file.size})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Response section */}
            {selectedMessage.status === "repondu" && selectedMessage.response && (
              <div className="mt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-black text-white p-3 rounded-lg">
                      <p className="text-sm whitespace-pre-line">{selectedMessage.response}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Répondu le {formatDate(selectedMessage.responseDate)}
                    </p>

                    {/* Display response files if any */}
                    {selectedMessage.responseFiles.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-300 mb-1">Pièces jointes:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMessage.responseFiles.map((file, index) => (
                            <div 
                              key={index} 
                              className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-100 cursor-pointer"
                              onClick={() => handleDownload(file.url, file.name)}
                            >
                              <Download size={12} />
                              {file.name} ({file.size})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-sm">
          <Mail size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-md font-medium mb-2">Aucune réclamation trouvée</h3>
          <p className="text-sm text-gray-500">
            {searchTerm || filterStatus !== "all" || filterCategory !== "all"
              ? "Aucune réclamation ne correspond à vos critères de recherche."
              : "Vous n'avez pas encore envoyé de réclamation à notre service client."}
          </p>
          {(searchTerm || filterStatus !== "all" || filterCategory !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterCategory("all");
              }}
              className="mt-4 text-sm text-black underline hover:no-underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="border border-gray-200 rounded-sm overflow-hidden hover:border-gray-300 transition-colors cursor-pointer"
              onClick={() => setSelectedMessage(message)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-medium">{message.subject}</h3>
                    <p className="text-xs text-gray-500">Ref: {message.reference}</p>
                  </div>
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

                {message.files.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <span>Pièces jointes: {message.files.length}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  {message.status === "repondu" ? (
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
          
          {/* Pagination controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm text-gray-600 disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} sur {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 text-sm text-gray-600 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}