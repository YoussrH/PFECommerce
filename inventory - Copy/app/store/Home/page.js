import AutoSlider from '@/app/components/AutoSlider/page'
import FeaturesSection from '@/app/components/Footer/FeaturesSection'
import Hero from '@/app/components/Hero/page'
import Collection from '@/app/components/Product/collection'
import NewProduit from '@/app/components/Product/NewProduit'
import Produit from '@/app/components/Product/Produit'
import React from 'react'

export default function Accueil() {
  return (
        
   <div>
        <AutoSlider/>
        <Hero/>
        <Produit/>
        <NewProduit/>
        <Collection/>
    </div>
  )
}
