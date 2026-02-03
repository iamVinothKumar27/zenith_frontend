import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider.jsx";

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

export default function Profile() {
  const { token, profile, apiBase, refreshProfile, setProfile, user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const snapshotRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    dob: "",
    education: "",
    college: "",
    degree: "",
    department: "",
    yearBatch: "",
    phone: "",
    location: "",
    bio: "",
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  const age = useMemo(() => calcAge(form.dob), [form.dob]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const res = await refreshProfile(token);
      const u = res?.user || profile;
      if (!u) return;
      const fallbackName = (u.email || user?.email || "").split("@")[0] || (u.email || user?.email || "");
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

  const avatarUrl = profile?.photoLocalURL || profile?.photoURL || "";

  const onChange = (k) => (e) => {
    setForm((s) => ({ ...s, [k]: e.target.value }));
  };

  const saveProfile = async () => {
    if (!token) return;
    setSaving(true);
    setMsg("");
    try {
      const payload = {
        name: form.name,
        dob: form.dob,
        education: form.education,
        college: form.college,
        degree: form.degree,
        department: form.department,
        yearBatch: form.yearBatch,
        phone: form.phone,
        location: form.location,
        bio: form.bio,
      };

      const res = await fetch(`${apiBase}/profile/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Save failed");
      if (j?.user) setProfile(j.user);
      snapshotRef.current = payload;
      setIsEditing(false);
      setMsg("✅ Profile saved");
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    snapshotRef.current = { ...form };
    setMsg("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setMsg("");
    if (snapshotRef.current) setForm(snapshotRef.current);
    setIsEditing(false);
  };

  const uploadPhoto = async (file) => {
    if (!file || !token) return;
    setMsg("");
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch(`${apiBase}/profile/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Photo upload failed");
      if (j?.user) setProfile(j.user);
      setMsg("✅ Photo updated");
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setPhotoUploading(false);
    }
  };

  const deletePhoto = async () => {
    if (!token) return;
    setMsg("");
    setPhotoUploading(true);
    try {
      const res = await fetch(`${apiBase}/profile/photo`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      if (j?.user) setProfile(j.user);
      setMsg("✅ Photo removed");
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setPhotoUploading(false);
    }
  };

  const disabled = !isEditing;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold">Your Profile</h1>
              {age !== null && (
                <div className="mt-1 text-xs text-[var(--muted)]">
                  Age: <span className="font-semibold text-[var(--text)]">{age}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isEditing ? (
                <button
                  onClick={startEdit}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm font-semibold hover:opacity-90"
                >
                  ✏️ Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={cancelEdit}
                    disabled={saving || photoUploading}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={saving || photoUploading}
                    className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--bg)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-[var(--muted)]">No Photo</div>
                )}
              </div>

              {isEditing && (
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      disabled={photoUploading}
                      onChange={(e) => uploadPhoto(e.target.files?.[0])}
                    />
                    <div className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm font-semibold hover:opacity-90">
                      {photoUploading ? "Working…" : "Upload"}
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={deletePhoto}
                    disabled={photoUploading || !avatarUrl}
                    className="px-3 py-2 rounded-xl border border-red-300 text-red-700 bg-[var(--bg)] text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div className="text-sm text-[var(--muted)]">{msg}</div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold">Full Name</label>
              <input
                value={form.name}
                onChange={onChange("name")}
                placeholder="Your full name"
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none disabled:opacity-70"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={onChange("dob")}
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none disabled:opacity-70"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Age</label>
              <input
                value={age ?? ""}
                disabled
                placeholder="Auto"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none opacity-80"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Education</label>
              <input
                value={form.education}
                onChange={onChange("education")}
                placeholder="e.g., B.E / B.Tech / M.Tech"
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none disabled:opacity-70"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">College / School</label>
              <input
                value={form.college}
                onChange={onChange("college")}
                placeholder="Enter your institute name"
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none disabled:opacity-70"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Degree</label>
              <input
                value={form.degree}
                onChange={onChange("degree")}
                placeholder="e.g., Bachelor / Master"
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none disabled:opacity-70"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Department</label>
              <input
                value={form.department}
                onChange={onChange("department")}
                placeholder="e.g., CSE / ECE"
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none disabled:opacity-70"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Year / Batch</label>
              <input
                value={form.yearBatch}
                onChange={onChange("yearBatch")}
                placeholder="e.g., 2026"
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none disabled:opacity-70"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Phone</label>
              <input
                value={form.phone}
                onChange={onChange("phone")}
                placeholder="Optional"
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none disabled:opacity-70"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold">Location</label>
              <input
                value={form.location}
                onChange={onChange("location")}
                placeholder="City, State"
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none disabled:opacity-70"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold">Bio</label>
              <textarea
                value={form.bio}
                onChange={onChange("bio")}
                placeholder="A short note about you"
                rows={4}
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none disabled:opacity-70"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
