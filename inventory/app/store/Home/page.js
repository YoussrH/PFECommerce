import AutoSlider from '@/app/components/AutoSlider/page'
import Hero from '@/app/components/Hero/page'
import Collection from '@/app/components/Product/collection'
import Produit from '@/app/components/Product/Produit'
import React from 'react'

export default function Accueil() {
  return (
        
   <div>
        <AutoSlider/>
        <Hero/>
        <Produit/>
        <Collection/>
    </div>
  )
}
