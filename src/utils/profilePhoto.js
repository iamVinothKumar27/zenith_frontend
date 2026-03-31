function isValidUrlCandidate(value = "") {
  const s = String(value || "").trim();
  if (!s) return false;
  const lowered = s.toLowerCase();
  return !["null", "undefined", "none", "nan"].includes(lowered);
}

export function sanitizeUrl(value = "") {
  return isValidUrlCandidate(value) ? String(value).trim() : "";
}

function hasAppProfilePhoto(profile = {}) {
  return Boolean(
    sanitizeUrl(profile?.avatarFileId) ||
    sanitizeUrl(profile?.photoLocalURL)
  );
}

export function getPreferredProfilePhoto(profile = {}, user = {}) {
  const authPhoto = sanitizeUrl(profile?.authPhotoURL) || sanitizeUrl(user?.photoURL) || sanitizeUrl(user?.providerData?.[0]?.photoURL);
  const appPhoto = sanitizeUrl(profile?.photoLocalURL) || sanitizeUrl(profile?.avatarFileId);
  const profilePhoto = sanitizeUrl(profile?.photoURL);

  // Priority:
  // 1) photo uploaded/managed inside app
  // 2) Gmail / Firebase auth photo
  // 3) other stored profile photo URL
  if (hasAppProfilePhoto(profile)) {
    return appPhoto || authPhoto || profilePhoto;
  }

  return authPhoto || profilePhoto || appPhoto;
}

export function getProfilePhotoCandidates(profile = {}, user = {}) {
  const authPhoto = sanitizeUrl(profile?.authPhotoURL) || sanitizeUrl(user?.photoURL) || sanitizeUrl(user?.providerData?.[0]?.photoURL);
  const appPhoto = sanitizeUrl(profile?.photoLocalURL) || sanitizeUrl(profile?.avatarFileId);
  const profilePhoto = sanitizeUrl(profile?.photoURL);

  const ordered = hasAppProfilePhoto(profile)
    ? [appPhoto, authPhoto, profilePhoto]
    : [authPhoto, profilePhoto, appPhoto];

  return ordered
    .map((v) => sanitizeUrl(v))
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}
