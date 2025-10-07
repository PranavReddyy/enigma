"use client";

import { MetalButton } from "@/components/ui/liquid-glass-button";
import Marquee from "react-fast-marquee";
import { FakeTerminal } from "@/components/term";
import { useRouter, usePathname } from "next/navigation";

const sponsors = [
  {
    lightLogoUrl:
      "https://www.mozilla.org/media/img/trademarks/mozilla-logo-tm.731d4dab7347.svg",
    darkLogoUrl:
      "https://www.mozilla.org/media/img/trademarks/mozilla-logo-tm.731d4dab7347.svg",
    name: "Mozilla",
  },
  {
    lightLogoUrl:
      "https://seeklogo.com/images/U/ubisoft-logo-7D360EDDD9-seeklogo.com.png",
    darkLogoUrl:
      "https://wallpapers.com/images/hd/ubisoft-logo-gray-background-tycgg9vw0ofxpr6c.jpg",
    name: "Ubisoft",
  },
  {
    lightLogoUrl:
      "https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/02-nvidia-logo-color-wht-500x200-4c25-d@2x.png",
    darkLogoUrl:
      "https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/02-nvidia-logo-color-grn-500x200-4c25-d@2x.png",
    name: "NVIDIA",
  },
  {
    lightLogoUrl:
      "https://static.wikia.nocookie.net/nitrome/images/9/96/Nitrome_logo_with_Cuboy.png",
    darkLogoUrl:
      "https://static.wikia.nocookie.net/nitrome/images/9/96/Nitrome_logo_with_Cuboy.png",
    name: "Nitrome",
  },
  {
    lightLogoUrl:
      "https://www.iiitg.ac.in/uploads/2023/08/05/20e3b14ce6d06b96610a3e655648ec31.png",
    darkLogoUrl:
      "https://www.iiitg.ac.in/uploads/2023/08/05/20e3b14ce6d06b96610a3e655648ec31.png",
    name: "GSDC",
  },
  {
    lightLogoUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/RedBullEnergyDrink.svg/800px-RedBullEnergyDrink.svg.png",
    darkLogoUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/RedBullEnergyDrink.svg/800px-RedBullEnergyDrink.svg.png",
    name: "RedBull",
  },
  {
    lightLogoUrl:
      "https://brand.gatech.edu/sites/default/files/inline-images/GTVertical_RGB.png",
    darkLogoUrl:
      "https://brand.gatech.edu/sites/default/files/inline-images/GTVertical_RGB.png",
    name: "GATech",
  },
];

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="min-h-screen flex flex-col w-full pt-24">
      <div className="flex-1 flex items-center">
        <div className="max-w-7xl w-full mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 max-w-2xl lg:max-w-3xl text-center lg:text-left">
              {/* Ongoing Event Tag */}
              <div className="mb-4 flex items-center justify-center lg:justify-start">
                <a
                  href="/hacktober"
                  className="
    inline-flex items-center rounded-sm
    py-2 pl-2 pr-2 text-sm
    border border-orange-500/50 
    bg-orange-900/30 
    backdrop-blur-sm
    transition-all duration-300
    hover:scale-101 hover:bg-orange-900/50
    animate-[pulse-glow_4s_ease-in-out_infinite]
  "
                >
                  <span className="mr-2 rounded-sm bg-orange-500/80 px-2 py-0.5 text-xs font-semibold text-white">
                    Ongoing
                  </span>

                  <span className="text-slate-200">Hacktober 2025</span>
                </a>
              </div>
              <div className="mb-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-6xl font-extrabold leading-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
                  We are Enigma
                </h1>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-medium leading-tight text-slate-400">
                  We are Computer Science
                </h2>
              </div>

              <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-slate-300 mb-6 font-normal max-w-xl mx-auto lg:mx-0">
                The official Computer Science club of Mahindra University.
                Building the future through code, innovation, and collaboration.
              </p>

              <div className="flex flex-row gap-3 justify-center lg:justify-start">
                <MetalButton
                  variant="orange"
                  onClick={() => router.push("/hacktober")}
                  size="lg"
                >
                  Hacktober 2025
                </MetalButton>
                <MetalButton
                  onClick={() =>
                    router.push("https://thesparchive.com/projectinit")
                  }
                  variant="primary"
                  size="lg"
                >
                  Projects Initiative
                </MetalButton>
              </div>
            </div>

            <div className="hidden lg:flex flex-1 justify-center items-center min-h-72">
              <FakeTerminal />
            </div>
          </div>
        </div>
      </div>

      <div className="pb-12 lg:pb-16">
        <div className="max-w-7xl w-full mx-auto px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-sm lg:text-base font-medium text-slate-400">
              Past Collaborations
            </h3>
          </div>

          <Marquee
            gradient={false}
            speed={50}
            pauseOnHover={true}
            className="flex items-center"
            loop={0}
          >
            {sponsors.map(({ darkLogoUrl, name }) => (
              <div key={name} className="flex items-center gap-16 px-8">
                <img
                  src={darkLogoUrl}
                  alt={`${name} logo`}
                  className="h-12 w-auto opacity-60 hover:opacity-80 transition-opacity duration-300 grayscale hover:grayscale-0"
                />
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
