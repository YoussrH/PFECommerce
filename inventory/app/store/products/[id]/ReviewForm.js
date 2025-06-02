"use client";
import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";

export const ReviewForm = ({ productId, onReviewSubmit }) => {
  const { user, isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) return;

    // Validation
    if (!isAuthenticated) {
      toast.error("Vous devez être connecté pour laisser un avis");
      return;
    }

    if (rating === 0) {
      toast.error("Veuillez sélectionner une note");
      return;
    }

    setIsSubmitting(true);

    try {
      // Small delay to prevent accidental double-clicks
      await new Promise(resolve => setTimeout(resolve, 300));

      const response = await fetch("http://localhost:5000/avis/createAvis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          articleId: productId,
          note: rating,
          commentaire: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'ajout de l'avis");
      }

      // Success handling
      toast.success("Votre avis a été ajouté avec succès");
      setRating(0);
      setComment("");

      // Wait a moment before refreshing to show success
      setTimeout(() => {
        if (onReviewSubmit) onReviewSubmit();
      }, 1000);

    } catch (error) {
      console.error('Review submission error:', error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-2">
      <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Laisser un avis</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Note *</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 hover:scale-110 transition-transform"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-6 w-6 sm:h-7 sm:w-7 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 && (
                  <>
                    {rating}/5 -{" "}
                    {rating === 1
                      ? "Très mauvais"
                      : rating === 2
                      ? "Mauvais"
                      : rating === 3
                      ? "Correct"
                      : rating === 4
                      ? "Bon"
                      : "Excellent"}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Commentaire (optionnel)
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec ce produit..."
              className="min-h-[80px] sm:min-h-[100px] text-sm resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/500 caractères
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 sm:flex-none bg-black hover:bg-gray-800 text-white text-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publication...
                </span>
              ) : (
                "Publier l'avis"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRating(0);
                setHoveredRating(0);
                setComment("");
              }}
              disabled={isSubmitting}
              className="text-sm"
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};