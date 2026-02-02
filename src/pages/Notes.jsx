import React, { useEffect, useMemo, useState } from "react";
import MindmapViewer from "../components/mindmap/MindmapViewer.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";

/**
 * Notes page (course-wise)
 * 1) First shows list of courses that have notes
 * 2) Clicking a course shows notes inside that course with preview (tap again to close)
 */
export default function Notes() {
  const { user, token, apiBase } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null); // string | null
  const [selectedId, setSelectedId] = useState(null); // note_id | null

  const selected = notes.find((n) => n.note_id === selectedId) || null;

  const fetchNotes = async () => {
    if (!user || !token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/notes/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load notes");
      const list = Array.isArray(data?.notes) ? data.notes : [];
      // Mindmaps first
      list.sort((a, b) => (a.type === "mindmap" ? -1 : 1));
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

  // Course buckets
  const courseBuckets = useMemo(() => {
    const map = new Map(); // courseTitle -> notes[]
    for (const n of notes) {
      const k = (n.courseTitle || "General").toString().trim() || "General";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(n);
    }
    // Sort courses alphabetically; keep General last
    const entries = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "General") return 1;
      if (b[0] === "General") return -1;
      return a[0].localeCompare(b[0]);
    });
    return entries.map(([courseTitle, list]) => ({
      courseTitle,
      notes: list,
      count: list.length,
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
    try {
      const res = await fetch(`${apiBase}/notes/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note_id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete");
      // If we deleted the selected one, close preview
      setSelectedId((prev) => (prev === note_id ? null : prev));
      await fetchNotes();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  const goBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedId(null);
  };

  return (
    <div className="container">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notes</h1>
          {selectedCourse ? (
            <>
              <span className="text-[var(--muted)]">/</span>
              <button
                onClick={goBackToCourses}
                className="text-sm px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:brightness-95"
                title="Back to courses"
              >
                Courses
              </button>
              <span className="text-[var(--muted)]">/</span>
              <div className="font-semibold">{selectedCourse}</div>
            </>
          ) : null}
        </div>

        <button
          onClick={fetchNotes}
          className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:brightness-95"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 text-[var(--muted)]">Loading…</div>
      ) : error ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 text-red-600">{error}</div>
      ) : notes.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 text-[var(--muted)]">No notes yet.</div>
      ) : !selectedCourse ? (
        // ---- COURSE LIST VIEW ----
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courseBuckets.map((c) => (
            <button
              key={c.courseTitle}
              onClick={() => {
                setSelectedCourse(c.courseTitle);
                setSelectedId(null);
              }}
              className="text-left bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 hover:brightness-95 transition"
              title="Open course notes"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.courseTitle}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">{c.count} note{c.count === 1 ? "" : "s"}</div>
                </div>
                <div className="text-sm text-[var(--muted)]">›</div>
              </div>
              <div className="mt-3 text-xs text-[var(--muted)]">
                Tip: Mindmaps saved from videos appear here.
              </div>
            </button>
          ))}
        </div>
      ) : (
        // ---- COURSE NOTES VIEW ----
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-sm text-[var(--muted)]">
                Tap a note to preview. Tap again to close.
              </div>
              <button
                onClick={goBackToCourses}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:brightness-95 text-sm"
              >
                Back
              </button>
            </div>

            <div className="space-y-3">
              {visibleNotes.map((n) => (
                <div
                  key={n.note_id}
                  className={`rounded-xl border border-[var(--border)] p-3 transition ${
                    selectedId === n.note_id ? "bg-[var(--surface)]" : "bg-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => togglePreview(n.note_id)} className="text-left flex-1" title="Preview">
                      <div className="font-semibold">{n.title || "Untitled"}</div>
                      <div className="text-xs text-[var(--muted)] mt-1">
                        {n.type || "note"}
                        {n.video_url ? " • Video" : ""}
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePreview(n.note_id)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:brightness-95 text-sm"
                      >
                        {selectedId === n.note_id ? "Close" : "Preview"}
                      </button>
                      <button
                        onClick={() => deleteNote(n.note_id)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:brightness-95 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 min-h-[260px]">
            {!selected || ((selected.courseTitle || "General").toString().trim() || "General") !== selectedCourse ? (
              <div className="text-[var(--muted)]">Select a note to preview.</div>
            ) : selected.type === "mindmap" ? (
              <MindmapViewer tree={selected.tree} title={selected.title || "Mindmap"} />
            ) : (
              <div className="text-[var(--muted)]">Unsupported note type.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
