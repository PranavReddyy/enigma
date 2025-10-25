"use client";

import { useState, useEffect, useRef } from "react";
import { TypeAnimation } from "react-type-animation";
import { useAuth } from "@/lib/auth-context";
import { pusherClient } from "@/lib/pusher";

const commands = {
  help: [
    "Available commands:",
    "  about          - Learn more about Enigma",
    "  projects       - View our latest projects",
    "  contact        - How to reach us",
    "  clear          - Clear the terminal screen",
    "  neofetch       - Display system information",
    "  thebox         - Access the secret chatroom",
    "  login          - Sign in to your account",
    "  whoami         - Check your authentication status",
    "  logout         - Sign out of your account",
    "  mess around and find more ;)",
  ],
  hi: "Hello there, type 'help' to see what I can do",
  hello: "Hi! Type 'help' to see available commands.",
  ankit: "Ankit is the president of Enigma. Some GPUs handle millions of computations per second, he handles millions of calories and emotional entanglements just as fast.",
  bunty: "Bunty nee sabbu slow aa enti",
  mittal: "you mean eic vp ?",
  aj: "his name is abhinav",
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
  const { user, setUser, loading: authLoading, logout: contextLogout, checkAuth } = useAuth();
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isInteractive, setIsInteractive] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [loginMode, setLoginMode] = useState(false);
  const mobileContentRef = useRef(null);
  const [loginStep, setLoginStep] = useState("email");
  const [loginEmail, setLoginEmail] = useState("");
  const [messages, setMessages] = useState([]);
  const [latestMessages, setLatestMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageCache, setMessageCache] = useState(new Map()); 
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isMobileFullscreen) return;

    const scrollY = window.scrollY;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100vh';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100vh';
    document.documentElement.style.top = `-${scrollY}px`;
    document.documentElement.style.left = '0';
    
    const preventScroll = (e) => {
      if (!e.target.closest('[data-scrollable="true"]')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('wheel', preventScroll, { passive: false });
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
      document.documentElement.style.top = '';
      document.documentElement.style.left = '';
      
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventScroll);
      
      window.scrollTo(0, scrollY);
    };
  }, [isMobileFullscreen]);

  useEffect(() => {
    fetchLatestMessages();
  }, []);

  useEffect(() => {
    const ensureBoxAccess = async () => {
      try {
        if (user) {
          const granted = await grantBoxAccess();
          if (granted) {
            await new Promise(resolve => setTimeout(resolve, 100));
            const res = await fetch("/api/secret/check-access");
            if (!res.ok) {
              await grantBoxAccess();
            }
          }
        }
      } catch (error) {}
    };

    if (!authLoading && user) {
      ensureBoxAccess();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!chatMode) return;

    fetchMessages();
    const channel = pusherClient.subscribe("secret-chat");

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind("new-message", (data) => {
      setMessages((prev) => [...prev, data]);
      setMessageCache(prev => {
        const newCache = new Map(prev);
        newCache.delete('latest-5');
        return newCache;
      });
      setTimeout(fetchLatestMessages, 1000);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe("secret-chat");
      setIsConnected(false);
    };
  }, [chatMode]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (window.innerWidth >= 768 && terminalRef.current && !terminalRef.current.contains(event.target)) {
        setIsInteractive(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [terminalRef]);

  useEffect(() => {
    if (isInteractive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInteractive]);

  const fetchLatestMessages = async () => {
    const cacheKey = 'latest-5';
    if (messageCache.has(cacheKey)) {
      const cached = messageCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) {
        setLatestMessages(cached.data);
        return;
      }
    }

    try {
      const res = await fetch("/api/secret/messages/public?limit=5");
      if (res.ok) {
        const data = await res.json();
        setMessageCache(prev => new Map(prev).set(cacheKey, {
          data: data.messages,
          timestamp: Date.now()
        }));
        setLatestMessages(data.messages);
      }
    } catch (error) {}
  };

  const fetchMessages = async (pageNum = 1, append = false) => {
    if (loadingMessages) return;
    
    const cacheKey = `page-${pageNum}`;
    if (messageCache.has(cacheKey) && !append) {
      const cached = messageCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) {
        setMessages(cached.data);
        setHasMoreMessages(cached.hasMore);
        setPage(pageNum);
        return;
      }
    }
    
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/secret/messages?page=${pageNum}&limit=20`);
      
      if (res.status === 403) {
        await grantBoxAccess();
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryRes = await fetch(`/api/secret/messages?page=${pageNum}&limit=20`);
        
        if (!retryRes.ok) return;
        
        const data = await retryRes.json();
        setMessageCache(prev => new Map(prev).set(cacheKey, {
          data: data.messages,
          hasMore: data.hasMore,
          timestamp: Date.now()
        }));
        
        if (append) {
          setMessages(prev => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages);
        }
        setHasMoreMessages(data.hasMore);
        setPage(pageNum);
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setMessageCache(prev => new Map(prev).set(cacheKey, {
          data: data.messages,
          hasMore: data.hasMore,
          timestamp: Date.now()
        }));
        
        if (append) {
          setMessages(prev => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages);
        }
        setHasMoreMessages(data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMoreMessages = () => {
    if (hasMoreMessages && !loadingMessages) {
      fetchMessages(page + 1, true);
    }
  };

  const sendMessage = async (content) => {
    setIsSending(true);
    try {
      const res = await fetch("/api/secret/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.status === 403) {
        await grantBoxAccess();
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryRes = await fetch("/api/secret/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        
        if (!retryRes.ok) {
          return { error: "Failed to send message" };
        }
        return { success: true };
      }

      if (!res.ok) {
        return { error: "Failed to send message" };
      }
      return { success: true };
    } catch (error) {
      return { error: "Failed to send message" };
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch("/api/secret/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || "Login failed" };
      }

      await checkAuth();
      return { success: true };
    } catch (error) {
      return { error: "Login failed" };
    }
  };

  const handleLogout = async () => {
    await contextLogout();
    return { success: true };
  };

  const handleContainerClick = () => {
    if (!isInteractive) {
      setIsInteractive(true);
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setIsMobileFullscreen(true);
      }
    } else {
      inputRef.current?.focus();
    }
  };

  const handleCloseMobile = () => {
    setIsInteractive(false);
    setIsMobileFullscreen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (chatMode) {
      setChatMode(false);
      setMessages([]);
    }
    if (loginMode) {
      setLoginMode(false);
      setLoginStep("email");
      setLoginEmail("");
    }
  };

  const grantBoxAccess = async () => {
    try {
      const res = await fetch("/api/secret/access-box", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counter: 649 }),
      });
      return res.ok;
    } catch (error) {
      return false;
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter") {
      if (isSending) {
        e.preventDefault();
        return;
      }

      if (inputRef.current) {
        inputRef.current.blur();
      }

      const command = inputValue.trim();
      const commandLower = command.toLowerCase();
      
      if (loginMode) {
        if (commandLower === "/cancel") {
          setLoginMode(false);
          setLoginStep("email");
          setLoginEmail("");
          setHistory([
            ...history,
            { type: "command", text: command },
            { type: "output", text: "Login cancelled." }
          ]);
          setInputValue("");
          setTimeout(() => inputRef.current?.focus(), 100);
          return;
        }

        if (loginStep === "email") {
          if (command.includes("@")) {
            setLoginEmail(command);
            setLoginStep("password");
            setHistory([
              ...history,
              { type: "command", text: command },
              { type: "output", text: "Password:" }
            ]);
          } else {
            setHistory([
              ...history,
              { type: "command", text: command },
              { type: "error", text: "Invalid email format." }
            ]);
          }
          setInputValue("");
          setTimeout(() => inputRef.current?.focus(), 100);
          return;
        }

        if (loginStep === "password") {
          const maskedPassword = "•".repeat(command.length);
          const result = await handleLogin(loginEmail, command);
          
          if (result.success) {
            await checkAuth();
            setHistory([
              ...history,
              { type: "command", text: maskedPassword },
              { type: "success", text: `✓ Login successful!` },
              { type: "output", text: "Type 'whoami' or 'thebox' to continue." }
            ]);
            setLoginMode(false);
            setLoginStep("email");
            setLoginEmail("");
          } else {
            setHistory([
              ...history,
              { type: "command", text: maskedPassword },
              { type: "error", text: `✗ ${result.error}` },
              { type: "output", text: "Email:" }
            ]);
            setLoginStep("email");
            setLoginEmail("");
          }
          setInputValue("");
          setTimeout(() => inputRef.current?.focus(), 100);
          return;
        }
      }

      if (chatMode) {
        if (commandLower === "/exit") {
          setChatMode(false);
          setMessages([]);
          setPage(1);
          setHasMoreMessages(true);
          setHistory([
            ...history,
            { type: "command", text: command },
            { type: "output", text: "Exited chat mode." }
          ]);
        } else if (command !== "") {
          const result = await sendMessage(command);
          if (result.error) {
            setHistory(prev => [...prev, { type: "error", text: result.error }]);
          }
        }
        setInputValue("");
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      }

      const newHistory = [...history, { type: "command", text: commandLower }];

      if (commandLower === "clear") {
        setHistory([]);
      } else if (commandLower === "login") {
        if (user) {
          setHistory([
            ...newHistory,
            { type: "output", text: `Already logged in as ${user.username}` }
          ]);
        } else {
          setLoginMode(true);
          setLoginStep("email");
          setHistory([
            ...newHistory,
            { type: "output", text: "Email:" }
          ]);
        }
      } else if (commandLower === "whoami") {
        if (user) {
          setHistory([
            ...newHistory,
            { type: "success", text: `Logged in as: ${user.username}` },
            { type: "output", text: `Email: ${user.email}` }
          ]);
        } else {
          setHistory([
            ...newHistory,
            { type: "output", text: "Not authenticated." }
          ]);
        }
      } else if (commandLower === "logout") {
        if (user) {
          await handleLogout();
          setHistory([
            ...newHistory,
            { type: "success", text: "✓ Logged out." }
          ]);
        } else {
          setHistory([
            ...newHistory,
            { type: "output", text: "Not logged in." }
          ]);
        }
      } else if (commandLower === "thebox") {
        if (!user) {
          setHistory([
            ...newHistory,
            { type: "error", text: "404 - Access Restricted" }
          ]);
        } else {
          setChatMode(true);
          setHistory([
            ...newHistory,
            { type: "success", text: `Welcome to The Box, ${user.username}!` },
            { type: "output", text: "Type '/exit' to leave." },
            { type: "divider", text: "────────────────────────" }
          ]);
        }
      } else if (commandLower in commands) {
        const output = commands[commandLower];
        const outputType = commandLower === "hacktober" ? "hacktober" : "output";
        setHistory([...newHistory, { type: outputType, text: output }]);
      } else if (commandLower !== "") {
        setHistory([...newHistory, { type: "output", text: `command not found: ${commandLower}` }]);
      } else {
        setHistory(newHistory);
      }
      setInputValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const renderIdleMode = () => {
    if (!isInteractive) {
      const dynamicIdleMessages = [
        'Welcome to Enigma',
        2000,
        'Hacktober 2025 is almost ending!',
        2000,
        'Projects Initiative is live!',
        2000,
        'Click to get started.',
        2000,
        'Type "help" for commands.',
        2000,
        ...(latestMessages.length > 0 ? [
          'The Box messages:',
          2000,
          ...latestMessages.flatMap((msg) => [
            `${msg.user.username}: ${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}`,
            1500,
          ]),
          'Type "thebox" to join...',
          3000,
        ] : [])
      ];

      return (
        <div className="relative flex mb-1">
          <span className="absolute left-0 top-0 text-green-400 select-none text-xs" style={{ minWidth: '1em' }}>
            $
          </span>
          <div className="pl-4 w-full text-xs">
            <TypeAnimation
              key={latestMessages.length}
              sequence={dynamicIdleMessages}
              wrapper="span"
              speed={50}
              className="text-slate-400"
              repeat={Infinity}
              cursor={true}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  const getPromptSymbol = () => {
    if (loginMode) return "$";
    if (chatMode) return ">";
    return "$";
  };

  const getPromptColor = () => {
    if (loginMode) return "text-yellow-400";
    if (chatMode) return "text-cyan-400";
    return "text-green-400";
  };

  const getPlaceholder = () => {
    if (loginMode) {
      if (loginStep === "email") return "Email...";
      if (loginStep === "password") return "Password...";
    }
    if (chatMode) return "Message...";
    return "";
  };

  return (
    <>
      {/* Desktop Terminal */}
      <div
        className="hidden md:block w-full h-72 rounded-2xl bg-black/30 border border-slate-700/50 p-4 font-mono text-xs text-slate-300 overflow-y-scroll cursor-text hide-scrollbar"
        onClick={handleContainerClick}
        ref={terminalRef}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (terminalRef.current) {
            terminalRef.current.scrollTop += e.deltaY;
          }
        }}
      >
        {history.map((line, index) => (
          <div key={index} className="relative flex mb-0.5">
            {line.type === "command" && (
              <span
                className="absolute left-0 top-0 text-white select-none"
                style={{ minWidth: '1em' }}
              >
                $
              </span>
            )}
            <div
              className={`whitespace-pre-wrap break-words ${line.type === "command" ? "pl-4" : ""}`}
            >
              {Array.isArray(line.text)
                ? line.text.map((subLine, subIndex) => (
                    <div
                      key={subIndex}
                      className="text-green-400 whitespace-pre-wrap"
                    >
                      {subLine}
                    </div>
                  ))
                : (
                  <div
                    className={
                      line.type === "hacktober"
                        ? "text-orange-400 whitespace-pre-wrap"
                        : line.type === "error"
                        ? "text-red-400 whitespace-pre-wrap"
                        : line.type === "success"
                        ? "text-cyan-400 whitespace-pre-wrap font-bold"
                        : line.type === "divider"
                        ? "text-slate-600 whitespace-pre-wrap"
                        : line.type === "output"
                        ? "text-green-400 whitespace-pre-wrap"
                        : "whitespace-pre-wrap"
                    }
                  >
                    {line.text}
                  </div>
                )
              }
            </div>
          </div>
        ))}

        {chatMode && (
          <div className="space-y-1 mb-2">
            {isConnected && (
              <div className="text-xs text-green-400 flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                [LIVE] Connection established to The Box
              </div>
            )}
            
            {hasMoreMessages && (
              <div className="text-center mb-2">
                <button
                  onClick={loadMoreMessages}
                  disabled={loadingMessages}
                  className="text-xs text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 cursor-pointer"
                >
                  {loadingMessages ? "Loading..." : "↑ Load older messages"}
                </button>
              </div>
            )}
            
            {messages.map((msg, idx) => {
              const isCurrentUser = msg.user.username === user?.username;
              const timestamp = new Date(msg.createdAt + "Z").toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              return (
                <div
                  key={msg.id || idx}
                  className={`text-xs w-full flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="w-80 break-words">
                    {isCurrentUser ? (
                      <div className="text-right">
                        <span className="text-slate-500">[{timestamp}] </span>
                        <span className="text-cyan-400">{msg.user.username}</span>
                        <span className="text-slate-300">: {msg.content}</span>
                      </div>
                    ) : (
                      <div className="text-left">
                        <span className="text-slate-500">[{timestamp}] </span>
                        <span className="text-blue-400">{msg.user.username}</span>
                        <span className="text-slate-300">: {msg.content}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {renderIdleMode()}

        {isInteractive && (
          <div className="flex items-center">
            <span className={`${getPromptColor()} text-xs`}>
              {getPromptSymbol()}
            </span>
            <input
              ref={inputRef}
              type={loginMode && loginStep === "password" ? "password" : "text"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none text-slate-300 text-xs w-full focus:outline-none focus:ring-0 ml-2"
              placeholder={getPlaceholder()}
              autoFocus
              disabled={isSending}
            />
            {isSending && (
              <span className="text-yellow-400 ml-2 animate-pulse text-xs">●</span>
            )}
          </div>
        )}
      </div>

      {/* Mobile Preview */}
      <div
        className={`md:hidden w-full h-32 rounded-2xl bg-black/30 border border-slate-700/50 p-4 font-mono text-xs text-slate-300 overflow-hidden cursor-pointer ${isMobileFullscreen ? 'hidden' : 'block'}`}
        onClick={handleContainerClick}
      >
        {chatMode && messages.length > 0 && (
          <div>
            {messages.slice(-1).map((msg) => (
              <div key={msg.id} className="break-words">
                <span className="text-blue-400">{msg.user.username}</span>
                <span className="text-slate-300">: {msg.content}</span>
              </div>
            ))}
          </div>
        )}

        {renderIdleMode()}
      </div>

      {/* Mobile Fullscreen */}
      {isMobileFullscreen && (
  <div 
    className="md:hidden fixed inset-0 z-[9999] bg-green-600 flex flex-col no-scroll-parent"
    style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      touchAction: 'none',
      overscrollBehavior: 'none',
    }}
  >
    {/* Header */}
    <div className="flex-shrink-0 bg-green-600 px-3 py-1 flex items-center justify-between text-black font-bold text-xs z-20">
      <div className="flex items-center gap-2">
        <span>[0] {chatMode ? '1:thebox' : loginMode ? '0:login' : '0:enigma'}</span>
        <span className="text-[10px] opacity-75">{user?.username || 'guest'}@enigmaos</span>
      </div>
      <button
        onClick={handleCloseMobile}
        className="text-black hover:text-white px-2 py-1"
      >
        ✕
      </button>
    </div>

    {/* Footer - Moved here */}
    <div 
      className="flex-shrink-0 bg-black border-y border-green-600/30 px-3 py-1.5 z-20"
    >
      <div className="text-slate-500 text-center text-[10px]">
        {chatMode && "[Enter] send • /exit leave"}
        {loginMode && "[Enter] continue • /cancel abort"}
        {!chatMode && !loginMode && "Type 'help' for commands"}
      </div>
    </div>

    {/* Scrollable Content */}
    <div
      ref={mobileContentRef}
      data-scrollable="true"
      className="flex-1 p-3 font-mono text-xs text-slate-300 bg-black cursor-text flex flex-col"
      onClick={handleContainerClick}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        overflow: 'auto',
        touchAction: 'pan-y',
      }}
    >
            {history.map((line, index) => (
              <div key={index} className="relative flex mb-0.5 flex-shrink-0">
                {line.type === "command" && (
                  <span
                    className="absolute left-0 top-0 text-white select-none"
                    style={{ minWidth: '1em' }}
                  >
                    $
                  </span>
                )}
                <div
                  className={`whitespace-pre-wrap break-words ${line.type === "command" ? "pl-4" : ""}`}
                >
                  {Array.isArray(line.text)
                    ? line.text.map((subLine, subIndex) => (
                        <div
                          key={subIndex}
                          className="text-green-400 whitespace-pre-wrap"
                        >
                          {subLine}
                        </div>
                      ))
                    : (
                      <div
                        className={
                          line.type === "hacktober"
                            ? "text-orange-400 whitespace-pre-wrap"
                            : line.type === "error"
                            ? "text-red-400 whitespace-pre-wrap"
                            : line.type === "success"
                            ? "text-cyan-400 whitespace-pre-wrap font-bold"
                            : line.type === "divider"
                            ? "text-slate-600 whitespace-pre-wrap"
                            : line.type === "output"
                            ? "text-green-400 whitespace-pre-wrap"
                            : "whitespace-pre-wrap"
                        }
                      >
                        {line.text}
                      </div>
                    )
                  }
                </div>
              </div>
            ))}

            {chatMode && (
              <div className="space-y-2 mt-2 flex-shrink-0">
                {isConnected && (
                  <div className="text-xs text-green-400 flex items-center gap-2 mb-2">
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                    [LIVE]
                  </div>
                )}
                
                {hasMoreMessages && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      loadMoreMessages();
                    }}
                    disabled={loadingMessages}
                    className="text-xs text-cyan-400 w-full text-center py-1 mb-2"
                  >
                    {loadingMessages ? "..." : "↑ Load older"}
                  </button>
                )}
                
                {messages.map((msg) => {
                  const isMe = msg.user.username === user?.username;
                  const time = new Date(msg.createdAt + "Z").toLocaleTimeString('en-US', { 
                    hour12: false, hour: '2-digit', minute: '2-digit' 
                  });

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%] break-words">
                        <div className={isMe ? 'text-right' : 'text-left'}>
                          <span className={`text-xs ${isMe ? 'text-cyan-400' : 'text-blue-400'}`}>
                            {msg.user.username}
                          </span>
                        </div>
                        <div className={`text-xs ${isMe ? 'bg-cyan-900/30' : 'bg-slate-800/50'} rounded px-2 py-1 mt-0.5`}>
                          {msg.content}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {renderIdleMode()}

            {isInteractive && (
              <div className="flex items-center mt-1 mb-2 flex-shrink-0">
                <span className={`${getPromptColor()} flex-shrink-0 text-xs`}>
                  {getPromptSymbol()}
                </span>
                <input
                  ref={inputRef}
                  type={loginMode && loginStep === "password" ? "password" : "text"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-black border-none text-slate-300 focus:outline-none ml-2"
                  placeholder={getPlaceholder()}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  disabled={isSending}
                  style={{ fontSize: '16px' }}
                />
                {isSending && (
                  <span className="text-yellow-400 animate-pulse ml-2 text-xs">●</span>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            className="flex-shrink-0 bg-black border-t-2 border-green-600 p-2 z-20"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 200px)' }}
          >
            <div className="text-slate-600 text-center text-xs">
              {chatMode && "[Enter] send • /exit leave"}
              {loginMode && "[Enter] continue • /cancel abort"}
              {!chatMode && !loginMode && "Type 'help' for commands"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}