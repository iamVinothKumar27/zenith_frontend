import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../../firebase.js";
import { useAuth } from "../../auth/AuthProvider.jsx";

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


function calcAge(dobStr) {
  if (!dobStr) return null;
  const d = new Date(dobStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age < 0 ? null : age;
}

const CourseForm = () => {
  const { title } = useParams();
  const navigate = useNavigate();
  const { token, profile, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    duration: "",
    pace: "",
    experience: "",
    summaryType: "",
    goal: "",
    level: "",
    subject: title === "Other Domains" ? "" : title,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ensure we have profile details (dob) loaded after auth
    if (token && !profile?.dob) {
      refreshProfile(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const computedAge = useMemo(() => calcAge(profile?.dob), [profile?.dob]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please login to continue.");
        setLoading(false);
        return;
      }

      // Require DOB in profile (age will be computed from DOB)
      if (!profile?.dob || computedAge === null) {
        alert("Please complete your profile (Date of Birth) before generating a course roadmap.");
        navigate("/profile");
        setLoading(false);
        return;
      }

      const t = token || (await user.getIdToken());

      // ✅ Stable course key (DB key). For "Other Domains", use the subject.
      const courseKey = (
        title === "Other Domains" ? String(formData.subject || "").trim() : String(title)
      ).trim();

      if (!courseKey) {
        alert("Please enter a valid subject.");
        setLoading(false);
        return;
      }

      // Send age to backend (but do NOT ask user)
      const payload = { ...formData, age: computedAge, subject: courseKey };

      const res = await fetchWithFallback(`/generate-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        // ✅ Save course roadmap/videos to DB for "My Courses" resume
        try {
          await fetchWithFallback(`/course/state/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
            body: JSON.stringify({
              courseTitle: courseKey,
              formData: payload,
              roadmap: result.roadmap,
              videos: result.videos,
            }),
          });
        } catch {}

        navigate(`/course/${encodeURIComponent(courseKey)}/videos`, {
          state: { roadmap: result.roadmap, videos: result.videos, title: courseKey, courseKey },
        });
      } else {
        alert(result.error || "Failed to generate roadmap");
      }
    } catch (err) {
      alert("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl ui-card p-8 text-[var(--text)]">
        <h2 className="text-2xl font-bold text-center mb-2">Tell Us About Your Course Preference</h2>
        <p className="text-center text-[var(--muted)] mb-6">
          Course: <span className="text-[var(--text)] font-semibold">{title}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {title === "Other Domains" && (
            <div>
              <label className="block font-medium text-[var(--muted)] mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="ui-input"
                placeholder="Enter your subject"
                required
              />
            </div>
          )}

          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Duration</label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="ui-input"
              placeholder="e.g., 4 weeks / 2 months"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Pace</label>
            <select
              name="pace"
              value={formData.pace}
              onChange={handleChange}
              className="ui-input"
              required
            >
              <option value="">Select pace</option>
              <option value="fast">Fast</option>
              <option value="moderate">Moderate</option>
              <option value="slow">Slow</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Experience</label>
            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="ui-input"
              required
            >
              <option value="">Select experience</option>
              <option value="none">None</option>
              <option value="some">Some</option>
              <option value="strong">Strong</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Level</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="ui-input"
              required
            >
              <option value="">Select level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Summary Type</label>
            <select
              name="summaryType"
              value={formData.summaryType}
              onChange={handleChange}
              className="ui-input"
              required
            >
              <option value="">Select summary type</option>
              <option value="paragraph">Paragraph</option>
              <option value="bulletins">Bulletins</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[var(--muted)] mb-1">Goal</label>
            <textarea
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              rows="4"
              className="ui-input resize-none"
              placeholder="What is your goal in learning this?"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 text-white py-3 font-semibold hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {loading ? "Generating..." : "Generate Roadmap"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
