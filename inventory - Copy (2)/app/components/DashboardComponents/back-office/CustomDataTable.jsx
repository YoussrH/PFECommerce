"use client";
import React, { useState } from "react";

export default function CustomDataTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const data = [
    { name: "Apple MacBook Pro 17\"", color: "Silver", category: "Laptop", price: "$2999" },
    { name: "Microsoft Surface Pro", color: "White", category: "Laptop PC", price: "$1999" },
    { name: "Magic Mouse 2", color: "Black", category: "Accessories", price: "$99" },
    { name: "Apple Watch", color: "Black", category: "Watches", price: "$199" },
    { name: "Apple iMac", color: "Silver", category: "PC", price: "$2999" },
    { name: "Apple AirPods", color: "White", category: "Accessories", price: "$399" },
    { name: "iPad Pro", color: "Gold", category: "Tablet", price: "$699" },
    { name: "Magic Keyboard", color: "Black", category: "Accessories", price: "$99" },
    { name: "Smart Folio iPad Air", color: "Blue", category: "Accessories", price: "$79" },
    { name: "AirTag", color: "Silver", category: "Accessories", price: "$29" },
    { name: "Magic Mouse 2", color: "Black", category: "Accessories", price: "$99" },
    { name: "Apple Watch", color: "Black", category: "Watches", price: "$199" },
    { name: "Apple iMac", color: "Silver", category: "PC", price: "$2999" },
    { name: "Apple AirPods", color: "White", category: "Accessories", price: "$399" },
    { name: "iPad Pro", color: "Gold", category: "Tablet", price: "$699" },
    { name: "Magic Keyboard", color: "Black", category: "Accessories", price: "$99" },
    { name: "Smart Folio iPad Air", color: "Blue", category: "Accessories", price: "$79" },
    { name: "AirTag", color: "Silver", category: "Accessories", price: "$29" },
    { name: "Magic Mouse 2", color: "Black", category: "Accessories", price: "$99" },
    { name: "Apple Watch", color: "Black", category: "Watches", price: "$199" },
    { name: "Apple iMac", color: "Silver", category: "PC", price: "$2999" },
    { name: "Apple AirPods", color: "White", category: "Accessories", price: "$399" },
    { name: "iPad Pro", color: "Gold", category: "Tablet", price: "$699" },
    { name: "Magic Keyboard", color: "Black", category: "Accessories", price: "$99" },
    { name: "Smart Folio iPad Air", color: "Blue", category: "Accessories", price: "$79" },
    { name: "AirTag", color: "Silver", category: "Accessories", price: "$29" },
  ];

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="p-4">
      <h2 className="text-md font-bold mb-4 text-start mt-4 text-gray-800">
        Les Commandes Récentes
      </h2>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
        <table className="w-full text-xs text-left rtl:text-right text-gray-500 dark:text-gray-400 bg-white">
          <thead className="text-xs text-slate-900 uppercase bg-white dark:bg-[#eef4f0] dark:text-slate-700">
            <tr>
              <th scope="col" className="p-4">Select</th>
              <th scope="col" className="px-6 py-3">Product Name</th>
              <th scope="col" className="px-6 py-3">Color</th>
              <th scope="col" className="px-6 py-3">Category</th>
              <th scope="col" className="px-6 py-3">Price</th>
              <th scope="col" className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((item, index) => (
              <tr key={index} className="bg-white border-b dark:bg-white dark:border-gray-100 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-200">
                <td className="w-4 p-4">
                  <div className="flex items-center">
                    <input type="checkbox" className="w-4 h-4 text-slate-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-slate-200 dark:focus:ring-slate-300 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.name}</td>
                <td className="px-6 py-4">{item.color}</td>
                <td className="px-6 py-4">{item.category}</td>
                <td className="px-6 py-4">{item.price}</td>
                <td className="px-6 py-4">
                  <a href="#" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <nav className="flex items-center justify-between pt-4" aria-label="Table navigation">
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 p-3">Showing {indexOfFirstRow + 1}-{indexOfLastRow} of {data.length}</span>
          <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8 bg-white border-gray-200">
            <li>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className=" text-xs flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 dark:bg-white dark:border-gray-200 dark:text-gray-400 dark:hover:bg-gray-200">
                Previous
              </button>
            </li>
            {[...Array(Math.ceil(data.length / rowsPerPage))].map((_, index) => (
              <li key={index}>
                <button onClick={() => handlePageChange(index + 1)} className={`flex text-xs items-center justify-center border dark:border-gray-200 border-gray-100 px-3 h-8 leading-tight ${currentPage === index + 1 ? 'bg-slate-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-white dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-200'}`}>
                  {index + 1}
                </button>
              </li>
            ))}
            <li>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === Math.ceil(data.length / rowsPerPage)} className="flex items-center text-xs justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 dark:bg-white dark:border-gray-300  dark:text-gray-400 dark:hover:bg-gray-200">
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
