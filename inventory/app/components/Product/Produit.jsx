"use client"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Produit() {
  const router = useRouter()

  return (
    <section className="container mx-auto px-4 mt-16 lg:mt-24">
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-10">
        {/* Left Featured Product */}
        <div className="relative flex flex-col items-center w-full lg:w-1/2">
          <div className="overflow-hidden w-full h-[400px] sm:h-[500px] cursor-pointer rounded-lg">
            <Image
              src="/DINA-ORANGE-3-.jpg"
              alt="Pull Oversize x Marc Jacobs"
              width={500}
              height={750}
              className="w-full h-full object-contain transition-transform duration-500 ease-out hover:scale-105"
            />
          </div>
          <div className="relative -mt-10 bg-white p-4 sm:p-6 shadow-lg w-[85%] sm:w-[80%] text-center">
            <h3 className="text-sm sm:text-base font-normal uppercase">Pull Oversize x Marc Jacobs</h3>
            <p className="text-xs mt-2 font-light font-mono">
              Découvrez notre pull oversize alliant confort et style, parfait pour un look décontracté et tendance.
            </p>
            <button
              className="mt-3 px-5 py-2 border-black border-2 text-black font-serif tracking-widest text-xs hover:bg-gray-200 transition"
              onClick={() => router.push("/store/products")}
            >
              DÉCOUVRIR
            </button>
          </div>
        </div>

        {/* Right Product Grid */}
        <div className="grid grid-cols-2 gap-4 w-full lg:w-1/2">
          {/* Product 1 */}
          <div className="flex flex-col items-center">
            <div className="overflow-hidden w-full h-[180px] sm:h-[200px] cursor-pointer rounded-lg">
              <Image
                src="/DINA-BLANC-1-.jpg"
                alt="Pull Blanc"
                width={500}
                height={256}
                className="w-full h-full object-contain transition-transform duration-500 ease-out hover:scale-105"
              />
            </div>
            <span className="bg-black text-white text-xs font-serif animate-bounce tracking-widest px-2 py-1 mt-2">
              NOUVEAUTÉ
            </span>
            <h3 className="text-xs sm:text-sm font-semibold tracking-widest mt-2">MARC JACOBS</h3>
            <p className="text-xs font-serif tracking-widest">Pull Oversize</p>
            <p className="text-xs sm:text-sm font-serif tracking-widest mt-1">55,00 DT</p>
          </div>

          {/* Product 2 */}
          <div className="flex flex-col items-center">
            <div className="overflow-hidden w-full h-[180px] sm:h-[200px] cursor-pointer rounded-lg">
              <Image
                src="/DINA-MARRON-2A-.jpg"
                alt="Pull Marron"
                width={500}
                height={256}
                className="w-full h-full object-contain transition-transform duration-500 ease-out hover:scale-105"
              />
            </div>
            <span className="bg-black text-white text-xs font-serif animate-bounce tracking-widest px-2 py-1 mt-2">
              NOUVEAUTÉ
            </span>
            <h3 className="text-xs sm:text-sm font-semibold tracking-widest mt-2">MARC JACOBS</h3>
            <p className="text-xs font-serif tracking-widest">Pull Oversize</p>
            <p className="text-xs sm:text-sm font-serif tracking-widest mt-1">55,00 DT</p>
          </div>

          {/* Product 3 */}
          <div className="flex flex-col items-center">
            <div className="overflow-hidden w-full h-[180px] sm:h-[200px] cursor-pointer rounded-lg">
              <Image
                src="/DINA-VIOLET-1.jpg"
                alt="Pull Violet"
                width={500}
                height={256}
                className="w-full h-full object-contain transition-transform duration-500 ease-out hover:scale-105"
              />
            </div>
            <span className="bg-black text-white text-xs font-serif animate-bounce tracking-widest px-2 py-1 mt-2">
              NOUVEAUTÉ
            </span>
            <h3 className="text-xs sm:text-sm tracking-widest font-semibold mt-2">MARC JACOBS</h3>
            <p className="text-xs font-serif tracking-widest">Pull Oversize</p>
            <p className="text-xs sm:text-sm font-serif tracking-widest mt-1">55,00 DT</p>
          </div>

          {/* Product 4 */}
          <div className="flex flex-col items-center">
            <div className="overflow-hidden w-full h-[180px] sm:h-[200px] cursor-pointer rounded-lg">
              <Image
                src="/DINA-ORANGE-1-.jpg"
                alt="Pull Orange"
                width={500}
                height={256}
                className="w-full h-full object-contain transition-transform duration-500 ease-out hover:scale-105"
              />
            </div>
            <span className="bg-black text-white text-xs font-serif animate-bounce tracking-widest px-2 py-1 mt-2">
              NOUVEAUTÉ
            </span>
            <h3 className="text-xs sm:text-sm tracking-widest font-semibold mt-2">MARC JACOBS</h3>
            <p className="text-xs font-serif tracking-widest">Pull Oversize</p>
            <p className="text-xs sm:text-sm font-serif tracking-widest mt-1">55,00 DT</p>
          </div>
        </div>
      </div>
    </section>
  )
}
