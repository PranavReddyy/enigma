"use client";

import { useState, useEffect } from "react";
import { HeroSection } from "@/components/sections/hero-section";
import { AboutSection } from "@/components/sections/about-section";
import { WhatWeDoSection } from "@/components/sections/whatwedo";
import { TeamSection } from "@/components/sections/team-section";
import { FAQSection } from "@/components/sections/faq-section";
import { FooterSection } from "@/components/sections/footer-section";
import PlexusBackground from "@/components/background";
import { HeroHeader } from "@/components/header";
import { LoadingSequence } from "@/components/ui/loading-sequence";
import { motion } from "framer-motion";

export function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showMainContent, setShowMainContent] = useState(false);

  const handleLoadingComplete = () => {
    setShowMainContent(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  };

  return (
    <div className="relative bg-black min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showMainContent ? 1 : 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-white font-sans relative z-10"
      >
        <HeroHeader />
        <PlexusBackground />
        <HeroSection />
        <AboutSection />
        <WhatWeDoSection />
        {/* <TeamSection /> */}
        <FAQSection />
        <FooterSection />
      </motion.div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: showMainContent ? 0 : 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            zIndex: 20,
            backgroundColor: "#000",
          }}
        >
          <LoadingSequence onComplete={handleLoadingComplete} />
        </motion.div>
      )}
    </div>
  );
}
