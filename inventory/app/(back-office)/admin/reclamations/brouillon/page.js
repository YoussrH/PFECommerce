"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader, CardTitle
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PencilIcon, TrashIcon, FileEditIcon } from "lucide-react"; // Imported FileEditIcon
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DraftReclamations() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftToDelete, setDraftToDelete] = useState(null);
  const router = useRouter();
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setLoading(true);

        const response = await fetch("http://localhost:5000/reclamations/lister?statut=brouillon", {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setDrafts(data.data);
        } else {
          toast.error("Impossible de récupérer les brouillons");
        }
      } catch (error) {
        console.error("Error fetching drafts:", error);
        toast.error("Erreur lors du chargement des brouillons");
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, [token, user]); // Added user to dependency array

  const handleDelete = async (id) => {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/reclamations/supprimer/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Brouillon supprimé avec succès");
        setDrafts(drafts.filter((draft) => draft.id !== id));
      } else {
        toast.error(data.message || "Échec de la suppression");
      }
    } catch (error) {
      console.error("Error deleting reclamation:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDraftToDelete(null);
    }
  };

  if (loading) {
    return <ReclamationsTableSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 md:p-8 lg:p-10"> {/* Added responsive padding */}
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900">Vos Brouillons de Réclamation</h1> {/* Enhanced heading */}

      <Card className="shadow-lg border-gray-100 rounded-xl"> {/* Enhanced card styling */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
          <CardTitle className="text-xl font-semibold text-gray-800">Brouillons Enregistrés</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {drafts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center"> {/* Refined empty state */}
              <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 mb-6">
                <FileEditIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700">Aucun brouillon trouvé</h3>
              <p className="text-gray-500 max-w-sm">
                Commencez à rédiger une réclamation pour la voir apparaître ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200"> {/* Added border to table container */}
              <Table className="min-w-full divide-y divide-gray-200">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sujet</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière modification</TableHead> {/* Changed heading */}
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-100">
                  {drafts.map((draft) => (
                    <TableRow key={draft.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{draft.reference}</TableCell>
                      <TableCell className="px-6 py-4 max-w-[250px] truncate text-sm text-gray-700">{draft.sujet}</TableCell> {/* Increased max-width */}
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {draft.prefix} {draft.prenom} {draft.nom}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(draft.date_modification), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10 px-2.5 py-0.5 text-xs font-medium rounded-full"> {/* Refined badge */}
                          Brouillon
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end"> {/* Aligned actions to end */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-150"
                            onClick={() => router.push(`/admin/reclamations/consulter/${draft.id}`)}
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Continuer
                          </Button>

                          <AlertDialog
                            open={draftToDelete === draft.id}
                            onOpenChange={(open) => !open && setDraftToDelete(null)}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-150"
                                onClick={() => setDraftToDelete(draft.id)}
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Supprimer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white rounded-lg shadow-xl p-6"> {/* Styled AlertDialog */}
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-lg font-semibold text-gray-900">Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600 mt-2">
                                  Êtes-vous sûr de vouloir supprimer ce brouillon ? Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex justify-end gap-3 mt-6">
                                <AlertDialogCancel className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                  onClick={() => handleDelete(draft.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReclamationsTableSkeleton() {
  return (
    <div className="container mx-auto p-6 md:p-8 lg:p-10">
      <Skeleton className="h-10 w-96 mb-8 rounded-md" /> {/* Skeleton for the main heading */}
      <Card className="shadow-lg border-gray-100 rounded-xl">
        <CardHeader className="pb-4 pt-6 px-6">
          <Skeleton className="h-8 w-64" /> {/* Skeleton for card title */}
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => ( // Show 5 skeleton rows
              <div key={i} className="grid grid-cols-6 gap-4 items-center py-4 px-6 border-b border-gray-100 last:border-b-0">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-32 ml-auto" /> {/* Adjusted width for actions */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Ensure FileEditIcon is defined or imported if custom, otherwise ensure it's imported from lucide-react
// function FileEditIcon(props) {
//   return (
//     <svg
// //       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5" />
//       <polyline points="14 2 14 8 20 8" />
//       <path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z" />
//     </svg>
//   );
// }