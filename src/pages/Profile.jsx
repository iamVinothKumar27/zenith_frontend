import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Edit3, Camera, Trash2, Save, X, MapPin, Phone,
  GraduationCap, Calendar, BookOpen, Award, CheckCircle,
  Clock, Star, Building2, Layers, FileText, Loader2,
} from "lucide-react";
import Avatar from "../components/common/Avatar.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { getPreferredProfilePhoto } from "../utils/profilePhoto.js";

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

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-[var(--accent-light)] grid place-items-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-[var(--muted)] font-medium">{label}</div>
        <div className="text-sm font-semibold text-[var(--text)] mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label className="ui-label mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "learning", label: "Learning", icon: BookOpen },
];

export default function Profile() {
  const { token, profile, apiBase, refreshProfile, setProfile, user } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const snapshotRef = useRef(null);

  const [form, setForm] = useState({
    name: "", dob: "", education: "", college: "",
    degree: "", department: "", yearBatch: "", phone: "", location: "", bio: "",
  });

  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const age = useMemo(() => calcAge(form.dob), [form.dob]);
  const resolvedProfilePhoto = useMemo(() => getPreferredProfilePhoto(profile, user), [profile, user]);
  const hasUploadedPhoto = !!String(profile?.avatarFileId || profile?.photoLocalURL || "").trim();

  useEffect(() => {
    (async () => {
      if (!token) return;
      const res = await refreshProfile(token);
      const u = res?.user || profile;
      if (!u) return;
      const fallbackName = (u.email || user?.email || "").split("@")[0] || "";
      const next = {
        name: (u.name || "") || fallbackName || "",
        dob: u.dob || "",
        education: u.education || "",
        college: u.college || "",
        degree: u.degree || "",
        department: u.department || "",
        yearBatch: (u.yearBatch || u.year || ""),
        phone: u.phone || "",
        location: u.location || "",
        bio: u.bio || "",
      };
      setForm(next);
      snapshotRef.current = next;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const saveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name, dob: form.dob, education: form.education,
        college: form.college, degree: form.degree, department: form.department,
        yearBatch: form.yearBatch, phone: form.phone, location: form.location, bio: form.bio,
      };
      const res = await fetch(`${apiBase}/profile/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Save failed");
      if (j?.user) setProfile(j.user);
      snapshotRef.current = payload;
      setIsEditing(false);
      showMsg("success", "Profile saved successfully!");
    } catch (e) {
      showMsg("error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (snapshotRef.current) setForm(snapshotRef.current);
    setIsEditing(false);
    setMsg({ type: "", text: "" });
  };

  const uploadPhoto = async (file) => {
    if (!file || !token) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch(`${apiBase}/profile/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Photo upload failed");
      if (j?.user) setProfile(j.user);
      showMsg("success", "Photo updated!");
    } catch (e) {
      showMsg("error", e.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const deletePhoto = async () => {
    if (!token) return;
    setPhotoUploading(true);
    try {
      const res = await fetch(`${apiBase}/profile/photo`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      if (j?.user) setProfile(j.user);
      showMsg("success", "Photo removed.");
    } catch (e) {
      showMsg("error", e.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const displayName = form.name || profile?.name || user?.displayName || (user?.email || "").split("@")[0] || "User";

  const STAT_CARDS = [
    { icon: BookOpen, label: "Courses", value: profile?.totalCourses ?? "—", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { icon: CheckCircle, label: "Completed", value: profile?.completedCourses ?? "—", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { icon: Award, label: "Certificates", value: profile?.certificates ?? "—", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
    { icon: Star, label: "Quiz Score", value: profile?.avgScore ? `${profile.avgScore}%` : "—", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Toast notification */}
      <AnimatePresence>
        {msg.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl flex items-center gap-2 ${
              msg.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {msg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--card)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-sm mb-6"
        >
          {/* Gradient banner */}
          <div className="h-32 relative" style={{ background: "var(--grad)" }}>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 0%, transparent 60%)" }} />
          </div>

          <div className="px-6 pb-6 -mt-16 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              {/* Avatar section */}
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl border-4 border-[var(--card)] overflow-hidden bg-[var(--surface)] shadow-lg">
                    <Avatar
                      name={displayName}
                      email={profile?.email || user?.email || ""}
                      imageUrl={resolvedProfilePhoto}
                      size={96}
                      className="w-full h-full"
                    />
                  </div>
                  {isEditing && (
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-[var(--accent)] text-white grid place-items-center cursor-pointer shadow-md hover:brightness-110 transition">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        disabled={photoUploading}
                        onChange={(e) => uploadPhoto(e.target.files?.[0])}
                      />
                      {photoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    </label>
                  )}
                </div>

                <div className="mb-1">
                  <h1 className="text-xl font-bold text-[var(--text)]">{displayName}</h1>
                  <p className="text-sm text-[var(--muted)]">{profile?.email || user?.email || ""}</p>
                  {form.location && (
                    <div className="flex items-center gap-1 text-xs text-[var(--muted)] mt-1">
                      <MapPin className="w-3 h-3" />
                      {form.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 sm:mb-1">
                {isEditing ? (
                  <>
                    {hasUploadedPhoto && (
                      <button
                        onClick={deletePhoto}
                        disabled={photoUploading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Photo
                      </button>
                    )}
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm font-semibold hover:bg-[var(--card)] transition disabled:opacity-60"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={saving || photoUploading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60"
                      style={{ background: "var(--grad)" }}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { snapshotRef.current = { ...form }; setIsEditing(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm font-semibold hover:bg-[var(--surface)] transition shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {form.bio && !isEditing && (
              <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed max-w-xl">{form.bio}</p>
            )}
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 hover:border-[var(--accent-border)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl ${s.bg} grid place-items-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-xl font-bold text-[var(--text)]">{s.value}</div>
                <div className="text-xs text-[var(--muted)]">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[var(--surface)] p-1 rounded-2xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-[var(--card)] text-[var(--accent)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {isEditing ? (
                /* Edit Form */
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-lg font-bold text-[var(--text)] mb-6">Edit Profile Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <FieldGroup label="Full Name">
                        <input
                          value={form.name}
                          onChange={onChange("name")}
                          placeholder="Your full name"
                          className="ui-input mt-1.5"
                        />
                      </FieldGroup>
                    </div>

                    <FieldGroup label="Date of Birth">
                      <input
                        type="date"
                        value={form.dob}
                        onChange={onChange("dob")}
                        className="ui-input mt-1.5"
                      />
                    </FieldGroup>

                    <FieldGroup label="Age (auto-calculated)">
                      <input
                        value={age ?? ""}
                        disabled
                        placeholder="Auto"
                        className="ui-input mt-1.5 opacity-70"
                      />
                    </FieldGroup>

                    <FieldGroup label="Education Level">
                      <input
                        value={form.education}
                        onChange={onChange("education")}
                        placeholder="e.g., B.E / B.Tech / M.Tech"
                        className="ui-input mt-1.5"
                      />
                    </FieldGroup>

                    <FieldGroup label="College / School">
                      <input
                        value={form.college}
                        onChange={onChange("college")}
                        placeholder="Institute name"
                        className="ui-input mt-1.5"
                      />
                    </FieldGroup>

                    <FieldGroup label="Degree">
                      <input
                        value={form.degree}
                        onChange={onChange("degree")}
                        placeholder="e.g., Bachelor / Master"
                        className="ui-input mt-1.5"
                      />
                    </FieldGroup>

                    <FieldGroup label="Department">
                      <input
                        value={form.department}
                        onChange={onChange("department")}
                        placeholder="e.g., CSE / ECE"
                        className="ui-input mt-1.5"
                      />
                    </FieldGroup>

                    <FieldGroup label="Year / Batch">
                      <input
                        value={form.yearBatch}
                        onChange={onChange("yearBatch")}
                        placeholder="e.g., 2026"
                        className="ui-input mt-1.5"
                      />
                    </FieldGroup>

                    <FieldGroup label="Phone">
                      <input
                        value={form.phone}
                        onChange={onChange("phone")}
                        placeholder="Optional"
                        className="ui-input mt-1.5"
                      />
                    </FieldGroup>

                    <div className="sm:col-span-2">
                      <FieldGroup label="Location">
                        <input
                          value={form.location}
                          onChange={onChange("location")}
                          placeholder="City, State"
                          className="ui-input mt-1.5"
                        />
                      </FieldGroup>
                    </div>

                    <div className="sm:col-span-2">
                      <FieldGroup label="Bio">
                        <textarea
                          value={form.bio}
                          onChange={onChange("bio")}
                          placeholder="A short note about you"
                          rows={4}
                          className="ui-input mt-1.5 resize-none"
                        />
                      </FieldGroup>
                    </div>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Personal Info */}
                  <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-[var(--text)] mb-5">Personal Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InfoRow icon={User} label="Full Name" value={form.name} />
                      <InfoRow icon={Calendar} label="Date of Birth" value={form.dob ? `${form.dob}${age ? ` (${age} yrs)` : ""}` : null} />
                      <InfoRow icon={Phone} label="Phone" value={form.phone} />
                      <InfoRow icon={MapPin} label="Location" value={form.location} />
                    </div>

                    {form.bio && (
                      <div className="mt-5 pt-5 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-[var(--muted)]" />
                          <span className="text-xs text-[var(--muted)] font-medium">Bio</span>
                        </div>
                        <p className="text-sm text-[var(--text)] leading-relaxed">{form.bio}</p>
                      </div>
                    )}

                    {!form.name && !form.phone && !form.location && !form.bio && (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] grid place-items-center mx-auto mb-3">
                          <User className="w-6 h-6 text-[var(--muted)]" />
                        </div>
                        <p className="text-sm text-[var(--muted)]">No personal info added yet.</p>
                        <button
                          onClick={() => { snapshotRef.current = { ...form }; setIsEditing(true); }}
                          className="mt-3 text-sm font-semibold hover:underline"
                          style={{ color: "var(--accent)" }}
                        >
                          Add your details
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Academic Info */}
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-[var(--text)] mb-5">Academic Info</h2>
                    <div className="flex flex-col gap-4">
                      <InfoRow icon={GraduationCap} label="Education" value={form.education} />
                      <InfoRow icon={Building2} label="College" value={form.college} />
                      <InfoRow icon={Award} label="Degree" value={form.degree} />
                      <InfoRow icon={Layers} label="Department" value={form.department} />
                      <InfoRow icon={Clock} label="Year / Batch" value={form.yearBatch} />
                    </div>

                    {!form.education && !form.college && !form.degree && (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] grid place-items-center mx-auto mb-3">
                          <GraduationCap className="w-6 h-6 text-[var(--muted)]" />
                        </div>
                        <p className="text-sm text-[var(--muted)]">No academic info yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "learning" && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-base font-bold text-[var(--text)] mb-6">Learning Activity</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[
                    { icon: BookOpen, label: "Total Enrolled Courses", value: profile?.totalCourses ?? 0, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
                    { icon: CheckCircle, label: "Courses Completed", value: profile?.completedCourses ?? 0, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                    { icon: Award, label: "Certificates Earned", value: profile?.certificates ?? 0, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
                  ].map((s, i) => (
                    <div key={i} className="bg-[var(--surface)] rounded-2xl p-5 flex items-center gap-4 border border-[var(--border)]">
                      <div className={`w-12 h-12 rounded-2xl ${s.bg} grid place-items-center shrink-0`}>
                        <s.icon className={`w-6 h-6 ${s.color}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--text)]">{s.value}</div>
                        <div className="text-xs text-[var(--muted)]">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--muted)] text-center">
                    Learning data is synced from your course progress. Visit{" "}
                    <a href="/my-courses" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                      My Courses
                    </a>{" "}
                    to continue learning.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
