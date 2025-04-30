"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-10 right-5 z-50 transition-transform transform hover:scale-110"
        >
          <Image
            src="/backtotop.png"
            alt="Scroll to top"
            width={30}
            height={30}
            className="animate-bounce "
          />
        </button>
      )}
    </div>
  );
};

export default ScrollToTop;
