"use client";

import { useState, useEffect } from "react";
import { Win98Button } from "@/components/ui/win-98-button";
import { BinaryBackground } from "@/components/ui/BinaryBackground";
import Image from "next/image";

export default function Home() {
  const [waitCount, setWaitCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounter = async () => {
      try {
        const response = await fetch("/api/counter");
        const data = await response.json();
        setWaitCount(data.count);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch counter:", error);
        setLoading(false);
      }
    };

    fetchCounter();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/counter");
        const data = await response.json();
        setWaitCount(data.count);
      } catch (error) {
        console.error("Failed to sync counter:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleWaitClick = async () => {
    try {
      const response = await fetch("/api/counter", { method: "POST" });
      const data = await response.json();
      setWaitCount(data.count);
    } catch (error) {
      console.error("Failed to increment counter:", error);
    }
  };

  return (
    <>
      <BinaryBackground />

      <div
        style={{
          minHeight: "100vh",
          padding: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            '"MS Sans Serif", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        }}
      >
        {/* Main Windows 95 Window */}
        <div
          style={{
            maxWidth: "min(500px, 90vw)",
            width: "100%",
            backgroundColor: "#c0c0c0",
            border: "2px solid",
            borderColor: "#dfdfdf #808080 #808080 #dfdfdf",
            boxShadow: "inset 1px 1px 0 #ffffff, 2px 2px 4px rgba(0,0,0,0.3)",
            position: "relative",
          }}
        >
          {/* Logo Dialog Box - positioned relative to main window */}
          <div
            style={{
              position: "absolute",
              top: "calc(100% - 70px)",
              left: "calc(100% - 110px)",
              zIndex: 10,
              backgroundColor: "#c0c0c0",
              border: "2px solid",
              borderColor: "#dfdfdf #808080 #808080 #dfdfdf",
              boxShadow: "inset 1px 1px 0 #ffffff, 2px 2px 4px rgba(0,0,0,0.3)",
              width: "min(120px, 30vw)",
              transform:
                "translateX(clamp(-120px, calc(100vw - 100% - 140px), 0px))",
            }}
          >
            {/* Logo Title Bar */}
            <div
              style={{
                backgroundColor: "#000080",
                color: "white",
                padding: "2px 4px",
                fontSize: "min(11px, 3vw)",
                fontWeight: "bold",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Enigma</span>
              <div style={{ display: "flex", gap: "2px" }}>
                <button
                  style={{
                    width: "min(16px, 4vw)",
                    height: "min(14px, 3.5vw)",
                    backgroundColor: "#c0c0c0",
                    border: "1px solid",
                    borderColor: "#dfdfdf #808080 #808080 #dfdfdf",
                    fontSize: "min(8px, 2vw)",
                  }}
                >
                  _
                </button>
                <button
                  style={{
                    width: "min(16px, 4vw)",
                    height: "min(14px, 3.5vw)",
                    backgroundColor: "#c0c0c0",
                    border: "1px solid",
                    borderColor: "#dfdfdf #808080 #808080 #dfdfdf",
                    fontSize: "min(8px, 2vw)",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Logo Content */}
            <div
              style={{
                padding: "min(15px, 4vw)",
                textAlign: "center",
              }}
            >
              <Image
                src="/logo.png"
                alt="Logo"
                width={0}
                height={0}
                sizes="100vw"
                style={{
                  width: "min(80px, 20vw)",
                  height: "min(80px, 20vw)",
                  filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))",
                }}
              />
            </div>
          </div>

          {/* Title Bar */}
          <div
            style={{
              backgroundColor: "#000080",
              color: "white",
              padding: "2px 4px",
              fontSize: "min(11px, 3vw)",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Website Status</span>
            <div style={{ display: "flex", gap: "2px" }}>
              <button
                style={{
                  width: "min(16px, 4vw)",
                  height: "min(14px, 3.5vw)",
                  backgroundColor: "#c0c0c0",
                  border: "1px solid",
                  borderColor: "#dfdfdf #808080 #808080 #dfdfdf",
                  fontSize: "min(8px, 2vw)",
                }}
              >
                _
              </button>
              <button
                style={{
                  width: "min(16px, 4vw)",
                  height: "min(14px, 3.5vw)",
                  backgroundColor: "#c0c0c0",
                  border: "1px solid",
                  borderColor: "#dfdfdf #808080 #808080 #dfdfdf",
                  fontSize: "min(8px, 2vw)",
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div
            style={{
              padding: "min(30px, 6vw)",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "min(20px, 5vw)",
                fontWeight: "bold",
                marginBottom: "min(30px, 6vw)",
                color: "#000080",
              }}
            >
              WEBSITE UNDER CONSTRUCTION
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "min(20px, 4vw)",
                flexWrap: "wrap",
              }}
            >
              <Win98Button
                onClick={handleWaitClick}
                style={{
                  fontSize: "min(12px, 3vw)",
                  fontWeight: "bold",
                  minWidth: "min(100px, 25vw)",
                  height: "min(40px, 10vw)",
                }}
              >
                WAIT
              </Win98Button>

              <div
                style={{
                  border: "2px solid",
                  borderColor: "#808080 #dfdfdf #dfdfdf #808080",
                  backgroundColor: "#ffffff",
                  padding: "0px min(20px, 4vw)",
                  minWidth: "min(80px, 20vw)",
                  height: "min(40px, 10vw)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "min(14px, 3.5vw)",
                  fontWeight: "bold",
                  boxSizing: "border-box",
                }}
              >
                {loading ? "..." : waitCount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
