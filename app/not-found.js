"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Win98Button } from "@/components/ui/win-98-button";
import { pusherClient } from "@/lib/pusher";
import { useAuth } from "@/lib/auth-context";
import { set } from "date-fns/set";

export default function NotFound() {
  const { user, setUser, loading: authLoading, logout } = useAuth();
  const [counter, setCounter] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState("choice");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const messagesEndRef = useRef(null);
  const usernameCheckTimeout = useRef(null);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageCache, setMessageCache] = useState(new Map());
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretPassword, setSecretPassword] = useState("");

  // Auto-open chatroom if user is authenticated
  useEffect(() => {
    if (!authLoading && user) {
      setShowModal(true);
      setStep("chatroom");
    }
  }, [authLoading, user, counter]);

  useEffect(() => {
    const ensureBoxAccess = async () => {
      try {
        // First, try to grant/refresh box access
        if (counter >= 649 || user) {
          await grantBoxAccess();

          // Then verify it worked
          const checkRes = await fetch("/api/secret/check-access");
          if (checkRes.ok) {
          } else {
            // Retry once more
            await grantBoxAccess();
          }
        }
      } catch (error) {
        // console.error("Box access setup failed:", error);
      }
    };

    // Only run when we have the conditions for access
    if (counter >= 649 || (!authLoading && user)) {
      ensureBoxAccess();
    }
  }, [counter, user, authLoading]);

  const handleSecretAccess = async () => {
    try {
      const res = await fetch("/api/secret/admin-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: secretPassword }),
      });

      if (res.ok) {
        setCounter(648);
        setShowSecretInput(false);
        setSecretPassword("");
        grantBoxAccess();
        if (user) {
          setShowModal(true);
          setStep("chatroom");
        } else {
          setShowModal(true);
        }
      } else {
        alert("Invalid password");
        setSecretPassword("");
      }
    } catch (error) {
      alert("Error checking password");
      setSecretPassword("");
    }
  };

  const increment = () => {
    if (counter < 649) {
      setCounter(counter + 1);
      if (counter + 1 === 649) {
        grantBoxAccess();
        setShowModal(true);
        if (user) {
          setStep("chatroom");
        }
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const grantBoxAccess = async () => {
    try {
      const res = await fetch("/api/secret/access-box", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counter: 649 }),
      });

      if (res.ok) {
      }
    } catch (error) {
      // console.error("Failed to grant box access:", error);
    }
  };

  // Check username availability - ONLY when in signup step
  useEffect(() => {
    if (step !== "signup") {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    if (username.length >= 3) {
      setCheckingUsername(true);

      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }

      usernameCheckTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/secret/check-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });
          const data = await res.json();
          setUsernameAvailable(data.available);
        } catch (error) {
          // console.error("Username check error:", error);
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      }, 500);
    } else {
      setUsernameAvailable(null);
      setCheckingUsername(false);
    }

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [username, step]);

  // Real-time message subscription - ONLY when in chatroom
  useEffect(() => {
    if (step !== "chatroom") return;

    fetchMessages(); // Load first page

    const channel = pusherClient.subscribe("secret-chat");

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind("new-message", (data) => {
      setMessages((prev) => [...prev, data]);

      // Only invalidate page 1 cache, not everything
      setMessageCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete("page-1"); // Only clear first page
        return newCache;
      });
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe("secret-chat");
      setIsConnected(false);
    };
  }, [step]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + Shift + S for secret access
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        setShowSecretInput(!showSecretInput);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSecretInput]);

  const fetchMessages = async (pageNum = 1, append = false) => {
    if (loadingMessages) return;

    // Check cache first
    const cacheKey = `page-${pageNum}`;
    if (messageCache.has(cacheKey) && !append) {
      const cached = messageCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) {
        // 1 minute cache
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
        await new Promise((resolve) => setTimeout(resolve, 500));
        const retryRes = await fetch(
          `/api/secret/messages?page=${pageNum}&limit=20`
        );

        if (!retryRes.ok) {
          if (retryRes.status === 401) {
            setStep("choice");
            setError("Session expired. Please sign in again.");
            return;
          }
          throw new Error("Failed to fetch messages after retry");
        }

        const data = await retryRes.json();
        // Process successful response...
        setMessageCache((prev) =>
          new Map(prev).set(cacheKey, {
            data: data.messages,
            hasMore: data.hasMore,
            timestamp: Date.now(),
          })
        );

        if (append) {
          setMessages((prev) => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages);
        }
        setHasMoreMessages(data.hasMore);
        setPage(pageNum);
        return;
      }

      if (!res.ok) {
        if (res.status === 401) {
          setStep("choice");
          setError("Session expired. Please sign in again.");
          return;
        }
        throw new Error("Failed to fetch messages");
      }

      const data = await res.json();

      // Cache the result
      setMessageCache((prev) =>
        new Map(prev).set(cacheKey, {
          data: data.messages,
          hasMore: data.hasMore,
          timestamp: Date.now(),
        })
      );

      if (append) {
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
      }
      setHasMoreMessages(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      // console.error("Error fetching messages:", error);
      setError("Failed to load messages. Please try again.");
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

  const handleSignup = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/secret/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setStep("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/secret/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.error.includes("verify")) {
          // User needs to verify email - redirect to verify step
          setStep("verify");
          setError("Please check your email and enter the verification code.");
          return;
        }
        throw new Error(data.error || "Login failed");
      }

      // Only update auth context for verified users
      const meRes = await fetch("/api/secret/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      setStep("chatroom");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/secret/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid code");
      }

      // Update auth context
      const meRes = await fetch("/api/secret/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      setStep("chatroom");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResendingCode(true);
    setError("");

    try {
      const res = await fetch("/api/secret/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      alert("New verification code sent! Check your email.");
      setVerificationCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setResendingCode(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/secret/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Failed to send reset code");
      }

      setError("");
      setStep("reset-code");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/secret/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: resetCode, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      alert("Password reset successful! You can now sign in.");
      setStep("login");
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newMessage.trim()) return;

    const tempMessage = newMessage;
    setNewMessage("");

    try {
      const res = await fetch("/api/secret/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tempMessage }),
      });

      // If we get 403, try to refresh box access and retry
      if (res.status === 403) {
        // console.log("Send message access denied, refreshing box session...");
        await grantBoxAccess();

        // Wait a bit and retry
        await new Promise((resolve) => setTimeout(resolve, 500));
        const retryRes = await fetch("/api/secret/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: tempMessage }),
        });

        if (!retryRes.ok) {
          if (retryRes.status === 401) {
            setStep("choice");
            setError("Session expired. Please sign in again.");
            return;
          }
          throw new Error("Failed to send message after retry");
        }

        // Clear any previous errors
        setError("");
        return;
      }

      if (!res.ok) {
        if (res.status === 401) {
          setStep("choice");
          setError("Session expired. Please sign in again.");
          return;
        }
        throw new Error("Failed to send message");
      }

      // Clear any previous errors
      setError("");
    } catch (error) {
      // console.error("Error sending message:", error);
      setError("Failed to send message");
      setNewMessage(tempMessage); // Restore message on error
    }
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setVerificationCode("");
    setResetCode("");
    setNewPassword("");
    setError("");
    setUsernameAvailable(null);
    setCheckingUsername(false);
    setLoading(false);
    setResendingCode(false);
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await logout();
    setShowModal(false);
    setStep("choice");
    resetForm();
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-[#c0c0c0] flex items-center justify-center p-4 font-mono">
      <div className="bg-[#c0c0c0] border-2 border-b-[#808080] border-r-[#808080] border-t-white border-l-white p-6 max-w-md w-full">
        <div className="bg-[#0000ff] text-white px-2 py-1 mb-4 flex items-center justify-between text-sm font-bold">
          <span>Error - 404.exe</span>
          <div className="flex gap-1">
            <div className="w-4 h-3 bg-[#c0c0c0] border border-[#808080] flex items-center justify-center text-[8px] text-black">
              ×
            </div>
          </div>
        </div>

        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-b-[#808080] border-r-[#808080] border-t-white border-l-white bg-[#c0c0c0] flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Enigma Logo"
                  className="w-8 h-8 object-contain"
                  draggable={false}
                />
              </div>
              <a
                href="https://itsbypranav.com"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 opacity-0 cursor-default"
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-black">Page Not Found</h1>
              <p className="text-sm text-black">404 Error</p>
            </div>
          </div>

          <div className="border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white p-4">
            <div className="text-4xl font-bold text-black font-mono tracking-wider mb-2">
              {counter.toString().padStart(3, "0")}
            </div>
            <div className="text-xs text-gray-600">
              {counter >= 649 ? "MAX REACHED" : "Keep clicking"}
            </div>
          </div>

          {showSecretInput && (
            <div className="border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white p-4">
              <div className="space-y-2">
                <input
                  type="password"
                  value={secretPassword}
                  onChange={(e) => setSecretPassword(e.target.value)}
                  placeholder="Admin password..."
                  className="w-full border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono focus:outline-none text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSecretAccess();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Win98Button
                    type="button"
                    onClick={handleSecretAccess}
                    className="text-xs px-3 py-1 flex-1"
                  >
                    Access
                  </Win98Button>
                  <Win98Button
                    type="button"
                    onClick={() => {
                      setShowSecretInput(false);
                      setSecretPassword("");
                    }}
                    className="text-xs px-3 py-1 flex-1"
                  >
                    Cancel
                  </Win98Button>
                </div>
              </div>
            </div>
          )}

          <Win98Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              increment();
            }}
            disabled={counter >= 649}
            className="text-sm px-6 py-2"
          >
            {counter >= 649 ? "MAXED OUT" : "Click Me!"}
          </Win98Button>

          <div className="pt-4 border-t border-[#808080]">
            <Link href="/">
              <Win98Button type="button" className="text-sm px-6 py-2">
                Go Home
              </Win98Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Secret Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#c0c0c0] border-2 border-b-[#808080] border-r-[#808080] border-t-white border-l-white max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#0000ff] text-white px-2 py-1 flex items-center justify-between text-sm font-bold flex-shrink-0">
              <span className="flex items-center gap-2">
                {step === "chatroom"
                  ? "The Box - 649.exe"
                  : "The Box - 649.exe"}
                {step === "chatroom" && isConnected && (
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                )}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="w-4 h-3 bg-[#c0c0c0] border border-[#808080] flex items-center justify-center text-[8px] text-black hover:bg-white"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {authLoading ? (
                <div className="text-center">
                  <p className="text-black">Loading...</p>
                </div>
              ) : (
                <>
                  {step === "choice" && (
                    <>
                      <div className="text-center mb-4">
                        <h2 className="text-lg font-bold text-black mb-2">
                          Damn, such amazing clicker
                        </h2>
                        <p className="text-sm text-black">
                          Welcome to the The Box
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Win98Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setStep("signup");
                            resetForm();
                          }}
                          className="w-full text-sm py-3"
                        >
                          Create Account
                        </Win98Button>
                        <Win98Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setStep("login");
                            resetForm();
                          }}
                          className="w-full text-sm py-3"
                        >
                          Sign In
                        </Win98Button>
                      </div>
                    </>
                  )}

                  {step === "signup" && (
                    <>
                      <div className="text-center mb-4">
                        <h2 className="text-lg font-bold text-black mb-2">
                          Create Account
                        </h2>
                      </div>

                      <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-black mb-2">
                            Username:
                          </label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                              setUsername(e.target.value.toLowerCase())
                            }
                            required
                            minLength={3}
                            maxLength={20}
                            pattern="[a-z0-9_]+"
                            className="w-full border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono focus:outline-none"
                            placeholder="username"
                          />
                          {checkingUsername && (
                            <p className="text-xs text-gray-600 mt-1">
                              Checking...
                            </p>
                          )}
                          {usernameAvailable === false && (
                            <p className="text-xs text-red-600 mt-1">
                              Username taken
                            </p>
                          )}
                          {usernameAvailable === true && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Available
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mt-1">
                            3-20 chars, lowercase, numbers, underscore only
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-black mb-2">
                            Email:
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono focus:outline-none"
                            placeholder="your@email.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-black mb-2">
                            Password:
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono focus:outline-none"
                            placeholder="••••••••"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            At least 6 characters
                          </p>
                        </div>

                        {error && (
                          <div className="bg-red-100 border-2 border-red-600 p-2 text-xs text-red-600">
                            {error}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Win98Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setStep("choice");
                              resetForm();
                            }}
                            className="flex-1 text-sm py-2"
                          >
                            Back
                          </Win98Button>
                          <Win98Button
                            type="submit"
                            disabled={
                              loading ||
                              usernameAvailable === false ||
                              checkingUsername
                            }
                            className="flex-1 text-sm py-2"
                          >
                            {loading ? "Creating..." : "Sign Up"}
                          </Win98Button>
                        </div>
                      </form>
                    </>
                  )}

                  {step === "login" && (
                    <>
                      <div className="text-center mb-4">
                        <h2 className="text-lg font-bold text-black mb-2">
                          Sign In
                        </h2>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-black mb-2">
                            Email:
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono focus:outline-none"
                            placeholder="your@email.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-black mb-2">
                            Password:
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono focus:outline-none"
                            placeholder="••••••••"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setStep("forgot");
                            setError("");
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Forgot password?
                        </button>

                        {error && (
                          <div className="bg-red-100 border-2 border-red-600 p-2 text-xs text-red-600">
                            {error}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Win98Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setStep("choice");
                              resetForm();
                            }}
                            className="flex-1 text-sm py-2"
                          >
                            Back
                          </Win98Button>
                          <Win98Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 text-sm py-2"
                          >
                            {loading ? "Signing in..." : "Sign In"}
                          </Win98Button>
                        </div>
                      </form>
                    </>
                  )}

                  {step === "verify" && (
                    <>
                      <div className="text-center mb-4">
                        <h2 className="text-lg font-bold text-black mb-2">
                          Verify Email
                        </h2>
                        <p className="text-sm text-black">
                          We sent a 6-digit code to {email}
                        </p>
                      </div>

                      <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-black mb-2">
                            Verification Code:
                          </label>
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) =>
                              setVerificationCode(e.target.value)
                            }
                            required
                            maxLength={6}
                            className="w-full border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono text-center text-2xl tracking-widest focus:outline-none"
                            placeholder="000000"
                          />
                        </div>

                        {error && (
                          <div className="bg-red-100 border-2 border-red-600 p-2 text-xs text-red-600">
                            {error}
                          </div>
                        )}

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={resendingCode}
                            className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
                          >
                            {resendingCode
                              ? "Sending..."
                              : "Didn't receive code? Resend"}
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <Win98Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setStep("signup");
                              setError("");
                            }}
                            className="flex-1 text-sm py-2"
                          >
                            Back
                          </Win98Button>
                          <Win98Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 text-sm py-2"
                          >
                            {loading ? "Verifying..." : "Verify"}
                          </Win98Button>
                        </div>
                      </form>
                    </>
                  )}

                  {step === "forgot" && (
                    <>
                      <div className="text-center mb-4">
                        <h2 className="text-lg font-bold text-black mb-2">
                          Reset Password
                        </h2>
                        <p className="text-sm text-black">
                          Enter your email to receive a reset link
                        </p>
                      </div>

                      <form
                        onSubmit={handleForgotPassword}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-bold text-black mb-2">
                            Email:
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono focus:outline-none"
                            placeholder="your@email.com"
                          />
                        </div>

                        {error && (
                          <div className="bg-red-100 border-2 border-red-600 p-2 text-xs text-red-600">
                            {error}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Win98Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setStep("login");
                              setError("");
                            }}
                            className="flex-1 text-sm py-2"
                          >
                            Back
                          </Win98Button>
                          <Win98Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 text-sm py-2"
                          >
                            {loading ? "Sending..." : "Send Link"}
                          </Win98Button>
                        </div>
                      </form>
                    </>
                  )}

                  {step === "reset-code" && (
                    <>
                      <div className="text-center mb-4">
                        <h2 className="text-lg font-bold text-black mb-2">
                          Enter Reset Code
                        </h2>
                        <p className="text-sm text-black">
                          We sent a 6-digit code to {email}
                        </p>
                      </div>

                      <form
                        onSubmit={handleResetPassword}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-bold text-black mb-2">
                            Reset Code:
                          </label>
                          <input
                            type="text"
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                            required
                            maxLength={6}
                            className="w-full border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono text-center text-2xl tracking-widest focus:outline-none"
                            placeholder="000000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-black mb-2">
                            New Password:
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono focus:outline-none"
                            placeholder="••••••••"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            At least 6 characters
                          </p>
                        </div>

                        {error && (
                          <div className="bg-red-100 border-2 border-red-600 p-2 text-xs text-red-600">
                            {error}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Win98Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setStep("forgot");
                              setError("");
                            }}
                            className="flex-1 text-sm py-2"
                          >
                            Back
                          </Win98Button>
                          <Win98Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 text-sm py-2"
                          >
                            {loading ? "Resetting..." : "Reset Password"}
                          </Win98Button>
                        </div>
                      </form>
                    </>
                  )}

                  {step === "chatroom" && (
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h2 className="text-lg font-bold text-black mb-1">
                          Welcome to The Box
                        </h2>
                        <p className="text-xs text-gray-600 flex items-center justify-center gap-2">
                          <span>
                            Logged in as:{" "}
                            {user?.username || email.split("@")[0]}
                          </span>
                        </p>
                      </div>

                      <div className="border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white h-[50vh] overflow-y-auto p-4">
                        {messages.length === 0 ? (
                          <div className="text-center text-gray-600 text-sm">
                            {loadingMessages
                              ? "Loading messages..."
                              : "No messages yet. Be the first to say something!"}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Load More Button */}
                            {hasMoreMessages && (
                              <div className="text-center mb-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    loadMoreMessages();
                                  }}
                                  disabled={loadingMessages}
                                  className="text-xs text-blue-600 hover:underline disabled:text-gray-400 bg-[#c0c0c0] border border-[#808080] px-3 py-1"
                                >
                                  {loadingMessages
                                    ? "Loading..."
                                    : "↑ Load older messages"}
                                </button>
                              </div>
                            )}

                            {messages.map((msg) => (
                              <div
                                key={msg.id}
                                className="bg-[#c0c0c0] border border-[#808080] p-2 animate-[slideIn_0.2s_ease-out]"
                              >
                                <div className="text-xs text-blue-600 font-bold mb-1">
                                  {msg.user.username || "Anonymous"}
                                </div>
                                <div className="text-sm text-black break-words">
                                  {msg.content}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {new Date(
                                    msg.createdAt + "Z"
                                  ).toLocaleString()}
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </div>

                      {error && (
                        <div className="bg-red-100 border-2 border-red-600 p-2 text-xs text-red-600">
                          {error}
                        </div>
                      )}

                      <form onSubmit={handleSendMessage} className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 border-2 border-b-white border-r-white border-t-[#808080] border-l-[#808080] bg-white px-2 py-1 text-black font-mono focus:outline-none"
                            maxLength={500}
                          />
                          <Win98Button
                            type="submit"
                            className="text-sm px-4 py-6"
                          >
                            Send
                          </Win98Button>
                        </div>
                        <p className="text-xs text-gray-600 text-center">
                          {isConnected
                            ? "✓ Real-time updates enabled"
                            : "⚠ Connecting..."}
                        </p>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
