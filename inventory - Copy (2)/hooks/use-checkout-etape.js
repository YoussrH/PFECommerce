'use client'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function useCheckoutEtape() {
  const pathname = usePathname()
  const [etapeActuelle, setEtapeActuelle] = useState('panier')

  useEffect(() => {
    if (pathname.includes('/caisse/panier')) {
      setEtapeActuelle('panier')
    } else if (pathname.includes('/caisse/adresse')) {
      setEtapeActuelle('adresse')
    } else if (pathname.includes('/caisse/livraison')) {
      setEtapeActuelle('livraison')
    } else if (pathname.includes('/caisse/paiement')) {
      setEtapeActuelle('paiement')
    }
  }, [pathname])

  return { etapeActuelle }
}