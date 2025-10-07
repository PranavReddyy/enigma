"use client";

import { useState, useEffect, useRef } from "react";
import { TypeAnimation } from "react-type-animation";

const idleMessages = [
  'Welcome to Enigma',
  2000,
  'Hacktober 2025 is here!',
  2000,
  'You got this far, why not say hi?',
  2000,
  'Projects Initiative is live!',
  2000,
  'mkdir joseph',
  2000,
  'Click here to get started.',
  2000,
  'Type "help" to see available commands.',
  2000,
  'AEON >> EnigmaOS v1.0.0',
  2000,
  'Booting up...',
  2000,
  'Just kidding, I\'m always on.',
  2000,
];

const commands = {
  help: [
    "Available commands:",
    "  about          - Learn more about Enigma",
    "  projects       - View our latest projects",
    "  contact        - How to reach us",
    "  clear          - Clear the terminal screen",
    "  neofetch       - Display system information",
    "  mess around and find more ;)",
  ],
  hi: "Hello there, type 'help' to see what I can do",
  hello: "Hi! Type 'help' to see available commands.",
  ankit: "Ankit is the president of Enigma. He consumes a lot of chicks",
  bunty: "Bunty nee sabbu slow aa enti",
  dilip: "god",
  meet: "mad design",
  syscom: "prema latha",
  ankita: "cutout chusi nammeyali anta",
  pranav: "itsbypranav.com",
  suzie: "apparently he never misses",
  about: "Enigma is the official Computer Science club of Mahindra University. We are passionate about building the future through code, innovation, and collaboration.",
  projects: "Projects Initiative launched, check out the button to the left of me",
  contact: "You can find us on Instagram, LinkedIn, or send a carrier pigeon to the CS department.",
  hacktober: "Join Hacktoberfest 2025! Fork our repos, make contributions, and earn exclusive swag. Visit /hacktober to get started!", 
  neofetch: [
    "        ########  ##    ##    .   /",
    "        ##        ###   ##       /",
    "        ######    ## ## ##      /",
    "        ##        ##  ####     /",
    "        ########  ##    ##    /",
    "",
    "        ######   ##    ##    #####",
    "        ##       ###  ###   ##   ##",
    "        ##  ###  ## ## ##   #######",
    "        ##   ##  ##    ##   ##   ##",
    "        ######   ##    ##   ##   ##",
    "                                                 ",
    "    enigma@mahindra-university",
    "    --------------------------",
    "    OS: EnigmaOS v1.0.0 x86_64",
    "    Host: The Future",
    "    Kernel: 5.4.0-enigma",
    "    Shell: zsh (probably)",
  ],
  clear: "", 
};

export function FakeTerminal() {
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isInteractive, setIsInteractive] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (terminalRef.current && !terminalRef.current.contains(event.target)) {
        setIsInteractive(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [terminalRef]);
  
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (isInteractive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInteractive]);
  
  const handleContainerClick = () => {
    if (!isInteractive) {
      setIsInteractive(true);
    }
  };

  // const handleKeyDown = (e) => {
  //   if (e.key === "Enter") {
  //     const command = inputValue.trim().toLowerCase();
  //     const newHistory = [...history, { type: "command", text: `$ ${command}` }];

  //     if (command === "clear") {
  //       setHistory([]);
  //     } else if (command in commands) {
  //       const output = commands[command];
  //       setHistory([...newHistory, { type: "output", text: output }]);
  //     } else if (command !== "") {
  //       setHistory([...newHistory, { type: "output", text: `command not found: ${command}` }]);
  //     } else {
  //        setHistory(newHistory);
  //     }
      
  //     setInputValue("");
  //   }
  // };

const handleKeyDown = (e) => {
  if (e.key === "Enter") {
    const command = inputValue.trim().toLowerCase();
    const newHistory = [...history, { type: "command", text: `$ ${command}` }];

    if (command === "clear") {
      setHistory([]);
    } else if (command in commands) {
      const output = commands[command];
      const outputType = command === "hacktober" ? "hacktober" : "output";
      setHistory([...newHistory, { type: outputType, text: output }]);
    } else if (command !== "") {
      setHistory([...newHistory, { type: "output", text: `command not found: ${command}` }]);
    } else {
       setHistory(newHistory);
    }
    
    setInputValue("");
  }
};

  return (
    <div
      className="w-full h-72 rounded-2xl bg-black/30 border border-slate-700/50 p-4 font-mono text-sm text-slate-300 overflow-y-scroll cursor-text hide-scrollbar"
      onClick={handleContainerClick}
      ref={terminalRef}
    >
      {/* {history.map((line, index) => (
        <div key={index}>
          {Array.isArray(line.text) ? (
            line.text.map((subLine, subIndex) => <div key={subIndex} className="text-green-400 whitespace-pre-wrap">{subLine}</div>)
          ) : (
            <div className={line.type === "output" ? "text-green-400 whitespace-pre-wrap" : "whitespace-pre-wrap"}>{line.text}</div>
          )}
        </div>
      ))} */}

      {history.map((line, index) => (
  <div key={index}>
    {Array.isArray(line.text) ? (
      line.text.map((subLine, subIndex) => <div key={subIndex} className="text-green-400 whitespace-pre-wrap">{subLine}</div>)
    ) : (
      <div className={
        line.type === "hacktober" 
          ? "text-orange-400 whitespace-pre-wrap" 
          : line.type === "output" 
            ? "text-green-400 whitespace-pre-wrap" 
            : "whitespace-pre-wrap"
      }>
        {line.text}
      </div>
    )}
  </div>
))}
      
      {!isInteractive ? (
        <div className="flex items-center">
            <span className="text-green-400">$</span>
            <TypeAnimation
              sequence={idleMessages}
              wrapper="span"
              speed={50}
              className="ml-2 text-slate-400"
              repeat={Infinity}
              cursor={true}
            />
        </div>
      ) : (
        <div className="flex items-center">
          <span className="text-green-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none text-slate-300 w-full focus:outline-none focus:ring-0 ml-2"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}