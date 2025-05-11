"use client";

import { usePathname } from "next/navigation";

const BreadcrumbAccount = () => {
  const pathname = usePathname() || "";

  const segments = pathname
    .split("/")
    .filter((segment) => segment && segment !== "store" && segment !== "account"); 

  return (
    <div className="border border-gray-300 px-4 py-1 text-sm mb-4 rounded-md flex items-center justify-center">
      <span className="text-black">Accueil</span>
      {segments.map((segment, index) => {
        const formattedSegment = segment.replace(/-/g, " ");
        const isLast = index === segments.length - 1;

        const displaySegment =
          segment.toLowerCase() === "customer"
            ? "Tableau de bord du compte"
            : formattedSegment.charAt(0).toUpperCase() + formattedSegment.slice(1);

        return (
          <span key={index} className="text-black">
            {" / "}
            <span className={isLast ? "font-semibold" : "hover:underline cursor-pointer"}>
              {displaySegment}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export default BreadcrumbAccount;