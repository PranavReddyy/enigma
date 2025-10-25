"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
const faqs = [
  {
    question: "What is Enigma?",
    answer:
      "Enigma is the Computer Science club of Mahindra University. We bring together students who share a passion for technology, programming, and appreciating the beauty of Computer Science through applications such as projects, problem solving, and more.",
  },
  {
    question: "How can I join Enigma?",
    answer: (
      <>
        You can join as a technical developer by simply starting a project with
        us in{" "}
        <a
          href="https://thesparchive.com/projectinit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300 transition-colors"
        >
          Enigma&apos;s Projects Initiative
        </a>
        . To be a part of an operational team, you can follow up with our
        recruitment emails or simply contact us.
      </>
    ),
  },
  {
    question: "What events does Enigma organize?",
    answer:
      "We host hackathons, coding challenges, hands-on workshops, chill discussion rooms, meetups, and even project expos. Specifically, we have our flagship GameCon festival, along with the Hacktoberfest, our flagship open-source celebration.",
  },
  {
    question: "Do I need prior coding experience to be a part of Enigma?",
    answer:
      "No. Everyone curious about tech is welcome. We run beginner-friendly tracks, mentoring, and community support so you can grow your skills.",
  },
  {
    question: "What is GameCon?",
    answer:
      "GameCon is Enigma’s GameDev committee's flagship event. It brings together coders, gamers, and creators to compete, build projects, and showcase creative tech ideas alongside E-Sports and Gaming Competitions. A celebration of gaming overall!",
  },
  {
    question: "How often are workshops and coding challenges held?",
    answer:
      "We schedule workshops and challenge events continuously throughout the year. On average there are two to four events each month covering technical topics, tools, and trending domains.",
  },
  {
    question: "How can I follow Enigma’s updates and content?",
    answer: (
      <>
        You can follow us on{" "}
        <a
          href="https://www.instagram.com/enigma.mu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300 transition-colors"
        >
          Instagram
        </a>
        , subscribe to our{" "}
        <a
          href="https://youtube.com/@mu-enigma"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300 transition-colors"
        >
          YouTube channel
        </a>
        , and watch our{" "}
        <a
          href="https://github.com/MU-Enigma"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300 transition-colors"
        >
          GitHub repositories
        </a>{" "}
        for project updates.
      </>
    ),
  },
  {
    question: "What happens if I type mu-enigma.org/404?",
    answer:
      "Probably nothing. Or maybe everything. Sometimes the best discoveries come from missing pages.",
  },
  {
    question: "Is there really a hidden message across Enigma’s platforms?",
    answer:
      "We cannot confirm or deny that. But if you look closely at our posts, repositories, and videos, you might start connecting the dots.",
  },
  {
    question: "Random Enigma Trivia!",
    answer:
      "Nobody really knows what 6:49 stands for, could be a time, a date, a name in some random lexical format.",
  },
  {
    question: "What is Enigma's goal?",
    answer:
      "Enigma is a community of curious minds who are passionate about Computer Science. We, the organizing committee, aspire to bring you the needed support, events, and resources to help you appreciate the true beauty of Computer Science through hands-on application and collaborative learning. We are Enigma.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="max-w-7xl w-full mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Got questions? We&apos;ve got answers. Here are some of the most
            common questions about Enigma.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-2">
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="group bg-black/30 border border-white/5 rounded-2xl backdrop-blur-md hover:bg-black/40 hover:border-white/15 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] transition-all duration-700 ease-out"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center"
                  >
                    <h3 className="text-white font-medium group-hover:text-slate-100 transition-all duration-700 text-base lg:text-lg pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-all duration-700 ease-out transform ${
                        openIndex === index
                          ? "rotate-180 text-blue-400 scale-110"
                          : "group-hover:text-slate-300"
                      }`}
                    />
                  </button>

                  <div
                    className={`transition-all duration-700 ease-out ${
                      openIndex === index
                        ? "max-h-[300px] opacity-100"
                        : "max-h-0 opacity-0"
                    } overflow-hidden`}
                  >
                    <div className="px-6 pb-4">
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4 transition-all duration-700"></div>
                      <p className="text-slate-300 leading-relaxed text-sm lg:text-base transition-all duration-700 transform translate-y-0">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex justify-center items-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-purple-500/8 rounded-3xl blur-2xl opacity-70 animate-pulse"></div>
              <img
                src="/pondering.png"
                alt="Pondering"
                className="relative w-full max-w-xs mx-auto rounded-3xl shadow-2xl transform transition-all duration-700 scale-x-[-1]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
