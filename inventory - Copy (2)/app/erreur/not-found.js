// app/erreur/not-found.js
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotFoundPage  () {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Page Non Trouvée</h2>
        <p className="text-gray-600">
          Désolé, nous n&apos;avons pas pu trouver la page que vous recherchez.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.back()} variant="outline">
            Retour
          </Button>
          <Link href="/" passHref>
            <Button>Retour à l&apos;accueil</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}