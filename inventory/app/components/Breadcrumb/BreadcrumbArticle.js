"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const BreadcrumbArticle = ({ productName }) => {
  const pathname = usePathname() || "";
  const [breadcrumbDetails, setBreadcrumbDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const segments = pathname
    .split("/")
    .filter((segment) => segment && segment !== "store");

  const isProductDetailPage = segments[0] === "products" && segments.length > 1;
  const productId = isProductDetailPage ? segments[1] : null;

  useEffect(() => {
    if (!isProductDetailPage || !productId) {
      return;
    }

    const fetchBreadcrumbDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:5000/articles/obtenirArticleParId/${productId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch product details: ${response.status}`);
        }

        const { donnees: article } = await response.json();

        if (!article) {
          throw new Error("Product data not found");
        }

        // Extract breadcrumb information from the article data
        const breadcrumb = [
          article.genre?.libelle,
          article.categorie?.parent?.libelle,
          article.categorie?.libelle,
        ].filter(Boolean);

        setBreadcrumbDetails(breadcrumb);
      } catch (err) {
        console.error("Error fetching breadcrumb details:", err);
        setError(err.message);
        setBreadcrumbDetails([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBreadcrumbDetails();
  }, [isProductDetailPage, productId]);

  if (isLoading) {
    return (
      <div className="border border-gray-300 px-4 py-1 text-sm mb-4 rounded-md flex items-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-gray-300 px-4 py-1 text-sm mb-4 rounded-md flex items-center">
        <span className="text-red-500">Error loading breadcrumb</span>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 px-4 py-1 text-sm mb-4 rounded-md flex items-center justify-center flex-wrap">
      <span className="text-black hover:underline cursor-pointer">Accueil</span>

      {isProductDetailPage ? (
        <>
          {breadcrumbDetails.map((segment, index) => (
            <span key={index} className="text-black">
              {" / "}
              <span className={index === breadcrumbDetails.length - 1 ? "font-semibold" : "hover:underline cursor-pointer"}>
                {segment}
              </span>
            </span>
          ))}
          {productName && (
            <span className="text-black">
              {" / "}
              <span className="font-semibold">{productName}</span>
            </span>
          )}
        </>
      ) : (
        segments.map((segment, index) => {
          const lower = segment.toLowerCase();
          let displaySegment;

          if (lower === "client") {
            displaySegment = "Tableau de bord du compte";
          } else if (lower === "contacts") {
            displaySegment = "Contactez-nous";
          } else {
            displaySegment = segment
              .replace(/-/g, " ")
              .split(" ")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
          }

          return (
            <span key={index} className="text-black">
              {" / "}
              <span className={index === segments.length - 1 ? "font-semibold" : "hover:underline cursor-pointer"}>
                {displaySegment}
              </span>
            </span>
          );
        })
      )}
    </div>
  );
};

export default BreadcrumbArticle;
