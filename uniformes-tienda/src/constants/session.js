export const STORAGE_KEY = "uniformes_session";

// Vistas que NO se deben restaurar al recargar (success no se restaura)
export const RESTORABLE_VIEWS = [
  "home",
  "catalog",
  "checkout",
  "track",
  "adminLogin",
  "admin",
];

export const saveSession = (data) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
};

export const loadSession = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};