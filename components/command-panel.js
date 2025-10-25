"use client";

import { useState, useEffect } from "react";

export function CommandPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState("");
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCommand, setEditingCommand] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // NEW
  const [editForm, setEditForm] = useState({
    command: "",
    output: "",
    type: "output",
    isArray: false,
  });

  // Keyboard shortcut listener (Ctrl/Cmd + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAuth = async () => {
    try {
      const res = await fetch("/api/secret/admin-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setMessage("✓ Authenticated");
        fetchCommands();
      } else {
        setMessage("✗ Invalid password");
      }
    } catch (error) {
      setMessage("✗ Authentication failed");
    }
  };

  const fetchCommands = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/commands?password=${password}`);
      if (res.ok) {
        const data = await res.json();
        setCommands(data.commands);
      }
    } catch (error) {
      setMessage("Failed to fetch commands");
    }
    setLoading(false);
  };

  const handleClearCache = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/clear-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        localStorage.removeItem("enigma-commands");
        localStorage.removeItem("enigma-commands-version");
        localStorage.removeItem("enigma-commands-time");
        setMessage("✓ Cache cleared globally");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage("✗ Failed to clear cache");
      }
    } catch (error) {
      setMessage("✗ Error clearing cache");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (cmd) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/commands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          id: cmd.id,
          command: cmd.command,
          output: cmd.output,
          type: cmd.type,
          isArray: cmd.isArray,
          isActive: !cmd.isActive,
        }),
      });

      if (res.ok) {
        setMessage(
          `✓ ${cmd.command} ${!cmd.isActive ? "enabled" : "disabled"}`
        );
        fetchCommands();
      } else {
        const error = await res.json();
        setMessage(`✗ Failed: ${error.details || error.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (cmd) => {
    setEditingCommand(cmd.id);
    setIsAdding(false);
    setEditForm({
      command: cmd.command,
      output: cmd.output,
      type: cmd.type,
      isArray: cmd.isArray,
    });
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingCommand(null);
    setEditForm({
      command: "",
      output: "",
      type: "output",
      isArray: false,
    });
  };

  const handleSaveEdit = async (cmdId) => {
    if (!editForm.command.trim() || !editForm.output) {
      setMessage("✗ Command and output required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/commands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          id: cmdId,
          ...editForm,
          isActive: commands.find((c) => c.id === cmdId).isActive,
        }),
      });

      if (res.ok) {
        setMessage("✓ Command updated");
        setEditingCommand(null);
        fetchCommands();
      } else {
        const error = await res.json();
        setMessage(`✗ Failed: ${error.details || error.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = async () => {
    if (!editForm.command.trim() || !editForm.output) {
      setMessage("✗ Command and output required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          ...editForm,
        }),
      });

      if (res.ok) {
        setMessage("✓ Command created");
        setIsAdding(false);
        setEditForm({
          command: "",
          output: "",
          type: "output",
          isArray: false,
        });
        fetchCommands();
      } else {
        const error = await res.json();
        setMessage(`✗ Failed: ${error.details || error.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to create");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cmdId) => {
    if (!confirm("Delete this command?")) return;

    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/admin/commands?password=${password}&id=${cmdId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setMessage("✓ Command deleted");
        fetchCommands();
      } else {
        const error = await res.json();
        setMessage(`✗ Failed: ${error.details || error.error}`);
      }
    } catch (error) {
      setMessage("✗ Failed to delete");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[95vw] sm:w-96 max-h-[85vh] bg-black border border-white/20 rounded-lg shadow-2xl flex flex-col font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-bold text-white">admin@enigma</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/60 hover:text-white transition-colors text-lg"
          disabled={isSaving}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 text-xs">
        {!isAuthenticated ? (
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              placeholder="password..."
              className="w-full bg-white/5 text-white px-3 py-2 rounded border border-white/20 focus:outline-none focus:border-white/40 placeholder:text-white/30"
              autoFocus
            />
            <button
              onClick={handleAuth}
              className="w-full bg-white text-black px-3 py-2 rounded hover:bg-white/90 transition-colors font-medium"
            >
              authenticate
            </button>
            {message && <p className="text-white/60 text-center">{message}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleClearCache}
                disabled={isSaving}
                className="bg-white text-black px-3 py-2 rounded hover:bg-white/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "clearing..." : "clear cache"}
              </button>
              <button
                onClick={handleAddNew}
                disabled={isSaving || isAdding}
                className="bg-white/10 text-white px-3 py-2 rounded hover:bg-white/20 transition-colors border border-white/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + new
              </button>
            </div>

            {message && (
              <p className="text-white/60 bg-white/5 p-2 rounded border border-white/10 break-words">
                {message}
              </p>
            )}

            {/* Add New Command Form */}
            {isAdding && (
              <div className="space-y-2 p-3 bg-white/5 rounded border border-white/20">
                <p className="text-white/80 font-bold mb-2">New Command</p>
                <input
                  type="text"
                  value={editForm.command}
                  onChange={(e) =>
                    setEditForm({ ...editForm, command: e.target.value })
                  }
                  placeholder="command name..."
                  disabled={isSaving}
                  className="w-full bg-white/5 text-white px-2 py-1.5 rounded border border-white/20 focus:outline-none focus:border-white/40 placeholder:text-white/30 disabled:opacity-50"
                />
                <textarea
                  value={editForm.output}
                  onChange={(e) =>
                    setEditForm({ ...editForm, output: e.target.value })
                  }
                  placeholder="output..."
                  disabled={isSaving}
                  className="w-full bg-white/5 text-white px-2 py-1.5 rounded border border-white/20 focus:outline-none focus:border-white/40 placeholder:text-white/30 min-h-[60px] resize-none disabled:opacity-50"
                />
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    value={editForm.type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, type: e.target.value })
                    }
                    disabled={isSaving}
                    className="bg-white/5 text-white px-2 py-1 rounded border border-white/20 text-xs disabled:opacity-50"
                  >
                    <option value="output">output</option>
                    <option value="hacktober">hacktober</option>
                    <option value="clear">clear</option>
                  </select>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editForm.isArray}
                      onChange={(e) =>
                        setEditForm({ ...editForm, isArray: e.target.checked })
                      }
                      disabled={isSaving}
                      className="rounded disabled:opacity-50"
                    />
                    <span className="text-white/70">array</span>
                  </label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCreateNew}
                    disabled={isSaving}
                    className="flex-1 bg-white text-black px-3 py-1.5 rounded hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "creating..." : "create"}
                  </button>
                  <button
                    onClick={() => setIsAdding(false)}
                    disabled={isSaving}
                    className="flex-1 bg-white/10 text-white px-3 py-1.5 rounded hover:bg-white/20 transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    cancel
                  </button>
                </div>
              </div>
            )}

            {/* Commands List */}
            <div className="space-y-2">
              <h4 className="text-white/80 font-bold">
                commands ({commands.length})
              </h4>

              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {commands.map((cmd) => (
                  <div
                    key={cmd.id}
                    className={`p-2.5 rounded border transition-all ${
                      cmd.isActive
                        ? "bg-white/5 border-white/20"
                        : "bg-white/[0.02] border-white/10 opacity-50"
                    }`}
                  >
                    {editingCommand === cmd.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.command}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              command: e.target.value,
                            })
                          }
                          disabled={isSaving}
                          className="w-full bg-white/5 text-white px-2 py-1.5 rounded border border-white/20 focus:outline-none focus:border-white/40 disabled:opacity-50"
                        />
                        <textarea
                          value={editForm.output}
                          onChange={(e) =>
                            setEditForm({ ...editForm, output: e.target.value })
                          }
                          disabled={isSaving}
                          className="w-full bg-white/5 text-white px-2 py-1.5 rounded border border-white/20 focus:outline-none focus:border-white/40 min-h-[60px] resize-none disabled:opacity-50"
                        />
                        <div className="flex gap-2 items-center flex-wrap">
                          <select
                            value={editForm.type}
                            onChange={(e) =>
                              setEditForm({ ...editForm, type: e.target.value })
                            }
                            disabled={isSaving}
                            className="bg-white/5 text-white px-2 py-1 rounded border border-white/20 disabled:opacity-50"
                          >
                            <option value="output">output</option>
                            <option value="hacktober">hacktober</option>
                            <option value="clear">clear</option>
                          </select>
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={editForm.isArray}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  isArray: e.target.checked,
                                })
                              }
                              disabled={isSaving}
                              className="rounded disabled:opacity-50"
                            />
                            <span className="text-white/70">array</span>
                          </label>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleSaveEdit(cmd.id)}
                            disabled={isSaving}
                            className="flex-1 bg-white text-black px-2 py-1.5 rounded hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? "saving..." : "save"}
                          </button>
                          <button
                            onClick={() => setEditingCommand(null)}
                            disabled={isSaving}
                            className="flex-1 bg-white/10 text-white px-2 py-1.5 rounded hover:bg-white/20 transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-bold text-white break-all">
                            {cmd.command}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleEdit(cmd)}
                              disabled={isSaving}
                              className="text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDelete(cmd.id)}
                              disabled={isSaving}
                              className="text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              ✕
                            </button>
                            <button
                              onClick={() => handleToggleActive(cmd)}
                              disabled={isSaving}
                              className={`px-1.5 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                cmd.isActive
                                  ? "bg-white text-black"
                                  : "bg-white/10 text-white/60 border border-white/20"
                              }`}
                            >
                              {cmd.isActive ? "on" : "off"}
                            </button>
                          </div>
                        </div>
                        <p className="text-white/50 text-[10px] truncate mb-1.5">
                          {cmd.isArray
                            ? "array output"
                            : cmd.output.slice(0, 80)}
                          {!cmd.isArray && cmd.output.length > 80 && "..."}
                        </p>
                        <div className="flex gap-1.5">
                          <span className="text-[9px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                            {cmd.type}
                          </span>
                          {cmd.isArray && (
                            <span className="text-[9px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                              array
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
