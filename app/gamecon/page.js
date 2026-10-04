"use client";
 
import { useState, useEffect } from "react";
import { Trophy, Users, GitPullRequest, Star, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { HeroHeader } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import {
  GitFork,
  GitMerge,
  ExternalLink,
  Code2,
  Award,
  Gift,
  Play,
  Brain,
  MonitorSmartphone,
  Shield,
  Gamepad2,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";
import PlexusBackground from "@/components/background";
import { Poppins } from 'next/font/google';

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'] 
});

// Registration events data
const registrationEvents = [
  {
    id: 1,
    title: "Game Jam",
    description: "Create innovative and engaging games within a thrilling time-limited challenge.",
    image: "/gamecon/GameJam.png",
    registerUrl: "https://tally.so/r/w4WgRr",
  },
  {
    id: 2,
    title: "Creative Jam",
    description: "Express your imagination and showcase your artistic talents through design and creativity.",
    image: "/gamecon/CreativeJam.png",
    registerUrl: "https://tally.so/r/3xkky5",
  },
  {
    id: 3,
    title: "Valorant",
    description: "Team up for an intense 5v5 tactical shooter where precision and strategy define victory.",
    image: "/gamecon/valorant.webp",
    registerUrl: " https://tally.so/r/w8vBY5",
  },
  {
    id: 4,
    title: "FIFA",
    description: "Experience the thrill of football in a fast-paced virtual tournament of pure skill and control.",
    image: "/gamecon/fifa25.jpg",
    registerUrl: " https://tally.so/r/mJaQo7",
  },
  {
    id: 5,
    title: "Call of Duty",
    description: "Enter a fierce first-person battle arena where reflexes and tactics rule the battlefield.",
    image: "/gamecon/cod-m.webp",
    registerUrl: "https://tally.so/r/3jdjrQ",
  },
  {
    id: 6,
    title: "Clash Royale",
    description: "Assemble your deck and outthink your rivals in a dynamic real-time strategy face-off.",
    image: "/gamecon/clash-royale.jpg",
    registerUrl: "https://tally.so/r/wkD2jo",
  },
];

// Timeline events data
const timelineEvents = [
  {
    id: 1,
    day: "Day 0",
    date: "4th Nov",
    title: "Gamer 2 Maker Workshop, GameJam Theme & GameZone",
    description: "A beginner gamedev workshop where the GameJam theme is announced. Find us at the D's area to register and play some cool games.",
    venue: "ELT 2",
    time: "6:49 PM onwards"
  },
  {
    id: 2,
    day: "Day 1",
    date: "6th Nov",
    title: "Opening Ceremony: Movie Screening",
    description: "The inception of GameCon 2025. Introduction and info session, followed by a screening of Minecraft: The Movie.",
    venue: "Auditorium",
    time: "6:49 PM onwards"
  },
  {
    id: 3,
    day: "Day 2",
    date: "7th Nov",
    title: "E-Sports Tournaments & Creative Jam",
    description: "Kickoff for E-Sports brackets and the Creative Jam (Art, Script, Music). This will conclude on the same day.",
    venue: "IT Block Lab; ECR-1,2,3",
    time: " Evening"
  },
  {
    id: 4,
    day: "Day 3-4",
    date: "8th & 9th Nov",
    title: "E-Sports Tournaments (Continued)",
    description: "Full weekend dedicated to the E-Sports tournament brackets. Saturday and Sunday.",
    venue: "IT Block Lab; ECR-1,2,3",
    time: "9:30 AM onwards"
  },
  {
    id: 5,
    day: "Day 5",
    date: "10th Nov",
    title: "PC Building Workshop",
    description: "A hands-on workshop to learn building, optimizing, and maintaining your own gaming PC from experts.",
    venue: "ELT 2",
    time: "6:49 PM onwards"
  },
  {
    id: 6,
    day: "Day 6",
    date: "12th Nov",
    title: "Game-Inspired Performances & GameZone",
    description: "Experience a full day of gaming in the Game Zone, playing on various stations like Nintendo Switches, PS5, Xbox, and PC games. In the evening, enjoy a night of dance and music performances inspired by the world of video games.",
    venue: "Auditorium & ECR 1, 2, 3",
    time: "Evening"
  },
  {
    id: 7, // Reused ID 7 for the final day since ID 6 and ID 7 were merged above.
    day: "Day 7",
    date: "14th Nov",
    title: "Boss Fights: Finales & Awards",
    description: "The grand conclusion! All E-Sports tournament finales, plus judging and winner announcements for the GameJam and CreativeJam.",
    venue: "Auditorium",
    time: "6:49 PM onwards"
  }
];


export default function GameCon() {

  return (
    <div className={`min-h-screen bg-transparent text-white ${poppins.className}`}>
      <HeroHeader />
      <PlexusBackground />
      {/* Hero Section */}
      <section className="h-[60vh] md:h-screen relative flex items-end">
        <Image
          src="/gamecon/Gamecon.png"
          alt="GameCon 2025"
          fill
          className="object-contain mt-16"
          priority
        />
        {/* Enhanced gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 md:h-24 bg-gradient-to-t from-black via-black/95 to-transparent"></div>
      </section>

      <main className="relative">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">

          {/* What is GameCon Section */}
          <section className="md:pt-5 pb-26">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent">
                What is GameCon?
              </h2>
            </div>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-xl text-gray-300 leading-relaxed mb-6">
                GameCon is our yearly celebration of Gaming and Game Development, 
                aiming to bring the culture and appreciation of Game Development to 
                Mahindra University. Our festival aims to feature major software 
                development aspects of the Gaming Industry through a Game Jam, and 
                creative aspects through a Creative Jam, while we all appreciate 
                the art that is created, that is the games through intense competitive 
                E-Sports Tournaments for Valorant, Fifa, Call of Duty, and Clash Royale.
              </p>
            </div>
          </section>

          {/* Trailer */}
          <section className="pb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent">
                GameCon 2025 Trailer
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Watch the official trailer and get ready for the ultimate gaming festival
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">
                    GameCon 2025 | Trailer
                  </h3>
                </div>

                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900/50 border border-red-500/20">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/mOOPEd3Kt90"
                    title="GameCon 2025 Official Trailer"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </section>

          {/* Registration Boxes */}
          <section className="pb-24 pt-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent pb-2">
                Register Now
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Step into the arena of creativity, competition, and innovation
              </p>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Join <span className="font-semibold text-white">GameCon 2025</span> and make your mark.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {registrationEvents.map((event) => {
                const Icon = event.icon;
                return (
                  <div 
                    key={event.id}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden hover:bg-white/[0.04] hover:border-red-500/30 transition-all duration-300 group"
                  >
                    <div className="relative w-full aspect-[3/2] bg-gray-800">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-8">
                      <h3 className="text-xl font-semibold text-white mb-4 text-center">
                        {event.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-6 text-center">
                        {event.description}
                      </p>
                      <a
                        href={event.registerUrl}
                        className="block w-full px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold text-center transition-all duration-300 hover:scale-105"
                      >
                        Register
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Timeline Section */}
          <section className="pb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent pb-2">
                Event Timeline
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Mark your calendars and don&apos;t miss out on any of the action
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {timelineEvents.map((event, index) => {
                const isLast = index === timelineEvents.length - 1;
                return (
                  <div 
                    key={event.id}
                    className={`relative pl-8 ${!isLast ? 'pb-12 border-l-2 border-red-500/30' : ''}`}
                  >
                    <div className="absolute -left-3 top-0 w-6 h-6 bg-red-500 rounded-full border-4 border-black"></div>
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-red-500/30 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-red-400 font-bold text-lg">{event.day}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{event.date}</span>
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">{event.title}</h3>
                      <p className="text-gray-400 mb-4">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-gray-300">{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-300">{event.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
