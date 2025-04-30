// app/erreur/error.js
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold text-gray-800">500</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Erreur du serveur</h2>
        <p className="text-gray-600">
          Une erreur s&apos;est produite. Veuillez réessayer plus tard.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => reset()} variant="outline">
            Réessayer
          </Button>
          <Button onClick={() => router.push('/')}>
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    </div>
  );
}