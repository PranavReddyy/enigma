"use client";

import { useEffect, useState } from "react";

export function BinaryBackground() {
  const [displayText, setDisplayText] = useState("");

  const binaryString =
    "0110100001110100011101000111000001110011001110100010111100101111011101110111011101110111001011100111100101101111011101010111010001110101011000100110010100101110011000110110111101101101001011110111011101100001011101000110001101101000001111110111011000111101001110010100010001100101011001110011011101010110011100100111000001001000011000100100110101101000011101000111010001110000011100110011101000101111001011110111011101110111011101110010111001111001011011110111010101110100011101010110001001100101001011100110001101101111011011010010111101110111011000010111010001100011011010000011111101110110001111010011100101000100011001010110011100110111010101100111001001110000010010000110001001001101";

  useEffect(() => {
    let currentIndex = 0;

    const updateBackground = () => {
      // Calculate rows and columns based on viewport
      const rows = Math.ceil(window.innerHeight / 16) + 5; // Add extra rows for full coverage
      const cols = Math.ceil(window.innerWidth / 10) + 80; // Add extra columns for full coverage
      const totalChars = rows * cols;

      let result = "";
      for (let i = 0; i < totalChars; i++) {
        result += binaryString[(currentIndex + i) % binaryString.length];
      }

      // Format into rows
      let formattedText = "";
      for (let i = 0; i < rows; i++) {
        const rowStart = i * cols;
        const rowEnd = Math.min((i + 1) * cols, result.length);
        formattedText += result.slice(rowStart, rowEnd) + "\n";
      }

      setDisplayText(formattedText);
      currentIndex = (currentIndex + 1) % binaryString.length;
    };

    // Initial update
    updateBackground();

    const interval = setInterval(updateBackground, 150);

    const handleResize = () => {
      updateBackground();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#404040",
        lineHeight: "16px",
        overflow: "hidden",
        pointerEvents: "none",
        whiteSpace: "pre",
        wordBreak: "break-all",
      }}
    >
      {displayText}
    </div>
  );
}
