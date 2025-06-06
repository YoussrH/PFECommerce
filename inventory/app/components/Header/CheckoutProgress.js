'use client';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const CheckoutProgress = () => {
  const steps = [
    { name: "Mon Panier", path: "/caisse/panier" },
    { name: "M'Identifier", path: "/caisse/identification" },
    { name: "Adresses", path: "/caisse/adresse" },
    { name: "Livraison", path: "/caisse/livraison" },
    { name: "Paiement", path: "/caisse/paiement" },
  ];

  const pathname = usePathname() || "";

  const currentStepIndex = steps.findIndex((step) => pathname.startsWith(step.path));

  return (
    <div className="w-full text-center py-4 md:py-6 flex flex-col items-center">
      <div className="mb-2 md:mb-4">
        <Link href="/">
          <Image 
            src="/mgm1.svg" 
            alt="Logo" 
            width={80} 
            height={90} 
            style={{ width: 'auto', height: 'auto' }}
            className="cursor-pointer" 
            priority
          />
        </Link>
      </div>

      <div className="bg-gray-100 p-2 md:p-4 rounded-none flex flex-wrap justify-center gap-2 md:gap-4 w-full max-w-4xl">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-1 md:gap-2">
            <span
              className={`text-xs md:text-sm font-semibold ${
                index === currentStepIndex
                  ? 'text-black italic'
                  : index < currentStepIndex
                  ? 'text-black'
                  : 'text-gray-400'
              }`}
            >
              {index + 1}. {step.name}
            </span>
            {index < steps.length - 1 && (
              <span className="text-gray-300 hidden sm:inline">/</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckoutProgress;