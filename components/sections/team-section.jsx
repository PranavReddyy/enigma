"use client";

import { useState } from "react";
import { Github, Linkedin, Twitter, Instagram, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ins, line, link } from "framer-motion/client";

const teamsByYear = {
"2024": [
    {
        name: 'Ponnam Adithya Sai',
        role: 'President',
        avatar: '/oc/2024/aditya.png',
        socials: {
            github: 'https://github.com/adiavolo',
            linkedin: 'https://www.linkedin.com/in/ponnam-adithya-sai/',
            twitter: 'https://www.instagram.com/awwtithya/',
        }
    },
    {
        name: 'Cherith Reddy Yerabolu',
        role: 'Vice President',
        avatar: '/oc/2024/cherith.png',
        socials: {
            github: 'https://github.com/ycherithreddy',
            twitter: 'https://x.com/CherithReddyY',
            linkedin: 'https://www.linkedin.com/in/cherith-reddy/',
            instagram: 'https://www.instagram.com/cherith_reddy/'
        }
    },
    {
        name: 'H Ravi Sankar',
        role: 'AI/ML Head',
        avatar: '/oc/2024/ravi.png',
        socials: {
          instagram: 'https://www.instagram.com/ravih.rs/',
            linkedin: 'https://www.linkedin.com/in/hoskote-ravi-sankar-b5807b271',
        }
    },
    {
        name: 'Sai Tarun Vemuganti',
        role: 'CompCoding Head',
        avatar: '/oc/2024/tarun.png',
        socials: {
          instagram: 'https://www.instagram.com/bot.tarun/',
        }
    },
    {
        name: 'Anirudh Chamarthi',
        role: 'SysAdmin',
        avatar: '/oc/2024/cham.png',
        socials: {
            github: 'https://github.com/DrResPekt',
            linkedin: 'https://www.linkedin.com/in/anirudh-chamarthi-43214b26b/',
            instagram: 'https://www.instagram.com/anirudh_chamarthi_1729/'
        }
    },
    {
        name: 'Monisha Kollipara',
        role: 'R&D Head',
        avatar: '/oc/2024/monisha.png',
        socials: {
        }
    },
    {
        name: 'Pericherla Tejas Varma',
        role: 'GameDev Head',
        avatar: '/oc/2024/tejas.png',
        socials: {
            linkedin: 'https://www.linkedin.com/in/pericherla-tejas-varma-a488b930b/',
        }
    },
    {
        name: 'Rishi Varma Vegesn',
        role: 'Content Head',
        avatar: '/oc/2024/rishi.png',
        socials: {
            instagram: 'https://www.instagram.com/vrishivarmai'
        }
    },
    {
        name: 'Geethika Choudhary Yadlapalli',
        role: 'Marketing & Design Head',
        avatar: '/oc/2024/geethu.png',
        socials: {
            linkedin: 'https://www.linkedin.com/in/geethika-y',
            instagram: 'https://instagram.com/geethu_05.05/',
        }
    },
    {
        name: 'Aarnav Tandava',
        role: 'Logistics and Committees Head',
        avatar: '/oc/2024/husky.png',
        socials: {
            linkedin: 'https://www.linkedin.com/in/aarnav-tandava-730369322/'
          }
    },
],};

const SocialIcon = ({ type }) => {
    const icons = {
        github: Github,
        linkedin: Linkedin,
        twitter: Twitter,
        instagram: Instagram,
        website: ExternalLink
    };
    
    const Icon = icons[type];
    return <Icon className="w-4 h-4" />;
};

export function TeamSection() {
  const availableYears = Object.keys(teamsByYear).sort((a, b) => b.localeCompare(a));
  const [selectedYear, setSelectedYear] = useState(availableYears[0]);

  return (
    <section id="team" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
            Meet the Team
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            The brilliant minds behind Enigma who make everything possible
          </p>
        </div>

        <div className="flex justify-center items-center gap-2 mb-20 bg-black/30 border border-white/5 rounded-full p-1.5 w-fit mx-auto">
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${
                selectedYear === year
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedYear}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-x-4 gap-y-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {teamsByYear[selectedYear].map((member, index) => (
              <div key={`${selectedYear}-${member.name}`} className="group text-center relative">
                <div className="relative mb-3">
                  <img
                    className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 mx-auto rounded-xl object-cover object-top grayscale transition-all duration-500 hover:grayscale-0 group-hover:rounded-2xl group-hover:shadow-lg"
                    src={member.avatar}
                    alt={member.name}
                    loading="lazy"
                  />
                  
                  <div className="hidden lg:block absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-4">
                    <div className="flex flex-col gap-2">
                      {Object.entries(member.socials).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-blue-400 transition-all duration-200 hover:scale-110"
                        >
                          <SocialIcon type={platform} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-xs sm:text-sm font-medium text-white transition-all duration-500 group-hover:tracking-wider">
                      {member.name}
                    </h3>
                    <span className="text-xs text-slate-500">_0{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <p className="text-xs text-slate-400 inline-block translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {member.role}
                  </p>
                </div>

                <div className="lg:hidden mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex justify-center gap-3">
                    {Object.entries(member.socials).slice(0, 3).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center text-white/70 hover:text-blue-400 transition-all duration-200 hover:scale-110"
                      >
                        <SocialIcon type={platform} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}