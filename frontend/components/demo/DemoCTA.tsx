"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { OnboardingModal } from "./OnboardingModal";

export function DemoCTA() {
  const [showButton, setShowButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Time-based trigger (45 seconds) - for desktop
    const timer = setTimeout(() => setShowButton(true), 45000);

    // 2. Scroll-based trigger (user scrolls near bottom)
    const handleScroll = (e: any) => {
      let scrollPosition = 0;
      let threshold = 0;

      if (!e.target || e.target === document || e.target === window || !e.target.scrollHeight) {
        scrollPosition = window.innerHeight + window.scrollY;
        threshold = document.body.offsetHeight - 200; // 200px from bottom
      } else {
        const target = e.target;
        scrollPosition = target.clientHeight + target.scrollTop;
        threshold = target.scrollHeight - 200;
      }

      if (scrollPosition >= threshold && threshold > 0) {
        setShowButton(true);
        setIsAtBottom(true);
      } else {
        setIsAtBottom(false);
      }
    };
    window.addEventListener("scroll", handleScroll, true); // true for capture phase

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll, true);
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
        className={`fixed z-50 transition-all duration-500 ease-out transform
          /* Desktop behavior */
          md:top-auto md:left-auto md:bottom-6 md:right-6 
          ${showButton ? "md:translate-y-0 md:opacity-100 md:scale-100" : "md:translate-y-12 md:opacity-0 md:scale-95 md:pointer-events-none"}
          
          /* Mobile behavior (sits above persona switcher) */
          top-auto left-4 right-4 bottom-24
          ${isAtBottom ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95 pointer-events-none"}
        `}
      >
        <div className="bg-card border border-border shadow-2xl rounded-2xl p-4 md:p-5 w-full md:w-[320px] flex flex-col gap-2 md:gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-125"></div>
          
          <div className="flex items-center gap-2 md:gap-3 relative z-10">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0 text-sm md:text-base">
              🚀
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xs md:text-sm leading-tight">Ready to run your gym with CortexFit?</h4>
            </div>
          </div>
          
          <button 
            onClick={() => setModalOpen(true)}
            className="w-full bg-primary text-primary-foreground font-semibold py-2 md:py-2.5 px-4 rounded-xl text-xs md:text-sm shadow-md hover:bg-primary/90 hover:shadow-lg transition-all relative z-10 mt-1"
          >
            Start My Free Trial
          </button>
        </div>
      </div>

      <OnboardingModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
