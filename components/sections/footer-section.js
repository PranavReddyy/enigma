"use client";

import {
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Youtube,
} from "lucide-react";
import Image from "next/image";

const socialLinks = [
  {
    name: "Mail",
    href: "mailto:enigma@mahindrauniversity.edu.in",
    icon: Mail,
  },
  {
    name: "GitHub",
    href: "https://github.com/MU-Enigma",
    icon: Github,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/mu-enigma/",
    icon: Linkedin,
  },
  {
    name: "Instagram",
    href: "https://instagram.com/enigmamahindra",
    icon: Instagram,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@mu-enigma",
    icon: Youtube,
  },
];

const quickLinks = [
  { name: "About", href: "#about" },
  { name: "What We Do", href: "#services" },
  // { name: "Team", href: "#team" },//
  { name: "FAQ", href: "#faq" },
  { name: "Events", href: "/events" },
];

export function FooterSection() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl w-full mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex items-center space-x-3">
              <Image
                src="/whitelogo.png"
                alt="Enigma Logo"
                width={32}
                height={32}
                className="w-10 h-10"
              />
              <h3 className="text-xl font-bold text-white">Enigma</h3>
            </div>

            <div className="flex flex-wrap gap-6">
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-slate-400 hover:text-white transition-colors duration-300 text-sm"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors duration-300"
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} Enigma - Mahindra University
            </p>
            <a href="https://www.itsbypranav.com/" target="_blank">
              <p className="text-slate-400 text-sm mt-2 md:mt-0">
                Built with thought
              </p>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
