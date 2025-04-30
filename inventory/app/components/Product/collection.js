"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { RxQuote } from "react-icons/rx";
import Image from "next/image";
export default function Collection() {
  const router = useRouter();

  return (
    <section className="flex flex-col justify-center items-center mt-16 px-4">
      <div className="flex flex-col md:flex-row items-start gap-6 w-full max-w-[1200px]">
        
        <div className="relative flex flex-col  justify-between h-[500px] md:w-1/2  p-6 ">
         
          <span className="text-6xl  absolute top-5 left-0  rotate-180">
            <RxQuote/>
          </span>

          <p className="text-5xl py-32 font-thin text-center px-6 italic">
            La mode est l&apos;armure pour survivre à la réalité du quotidien
          </p>

          <span className="text-6xl   absolute bottom-0 right-0 ">
            <RxQuote/>
          </span>
        </div>

        <div className="relative flex flex-col items-center w-full md:w-1/2">
          <div className="overflow-hidden w-full h-[590px] cursor-pointer">
            <Image
              src="/FNACBLG23D16-3-scaled-1.jpg"
              alt="Capsule Disney Mickey Mouse x Marc Jacobs" width={300} height={200}
              className="shadow-lg w-full h-[700px] object-cover transition-transform duration-500 ease-out hover:scale-105"
            />
          </div>
          <div className="relative bottom-4 bg-white p-5 shadow-md w-[80%] text-center">
            <h3 className="text-lg font-normal uppercase">
              HUGO BOSS
            </h3>
            <p className="text-xs mt-2 font-light font-mono">
            Le style est une manière de dire qui vous êtes sans parler            </p>
            <button
              className="mt-3 px-5 py-2 border-black border-2 text-black  tracking-widest text-xs hover:bg-gray-200 transition"
              onClick={() => router.push("/store/products")}
            >
              DÉCOUVRIR
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
