"use client"
import { useRouter } from "next/navigation"
import { Quote } from "lucide-react"
import Image from "next/image"

export default function Collection() {
  const router = useRouter()

  return (
    <section className="container mx-auto px-4 mt-16 lg:mt-24 mb-16">
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-10">
        {/* Left Quote Section */}
        <div className="relative w-full lg:w-1/2 h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center  rounded-lg">
          <Quote className="absolute top-6 left-6 h-10 w-10 text-gray-300 rotate-180" />

          <p className="text-2xl sm:text-3xl lg:text-4xl font-thin text-center px-10 italic">
            La mode est l&apos;armure pour survivre à la réalité du quotidien
          </p>

          <Quote className="absolute bottom-6 right-6 h-10 w-10 text-gray-300" />
        </div>

        {/* Right Image Section */}
        <div className="relative flex flex-col items-center w-full lg:w-1/2">
          <div className="overflow-hidden w-full h-[400px] sm:h-[500px] cursor-pointer rounded-lg">
            <Image
              src="https://res.cloudinary.com/dnkd2ksye/image/upload/v1747090880/FNACBLG23D16-3-scaled-1_bc1zyi.jpg"
              alt="HUGO BOSS Collection"
              width={500}
              height={700}
              className="w-full h-[700px] object-cover transition-transform duration-500 ease-out hover:scale-105"
            />
          </div>
          <div className="relative -mt-10 bg-white p-4 sm:p-6 shadow-lg w-[85%] sm:w-[80%] text-center">
            <h3 className="text-lg font-normal uppercase">HUGO BOSS</h3>
            <p className="text-xs mt-2 font-light font-mono">
              Le style est une manière de dire qui vous êtes sans parler
            </p>
            <button
              className="mt-3 px-5 py-2 border-black border-2 text-black tracking-widest text-xs hover:bg-gray-200 transition"
              onClick={() => router.push("/store/homme")}
            >
              DÉCOUVRIR
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
