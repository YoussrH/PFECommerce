"use client";

import Image from "next/image";
import React, { useState } from "react";
import { GoHeart } from "react-icons/go";

const OutletProductList = ({ products }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  const filteredProducts = (products || []).filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-2/3">
        <div className="grid grid-cols-4 gap-2">
          {currentProducts.length > 0 ? (
            currentProducts.map((product) => (
              <div
                key={product.id}
                className="relative group transition-all duration-300"
              >
           <Image 
  src={product.image} 
  alt={product.name} 
  width={208} 
  height={256} 
  className="w-52 h-64 object-contain rounded-sm my-5" 
/>

                <div className="-ml-5 justify-center">
                <div className="w-full flex  justify-center mt-2">
                  <div className="animate-bounce text-center border border-black text-white bg-black rounded-lg text-[10px] font-serif px-2 py-1">
                    <span>NOUVEAUTÉ</span>
                  </div>
                </div>

                <div className="text-center mt-2">
                  <p className="text-gray-700 text-sm mt-2">
                    {product.brand}
                  </p>

                  <div className="group-hover:opacity-0 transition-opacity duration-300">
                    <p className="text-gray-700 font-serif text-xs mt-2">
                      {product.name}
                    </p>
                    <p className="text-gray-900 font-serif text-xs font-semibold">
                      {product.price} €
                    </p>
                  </div>

                  <div className=" -mt-10 relative inset-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="   flex space-x-1">
                      <button className="bg-black border border-black text-white font-serif text-xs px-4 py-2 rounded-full flex items-center hover:bg-white hover:text-black transition-all duration-300">
                        Achat Rapide
                      </button>
                      <GoHeart className="w-5 h-5 cursor-pointer mt-2" />
                    </div>
                  </div>
                </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-4 text-center">
              No products match your filters.
            </p>
          )}
        </div>

        <div className="flex justify-center items-center my-11  space-x-4">
        <div className="flex justify-center mt-4">
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="bg-black text-white font-serif text-xs px-4 py-2 rounded-full hover:bg-white hover:border hover:border-black hover:text-black transition-all duration-300"
          >
            Voir la Page Suivante
          </button>
        </div>
         <div className="flex gap-3 font-mono mt-4 ">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="text-gray-700 hover:text-black disabled:text-gray-300"
          >
            &lt;
          </button>

          {totalPages > 5 ? (
            <>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-xs font-serif ${
                    currentPage === page
                      ? "border border-black bg-white text-black"
                      : "text-gray-700 hover:text-black"
                  }`}
                >
                  {page}
                </button>
              ))}

              <span>...</span>

              <button
                onClick={() => handlePageChange(totalPages)}
                className={`px-3 py-1 text-xs font-serif ${
                  currentPage === totalPages
                    ? "border border-black bg-white text-black"
                    : "text-gray-700 hover:text-black"
                }`}
              >
                {totalPages}
              </button>
            </>
          ) : (
            Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-xs font-serif ${
                    currentPage === page
                      ? "border border-black bg-white text-black"
                      : "text-gray-700 hover:text-black"
                  }`}
                >
                  {page}
                </button>
              );
            })
          )}

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="text-gray-700 hover:text-black disabled:text-gray-300"
          >
            &gt;
          </button>
         </div>
          
        </div>

     
      </div>
    </div>
  );
};

export default OutletProductList;