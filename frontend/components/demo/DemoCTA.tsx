"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { OnboardingModal } from "./OnboardingModal";

export function DemoCTA() {
  const [showButton, setShowButton] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Time-based trigger (45 seconds)
    const timer = setTimeout(() => setShowButton(true), 45000);

    // 2. Scroll-based trigger (user scrolls near bottom)
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.body.offsetHeight - 500; // 500px from bottom
      if (scrollPosition >= threshold) {
        setShowButton(true);
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 3. Navigation-based trigger (3 page views)
  useEffect(() => {
    const navCount = parseInt(sessionStorage.getItem("demo_nav_count") || "0") + 1;
    sessionStorage.setItem("demo_nav_count", navCount.toString());
    
    if (navCount >= 3) {
      setShowButton(true);
    }
  }, [pathname]);

  return (
    <>
      <div 
        className={`fixed bottom-6 right-6 z-50 transition-all duration-700 ease-out transform ${
          showButton ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="bg-card border border-border shadow-2xl rounded-2xl p-5 w-[320px] flex flex-col gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-125"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
              🚀
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm leading-tight">Ready to run your gym with CortexFit?</h4>
            </div>
          </div>
          
          <button 
            onClick={() => setModalOpen(true)}
            className="w-full bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-xl text-sm shadow-md hover:bg-primary/90 hover:shadow-lg transition-all relative z-10 mt-1"
          >
            Start My Free Trial
          </button>
        </div>
      </div>

      <OnboardingModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
