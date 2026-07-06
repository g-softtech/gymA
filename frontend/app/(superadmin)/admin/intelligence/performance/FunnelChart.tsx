"use client";

import { motion } from "framer-motion";

export default function FunnelChart({
  data
}: {
  data: { stage: string, value: number }[]
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
      <h3 className="text-white font-semibold mb-6">
        AI Funnel: Decision Lifecycle
      </h3>

      <div className="space-y-4">
        {data.map((item, index) => {
          const widthPercent = (item.value / maxVal) * 100;
          
          return (
            <div key={item.stage} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{item.stage}</span>
                <span className="text-white font-medium">{item.value.toLocaleString()}</span>
              </div>
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden w-full">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.15,
                    ease: "easeOut" 
                  }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
