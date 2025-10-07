"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import Image from "next/image";

export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      id="about"
      className="min-h-screen flex items-center w-full py-24"
    >
      <div className="max-w-7xl w-full mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 flex justify-center items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl scale-100 sm:scale-150"></div>
              <Image
                src="/roboto.png"
                alt="Roboto - Technology Innovation"
                width={400}
                height={400}
                className="relative w-full h-auto max-w-md filter drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          <div className="flex-1 max-w-2xl lg:max-w-3xl">
            <div className="mb-8">
              <TextEffect
                trigger={isInView}
                preset="fade-in-blur"
                speedReveal={1.1}
                speedSegment={0.3}
                as="h2"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white tracking-tight"
              >
                About Us
              </TextEffect>
            </div>

            <div className="mb-8">
              <TextEffect
                trigger={isInView}
                preset="fade-in-blur"
                speedReveal={1.3}
                speedSegment={0.5}
                as="p"
                className="text-base sm:text-lg lg:text-xl leading-relaxed text-white font-normal"
              >
                Enigma is the premier Computer Science club at Mahindra
                University, where innovation meets collaboration. We are a
                community of passionate developers, designers, and tech
                enthusiasts dedicated to fostering technical excellence and
                creative problem-solving.
              </TextEffect>
            </div>

            {/* Subtle Stats */}
            {/* <motion.div
              className="flex gap-8 text-sm text-slate-400"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">200+</span>
                <span>Members</span>
              </div>
              <div className="w-px h-12 bg-slate-700"></div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">50+</span>
                <span>Projects</span>
              </div>
              <div className="w-px h-12 bg-slate-700"></div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">25+</span>
                <span>Events</span>
              </div>
            </motion.div> */}
          </div>
        </div>
      </div>
    </section>
  );
}
