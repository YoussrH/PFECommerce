
import FixedHeader from '@/app/components/DashboardComponents/FixedHeader';
import ItemCard from '@/app/components/DashboardComponents/ItemCard';
import React from 'react'

export default function Inventory  () {
  
  const cards=[
      {title: "Groupe d'articles",src:"/dress.gif",description:"Créez plusieurs variantes du même article en utilisant les Groupes d'articles",linklabel:"Nouveau Groupe d'articles  ",enabled: true},
      {title: 'Articles',src:"/hawaiian.gif",href:"/dashboard/inventory/items",description:"Créez des articles autonomes et des services que vous achetez et vendez",linklabel:" Nouvel Article    ",enabled: true},
      {title: 'Articles composés',src:"/composit-item.gif",description:"Regroupez différents articles et vendez-les sous forme de kits",linklabel:"Nouveaux Articles composés  ",enabled: false},
      {title: 'Liste de prix',src:"/list.gif",description:"Ajustez vos prix pour des contacts ou des transactions spécifiques",linklabel:" Nouvelle Liste de prix  ",enabled: false},


]


  return (
    <div className='font-sans'>
      <FixedHeader newLinks="/dashboard/inventory/items/new"/>
      <div className='grid grid-cols-1 lg:grid-cols-2 py-8 px-16 gap-6'>
      {cards.map((item,i)=>
              {
                  return(
                      <ItemCard  OptionsData={item} key={i}/>
                  );
              })}

      </div>
    </div>
  )
}
