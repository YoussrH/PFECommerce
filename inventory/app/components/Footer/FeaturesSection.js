import Image from "next/image";
import { GiHummingbird } from "react-icons/gi";

export default function FeaturesSection() {
  return (
    <div className="relative flex flex-col bottom-0 items-center my-16 px-4">
{/* <Image src="/roue-left.svg" alt="Decorative Wheel" width={176}   height={176} 
 className="hidden md:block absolute left-36 top-1/2 transform -translate-y-1/2 opacity-60"/> */}

      <div className="flex flex-col md:flex-row gap-10  lg:gap-20 h-auto max-w-5xl w-full items-center justify-between bg-slate-50 bg-opacity-35 shadow-lg rounded-sm p-6 border relative ">
        <div className="flex flex-col  items-center text-center space-y-2">
        <Image  src="/skydiving.png" alt="Skydiving"  width={64} height={64}  className="w-12 md:w-16"/> 
           <p className="text-xs font-light">Livraison offerte à partir de</p>
          <p className="text-xs font-light">110DT d&apos;achat</p>
        </div>

        <div className="flex flex-col  items-center text-center space-y-2">
          <GiHummingbird className="w-12 md:w-14 h-12 md:h-14" />
          <p className="text-xs font-light">Retours faciles et gratuits</p>
        </div>

        <div className="flex flex-col  items-center text-center space-y-2">
          <Image src="/gift-box.png" alt="Gift Box" width={48}  height={48}  className="w-10 md:w-12"/>
          <p className="text-xs font-light">Emballage soigné</p>
        </div>

        <div className="flex flex-col  items-center text-center space-y-2">
        <Image src="/costumer-service.png"  alt="Customer Service" width={48}  height={48}  className="w-10 md:w-12"/>       
          <p className="text-xs font-light">Service client</p>
          <p className="text-xs font-light">71 224 289</p>
        </div>
      </div>

{/*       <Image src="/roue-right-1.svg" alt="Right Wheel" width={176}  height={176}  className="hidden md:block absolute right-36 top-1/2 transform -translate-y-1/2 opacity-60"/>    
 */}      
      </div>
  );
}
