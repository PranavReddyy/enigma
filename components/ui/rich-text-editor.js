"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Code,
  Link,
  Quote,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Minus,
} from "lucide-react";

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start writing...",
}) {
  const editorRef = useRef(null);
  const [content, setContent] = useState(value);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = value;
      setContent(value);
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const formatText = (command, commandValue = null) => {
    editorRef.current?.focus();

    // Special handling for format block commands
    if (command === "formatBlock") {
      document.execCommand(command, false, `<${commandValue}>`);
    } else {
      document.execCommand(command, false, commandValue);
    }

    handleInput();
  };

  const insertCodeBlock = () => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    const codeBlock = document.createElement("pre");
    codeBlock.style.cssText = `
      background: #0f172a;
      color: #22d3ee;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
      font-family: 'Courier New', monospace;
      overflow-x: auto;
      border: 1px solid #334155;
    `;

    const code = document.createElement("code");
    code.textContent = "// Your code here";
    code.contentEditable = "true";
    codeBlock.appendChild(code);

    range.insertNode(codeBlock);

    // Add a paragraph after the code block
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    codeBlock.parentNode.insertBefore(p, codeBlock.nextSibling);

    // Position cursor in the code block
    const newRange = document.createRange();
    newRange.selectNodeContents(code);
    selection.removeAllRanges();
    selection.addRange(newRange);

    handleInput();
  };

  const insertDivider = () => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    const hr = document.createElement("hr");
    hr.style.cssText = `
      border: none;
      border-top: 1px solid #475569;
      margin: 2rem 0;
    `;

    range.insertNode(hr);

    // Add a paragraph after the divider
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    hr.parentNode.insertBefore(p, hr.nextSibling);

    // Position cursor after the divider
    const newRange = document.createRange();
    newRange.setStartAfter(p);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    handleInput();
  };

  const createLink = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();

    if (!selectedText) {
      alert("Please select some text first to create a link.");
      return;
    }

    const url = prompt("Enter URL:");
    if (url) {
      formatText("createLink", url);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      if (onChange) {
        onChange(newContent);
      }
    }
  };

  const handleKeyDown = (e) => {
    // Handle Enter key in different contexts
    if (e.key === "Enter") {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const currentNode = range.startContainer;

      // Check if we're in a heading
      let parent =
        currentNode.nodeType === Node.TEXT_NODE
          ? currentNode.parentNode
          : currentNode;

      if (parent.tagName && ["H1", "H2", "H3"].includes(parent.tagName)) {
        e.preventDefault();
        // Create a new paragraph after the heading
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        parent.parentNode.insertBefore(p, parent.nextSibling);

        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        handleInput();
        return;
      }
    }

    // Handle Tab key for code blocks
    if (e.key === "Tab") {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      let parent =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentNode
          : range.startContainer;

      // Check if we're in a code block
      while (parent && parent !== editorRef.current) {
        if (parent.tagName === "PRE" || parent.tagName === "CODE") {
          e.preventDefault();
          document.execCommand("insertText", false, "  "); // Insert 2 spaces
          handleInput();
          return;
        }
        parent = parent.parentNode;
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
  };

  const tools = [
    { icon: Bold, command: "bold", label: "Bold" },
    { icon: Italic, command: "italic", label: "Italic" },
    { icon: Code, action: insertCodeBlock, label: "Code Block" },
    { icon: Link, action: createLink, label: "Link" },
    {
      icon: Quote,
      command: "formatBlock",
      value: "blockquote",
      label: "Quote",
    },
    { icon: Minus, action: insertDivider, label: "Divider" },
    { icon: List, command: "insertUnorderedList", label: "Bullet List" },
    { icon: ListOrdered, command: "insertOrderedList", label: "Numbered List" },
    { icon: Heading1, command: "formatBlock", value: "h1", label: "Heading 1" },
    { icon: Heading2, command: "formatBlock", value: "h2", label: "Heading 2" },
    { icon: Heading3, command: "formatBlock", value: "h3", label: "Heading 3" },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-white/[0.08] bg-white/[0.02] flex-wrap">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (tool.action) {
                  tool.action();
                } else {
                  formatText(tool.command, tool.value);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-all duration-200"
              title={tool.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="min-h-[500px] p-6 text-white focus:outline-none overflow-y-auto"
          style={{
            lineHeight: "1.6",
            fontSize: "16px",
            fontFamily: "inherit",
            wordWrap: "break-word",
            whiteSpace: "normal",
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />

        {/* Placeholder */}
        {!content && (
          <div
            className="absolute top-6 left-6 text-slate-500 pointer-events-none select-none"
            style={{ fontSize: "16px" }}
          >
            {placeholder}
          </div>
        )}
      </div>

      <style jsx>{`
        [contenteditable] {
          word-wrap: break-word;
          white-space: normal;
        }

        [contenteditable] * {
          max-width: 100%;
        }

        [contenteditable] h1 {
          font-size: 2rem !important;
          font-weight: 700 !important;
          margin: 1.5rem 0 1rem 0 !important;
          color: white !important;
          line-height: 1.2 !important;
          display: block !important;
        }

        [contenteditable] h2 {
          font-size: 1.75rem !important;
          font-weight: 600 !important;
          margin: 1.25rem 0 0.75rem 0 !important;
          color: white !important;
          line-height: 1.3 !important;
          display: block !important;
        }

        [contenteditable] h3 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          margin: 1rem 0 0.5rem 0 !important;
          color: white !important;
          line-height: 1.4 !important;
          display: block !important;
        }

        [contenteditable] p {
          margin: 0.75rem 0 !important;
          line-height: 1.6 !important;
          color: #e2e8f0 !important;
          display: block !important;
        }

        [contenteditable] blockquote {
          border-left: 3px solid #475569 !important;
          padding: 1rem !important;
          margin: 1rem 0 !important;
          font-style: italic !important;
          color: #cbd5e1 !important;
          background: rgba(71, 85, 105, 0.1) !important;
          border-radius: 0.5rem !important;
          display: block !important;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          margin: 1rem 0 !important;
          padding-left: 1.5rem !important;
          color: #e2e8f0 !important;
        }

        [contenteditable] li {
          margin: 0.25rem 0 !important;
          color: #e2e8f0 !important;
          line-height: 1.6 !important;
        }

        [contenteditable] a {
          color: #60a5fa !important;
          text-decoration: underline !important;
        }

        [contenteditable] strong {
          font-weight: 600 !important;
          color: white !important;
        }

        [contenteditable] em {
          font-style: italic !important;
          color: #cbd5e1 !important;
        }

        [contenteditable] pre {
          background: #0f172a !important;
          color: #22d3ee !important;
          padding: 1rem !important;
          border-radius: 0.5rem !important;
          font-family: "Courier New", monospace !important;
          font-size: 14px !important;
          overflow-x: auto !important;
          margin: 1rem 0 !important;
          white-space: pre !important;
          border: 1px solid #334155 !important;
          display: block !important;
        }

        [contenteditable] code {
          background: #1e293b !important;
          color: #22d3ee !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
          font-family: "Courier New", monospace !important;
          font-size: 0.875em !important;
        }

        [contenteditable] pre code {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }

        [contenteditable] hr {
          border: none !important;
          border-top: 1px solid #475569 !important;
          margin: 2rem 0 !important;
          display: block !important;
        }
      `}</style>
    </div>
  );
}
