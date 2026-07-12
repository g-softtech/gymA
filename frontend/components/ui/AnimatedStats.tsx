"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

export function AnimatedNumber({ value }: { value: string }) {
  // Extract number and surrounding text (e.g., "$100k" -> prefix "$", num 100, suffix "k")
  const match = value.match(/(^.*?)([\d,.]+)(.*$)/);
  const numStr = match ? match[2].replace(/,/g, '') : "0";
  const num = parseFloat(numStr);
  const isNumeric = match && !isNaN(num);
  
  const prefix = match ? match[1] : "";
  const suffix = match ? match[3] : "";
  
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const springValue = useSpring(0, { duration: 2500, bounce: 0 });

  useEffect(() => {
    if (isInView && isNumeric) {
      springValue.set(num);
    }
  }, [isInView, isNumeric, num, springValue]);

  const displayValue = useTransform(springValue, (current) => {
    if (!isNumeric) return value;
    const formatted = Math.floor(current).toLocaleString(); // Add commas back
    return `${prefix}${formatted}${suffix}`;
  });

  if (!isNumeric) return <span>{value}</span>;

  return <motion.span ref={ref}>{displayValue}</motion.span>;
}

export default function AnimatedStats({ 
  stats, 
  gradientMain 
}: { 
  stats: { value: string; label: string }[], 
  gradientMain: string 
}) {
  return (
    <section id="stats" className="py-16 relative overflow-hidden" style={{ background: gradientMain }}>
      {/* Decorative texture overlay */}
      <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.6, type: "spring", bounce: 0.4 }}
            className="flex-1 min-w-[250px] max-w-[350px] flex flex-col items-center justify-center p-4"
          >
            <p className="text-5xl md:text-6xl font-black text-white drop-shadow-lg mb-3 text-center">
              <AnimatedNumber value={stat.value} />
            </p>
            <p className="text-white/90 text-sm md:text-base font-bold uppercase tracking-widest text-center">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
