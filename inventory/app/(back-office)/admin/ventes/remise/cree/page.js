"use client";
import { useState, useEffect } from "react";
import { FaTags } from "react-icons/fa";
import { toast } from "react-hot-toast";

export default function CreateRemise() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState("");
  const [gender, setGender] = useState("homme");
  const [discount, setDiscount] = useState({
    name: "",
    type: "percentage",
    value: 0,
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch articles when the component mounts
  useEffect(() => {
    fetch("http://localhost:5000/articles")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json(); // Parse JSON data
      })
      .then((data) => {
        setArticles(data); // Set the fetched articles data
      })
      .catch((err) => {
        console.error("Error fetching articles:", err);
        setMessage("Failed to load articles. Please try again later."); // Display error message
      });
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validation
    if (!selectedArticle) {
      setMessage("Please select an article.");
      setLoading(false);
      return;
    }

    if (discount.value <= 0) {
      setMessage("Discount value must be greater than 0.");
      setLoading(false);
      return;
    }

    if (new Date(discount.startDate) > new Date(discount.endDate)) {
      setMessage("Start date cannot be after end date.");
      setLoading(false);
      return;
    }

    const remiseData = {
      articleId: selectedArticle, 
      genre: gender,
      discountType: discount.type, 
      discountValue: discount.value,
      startDate: discount.startDate,
      endDate: discount.endDate,
    };

    const res = await fetch("http://localhost:5000/remise/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(remiseData),
    });
    
    if (res.ok) {
      toast.success("Remise ajoutée avec succès!");
      setMessage("Discount created successfully!");
    } else {
      const errorData = await res.json(); // Get the error response body
      console.error("Error creating discount:", errorData);
      toast.error(`Erreur: ${errorData.message || "Erreur inconnue."}`);
      setMessage(`Error creating discount: ${errorData.message || "Unknown error."}`);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FaTags className="text-blue-500" /> Create Discount
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Discount Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount Name</label>
          <input
            type="text"
            value={discount.name}
            onChange={(e) => setDiscount({ ...discount, name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Article Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Article</label>
          <select
            value={selectedArticle}
            onChange={(e) => setSelectedArticle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an article</option>
            {articles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.name}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
          </select>
        </div>

        {/* Discount Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount Type</label>
          <select
            value={discount.type}
            onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        {/* Discount Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount Value</label>
          <input
            type="number"
            value={discount.value}
            onChange={(e) => setDiscount({ ...discount, value: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={discount.startDate}
            onChange={(e) => setDiscount({ ...discount, startDate: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={discount.endDate}
            onChange={(e) => setDiscount({ ...discount, endDate: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Discount"}
        </button>

        {/* Message */}
        {message && (
          <p
            className={`mt-4 text-sm ${
              message.startsWith("Error") ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
