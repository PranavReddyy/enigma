"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  MonitorSmartphone,
  Shield,
  Gamepad2,
  Globe,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI/ML",
    description: "Neural networks and intelligent systems",
  },
  {
    icon: MonitorSmartphone,
    title: "WebDev",
    description: "Modern web applications and frameworks",
  },
  {
    icon: Shield,
    title: "SysCom",
    description: "Systems programming and infrastructure",
  },
  {
    icon: Gamepad2,
    title: "GameDev",
    description: "Interactive experiences and game design",
  },
  {
    icon: Globe,
    title: "CyberSec",
    description: "Security research and ethical hacking",
  },
];

export function WhatWeDoSection() {
  return (
    <section id="services" className="py-24">
      <div className="max-w-7xl w-full mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
            What We Do
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Five specialized committees driving innovation across computer
            science
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group relative bg-black/40 border-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300 overflow-hidden"
              >
                <CardContent className="relative p-5 text-center">
                  {/* Icon */}
                  <div className="mb-3">
                    <div className="w-12 h-12 mx-auto bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-all duration-300">
                      <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mb-12">
          <p className="text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Beyond committees, we host{" "}
            <span className="text-white font-medium">hackathons</span>,
            <span className="text-white font-medium"> workshops</span>,
            <span className="text-white font-medium">
              {" "}
              competitive programming
            </span>{" "}
            events, and
            <span className="text-white font-medium">
              {" "}
              industry partnerships
            </span>{" "}
            to foster innovation and learning.
          </p>
        </div>

        <div className="text-center">
          <a
            href="https://chat.whatsapp.com/B6CszVrSOYVGjUsOgdiNbY"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            <Users className="w-5 h-5 text-white" />
            Join Community
          </a>
        </div>
      </div>
    </section>
  );
}
