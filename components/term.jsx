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
  const [loginStep, setLoginStep] = useState("email"); // email -> password
  const [loginEmail, setLoginEmail] = useState("");
  const [messages, setMessages] = useState([]);
  const [latestMessages, setLatestMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageCache, setMessageCache] = useState(new Map()); 


  // Fetch latest 5 messages for display
  useEffect(() => {
    fetchLatestMessages();
  }, []);

  
useEffect(() => {
  const ensureBoxAccess = async () => {
    try {
      if (user) {
        // First grant access
        const granted = await grantBoxAccess();
        if (granted) {
          // Wait a bit then verify it worked
          await new Promise(resolve => setTimeout(resolve, 100));
          const res = await fetch("/api/secret/check-access");
          if (res.ok) {
          } else {
            // Retry once more
            await grantBoxAccess();
          }
        }
      }
    } catch (error) {
      // console.error("Terminal session setup failed:", error);
    }
  };

  // Check for authenticated users
  if (!authLoading && user) {
    ensureBoxAccess();
  }
}, [user, authLoading]);

  // Real-time subscription when in chat mode
  useEffect(() => {
    if (!chatMode) return;

    fetchMessages();

    const channel = pusherClient.subscribe("secret-chat");

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind("new-message", (data) => {
  setMessages((prev) => [...prev, data]);
  
  // Only invalidate specific cache entries, not all
  setMessageCache(prev => {
    const newCache = new Map(prev);
    newCache.delete('latest-5'); // Only clear latest messages cache
    return newCache;
  });
  
  // Refresh latest messages for idle mode
  setTimeout(fetchLatestMessages, 1000);
});

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe("secret-chat");
      setIsConnected(false);
    };
  }, [chatMode]);

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history, messages]);

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
    if (isInteractive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInteractive]);

  const fetchLatestMessages = async () => {
  // Check cache first
  const cacheKey = 'latest-5';
  if (messageCache.has(cacheKey)) {
    const cached = messageCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 30000) { // 30 seconds cache
      setLatestMessages(cached.data);
      return;
    }
  }

  try {
    // Use public endpoint for latest messages (no auth required)
    const res = await fetch("/api/secret/messages/public?limit=5");
    if (res.ok) {
      const data = await res.json();
      
      // Cache the result
      setMessageCache(prev => new Map(prev).set(cacheKey, {
        data: data.messages,
        timestamp: Date.now()
      }));
      
      setLatestMessages(data.messages);
    }
  } catch (error) {
    // console.error("Error fetching latest messages:", error);
  }
};

  // Replace the fetchMessages function:

const fetchMessages = async (pageNum = 1, append = false) => {
  if (loadingMessages) return;
  
  // Check cache first
  const cacheKey = `page-${pageNum}`;
  if (messageCache.has(cacheKey) && !append) {
    const cached = messageCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
      setMessages(cached.data);
      setHasMoreMessages(cached.hasMore);
      setPage(pageNum);
      return;
    }
  }
  
  setLoadingMessages(true);
  try {
    const res = await fetch(`/api/secret/messages?page=${pageNum}&limit=20`);
    
    // If we get 403, try to refresh box access and retry
    if (res.status === 403) {
      await grantBoxAccess();
      
      // Wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 500));
      const retryRes = await fetch(`/api/secret/messages?page=${pageNum}&limit=20`);
      
      if (!retryRes.ok) {
        if (retryRes.status === 401) {
          // Don't handle 401 in terminal - just log the error
          // console.error("Authentication failed in terminal");
          return;
        }
        throw new Error("Failed to fetch messages after retry");
      }
      
      const data = await retryRes.json();
      // Process successful response...
      setMessageCache(prev => new Map(prev).set(cacheKey, {
        data: data.messages,
        hasMore: data.hasMore,
        timestamp: Date.now()
      }));
      
      if (append) {
        setMessages(prev => [...data.messages, ...prev]); // Prepend older messages
      } else {
        setMessages(data.messages);
      }
      setHasMoreMessages(data.hasMore);
      setPage(pageNum);
      return;
    }
    
    if (res.ok) {
      const data = await res.json();
      
      // Cache the result
      setMessageCache(prev => new Map(prev).set(cacheKey, {
        data: data.messages,
        hasMore: data.hasMore,
        timestamp: Date.now()
      }));
      
      if (append) {
        setMessages(prev => [...data.messages, ...prev]); // Prepend older messages
      } else {
        setMessages(data.messages);
      }
      setHasMoreMessages(data.hasMore);
      setPage(pageNum);
    } else {
      // console.error("Failed to fetch messages:", res.status);
    }
  } catch (error) {
    // console.error("Error fetching messages:", error);
  } finally {
    setLoadingMessages(false);
  }
};

