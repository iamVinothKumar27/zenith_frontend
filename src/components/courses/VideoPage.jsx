// VideoPage.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, Link, useParams } from "react-router-dom";
import { auth } from "../../firebase.js";
import { motion } from "framer-motion";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import MindmapViewer from "../mindmap/MindmapViewer.jsx";

const PASS_PERCENT = 0.4; // 40% to pass

// ✅ LOCAL CACHE KEYS
const QUIZ_CACHE_KEY = "zenith_quiz_cache_v1"; // videoUrl -> {quiz_id, questions}
const TRANSCRIPT_CACHE_KEY = "zenith_transcript_v1"; // videoUrl -> transcript
const QUIZ_COOLDOWN_MS = 15000; // 15 seconds

// ✅ Chat persistent IDs + messages (namespaced per-course)
const CHAT_ID_KEY = "zenith_chat_conversation_id_v1";
const CHAT_MESSAGES_COURSE_KEY = "zenith_chat_course_messages_v1";
const CHAT_MESSAGES_PDF_KEY = "zenith_chat_pdf_messages_v1";
const PDF_LIST_KEY = "zenith_chat_pdf_list_v1"; // per-course: [{id,name}]
const ACTIVE_PDF_KEY = "zenith_chat_active_pdf_v1"; // per-course: pdf_id

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ✅ Rich question renderer: supports fenced code blocks and inline code
const renderRichQuestion = (text) => {
  if (!text) return null;
  const raw = String(text);
  const parts = raw.split(/```/g);
  return (
    <span>
      {parts.map((p, idx) => {
        if (idx % 2 === 1) {
          return (
            <pre
              key={idx}
              className="mt-3 mb-2 p-3 rounded-xl overflow-x-auto text-xs sm:text-sm border border-white/10 bg-black/30 text-white"
            >
              <code>{p.trim()}</code>
            </pre>
          );
        }
        const lines = p.split("\n");
        return (
          <span key={idx}>
            {lines.map((line, li) => (
              <React.Fragment key={`${idx}-${li}`}>
                {line}
                {li < lines.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </span>
  );
};

const VideoPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  // ✅ Multi-backend support (comma-separated). Example:
  // VITE_API_BASES=https://server.zenithlearning.site,https://zenithserver.vinothkumarts.in
  const API_BASES = (import.meta.env.VITE_API_BASES || import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000")
    .split(",")
    .map(s => s.trim().replace(/\/$/, ""))
    .filter(Boolean);

  async function fetchWithFallback(path, options) {
    let lastErr = null;
    const p = path.startsWith("/") ? path : `/${path}`;
    for (const base of API_BASES) {
      try {
        const res = await fetch(`${base}${p}`, options);
        if (res.status < 500) return res;
        lastErr = new Error(`HTTP ${res.status}`);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("All backends failed");
  }


  // ✅ support refresh/direct URL open (/course/:title/videos or /courses/:id)
  const params = useParams();
  const routeTitleRaw = (params.title || params.id || "").toString();
  const routeCourseKey = (() => {
    try {
      return decodeURIComponent(routeTitleRaw || "");
    } catch {
      return routeTitleRaw || "";
    }
  })();

  // ✅ stable course key for DB + localStorage
  const courseKey = (location.state?.courseKey || routeCourseKey || location.state?.title || "Course").toString().trim();
  const serviceTitle = (location.state?.title || courseKey || "Course").toString().trim();
  const initialRoadmap = location.state?.roadmap || null;
  const initialVideos = location.state?.videos || null;
  const initialFormData = location.state?.formData || {
    age: "",
    duration: "",
    pace: "",
    level: "",
    experience: "",
    summaryType: "",
    goal: "",
    subject: serviceTitle === "Other Domains" ? "" : serviceTitle,
  };

  const [roadmap, setRoadmap] = useState(initialRoadmap);
  const [videos, setVideos] = useState(initialVideos);
  const [formData, setFormData] = useState(initialFormData);

  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);

  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [exitLoading, setExitLoading] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState({ 0: true });

  const [showSummary, setShowSummary] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const [mcqs, setMcqs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [requiredMark, setRequiredMark] = useState(null);

  const [transcript, setTranscript] = useState("");
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState("");

  // ✅ Mindmap (JSON tree)
  const [showMindmap, setShowMindmap] = useState(false);
  const [mindmapTree, setMindmapTree] = useState(null);
  const [loadingMindmap, setLoadingMindmap] = useState(false);
  const [mindmapError, setMindmapError] = useState("");

  // ✅ Chat
  const [chatOpen, setChatOpen] = useState(false);

  // Course + PDF message histories (kept separate internally)
  const [courseMessages, setCourseMessages] = useState([]);
  const [pdfList, setPdfList] = useState([]); // [{id,name}]
  const [activePdfId, setActivePdfId] = useState(null);
  const [pdfChats, setPdfChats] = useState({}); // pdf_id -> messages[] // { id, name }
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = useRef(null);

  // ✅ User-switchable chat mode (like ChatGPT: Normal vs PDF)
  const [chatMode, setChatMode] = useState("course"); // "course" | "pdf"

  // If we have PDFs but none selected (e.g., after refresh), auto-select the first one
  useEffect(() => {
    if (pdfList.length > 0 && !activePdfId) {
      setActivePdfId(pdfList[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfList]);

  const [doubtText, setDoubtText] = useState("");
  const [loadingDoubt, setLoadingDoubt] = useState(false);
  const chatScrollRef = useRef(null);

  // ✅ DB chat hydration guards
  const hydratedCourseChatRef = useRef(false);
  const hydratedPdfChatRef = useRef({}); // pdfId -> true

  // ✅ Resizable panels (LEFT + RIGHT)
  const [leftWidth, setLeftWidth] = useState(() => {
    const v = Number(localStorage.getItem("zenith_left_width_px_v1"));
    return Number.isFinite(v) ? v : 320;
  });
  const [rightWidth, setRightWidth] = useState(() => {
    const v = Number(localStorage.getItem("zenith_right_width_px_v1"));
    return Number.isFinite(v) ? v : 380;
  });
  const draggingRef = useRef(null);

  const [quizId, setQuizId] = useState(null);
  const [quizCompletedMap, setQuizCompletedMap] = useState({});
  const [quizSubmittedMap, setQuizSubmittedMap] = useState({});
  const [attemptsLeft, setAttemptsLeft] = useState(Infinity);
  const [quizPassedMap, setQuizPassedMap] = useState({});
  const [highestUnlockedId, setHighestUnlockedId] = useState(1);
  const [blockMsg, setBlockMsg] = useState("");

  const [quizCooldownUntil, setQuizCooldownUntil] = useState(0);

  // ✅ DB-backed resume + unlock state
  const hydratedFromDBRef = useRef(false);
  const saveDebounceRef = useRef(null);
  const mindmapAbortRef = useRef(null);

  const currentVideoKey = `${currentWeek}-${currentVideo}`;
  const isQuizSubmittedForCurrent = !!quizSubmittedMap[currentVideoKey];
  const isQuizPassedForCurrent = !!quizPassedMap[currentVideoKey];

  // If no PDF is loaded, force course mode
  useEffect(() => {
    if (!activePdfId && chatMode !== "course") setChatMode("course");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePdfId]);

  const activePdf = useMemo(() => pdfList.find((p) => p.id === activePdfId) || null, [pdfList, activePdfId]);

  const messages = chatMode === "pdf" ? (activePdfId ? (pdfChats[activePdfId] || []) : []) : courseMessages;

  const setMessages = (updater) => {
    if (chatMode !== "pdf") {
      setCourseMessages(updater);
      return;
    }
    if (!activePdfId) return;
    setPdfChats((prev) => {
      const cur = prev[activePdfId] || [];
      const next = typeof updater === "function" ? updater(cur) : updater;
      return { ...prev, [activePdfId]: next };
    });
  };

  // ---------------- Auth fetch ----------------
  const authedFetch = async (path, options = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Please login to continue.");
    const token = await user.getIdToken();
    const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
    return fetchWithFallback(path, { ...options, headers });
  };

  // ---------------- Load course state if opened from "My Courses" ----------------
  // Reset chat hydration when course changes
  useEffect(() => {
    hydratedCourseChatRef.current = false;
    hydratedPdfChatRef.current = {};
  }, [courseKey]);

  useEffect(() => {
    const ac = new AbortController();
    const loadState = async () => {
      try {
        if (videos && Array.isArray(videos) && videos.length) return;

        const res = await authedFetch(`/course/state/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ac.signal,
          body: JSON.stringify({ courseTitle: courseKey }),
        });
        const data = await res.json();
        if (res.ok && data.found && data.state) {
          setRoadmap(data.state.roadmap || null);
          setVideos(data.state.videos || null);
          setFormData(data.state.formData || initialFormData);
        }
      } catch (e) {
        console.warn("course/state/get failed:", e?.message || e);
      }
    };
    loadState();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- LS Helpers ----------------
  const readLS = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeLS = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  const getQuizCacheObj = () => readLS(QUIZ_CACHE_KEY, {});
  const setQuizCacheObj = (obj) => writeLS(QUIZ_CACHE_KEY, obj);

  const getTranscriptCache = () => readLS(TRANSCRIPT_CACHE_KEY, {});
  const setTranscriptCache = (cache) => writeLS(TRANSCRIPT_CACHE_KEY, cache);

  // ✅ chat: conversation id persistence (per course + per pdf)
  const _lsKeyCourseConvo = (ck) => `${CHAT_ID_KEY}::course::${encodeURIComponent(ck || "Course")}`;
  const _lsKeyPdfConvo = (ck, pdfId) => `${CHAT_ID_KEY}::pdf::${encodeURIComponent(ck || "Course")}::${pdfId || ""}`;
  const _lsKeyCourseMsgs = (ck) => `${CHAT_MESSAGES_COURSE_KEY}::${encodeURIComponent(ck || "Course")}`;
  const _lsKeyPdfList = (ck) => `${PDF_LIST_KEY}::${encodeURIComponent(ck || "Course")}`;
  const _lsKeyActivePdf = (ck) => `${ACTIVE_PDF_KEY}::${encodeURIComponent(ck || "Course")}`;

  const getCourseConversationId = () => {
    const k = _lsKeyCourseConvo(courseKey);
    let id = localStorage.getItem(k);
    if (!id) {
      id = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).toString();
      localStorage.setItem(k, id);
    }
    return id;
  };

  const getPdfConversationId = (pdfId) => {
    const k = _lsKeyPdfConvo(courseKey, pdfId);
    let id = localStorage.getItem(k);
    if (!id) {
      id = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).toString();
      localStorage.setItem(k, id);
    }
    return id;
  };

  // ✅ chat: small local cache per-course (DB is source of truth)
  useEffect(() => {
    const savedCourse = readLS(_lsKeyCourseMsgs(courseKey), []);
    const savedPdfList = readLS(_lsKeyPdfList(courseKey), []);
    const savedActivePdf = readLS(_lsKeyActivePdf(courseKey), null);

    if (Array.isArray(savedCourse)) setCourseMessages(savedCourse);
    if (Array.isArray(savedPdfList)) setPdfList(savedPdfList);
    if (savedActivePdf) setActivePdfId(savedActivePdf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseKey]);

  useEffect(() => writeLS(_lsKeyCourseMsgs(courseKey), courseMessages), [courseMessages, courseKey]);
  // ✅ scroll to bottom when messages change (only if open)
  useEffect(() => {
    if (!chatOpen) return;
    setTimeout(() => {
      chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [courseMessages, pdfChats, loadingDoubt, chatOpen, activePdfId]);

  // ✅ Load chat history from DB when chat opens (source of truth)
  useEffect(() => {
    if (!chatOpen) return;

    const loadCourseHistory = async () => {
      if (hydratedCourseChatRef.current) return;
      try {
        const convoId = getCourseConversationId();
        const res = await authedFetch(
          `/chat/history?courseTitle=${encodeURIComponent(courseKey)}&conversation_id=${encodeURIComponent(convoId)}`,
          { method: "GET" }
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data.history)) {
          setCourseMessages(data.history);
          hydratedCourseChatRef.current = true;
        }
      } catch (e) {
        // keep local cache if DB fails
      }
    };

    const loadPdfHistory = async () => {
      const pid = activePdfId;
      if (!pid) return;
      if (hydratedPdfChatRef.current[pid]) return;
      try {
        const convoId = getPdfConversationId(pid);
        const res = await authedFetch(
          `/pdf/chat/history?courseTitle=${encodeURIComponent(courseKey)}&pdf_id=${encodeURIComponent(pid)}&conversation_id=${encodeURIComponent(convoId)}`,
          { method: "GET" }
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data.history)) {
          setPdfChats((prev) => ({ ...prev, [pid]: data.history }));
          hydratedPdfChatRef.current[pid] = true;
        }
      } catch (e) {
        // keep local cache if DB fails
      }
    };

    // Always hydrate course chat; and hydrate PDF chat if a PDF is loaded
    loadCourseHistory();
    if (activePdfId) loadPdfHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, activePdfId, courseKey]);

  // ✅ persist widths
  useEffect(() => {
    try {
      localStorage.setItem("zenith_left_width_px_v1", String(leftWidth));
    } catch {}
  }, [leftWidth]);

  useEffect(() => {
    try {
      localStorage.setItem("zenith_right_width_px_v1", String(rightWidth));
    } catch {}
  }, [rightWidth]);

  // ✅ global mouse move/up for resizing
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const { side, startX, startW } = draggingRef.current;
      const dx = e.clientX - startX;

      const vw = window.innerWidth;
      const minLeft = 240;
      const maxLeft = clamp(vw * 0.45, 280, 520);
      const minRight = 280;
      const maxRight = clamp(vw * 0.55, 320, 640);

      if (side === "left") setLeftWidth(clamp(startW + dx, minLeft, maxLeft));
      if (side === "right") setRightWidth(clamp(startW - dx, minRight, maxRight));
    };

    const onUp = () => {
      draggingRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startDrag = (side, e) => {
    e.preventDefault();
    draggingRef.current = {
      side,
      startX: e.clientX,
      startW: side === "left" ? leftWidth : rightWidth,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // ---------------- GLOBAL ID MAP ----------------
  const globalIdMaps = useMemo(() => {
    const indexByKey = {};
    const keyByIndex = {};
    let id = 1;

    if (!videos || !Array.isArray(videos)) return { indexByKey, keyByIndex, total: 0 };

    for (let w = 0; w < videos.length; w++) {
      const weekObj = videos[w];
      const weekKey = weekObj ? Object.keys(weekObj)[0] : null;
      const weekVideos = weekKey ? weekObj[weekKey] : [];
      if (!Array.isArray(weekVideos)) continue;

      for (let v = 0; v < weekVideos.length; v++) {
        const key = `${w}-${v}`;
        indexByKey[key] = id;
        keyByIndex[id] = { weekIndex: w, videoIndex: v };
        id++;
      }
    }

    return { indexByKey, keyByIndex, total: id - 1 };
  }, [videos]);

  const getGlobalId = (weekIndex, videoIndex) => {
    const key = `${weekIndex}-${videoIndex}`;
    return globalIdMaps.indexByKey[key] || null;
  };

  const currentGlobalId = getGlobalId(currentWeek, currentVideo) || 1;

  // ✅ Resume at first unpassed quiz
  const computeResumeGlobalId = (passedMap) => {
    const pm = passedMap && typeof passedMap === "object" ? passedMap : {};
    for (let gid = 1; gid <= globalIdMaps.total; gid++) {
      const pos = globalIdMaps.keyByIndex[gid];
      if (!pos) continue;
      const k = `${pos.weekIndex}-${pos.videoIndex}`;
      if (!pm[k]) return gid;
    }
    return Math.max(1, globalIdMaps.total || 1);
  };

  // ---------------- LOAD/SAVE PROGRESS ----------------
  const getProgressLSKey = () => {
    const uid = auth.currentUser?.uid || "guest";
    const key = String(courseKey || "Course").trim() || "Course";
    return `zenith_course_progress_v2__${uid}__${key}`;
  };

  // 1) Local fallback hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getProgressLSKey());
      if (!raw) return;
      const saved = JSON.parse(raw);

      const resumeId = computeResumeGlobalId(saved.quizPassedMap || {});
      const pos = globalIdMaps.keyByIndex[resumeId] || globalIdMaps.keyByIndex[1];
      if (pos) {
        setCurrentWeek(pos.weekIndex);
        setCurrentVideo(pos.videoIndex);
      }

      setHighestUnlockedId(
        typeof saved.highestUnlockedId === "number" && saved.highestUnlockedId >= 1 ? saved.highestUnlockedId : 1
      );
      if (saved.quizPassedMap && typeof saved.quizPassedMap === "object") setQuizPassedMap(saved.quizPassedMap);
      if (saved.quizSubmittedMap && typeof saved.quizSubmittedMap === "object") setQuizSubmittedMap(saved.quizSubmittedMap);
      if (saved.quizCompletedMap && typeof saved.quizCompletedMap === "object") setQuizCompletedMap(saved.quizCompletedMap);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalIdMaps.total]);

  // 2) DB hydrate (authoritative)
  useEffect(() => {
    const hydrateFromDB = async () => {
      if (hydratedFromDBRef.current) return;
      if (!videos || !Array.isArray(videos) || globalIdMaps.total <= 0) return;

      try {
        const res = await authedFetch(`/course/progress/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseTitle: courseKey }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load course progress");
        if (!data?.found || !data?.progress) {
          hydratedFromDBRef.current = true;
          return;
        }

        const p = data.progress;
        const nextHighest = Math.max(1, Number(p.highestUnlockedId || 1));
        const resumeId = computeResumeGlobalId(p.quizPassedMap || {});
        const pos = globalIdMaps.keyByIndex[resumeId] || globalIdMaps.keyByIndex[1];

        setHighestUnlockedId(nextHighest);
        setQuizPassedMap(p.quizPassedMap || {});
        setQuizSubmittedMap(p.quizSubmittedMap || {});
        setQuizCompletedMap(p.quizCompletedMap || {});
        if (pos) {
          setCurrentWeek(pos.weekIndex);
          setCurrentVideo(pos.videoIndex);
        }

        hydratedFromDBRef.current = true;
      } catch (e) {
        console.warn("course/progress/get failed:", e?.message || e);
        hydratedFromDBRef.current = true;
      }
    };

    hydrateFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, globalIdMaps.total]);

  // ✅ Save progress immediately (used after quiz submit so exiting won't lose updates)
  const persistProgressNow = async (overrides = {}) => {
    try {
      const next = {
        highestUnlockedId,
        quizPassedMap,
        quizSubmittedMap,
        quizCompletedMap,
        ...overrides,
      };

      const resumeId = computeResumeGlobalId(next.quizPassedMap);
      const payload = {
        currentGlobalId: resumeId,
        highestUnlockedId: next.highestUnlockedId,
        quizPassedMap: next.quizPassedMap,
        quizSubmittedMap: next.quizSubmittedMap,
        quizCompletedMap: next.quizCompletedMap,
      };

      try {
        localStorage.setItem(getProgressLSKey(), JSON.stringify(payload));
      } catch {}

      await authedFetch(`/course/progress/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseTitle: courseKey, progress: payload }),
      });
    } catch (e) {
      console.warn("persistProgressNow failed:", e?.message || e);
    }
  };

  // 3) Persist debounced
  useEffect(() => {
    let resumeId = 1;
    try {
      resumeId = computeResumeGlobalId(quizPassedMap);
      const payload = {
        currentGlobalId: resumeId,
        highestUnlockedId,
        quizPassedMap,
        quizSubmittedMap,
        quizCompletedMap,
      };
      localStorage.setItem(getProgressLSKey(), JSON.stringify(payload));
    } catch {}

    if (!hydratedFromDBRef.current) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);

    saveDebounceRef.current = setTimeout(async () => {
      try {
        await authedFetch(`/course/progress/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseTitle: courseKey,
            progress: {
              currentGlobalId: resumeId,
              highestUnlockedId,
              quizPassedMap,
              quizSubmittedMap,
              quizCompletedMap,
            },
          }),
        });
      } catch (e) {
        console.warn("course/progress/save failed:", e?.message || e);
      }
    }, 800);

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGlobalId, highestUnlockedId, quizPassedMap, quizSubmittedMap, quizCompletedMap, courseKey]);

  // ---------------- BLOCK MSG AUTO HIDE ----------------
  useEffect(() => {
    if (!blockMsg) return;
    const t = setTimeout(() => setBlockMsg(""), 2500);
    return () => clearTimeout(t);
  }, [blockMsg]);

  const isVideoUnlocked = (weekIndex, videoIndex) => {
    const gid = getGlobalId(weekIndex, videoIndex);
    if (!gid) return false;
    return gid <= highestUnlockedId;
  };

  const getBlockReasonFor = (weekIndex, videoIndex) => {
    const gid = getGlobalId(weekIndex, videoIndex);
    if (!gid) return "Invalid video";
    if (gid <= highestUnlockedId) return "";
    return `Complete quiz for Video ID ${gid - 1} (pass (>=40%)) to unlock Video ID ${gid}.`;
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: selectedOption }));
  };

  const toggleWeek = (weekIndex) => {
    setExpandedWeeks((prev) => ({ ...prev, [weekIndex]: !prev[weekIndex] }));
  };

  const selectVideo = (weekIndex, videoIndex) => {
    if (!isVideoUnlocked(weekIndex, videoIndex)) {
      const reason = getBlockReasonFor(weekIndex, videoIndex);
      setBlockMsg(reason || "Complete previous quiz to continue.");
      return;
    }

    setCurrentWeek(weekIndex);
    setCurrentVideo(videoIndex);

    setShowSummary(false);
    setShowQuiz(false);
    setShowTranscript(false);
    setShowMindmap(false);

    setSummary("");
    setTranscript("");
    setTranscriptError("");

    setMindmapTree(null);
    setMindmapError("");
    setLoadingMindmap(false);

    setMcqs([]);
    setAnswers({});
    setScore(null);
    setQuizId(null);
    setAttemptsLeft(Infinity);
  };

  const getCurrentVideoData = () => {
    if (!videos || !videos[currentWeek]) return null;
    const weekKey = Object.keys(videos[currentWeek])[0];
    return videos[currentWeek][weekKey][currentVideo];
  };

  const currentVideoData = getCurrentVideoData();

  // ✅ Close Mindmap when switching videos
  useEffect(() => {
    try {
      if (mindmapAbortRef.current) mindmapAbortRef.current.abort();
    } catch {}
    setShowMindmap(false);
    setMindmapTree(null);
    setMindmapError("");
    setLoadingMindmap(false);
  }, [currentWeek, currentVideo]);

  // ✅ Transcript fetch with cache
  const fetchTranscript = async (videoUrl) => {
    if (!videoUrl || videoUrl === "No video found") {
      setTranscriptError("No video URL available for transcript");
      return;
    }

    const tCache = getTranscriptCache();
    if (tCache[videoUrl]) {
      setTranscript(tCache[videoUrl]);
      setTranscriptError("");
      return;
    }

    setLoadingTranscript(true);
    setTranscriptError("");

    try {
      const res = await authedFetch(`/get-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.transcript) {
          setTranscript(data.transcript);
          setTranscriptCache({ ...tCache, [videoUrl]: data.transcript });
        } else if (data.job_id) {
          setTranscriptError("Transcript is being processed. Please try again in a moment.");
        } else {
          setTranscriptError("Transcript not available");
        }
      } else {
        setTranscriptError(data.error || "Error fetching transcript");
      }
    } catch (err) {
      console.error(err);
      setTranscriptError(err.message || "Network error. Please check your connection.");
    } finally {
      setLoadingTranscript(false);
    }
  };

  useEffect(() => {
    const cv = getCurrentVideoData();
    if (cv && cv.video !== "No video found") fetchTranscript(cv.video);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek, currentVideo, videos]);

  const handleSummarize = async () => {
    const cv = getCurrentVideoData();
    if (!cv || cv.video === "No video found") return alert("No video available");
    if (!transcript) return alert("Transcript not available yet");

    setLoadingSummary(true);
    setShowSummary(true);
    setShowQuiz(false);
    setShowTranscript(false);
    setShowMindmap(false);

    try {
      const res = await authedFetch(`/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          type: formData.summaryType || "Paragraph",
          video_url: cv.video,
        }),
      });
      const data = await res.json();
      if (res.ok) setSummary(data.summary);
      else setSummary(data.error || "Error loading summary. Please try again.");
    } catch (err) {
      console.error(err);
      setSummary(err.message || "Network error. Please check your connection.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleTranscript = () => {
    setShowTranscript(true);
    setShowSummary(false);
    setShowQuiz(false);
    setShowMindmap(false);
  };

  // NOTE: this handler is used directly in onClick.
  // React passes the click event as the first argument, so guard against that.
  const handleMindmap = async (forceOrEvent = false) => {
    const force = typeof forceOrEvent === "boolean" ? forceOrEvent : false;
    const cv = getCurrentVideoData();
    if (!cv || cv.video === "No video found") return alert("No video available");

    setShowMindmap(true);
    setShowTranscript(false);
    setShowSummary(false);
    setShowQuiz(false);
    setMindmapError("");

    if (!force && mindmapTree && mindmapTree.__videoUrl === cv.video) return;

    if (!transcript) {
      await fetchTranscript(cv.video);
    }

    setLoadingMindmap(true);
    try {
      try {
        if (mindmapAbortRef.current) mindmapAbortRef.current.abort();
      } catch {}
      const ac = new AbortController();
      mindmapAbortRef.current = ac;

      const tCache = getTranscriptCache();
      const transcriptText = transcript || tCache[cv.video] || "";

      const res = await authedFetch(`/generate-mindmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ac.signal,
        body: JSON.stringify({
          video_url: cv.video,
          transcript: transcriptText,
          title: currentVideoData?.topic || "Mindmap",
          courseTitle: courseKey,
          force,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMindmapTree(null);
        setMindmapError(data.error || "Failed to generate mindmap");
      } else {
        const tree = data.tree || null;
        if (tree && typeof tree === "object") tree.__videoUrl = cv.video;
        setMindmapTree(tree);
      }
    } catch (e) {
      setMindmapTree(null);
      setMindmapError(e?.message || "Network error");
    } finally {
      setLoadingMindmap(false);
    }
  };

  const handleSaveMindmapToNotes = async () => {
    try {
      const cv = getCurrentVideoData();
      if (!cv?.video || cv.video === "No video found") return alert("No video selected");
      if (!mindmapTree) return alert("Generate the mindmap first");

      const cleanTree = JSON.parse(JSON.stringify(mindmapTree));
      delete cleanTree.__videoUrl;

      const res = await authedFetch(`/notes/save-mindmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentVideoData?.topic || "Mindmap",
          courseTitle: courseKey,
          video_url: cv.video,
          tree: cleanTree,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save note");
      alert("Saved to Notes ✔");
    } catch (e) {
      alert(e?.message || "Save failed");
    }
  };

  const isQuizButtonDisabled = (() => {
    if (!videos || !Array.isArray(videos) || globalIdMaps.total <= 0) return true;
    if (!isVideoUnlocked(currentWeek, currentVideo)) return true;
    if (isQuizPassedForCurrent) return true;
    if (Date.now() < quizCooldownUntil) return true;
    return false;
  })();

  const quizButtonTitle = (() => {
    if (!videos || !Array.isArray(videos) || globalIdMaps.total <= 0) return "Loading course content…";
    if (!isVideoUnlocked(currentWeek, currentVideo)) return "Locked. Complete previous quiz to unlock.";
    if (isQuizPassedForCurrent) return "Quiz already passed for this video.";
    if (Date.now() < quizCooldownUntil) {
      const left = Math.ceil((quizCooldownUntil - Date.now()) / 1000);
      return `Please wait ${left}s before trying again.`;
    }
    return "";
  })();

  const handleQuiz = async () => {
    try {
      if (isQuizButtonDisabled) {
        setBlockMsg(quizButtonTitle || "Quiz is disabled for this video.");
        return;
      }

      const cv = getCurrentVideoData();
      const videoUrl = cv?.video;

      if (!videoUrl || videoUrl === "No video found") return alert("No video available");
      const qCache = getQuizCacheObj();
      const cachedQuiz = qCache[videoUrl]?.questions?.length ? qCache[videoUrl] : null;

      if (cachedQuiz) {
        setQuizId(cachedQuiz.quiz_id);
        setMcqs(cachedQuiz.questions);
        setAnswers({});
        setScore(null);
        setAttemptsLeft(Infinity);
        setShowQuiz(true);
        setShowSummary(false);
        setShowTranscript(false);
        setShowMindmap(false);
        setQuizSubmittedMap((prev) => ({ ...prev, [currentVideoKey]: false }));
      }

      setQuizCooldownUntil(Date.now() + QUIZ_COOLDOWN_MS);

      setShowQuiz(true);
      setShowSummary(false);
      setShowTranscript(false);
      setShowMindmap(false);

      const transcriptCache = getTranscriptCache();
      const transcriptToSend = transcript || transcriptCache[videoUrl] || "";

      const response = await authedFetch(`/generate-mcq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptToSend, video_url: videoUrl, courseTitle: courseKey }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to fetch quiz");

      setQuizId(data.quiz_id);
      setMcqs(data.questions || []);
      setAnswers({});
      setScore(null);
      setAttemptsLeft(Infinity);
      setQuizSubmittedMap((prev) => ({ ...prev, [currentVideoKey]: false }));

      setQuizCacheObj({
        ...qCache,
        [videoUrl]: { quiz_id: data.quiz_id, questions: data.questions || [] },
      });
    } catch (err) {
      console.error(err);
      if (!mcqs?.length) alert(err.message || "Failed to load quiz");
    }
  };

  const markCompletionInDB = async (videoUrl) => {
    try {
      await authedFetch(`/progress/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: courseKey,
          videoUrl,
          progress: { percent: 100, completed: true, quizPassed: true, current: 0 },
        }),
      });
    } catch (e) {
      console.warn("progress/upsert failed:", e?.message || e);
    }
  };

  const calculateScore = async () => {
    if (quizSubmitting) return;
    setQuizSubmitting(true);
    try {
      if (!quizId) return alert("Quiz not ready yet");
      const answersList = mcqs.map((_, idx) => answers[idx] || "");
      if (answersList.some((a) => !String(a).trim())) {
        alert("Please answer all questions before submitting.");
        return;
      }

      const res = await authedFetch(`/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quizId, answers: answersList, courseTitle: courseKey, video_no: currentGlobalId, total_videos: globalIdMaps.total }),
      });

      let data = await res.json();
      if (!res.ok) {
        if (String(data?.error || "").toLowerCase().includes("invalid quiz_id")) {
          const cv = getCurrentVideoData();
          const videoUrl = cv?.video;
          const qCache = getQuizCacheObj();
          const transcriptCache = getTranscriptCache();
          const transcriptToSend = transcript || transcriptCache[videoUrl] || "";

          const regen = await authedFetch(`/generate-mcq`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: transcriptToSend, video_url: videoUrl, courseTitle: courseKey }),
          });
          const regenData = await regen.json();
          if (regen.ok && regenData?.quiz_id) {
            setQuizId(regenData.quiz_id);
            setQuizCacheObj({
              ...qCache,
              [videoUrl]: { quiz_id: regenData.quiz_id, questions: regenData.questions || mcqs },
            });

            const retry = await authedFetch(`/submit-quiz`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quiz_id: regenData.quiz_id, answers: answersList, courseTitle: courseKey }),
            });
            data = await retry.json();
            if (!retry.ok) {
              alert(data?.error || "Submit failed");
              return;
            }
          } else {
            alert(data?.error || "Submit failed");
            return;
          }
        } else {
          alert(data?.error || "Submit failed");
          return;
        }
      }

      setScore(data.score);
      setAttemptsLeft(data.attempts_left);
      setRequiredMark(data.required ?? null);

      const nextSubmittedMap = { ...(quizSubmittedMap || {}), [currentVideoKey]: true };
      const nextCompletedMap = { ...(quizCompletedMap || {}), [currentVideoKey]: true };
      const passed = !!data.passed;

      if (passed) {
        const nextPassedMap = { ...(quizPassedMap || {}), [currentVideoKey]: true };
        const nextId = currentGlobalId + 1;
        const nextHighestUnlocked =
          nextId <= globalIdMaps.total ? Math.max(highestUnlockedId || 1, nextId) : highestUnlockedId || 1;

        setQuizSubmittedMap(nextSubmittedMap);
        setQuizCompletedMap(nextCompletedMap);
        setQuizPassedMap(nextPassedMap);
        setHighestUnlockedId(nextHighestUnlocked);

        setBlockMsg(`✅ Passed! Video ID ${currentGlobalId} completed. Unlocked Video ID ${nextId}.`);

        // ✅ Persist immediately so exit won't lose quiz state
        persistProgressNow({
          quizSubmittedMap: nextSubmittedMap,
          quizCompletedMap: nextCompletedMap,
          quizPassedMap: nextPassedMap,
          highestUnlockedId: nextHighestUnlocked,
        });

        const cv = getCurrentVideoData();
        if (cv?.video) markCompletionInDB(cv.video);
      } else {
        const nextPassedMap = { ...(quizPassedMap || {}), [currentVideoKey]: false };

        setQuizSubmittedMap(nextSubmittedMap);
        setQuizCompletedMap(nextCompletedMap);
        setQuizPassedMap(nextPassedMap);

        setBlockMsg(`❌ Not passed (need ≥40%). You can reattempt until you pass.`);

        // ✅ Persist fail state immediately too
        persistProgressNow({
          quizSubmittedMap: nextSubmittedMap,
          quizCompletedMap: nextCompletedMap,
          quizPassedMap: nextPassedMap,
        });
      }
    } catch (e) {
      console.error(e);
      alert(e.message || "Network error while submitting quiz");
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleReattempt = () => {
    setQuizSubmittedMap((prev) => ({ ...prev, [currentVideoKey]: false }));
    setAnswers({});
    setScore(null);
  };

  const getVideoEmbedUrl = (videoUrl) => {
    if (videoUrl === "No video found") return null;
    const videoId = videoUrl.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const Loader = () => (
    <div className="flex justify-center items-center py-10">
      <div className="w-12 h-12 border-4 border-[var(--accent)] border-dashed rounded-full animate-spin"></div>
    </div>
  );

  const isNextAvailableByUnlockRule = useMemo(() => {
    const nextId = currentGlobalId + 1;
    if (currentGlobalId >= globalIdMaps.total) return false;
    return nextId <= highestUnlockedId;
  }, [currentGlobalId, globalIdMaps.total, highestUnlockedId]);

  const navigateToNextVideo = () => {
    const nextId = currentGlobalId + 1;
    if (nextId > globalIdMaps.total) return;
    if (nextId > highestUnlockedId) {
      setBlockMsg(`Locked. Pass quiz for Video ID ${currentGlobalId} to unlock next.`);
      return;
    }
    const next = globalIdMaps.keyByIndex[nextId];
    if (!next) return;
    selectVideo(next.weekIndex, next.videoIndex);
  };

  const navigateToPreviousVideo = () => {
    const prevId = currentGlobalId - 1;
    if (prevId < 1) return;
    const prev = globalIdMaps.keyByIndex[prevId];
    if (!prev) return;
    selectVideo(prev.weekIndex, prev.videoIndex);
  };

  // ---------------- CHAT UI HELPERS ----------------
  const parseBlocks = (text) => {
    const blocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before.trim()) blocks.push({ type: "text", value: before });

      blocks.push({ type: "code", lang: match[1] || "text", value: match[2] });
      lastIndex = regex.lastIndex;
    }

    const after = text.slice(lastIndex);
    if (after.trim()) blocks.push({ type: "text", value: after });

    return blocks.length ? blocks : [{ type: "text", value: text }];
  };

  const copyToClipboard = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  };

  const [copiedText, setCopiedText] = useState(null);

  const buildPairs = (arr) => {
    const out = [];
    const msgs = Array.isArray(arr) ? arr : [];
    for (let i = 0; i < msgs.length; i += 2) {
      const q = msgs[i];
      const a = msgs[i + 1];
      out.push({ pairIndex: Math.floor(i / 2), q, a });
    }
    return out;
  };

  const removePdf = () => {
    if (!activePdfId) return;
    const removeId = activePdfId;

    setPdfChats((prev) => {
      const next = { ...prev };
      delete next[removeId];
      return next;
    });
    hydratedPdfChatRef.current[removeId] = false;

    setPdfList((prev) => {
      const remaining = prev.filter((p) => p.id !== removeId);
      const nextActive = remaining.length ? remaining[0].id : null;
      setActivePdfId(nextActive);
      if (!nextActive) setChatMode("course");
      return remaining;
    });
  };

  const deletePair = async (pairIndex) => {
    try {
      if (chatMode === "pdf") {
        if (!activePdfId) return;
        const convoId = getPdfConversationId(activePdfId);
        const res = await authedFetch(`/pdf/chat/history/pair`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdf_id: activePdfId,
            conversation_id: convoId,
            courseTitle: courseKey,
            pair_index: pairIndex,
          }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.history)) {
            const pid = activePdfId;
            setPdfChats((prev) => ({ ...prev, [pid]: data.history }));
          }
      } else {
        const convoId = getCourseConversationId();
        const res = await authedFetch(`/chat/history/pair`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: convoId,
            courseTitle: courseKey,
            pair_index: pairIndex,
          }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.history)) setCourseMessages(data.history);
      }
    } catch (e) {
      console.warn("deletePair failed", e);
    }
  };

  // ---------------- PDF Upload + Q&A ----------------
  const uploadPdf = async (file) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }

    setUploadingPdf(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("courseTitle", courseKey);

      const res = await authedFetch(`/pdf/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setPdfList((prev) => {
        const exists = prev.some((p) => p.id === data.pdf_id);
        if (exists) return prev;
        return [{ id: data.pdf_id, name: data.filename || file.name }, ...prev];
      });
      setActivePdfId(data.pdf_id);

      // Switch to PDF tab automatically after upload (but user can switch back anytime)
      setChatMode("pdf");

      // reset hydration for this PDF
      hydratedPdfChatRef.current[data.pdf_id] = false;

      // optional assistant message
      setPdfChats((prev) => {
        const cur = prev[data.pdf_id] || [];
        return {
          ...prev,
          [data.pdf_id]: [
            ...cur,
            { role: "assistant", content: `PDF loaded: ${data.filename || file.name}. Ask your questions now.` },
          ],
        };
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to upload PDF");
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const sendChatMessage = async () => {
    if (!doubtText.trim()) return;

    const userMsg = doubtText;
    const addUser = (setter) => setter((prev) => [...prev, { role: "user", content: userMsg }]);
    const addAssistant = (setter, content) => setter((prev) => [...prev, { role: "assistant", content }]);

    // ✅ Decide endpoint based on selected tab
    if (chatMode === "pdf") {
      if (!activePdfId) {
        alert("Please upload a PDF first.");
        return;
      }
      setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
      setDoubtText("");
      setLoadingDoubt(true);

      try {
        const convoId = getPdfConversationId(activePdfId);
        const res = await authedFetch(`/pdf/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdf_id: activePdfId,
            question: userMsg,
            conversation_id: convoId,
            courseTitle: courseKey,
          }),
        });

        const data = await res.json();
        const reply = res.ok ? data.reply : "Error: " + (data.error || "Unable to get reply");
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [...prev, { role: "assistant", content: err.message || "Network error. Please try again." }]);
      } finally {
        setLoadingDoubt(false);
      }
      return;
    }

    // Normal (course) mode
    const convoId = getCourseConversationId();
    addUser(setCourseMessages);
    setDoubtText("");
    setLoadingDoubt(true);

    try {
      const res = await authedFetch(`/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: serviceTitle,
          message: userMsg,
          conversation_id: convoId,
          courseTitle: courseKey,
        }),
      });

      const data = await res.json();
      const reply = res.ok ? data.reply : "Error: " + (data.error || "Unable to get reply");
      addAssistant(setCourseMessages, reply);
    } catch (err) {
      console.error(err);
      addAssistant(setCourseMessages, err.message || "Network error. Please try again.");
    } finally {
      setLoadingDoubt(false);
    }
  };

  const onChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loadingDoubt) sendChatMessage();
    }
  };

  return (
    <div className="h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col overflow-hidden">
      <header className="bg-[var(--card)]/90 backdrop-blur border-b border-[var(--border)] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 bg-[var(--accent)] text-white rounded-xl hover:opacity-90"
            >
              📚
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">Your Learning</h1>
            <span className="text-xs text-[var(--muted)]">
              Video ID: <b>{currentGlobalId}</b> / {globalIdMaps.total} | Unlocked up to: <b>{highestUnlockedId}</b>
            </span>
          </div>
        </div>

        <nav className="flex items-center space-x-4">
          <Link to="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
            Home
          </Link>
          <Link to="/services" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
            Services
          </Link>
          <Link to="/my-courses" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
            My Courses
          </Link>

          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:opacity-90 grid place-items-center"
            title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            aria-label="Toggle theme"
          >
            <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>

          <button
            onClick={() => {
              if (exitLoading) return;
              setExitLoading(true);
              // let spinner paint
              setTimeout(() => navigate("/"), 50);
            }}
            disabled={exitLoading}
            className="px-3 py-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {exitLoading && (
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
            )}
            {exitLoading ? "Exiting..." : "Exit"}
          </button>
        </nav>
      </header>

      {blockMsg && (
        <div className="bg-yellow-100 border-b border-yellow-200 text-yellow-900 px-4 py-2 text-sm">{blockMsg}</div>
      )}

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR (Resizable) */}
        {!sidebarCollapsed && (
          <>
            <aside
              className="bg-slate-800 text-white overflow-hidden"
              style={{ width: leftWidth, minWidth: 240, maxWidth: "45vw" }}
            >
              <div className="h-full overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">📚 Contents</h3>
                    <button onClick={() => setSidebarCollapsed(true)} className="text-gray-400 hover:text-white p-1">
                      ✕
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                    <h4 className="font-medium">{serviceTitle}</h4>
                    <p className="text-sm text-gray-300">Course</p>
                  </div>

                  <div className="space-y-2">
                    {videos &&
                      videos.map((week, weekIndex) => {
                        const weekKey = Object.keys(week)[0];
                        const weekVideos = week[weekKey];
                        const isExpanded = expandedWeeks[weekIndex];

                        return (
                          <div key={weekIndex}>
                            <button
                              onClick={() => toggleWeek(weekIndex)}
                              className="w-full flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span>{isExpanded ? "📂" : "📁"}</span>
                                <span className="font-medium">{weekKey}</span>
                              </div>
                              <span className="text-gray-400 text-sm">{weekVideos.length} videos</span>
                            </button>

                            {isExpanded && (
                              <div className="ml-4 mt-2 space-y-1">
                                {weekVideos.map((video, videoIndex) => {
                                  const gid = getGlobalId(weekIndex, videoIndex);
                                  const unlocked = isVideoUnlocked(weekIndex, videoIndex);
                                  const key = `${weekIndex}-${videoIndex}`;
                                  const passed = !!quizPassedMap[key];

                                  return (
                                    <button
                                      key={videoIndex}
                                      onClick={() => selectVideo(weekIndex, videoIndex)}
                                      className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                                        currentWeek === weekIndex && currentVideo === videoIndex
                                          ? "bg-[var(--accent)]"
                                          : unlocked
                                          ? "hover:bg-slate-600"
                                          : "opacity-50 cursor-not-allowed"
                                      }`}
                                      title={
                                        unlocked
                                          ? passed
                                            ? `Video ID ${gid} (Quiz Passed)`
                                            : `Video ID ${gid} (Unlocked)`
                                          : getBlockReasonFor(weekIndex, videoIndex)
                                      }
                                    >
                                      <span>{unlocked ? "🎥" : "🔒"}</span>
                                      <span className="truncate flex-1">{video.topic}</span>
                                      <span className="text-xs text-gray-300">
                                        #{gid} {passed ? "✅" : ""}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </aside>

            {/* LEFT RESIZE HANDLE */}
            <div
              onMouseDown={(e) => startDrag("left", e)}
              className="w-1.5 bg-[var(--border)] hover:bg-[var(--surface)] cursor-col-resize"
              title="Drag to resize"
            />
          </>
        )}

        {/* CENTER MAIN */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold mb-6">{currentVideoData?.topic}</h2>

                <div className="flex flex-col items-end">
                  <span className="text-xs text-[var(--muted)]">Status</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      isQuizPassedForCurrent ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {isQuizPassedForCurrent ? "Quiz Passed" : "Quiz Pending"}
                  </span>
                </div>
              </div>

              <div className="bg-[var(--card)] text-[var(--text)] rounded-lg border border-[var(--border)] overflow-hidden mb-6">
                {currentVideoData && currentVideoData.video !== "No video found" ? (
                  <iframe
                    width="100%"
                    height="500"
                    src={getVideoEmbedUrl(currentVideoData.video)}
                    title={currentVideoData.topic}
                    frameBorder="0"
                    allowFullScreen
                    className="w-full"
                  />
                ) : (
                  <div className="h-96 bg-[var(--surface)] flex items-center justify-center">
                    <p className="text-[var(--muted)] text-lg">No video available for this topic</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={handleSummarize}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-2)]"
                >
                  Summarize
                </button>

                <button
                  onClick={handleTranscript}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-2)]"
                >
                  Transcript
                </button>

                <button
                  onClick={() => handleMindmap(false)}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-2)]"
                >
                  Mindmap
                </button>

                <button
                  onClick={handleQuiz}
                  disabled={isQuizButtonDisabled}
                  title={quizButtonTitle}
                  className={`px-6 py-2 rounded-lg ${
                    isQuizButtonDisabled
                      ? "bg-[var(--border)] text-[var(--muted)] cursor-not-allowed"
                      : "bg-[var(--accent)] text-white hover:brightness-95"
                  }`}
                >
                  Quiz {isQuizPassedForCurrent ? "(Passed)" : ""}
                </button>
              </div>

              {showSummary && (
                <div className="bg-[var(--card)] text-[var(--text)] rounded-lg border border-[var(--border)] p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">Video Summary</h3>
                  {loadingSummary ? <Loader /> : <p className="whitespace-pre-wrap">{summary}</p>}
                </div>
              )}

              {showTranscript && (
                <div className="bg-[var(--card)] text-[var(--text)] rounded-lg border border-[var(--border)] p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">Video Transcript</h3>
                  {loadingTranscript ? (
                    <Loader />
                  ) : transcriptError ? (
                    <p className="text-red-600">{transcriptError}</p>
                  ) : (
                    <p className="whitespace-pre-wrap">{transcript}</p>
                  )}
                </div>
              )}

              {showMindmap && (
                <div className="bg-[var(--card)] text-[var(--text)] rounded-lg border border-[var(--border)] p-6 mb-6">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <h3 className="text-xl font-semibold">Mindmap</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveMindmapToNotes}
                        disabled={!mindmapTree || loadingMindmap}
                        className={`px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:brightness-95 ${
                          !mindmapTree || loadingMindmap ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Save to Notes
                      </button>
                      <button
                        onClick={() => handleMindmap(true)}
                        className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:brightness-95"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={() => setShowMindmap(false)}
                        className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:brightness-95"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {loadingMindmap ? (
                    <Loader />
                  ) : mindmapError ? (
                    <p className="text-red-600">{mindmapError}</p>
                  ) : (
                    <MindmapViewer tree={mindmapTree} title={currentVideoData?.topic || "Mindmap"} />
                  )}
                </div>
              )}

              {showQuiz && (
                <div className="bg-[var(--card)] text-[var(--text)] rounded-lg border border-[var(--border)] p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold mb-2">Quiz</h3>
                    <span className="text-xs text-[var(--muted)]">
                      Pass mark:{" "}
                      <b>{requiredMark ?? Math.max(1, Math.ceil((mcqs.length || 10) * PASS_PERCENT))}</b> /{" "}
                      {mcqs.length || 10}
                    </span>
                  </div>

                  {isQuizSubmittedForCurrent ? (
                    <div className="mt-4">
                      {score !== null ? (
                        <p
                          className={`font-semibold text-lg ${
                            requiredMark !== null
                              ? score >= requiredMark
                                ? "text-green-700"
                                : "text-red-700"
                              : score / (mcqs.length || 10) >= PASS_PERCENT
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          Score: {score}/{mcqs.length}{" "}
                          {requiredMark !== null
                            ? score >= requiredMark
                              ? "✅ PASSED"
                              : "❌ NOT PASSED"
                            : score / (mcqs.length || 10) >= PASS_PERCENT
                            ? "✅ PASSED"
                            : "❌ NOT PASSED"}
                        </p>
                      ) : (
                        <p className="text-[var(--muted)]">Score not available</p>
                      )}

                      {score !== null && requiredMark !== null && score < requiredMark ? (
                        <button
                          onClick={handleReattempt}
                          className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Reattempt Quiz
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      {mcqs.length > 0 ? (
                        <>
                          {mcqs.map((mcq, index) => (
                            <div key={index} className="mb-4">
                              <p className="font-medium mb-2">
                                {index + 1}. {renderRichQuestion(mcq.question)}
                              </p>
                              <div className="space-y-2">
                                {mcq.options.map((option, i) => (
                                  <label
                                    key={i}
                                    className="flex items-center p-2 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--surface)]"
                                  >
                                    <input
                                      type="radio"
                                      name={`q-${index}`}
                                      value={option}
                                      onChange={() => handleAnswerSelect(index, option)}
                                      className="mr-2"
                                    />
                                    {option}
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={calculateScore}
                            disabled={quizSubmitting}
                            className="mt-4 px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-2)] disabled:opacity-50 flex items-center gap-2"
                          >
                            {quizSubmitting && (
                              <span className="inline-block w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                            )}
                            {quizSubmitting ? "Submitting..." : "Submit Quiz"}
                          </button>
                        </>
                      ) : (
                        <p>Loading quiz...</p>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-between pb-10">
                <button
                  onClick={navigateToPreviousVideo}
                  disabled={currentGlobalId === 1}
                  className="px-6 py-2 border border-[var(--border)] bg-[var(--card)] rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  ← Previous
                </button>

                <button
                  onClick={navigateToNextVideo}
                  disabled={!isNextAvailableByUnlockRule}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-2)] disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT CHAT PANEL (Resizable) */}
        {chatOpen && (
          <>
            {/* RIGHT RESIZE HANDLE */}
            <div
              onMouseDown={(e) => startDrag("right", e)}
              className="w-1.5 bg-[var(--border)] hover:opacity-80 cursor-col-resize"
              title="Drag to resize"
            />

            <aside
              className="bg-[var(--card)] border-l border-[var(--border)] flex flex-col"
              style={{ width: rightWidth, minWidth: 280, maxWidth: "55vw" }}
            >
              {/* Header */}
              <div className="p-4 border-b border-[var(--border)] bg-[var(--card)] flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">Chat</h3>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChatMode("course")}
                        className={`text-xs px-3 py-1 rounded-full border border-[var(--border)] ${
                          chatMode === "course" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg)]"
                        }`}
                        title="Normal chat"
                      >
                        Normal
                      </button>
                      <button
                        onClick={() => activePdfId && setChatMode("pdf")}
                        disabled={!activePdfId}
                        className={`text-xs px-3 py-1 rounded-full border border-[var(--border)] disabled:opacity-50 ${
                          chatMode === "pdf" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg)]"
                        }`}
                        title={activePdfId ? "PDF chat" : "Upload a PDF to enable"}
                      >
                        PDF
                      </button>

                      {activePdfId && (
                        <button
                          onClick={removePdf}
                          className="text-xs px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:opacity-90"
                          title="Remove PDF"
                        >
                          Remove PDF
                        </button>
                      )}
                    </div>
                  </div>

                  {pdfList.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] text-[var(--muted)]">PDF:</span>
                      <select
                        value={activePdfId || ""}
                        onChange={(e) => {
                          const id = e.target.value || null;
                          setActivePdfId(id);
                          if (id) setChatMode("pdf");
                        }}
                        className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] max-w-[260px]"
                      >
                        {pdfList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (pdfInputRef.current) pdfInputRef.current.click();
                        }}
                        className="text-xs px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:opacity-90"
                        title="Upload another PDF"
                      >
                        + Upload
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-[var(--muted)] mt-1">
                    {chatMode === "pdf"
                      ? activePdfId
                        ? `PDF: ${activePdf?.name || "Loaded"}`
                        : "Upload a PDF to chat with it."
                      : "Ask doubts about this course"}
                  </p>
                </div>

                <button
                  onClick={() => setChatOpen(false)}
                  className="px-3 py-1 rounded-xl bg-[var(--bg)] hover:opacity-90 border border-[var(--border)]"
                  title="Close chat"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-[var(--chat-bg)]">
                {messages.length === 0 ? (
                  <p className="text-[var(--muted)] text-sm">
                    {chatMode === "pdf"
                      ? activePdfId
                        ? "Ask a question about the PDF below."
                        : "Upload a PDF to start PDF chat."
                      : "Type your question below and press Send."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {buildPairs(messages).map(({ pairIndex, q, a }) => {
                      const qText = q?.content || "";
                      const aText = a?.content || "";
                      const blocks = parseBlocks(aText);

                      return (
                        <div key={pairIndex} className="space-y-2">
                          {/* User question */}
                          <div className="flex justify-end">
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.18 }}
                              className="relative max-w-[85%] p-3 rounded-2xl whitespace-pre-wrap bg-[var(--accent)] text-white rounded-br-sm"
                            >
                              {qText}
                            </motion.div>
                          </div>

                          {/* Assistant answer + controls */}
                          <div className="flex justify-start">
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.18 }}
                              className="max-w-[85%] p-3 rounded-2xl whitespace-pre-wrap bg-[var(--card)] border border-[var(--border)] text-[var(--text)] rounded-bl-sm"
                            >
                              {/* Header row (prevents overlap with content) */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs text-[var(--muted)]">Answer</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={async () => {
                                      const ok = await copyToClipboard(aText);
                                      if (ok) {
                                        setCopiedText(`a-${pairIndex}`);
                                        setTimeout(() => setCopiedText(null), 900);
                                      }
                                    }}
                                    className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:opacity-90"
                                    title="Copy"
                                  >
                                    {copiedText === `a-${pairIndex}` ? "Copied" : "Copy"}
                                  </button>
                                  <button
                                    onClick={() => deletePair(pairIndex)}
                                    className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:opacity-90"
                                    title="Delete this Q&A"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
{blocks.map((b, i) => {
                                if (b.type === "code") {
                                  return (
                                    <div key={i} className="mt-3">
                                      <div className="flex items-center justify-between px-3 py-2 rounded-t-xl bg-[#161b22] text-[#c9d1d9]">
                                        <span className="text-xs opacity-80">{b.lang || "code"}</span>
                                        <button
                                          onClick={async () => {
                                            const ok = await copyToClipboard(b.value);
                                            if (ok) {
                                              setCopiedText(`code-${pairIndex}-${i}`);
                                              setTimeout(() => setCopiedText(null), 900);
                                            }
                                          }}
                                          className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-[#0d1117] hover:brightness-110"
                                        >
                                          {copiedText === `code-${pairIndex}-${i}` ? "Copied" : "Copy"}
                                        </button>
                                      </div>
                                      <pre className="bg-[#0d1117] text-[#c9d1d9] p-3 rounded-b-xl overflow-x-auto text-sm font-mono border border-white/10 border-t-0">
                                        <code>{b.value}</code>
                                      </pre>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={i} className="whitespace-pre-wrap">
                                    {b.value}
                                  </div>
                                );
                              })}
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}

                    {loadingDoubt && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] bg-[var(--card)] border border-[var(--border)] p-3 rounded-2xl rounded-bl-sm">
                          Thinking…
                        </div>
                      </div>
                    )}

                    <div ref={chatScrollRef} />
                  </div>
                )}
              </div>

              {/* Input (ChatGPT-like: + button + one input bar) */}
              <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]">
                <div className="flex items-end gap-2">
                  {/* + upload */}
                  <button
                    onClick={() => pdfInputRef.current?.click()}
                    className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:opacity-90 grid place-items-center text-lg"
                    title="Upload PDF"
                    disabled={uploadingPdf}
                  >
                    {uploadingPdf ? "…" : "+"}
                  </button>

                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => uploadPdf(e.target.files?.[0])}
                  />

                  {/* message input */}
                  <textarea
                    value={doubtText}
                    onChange={(e) => setDoubtText(e.target.value)}
                    onKeyDown={onChatKeyDown}
                    placeholder={
                      chatMode === "pdf" ? "Ask a question about the PDF…" : "Ask a doubt…"
                    }
                    className="flex-1 h-12 max-h-32 p-3 border border-[var(--border)] rounded-2xl resize-none bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--muted)]"
                  />

                  {/* send */}
                  <button
                    onClick={sendChatMessage}
                    className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] disabled:opacity-50 grid place-items-center"
                    disabled={loadingDoubt}
                    title="Send"
                  >
                    ➤
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-[var(--muted)]">
                    {chatMode === "pdf"
                      ? activePdfId
                        ? "Using PDF context"
                        : "Upload a PDF to enable PDF chat"
                      : `Course: ${serviceTitle}`}
                  </p>

                  <button
                    onClick={() => {
                      setDoubtText("");
                      setMessages([]);
                      setLoadingDoubt(false);
                    }}
                    className="text-xs px-3 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] hover:opacity-90"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* FLOATING CHAT ICON */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-lg hover:bg-[var(--accent-2)] flex items-center justify-center text-2xl"
          title="Chat"
        >
          💬
        </button>
      )}
    </div>
  );
};

export default VideoPage;
