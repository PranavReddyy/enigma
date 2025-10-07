"use client";

import { motion } from "framer-motion";
import { Win98Button } from "@/components/ui/win-98-button";
import { BinaryBackground } from "@/components/ui/BinaryBackground";
import Image from "next/image";

export function ConstructionPage({ onEnterClick }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
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
              WEBSITE CONSTRUCTED
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
                onClick={onEnterClick}
                style={{
                  fontSize: "min(12px, 3vw)",
                  fontWeight: "bold",
                  minWidth: "min(100px, 25vw)",
                  height: "min(40px, 10vw)",
                }}
              >
                ENTER
              </Win98Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
