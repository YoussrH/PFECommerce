"use client";
import { useState, useEffect } from "react";
import { Star, Loader2, MessageCircle, Plus } from "lucide-react";
import { ReviewForm } from "./ReviewForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const ProductReviews = ({ productId }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/avis/getProductReviews/${productId}`
      );
      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      if (data.success) {
        const reviewsData = data.data || [];
        setReviews(reviewsData);

        if (reviewsData.length > 0) {
          const total = reviewsData.length;
          const sum = reviewsData.reduce((acc, review) => acc + review.note, 0);
          const average = sum / total;

          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          reviewsData.forEach((review) => distribution[review.note]++);
          setStats({ average, total, distribution });
        }
      } else {
        throw new Error(data.message || "Failed to fetch reviews");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify purchase
  const verifierAchatArticle = async () => {
    try {
      setCheckingPurchase(true);
      const response = await fetch(
        `http://localhost:5000/clients/verifierAchatArticle/${productId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to verify purchase");

      const data = await response.json();
      setHasPurchased(data?.data?.hasPurchased || false);
    } catch (err) {
      console.error("Purchase verification error:", err);
      setHasPurchased(false);
    } finally {
      setCheckingPurchase(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Check purchase when auth state or product changes
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      verifierAchatArticle();
    } else {
      setHasPurchased(false);
      setCheckingPurchase(false);
    }
  }, [isAuthenticated, authLoading, productId]);

  // Handle review submission
  const handleReviewSubmit = async () => {
    await fetchReviews();
    setShowReviewForm(false);
  };

  // Helper functions
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getInitials = (prenom, nom) =>
    `${prenom?.charAt(0) || ""}${nom?.charAt(0) || ""}`.toUpperCase();

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="text-red-500 text-sm text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add review button - shown only for authenticated users who purchased */}
      {!checkingPurchase && isAuthenticated && hasPurchased && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowReviewForm(!showReviewForm)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>{showReviewForm ? "Masquer" : "Écrire un avis"}</span>
          </Button>
        </div>
      )}

      {/* Reviews Summary */}
      {reviews.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">
                  {stats.average.toFixed(1)}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(stats.average)
                            ? "fill-current text-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {stats.total} avis
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-64 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-6">{rating}</span>
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (stats.distribution[rating] / stats.total) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-8">
                      {stats.distribution[rating]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form - shown only when toggled */}
      {showReviewForm && (
        <ReviewForm 
          productId={productId} 
          onReviewSubmit={handleReviewSubmit} 
        />
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Aucun avis pour ce produit</p>
            <p className="text-xs text-gray-400">
              Soyez le premier à partager votre expérience !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {getInitials(
                          review.utilisateur?.prenom || '', 
                          review.utilisateur?.nom || ''
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">
                          {review.utilisateur.prenom} {review.utilisateur.nom}
                        </h4>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.note
                                  ? "fill-current text-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    {review.commentaire && (
                      <p className="mt-2 text-sm text-gray-600">
                        {review.commentaire}
                      </p>
                    )}
                    {review.est_verifie && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Achat vérifié
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Show purchase/auth messages only when form is not shown */}
      {!showReviewForm && (
        <>
          {checkingPurchase ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !isAuthenticated ? (
            <Card>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-gray-600 text-center">
                  Connectez-vous pour laisser un avis sur ce produit
                </p>
              </CardContent>
            </Card>
          ) : !hasPurchased ? (
            <Card>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-gray-600 text-center">
                  Vous devez avoir acheté ce produit pour laisser un avis
                </p>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
};