import React, { useState } from "react";
import { login } from "../../services/api";
import { LOGO_TESSUTI } from "../../assets";

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: "spin .7s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export default function AdminLogin({ onLogin, onBack }) {
  const [user, setUser]       = useState("");
  const [pass, setPass]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(user, pass);
      onLogin();
    } catch (err) {
      setError(err.message || "Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0e0c",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

      <div style={{
        width: "100%",
        maxWidth: 400,
        animation: "fadeUp .4s ease both",
      }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,.35)", fontSize: 13,
            marginBottom: 32, padding: 0, transition: "color .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.35)"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Volver al inicio
        </button>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 16,
          padding: "40px 36px",
          backdropFilter: "blur(8px)",
        }}>
          {/* Logo + título */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img
              src={LOGO_TESSUTI}
              alt="Tessuti"
              style={{
                width: 72, height: 72, borderRadius: "50%", objectFit: "cover",
                margin: "0 auto 16px", display: "block",
                border: "2px solid rgba(255,255,255,.12)",
              }}
            />
            <h2 style={{
              color: "#fff", fontSize: 22, fontWeight: 600, marginBottom: 4,
              fontFamily: "'Cormorant Garamond', serif", letterSpacing: ".04em",
            }}>
              Acceso administrativo
            </h2>
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase" }}>
              Dotaciones Tessuti
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(153,27,27,.25)", border: "1px solid rgba(252,165,165,.25)",
              borderRadius: 8, padding: "10px 14px", marginBottom: 20,
              color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
                Usuario
              </label>
              <input
                type="text"
                placeholder="admin"
                value={user}
                onChange={e => setUser(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "11px 14px",
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8, fontSize: 14, color: "#fff",
                  outline: "none", transition: "border-color .15s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(255,255,255,.3)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "11px 44px 11px 14px",
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: 8, fontSize: 14, color: "#fff",
                    outline: "none", transition: "border-color .15s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(255,255,255,.3)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,.3)", padding: 0, display: "flex",
                  }}
                >
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !user || !pass}
              style={{
                marginTop: 8,
                width: "100%", padding: "12px",
                background: loading || !user || !pass ? "rgba(255,255,255,.08)" : "#fff",
                color: loading || !user || !pass ? "rgba(255,255,255,.25)" : "#1a1a1a",
                border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 700, cursor: loading || !user || !pass ? "not-allowed" : "pointer",
                transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                letterSpacing: ".04em",
              }}
            >
              {loading ? <><Spinner size={14} /> Entrando...</> : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}