const loadMoreMessages = () => {
  if (hasMoreMessages && !loadingMessages) {
    const scrollHeight = messagesEndRef.current?.parentElement?.scrollHeight;
    fetchMessages(page + 1, true);
    
    // Prevent auto-scroll when loading older messages
    setTimeout(() => {
      if (messagesEndRef.current?.parentElement && scrollHeight) {
        messagesEndRef.current.parentElement.scrollTop = 
          messagesEndRef.current.parentElement.scrollHeight - scrollHeight;
      }
    }, 100);
  }
};

  const sendMessage = async (content) => {
  try {
    const res = await fetch("/api/secret/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    // If we get 403, try to refresh box access and retry
    if (res.status === 403) {
      await grantBoxAccess();
      
      // Wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 500));
      const retryRes = await fetch("/api/secret/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!retryRes.ok) {
        return { error: "Failed to send message after retry" };
      }
      return { success: true };
    }

    if (!res.ok) {
      return { error: "Failed to send message" };
    }
    return { success: true };
  } catch (error) {
    // console.error("Error sending message:", error);
    return { error: "Failed to send message" };
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

      // Update auth context
      await checkAuth();
      return { success: true };
    } catch (error) {
      // console.error("Login error:", error);
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
    }
  };

  const grantBoxAccess = async () => {
  try {
    const res = await fetch("/api/secret/access-box", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ counter: 649 }),
    });

    if (res.ok) {
      return true;
    } else {
      // console.error("Failed to grant box access from terminal");
      return false;
    }
  } catch (error) {
    // console.error("Failed to grant box access from terminal:", error);
    return false;
  }
};

  const handleKeyDown = async (e) => {
    if (e.key === "Enter") {
      const command = inputValue.trim();
      const commandLower = command.toLowerCase();
      
      // Handle login flow
      if (loginMode) {
        if (commandLower === "/cancel") {
          setLoginMode(false);
          setLoginStep("email");
          setLoginEmail("");
          setHistory([
            ...history,
            { type: "command", text: `> ${command}` },
            { type: "output", text: "Login cancelled." }
          ]);
          setInputValue("");
          return;
        }

        if (loginStep === "email") {
          if (command.includes("@")) {
            setLoginEmail(command);
            setLoginStep("password");
            setHistory([
              ...history,
              { type: "command", text: `> ${command}` },
              { type: "output", text: "Password:" }
            ]);
          } else {
            setHistory([
              ...history,
              { type: "command", text: `> ${command}` },
              { type: "error", text: "Invalid email format. Please try again." }
            ]);
          }
          setInputValue("");
          return;
        }

        if (loginStep === "password") {
          const maskedPassword = "•".repeat(command.length);
          const result = await handleLogin(loginEmail, command);
          
          if (result.success) {
  // Update auth context only after successful login
  await checkAuth();
  
  setHistory([
    ...history,
    { type: "command", text: `> ${maskedPassword}` },
    { type: "success", text: `✓ Login successful! Welcome back.` },
    { type: "output", text: "Type 'whoami' to check your status or 'thebox' to enter the chatroom." }
  ]);
  setLoginMode(false);
  setLoginStep("email");
  setLoginEmail("");
} else {
  setHistory([
    ...history,
    { type: "command", text: `> ${maskedPassword}` },
    { type: "error", text: `✗ ${result.error}` },
    { type: "output", text: result.error.includes("verify") 
      ? "Please verify your email first. Check your inbox." 
      : "Type '/cancel' to abort login or try again." }
  ]);
  setLoginStep("email");
  setLoginEmail("");
  if (!result.error.includes("verify")) {
    setHistory(prev => [...prev, { type: "output", text: "Email:" }]);
  }
}
          setInputValue("");
          return;
        }
      }

      // If in chat mode, send as message
      if (chatMode) {
        if (commandLower === "/exit") {
          setChatMode(false);
  setMessages([]); // Clear messages when exiting
  setPage(1); // Reset pagination
  setHasMoreMessages(true); // Reset pagination state
  setHistory([
    ...history,
    { type: "command", text: `> ${command}` },
    { type: "output", text: "Exited chat mode. Type 'thebox' to return." }
  ]);
} else if (command !== "") {
          const result = await sendMessage(command);
          if (result.error) {
            setHistory([...history, { type: "error", text: result.error }]);
          }
        }
        setInputValue("");
        return;
      }

      // Normal command mode
      const newHistory = [...history, { type: "command", text: `$ ${commandLower}` }];

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
            { type: "output", text: `Email: ${user.email}` },
            { type: "output", text: `Access Level: The Box Member` }
          ]);
        } else {
          setHistory([
            ...newHistory,
            { type: "output", text: "Not authenticated. Type 'login' to sign in." }
          ]);
        }
      } else if (commandLower === "logout") {
        if (user) {
          await handleLogout();
          setHistory([
            ...newHistory,
            { type: "success", text: "✓ Logged out successfully." }
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
      { type: "error", text: "404 Not Found - Entry Restricted to The Box" }
    ]);
  } else {
    setChatMode(true);
    setHistory([
      ...newHistory,
      { type: "success", text: `Welcome to The Box, ${user.username}!` },
      { type: "output", text: "You are now in chat mode. Messages will appear in real-time." },
      { type: "output", text: "Type '/exit' to return to command mode." },
      { type: "divider", text: "────────────────────────────────────────" }
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
    }
  };

  const renderIdleMode = () => {
  if (!isInteractive && !chatMode && !loginMode) {
    // Create dynamic idle messages that include latest box messages
    const dynamicIdleMessages = [
      'Welcome to Enigma',
      2000,
      'Hacktober 2025 is here!',
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
      // Add The Box messages section
      ...(latestMessages.length > 0 ? [
        'Hear what people talk about in The Box:',
        2000,
        ...latestMessages.flatMap((msg, idx) => [
          `[${new Date(msg.createdAt + "Z").toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          })}] ${msg.user.username}: ${msg.content}`,
          1500, // 1.5 second pause between messages
        ]),
        'Type "thebox" to join the conversation...',
        3000,
      ] : [])
    ];

    return (
      <div className="flex items-center">
        <span className="text-green-400">$</span>
        <TypeAnimation
          key={latestMessages.length} // Force re-render when messages change
          sequence={dynamicIdleMessages}
          wrapper="span"
          speed={50}
          className="ml-2 text-slate-400"
          repeat={Infinity}
          cursor={true}
        />
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
    if (loginStep === "email") return "Enter your email address...";
    if (loginStep === "password") return "Enter your password... (type /cancel to abort)";
  }
  if (chatMode) return "Type your message... (/exit to leave)";
  return "";
};

  return (
    <div
      className="w-full h-72 rounded-2xl bg-black/30 border border-slate-700/50 p-4 font-mono text-sm text-slate-300 overflow-y-scroll cursor-text hide-scrollbar"
      onClick={handleContainerClick}
      ref={terminalRef}
    >
      {/* Command history */}
      {history.map((line, index) => (
        <div key={index}>
          {Array.isArray(line.text) ? (
            line.text.map((subLine, subIndex) => (
              <div key={subIndex} className="text-green-400 whitespace-pre-wrap">
                {subLine}
              </div>
            ))
          ) : (
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
          )}
        </div>
      ))}

      {/* Chat mode messages */}
      {chatMode && (
  <div className="space-y-1 mb-2">
    {isConnected && (
      <div className="text-xs text-green-400 flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
        [LIVE] Connection established to The Box
      </div>
    )}
    
    {/* Load More Button */}
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
    
    <div ref={messagesEndRef} />
  </div>
)}


      {/* Idle mode (typing animation + latest messages) */}
      {renderIdleMode()}

      {/* Interactive input */}
      {isInteractive && (
        <div className="flex items-center">
          <span className={getPromptColor()}>
            {getPromptSymbol()}
          </span>
          <input
            ref={inputRef}
            type={loginMode && loginStep === "password" ? "password" : "text"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none text-slate-300 w-full focus:outline-none focus:ring-0 ml-2"
            placeholder={getPlaceholder()}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}