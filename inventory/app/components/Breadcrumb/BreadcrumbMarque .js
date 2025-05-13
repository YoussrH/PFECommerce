"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const BreadcrumbMarque = ({ brandName }) => {
  const pathname = usePathname() || "";

  return (
    <div className="border border-gray-300 px-4 py-1 text-sm mb-4 rounded-md flex items-center justify-center">
      <Link href="/" className="text-black hover:underline">
        Accueil
      </Link>
      {" / "}
      <Link href="/store/marques" className="text-black hover:underline">
        Marques
      </Link>
      {" / "}
      <span className="font-semibold">
        {brandName}
      </span>
    </div>
  );
};

export default BreadcrumbMarque;