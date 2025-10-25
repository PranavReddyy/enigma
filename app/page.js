"use client";

import { useState, useEffect } from "react";
import { ConstructionPage } from "@/components/construction-page";
import { HomePage } from "@/components/home-page";
import { CommandPanel } from "@/components/command-panel";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [currentStage, setCurrentStage] = useState("booting");

  useEffect(() => {
    const hasSeenConstruction = localStorage.getItem("constructed");
    if (hasSeenConstruction === "true") {
      setCurrentStage("homepage");
    } else {
      setCurrentStage("construction");
    }
  }, []);

  const handleEnterClick = () => {
    localStorage.setItem("constructed", "true");
    setCurrentStage("homepage");
  };

  return (
    <AnimatePresence mode="wait">
      {currentStage === "booting" && null}

      {currentStage === "construction" && (
        <motion.div
          key="construction"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ConstructionPage onEnterClick={handleEnterClick} />
        </motion.div>
      )}

      {currentStage === "homepage" && (
        <motion.div
          key="homepage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <HomePage />
        </motion.div>
      )}
      <CommandPanel />
    </AnimatePresence>
  );
}
