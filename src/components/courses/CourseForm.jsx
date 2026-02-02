import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { auth } from "../../firebase.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const CourseForm = () => {
  const { title } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    age: "",
    duration: "",
    pace: "",
    level: "",
    experience: "",
    summaryType: "",
    goal: "",
    subject: title === "Other Domains" ? "" : title,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) { alert("Please login to continue."); setLoading(false); return; }
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/generate-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok) {
        // ✅ Stable course key (DB key). For "Other Domains", use the subject.
        const courseKey = (title === "Other Domains" ? String(formData.subject || "").trim() : String(title)).trim();
        if (!courseKey) {
          alert("Please enter a valid subject.");
          setLoading(false);
          return;
        }

        // ✅ Save course roadmap/videos to DB for "My Courses" resume
        try {
          await fetch("http://127.0.0.1:5000/course/state/save", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ courseTitle: courseKey, formData, roadmap: result.roadmap, videos: result.videos }),
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
        <h2 className="text-2xl font-bold text-center mb-2">Tell Us About Yourself</h2>
        <p className="text-center text-[var(--muted)] mb-6">Course: <span className="text-[var(--text)] font-semibold">{title}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
        {["age","duration","pace","level","experience","summaryType","goal"].map(field => (
          <div key={field}>
            <label className="block font-medium text-[var(--muted)] mb-1 capitalize">{field === "summaryType" ? "Preferred Summary Type" : field}</label>
            {field === "goal" ? (
              <textarea
                name={field}
                value={formData[field]}
                onChange={handleChange}
                rows="4"
                className="ui-input resize-none"
                placeholder="Enter your reason for pursuing this course"
                required
              />
            ) : field === "pace" || field === "level" ? (
              <select name={field} value={formData[field]} onChange={handleChange} className="ui-input" required>
                <option value="">Select {field}</option>
                {field === "pace" ? <>
                  <option value="fast">Fast Learner</option>
                  <option value="slow">Slow Learner</option>
                </> : <>
                  <option value="average">Average</option>
                  <option value="topper">Topper</option>
                </>}
              </select>
            ) : (
              <input
                type={field === "age" ? "number" : "text"}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="ui-input"
                placeholder={field}
                required
              />
            )}
          </div>
        ))}
        {title === "Other Domains" && (
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="ui-input"
            placeholder="Enter your subject"
            required
          />
        )}
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