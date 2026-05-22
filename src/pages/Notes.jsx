import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, FileText, Network, RefreshCw, ChevronRight,
  Trash2, Eye, EyeOff, ArrowLeft, Loader2, StickyNote,
} from "lucide-react";
import MindmapViewer from "../components/mindmap/MindmapViewer.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function Notes() {
  const { user, token, apiBase } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState({});

  const selected = notes.find((n) => n.note_id === selectedId) || null;

  const fetchNotes = async () => {
    if (!user || !token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/notes/list`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load notes");
      const list = Array.isArray(data?.notes) ? data.notes : [];
      list.sort((a) => (a.type === "mindmap" ? -1 : 1));
      setNotes(list);
    } catch (e) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const courseBuckets = useMemo(() => {
    const map = new Map();
    for (const n of notes) {
      const k = (n.courseTitle || "General").toString().trim() || "General";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(n);
    }
    const entries = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "General") return 1;
      if (b[0] === "General") return -1;
      return a[0].localeCompare(b[0]);
    });
    return entries.map(([courseTitle, list]) => ({
      courseTitle,
      notes: list,
      count: list.length,
      mindmapCount: list.filter((n) => n.type === "mindmap").length,
      updatedAt: list[0]?.updatedAt || list[0]?.createdAt || null,
    }));
  }, [notes]);

  const visibleNotes = useMemo(() => {
    const ct = (selectedCourse || "").toString();
    if (!ct) return [];
    return notes.filter((n) => ((n.courseTitle || "General").toString().trim() || "General") === ct);
  }, [notes, selectedCourse]);

  const togglePreview = (note_id) => {
    setSelectedId((prev) => (prev === note_id ? null : note_id));
  };

  const deleteNote = async (note_id) => {
    if (!user || !token) return;
    if (!confirm("Delete this note?")) return;
    setDeleting((p) => ({ ...p, [note_id]: true }));
    try {
      const res = await fetch(`${apiBase}/notes/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note_id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete");
      setSelectedId((prev) => (prev === note_id ? null : prev));
      await fetchNotes();
    } catch (e) {
      alert(e?.message || "Delete failed");
    } finally {
      setDeleting((p) => { const n = { ...p }; delete n[note_id]; return n; });
    }
  };

  const goBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedId(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            {selectedCourse && (
              <button
                onClick={goBackToCourses}
                className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] grid place-items-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)]">
                {selectedCourse ? selectedCourse : "My Notes"}
              </h1>
              <p className="text-sm text-[var(--muted)]">
                {selectedCourse
                  ? `${visibleNotes.length} note${visibleNotes.length !== 1 ? "s" : ""} in this course`
                  : "Mindmaps and notes saved while learning"}
              </p>
            </div>
          </div>

          <button
            onClick={fetchNotes}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-[var(--card)] border border-[var(--border)] animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm">{error}</div>
        )}

        {/* Empty */}
        {!loading && !error && notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-14 text-center"
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 grid place-items-center"
              style={{ background: "var(--accent-light)" }}>
              <StickyNote className="w-7 h-7" style={{ color: "var(--accent)" }} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No notes yet</h3>
            <p className="text-sm text-[var(--muted)] max-w-xs mx-auto">
              Notes and mindmaps are created while watching course videos. Start a course to generate them.
            </p>
            <a href="/my-courses" className="mt-5 inline-flex items-center gap-2 primary-btn">
              <BookOpen className="w-4 h-4" />
              Go to My Courses
            </a>
          </motion.div>
        )}

        {/* Course grid */}
        {!loading && !error && notes.length > 0 && !selectedCourse && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {courseBuckets.map((c) => (
              <motion.button
                key={c.courseTitle}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                onClick={() => { setSelectedCourse(c.courseTitle); setSelectedId(null); }}
                className="text-left bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-border)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,70,229,0.1)] transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
                    style={{ background: "var(--accent-light)" }}>
                    <BookOpen className="w-5 h-5" style={{ color: "var(--accent)" }} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:translate-x-0.5 group-hover:text-[var(--accent)] transition-all mt-1" />
                </div>

                <div className="font-semibold text-[var(--text)] mb-1 group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                  {c.courseTitle}
                </div>

                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {c.count} note{c.count !== 1 ? "s" : ""}
                  </span>
                  {c.mindmapCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Network className="w-3 h-3" />
                      {c.mindmapCount} mindmap{c.mindmapCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="mt-3 text-xs text-[var(--muted)] bg-[var(--surface)] rounded-xl px-3 py-2">
                  Tap to view notes and mindmaps
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Course notes view */}
        {!loading && !error && selectedCourse && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Note list */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--text)] text-sm">Notes</h3>
                <span className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2.5 py-1 rounded-full">
                  {visibleNotes.length} item{visibleNotes.length !== 1 ? "s" : ""}
                </span>
              </div>

              {visibleNotes.length === 0 && (
                <div className="text-center py-8 text-sm text-[var(--muted)]">No notes in this course.</div>
              )}

              <div className="space-y-2.5">
                <AnimatePresence>
                  {visibleNotes.map((n) => {
                    const isSelected = selectedId === n.note_id;
                    const isMindmap = n.type === "mindmap";
                    const isDeleting = !!deleting[n.note_id];

                    return (
                      <motion.div
                        key={n.note_id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`rounded-2xl border p-3.5 transition-all duration-200 ${
                          isSelected
                            ? "border-[var(--accent-border)] bg-[var(--accent-light)]"
                            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-border)]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl grid place-items-center shrink-0 mt-0.5 ${
                            isMindmap
                              ? "bg-violet-50 dark:bg-violet-900/20"
                              : "bg-blue-50 dark:bg-blue-900/20"
                          }`}>
                            {isMindmap
                              ? <Network className="w-4 h-4 text-violet-500" />
                              : <FileText className="w-4 h-4 text-blue-500" />
                            }
                          </div>

                          <button
                            onClick={() => togglePreview(n.note_id)}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="font-semibold text-sm text-[var(--text)] truncate">
                              {n.title || "Untitled"}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                isMindmap
                                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}>
                                {isMindmap ? "Mindmap" : "Note"}
                              </span>
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => togglePreview(n.note_id)}
                              className="w-8 h-8 rounded-xl border border-[var(--border)] bg-[var(--card)] grid place-items-center text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] transition-all"
                              title={isSelected ? "Close preview" : "Preview"}
                            >
                              {isSelected
                                ? <EyeOff className="w-3.5 h-3.5" />
                                : <Eye className="w-3.5 h-3.5" />
                              }
                            </button>
                            <button
                              onClick={() => deleteNote(n.note_id)}
                              disabled={isDeleting}
                              className="w-8 h-8 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-900/20 grid place-items-center transition-all disabled:opacity-50"
                              title="Delete note"
                            >
                              {isDeleting
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Preview panel */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 shadow-sm min-h-[360px]">
              <h3 className="font-semibold text-[var(--text)] text-sm mb-4">Preview</h3>
              {!selected || ((selected.courseTitle || "General").toString().trim() || "General") !== selectedCourse ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] grid place-items-center mb-3">
                    <Eye className="w-6 h-6 text-[var(--muted)]" />
                  </div>
                  <p className="text-sm text-[var(--muted)]">Select a note to preview it here</p>
                </div>
              ) : selected.type === "mindmap" ? (
                <div className="h-full min-h-[300px]">
                  <MindmapViewer tree={selected.tree} title={selected.title || "Mindmap"} />
                </div>
              ) : (
                <div className="text-sm text-[var(--muted)] italic">Unsupported note type.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
