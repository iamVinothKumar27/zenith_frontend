function isValidUrlCandidate(value = "") {
  const s = String(value || "").trim();
  if (!s) return false;
  const lowered = s.toLowerCase();
  return !["null", "undefined", "none", "nan"].includes(lowered);
}

const GENERATED_AVATAR_PATTERNS = [
  "api.dicebear.com",
  "ui-avatars.com",
  "gravatar.com/avatar",
  "avatars.dicebear.com",
  "source.boringavatars.com",
];

function isGeneratedAvatarUrl(value = "") {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return false;
  return GENERATED_AVATAR_PATTERNS.some((pattern) => s.includes(pattern));
}

export function sanitizeUrl(value = "") {
  return isValidUrlCandidate(value) ? String(value).trim() : "";
}

function sanitizeRealPhotoUrl(value = "") {
  const cleaned = sanitizeUrl(value);
  if (!cleaned) return "";
  return isGeneratedAvatarUrl(cleaned) ? "" : cleaned;
}

function hasAppProfilePhoto(profile = {}) {
  return Boolean(
    sanitizeRealPhotoUrl(profile?.avatarFileId) ||
    sanitizeRealPhotoUrl(profile?.photoLocalURL)
  );
}

export function getPreferredProfilePhoto(profile = {}, user = {}) {
  const authPhoto =
    sanitizeRealPhotoUrl(profile?.authPhotoURL) ||
    sanitizeRealPhotoUrl(user?.photoURL) ||
    sanitizeRealPhotoUrl(user?.providerData?.[0]?.photoURL);

  const appPhoto =
    sanitizeRealPhotoUrl(profile?.photoLocalURL) ||
    sanitizeRealPhotoUrl(profile?.avatarFileId);

  const profilePhoto = sanitizeRealPhotoUrl(profile?.photoURL);

  // Priority:
  // 1) photo uploaded/managed inside app
  // 2) Gmail / Firebase auth photoURL
  // 3) any other real stored profile photo URL
  if (hasAppProfilePhoto(profile)) {
    return appPhoto || authPhoto || profilePhoto;
  }

  return authPhoto || profilePhoto || appPhoto;
}

export function getProfilePhotoCandidates(profile = {}, user = {}) {
  const authPhoto =
    sanitizeRealPhotoUrl(profile?.authPhotoURL) ||
    sanitizeRealPhotoUrl(user?.photoURL) ||
    sanitizeRealPhotoUrl(user?.providerData?.[0]?.photoURL);

  const appPhoto =
    sanitizeRealPhotoUrl(profile?.photoLocalURL) ||
    sanitizeRealPhotoUrl(profile?.avatarFileId);

  const profilePhoto = sanitizeRealPhotoUrl(profile?.photoURL);

  const ordered = hasAppProfilePhoto(profile)
    ? [appPhoto, authPhoto, profilePhoto]
    : [authPhoto, profilePhoto, appPhoto];

  return ordered
    .map((v) => sanitizeUrl(v))
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}
