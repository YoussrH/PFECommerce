import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import React from 'react'
import Link from "next/link";
import SalesAcitivtyCard from "./SalesAcitivtyCard";
import InventorySummaryCard from "./InventorySummaryCard";

export default function AperCuVentes() {
    const SalesActivity=[
        {title:"À emballer" ,icon:IoMdCheckmarkCircleOutline,number:10,unit:"Qte",href:"#",color:"text-blue-600"},
        {title:"À expédier" ,icon:IoMdCheckmarkCircleOutline,number:10,unit:"Pqts",href:"#",color:"text-red-600"},
        {title:"À livrer" ,icon:IoMdCheckmarkCircleOutline,number:10,unit:"Pqts",href:"#",color:"text-green-600"},
        {title:"À facturer" ,icon:IoMdCheckmarkCircleOutline,number:0,unit:"Qte",href:"#",color:"text-yellow-500"},


    ]
    const InventorySummary = [
        {title:"Quantité en stock",number:10},
        {title:"Quantité à recevoir",number:0},

    ]
  return (
    <div className="  border-b border-gray-200 p-16 gap-4 grid grid-cols-12  font-mono ">
    <div className='col-span-8 border-r border-slate-300 p-8'>
        <h2 className="font-semibold text-md mb-4">Activités des ventes</h2>
        <div className="grid grid-cols-4   gap-4 pr-8" >
       {SalesActivity.map((item,i)=>{
        return(
       <SalesAcitivtyCard item={item} key={i}/> 
         );                             
        
       })}
        </div>
        
       
    
    </div>
    <div className="col-span-4 p-8">
        <h2 className="font-semibold text-md mb-4 ">Résumé de l&apos;inventaire</h2>
        <div className="">
        {InventorySummary.map((item,i)=>
        {
            return(
                <InventorySummaryCard  item={item} key={i}/>
            );
        })}
        </div>

    </div>


    </div>
  )
}
