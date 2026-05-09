"use client";

import { useState } from "react";
import { Lock, Shield, ArrowRight, Eye, EyeOff } from "lucide-react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const isFloating = focused || hasValue;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f0f4f9;
          padding: 20px;
          font-family: 'Roboto', sans-serif;
        }

        .login-card {
          background: #ffffff;
          border-radius: 28px;
          padding: 48px 40px 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.07), 0 10px 30px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }

        .card-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }

        .logo-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #1a73e8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
        }

        .app-label {
          font-family: 'Google Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #1a73e8;
          margin-bottom: 6px;
          letter-spacing: 0.3px;
        }

        .card-title {
          font-family: 'Google Sans', sans-serif;
          font-size: 26px;
          font-weight: 400;
          color: #202124;
          margin-bottom: 6px;
          letter-spacing: -0.2px;
        }

        .card-subtitle {
          font-size: 14px;
          color: #5f6368;
          line-height: 1.5;
        }

        .divider {
          height: 1px;
          background: #e8eaed;
          margin: 0 0 28px;
        }

        /* Floating label field */
        .field-wrap {
          position: relative;
          margin-bottom: 28px;
        }

        .float-label {
          position: absolute;
          left: 14px;
          top: 16px;
          font-size: 16px;
          color: #5f6368;
          pointer-events: none;
          transition: top 0.15s ease, font-size 0.15s ease, color 0.15s ease;
          background: #fff;
          padding: 0 4px;
          line-height: 1;
        }

        .float-label.up {
          top: -8px;
          font-size: 12px;
          color: #1a73e8;
        }

        .float-label.up.err {
          color: #d93025;
        }

        .field-input {
          width: 100%;
          height: 52px;
          padding: 0 16px;
          font-size: 16px;
          color: #202124;
          background: #fff;
          border: 1.5px solid #dadce0;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: 'Roboto', sans-serif;
          box-sizing: border-box;
        }

        .field-input:focus {
          border-color: #1a73e8;
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.12);
        }

        .field-input.err {
          border-color: #d93025;
        }

        .field-input.err:focus {
          box-shadow: 0 0 0 3px rgba(217, 48, 37, 0.1);
        }

        .error-row {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
          font-size: 12px;
          color: #d93025;
          padding-left: 2px;
        }

        /* Button */
        .btn-next {
          width: 100%;
          height: 48px;
          background: #1a73e8;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Google Sans', 'Roboto', sans-serif;
          letter-spacing: 0.25px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, box-shadow 0.15s;
          box-shadow: 0 1px 3px rgba(26, 115, 232, 0.3);
        }

        .btn-next:hover:not(:disabled) {
          background: #1557b0;
          box-shadow: 0 3px 8px rgba(26, 115, 232, 0.35);
        }

        .btn-next:active:not(:disabled) {
          background: #1249a0;
          box-shadow: none;
        }

        .btn-next:disabled {
          background: #a8c7fa;
          cursor: not-allowed;
          box-shadow: none;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: _spin 0.65s linear infinite;
          flex-shrink: 0;
        }

        @keyframes _spin { to { transform: rotate(360deg); } }

        .footer-note {
          margin-top: 24px;
          text-align: center;
          font-size: 11px;
          color: #9aa0a6;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 32px;
        }

        .footer-link {
          font-size: 12px;
          color: #5f6368;
          text-decoration: none;
          cursor: default;
        }

        .footer-link:hover { text-decoration: underline; }

        .eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #5f6368;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
          transition: color 0.15s, background 0.15s;
          outline: none;
        }

        .eye-btn:hover {
          color: #1a73e8;
          background: rgba(26, 115, 232, 0.08);
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">

          {/* Header */}
          <div className="card-header">
            <div className="logo-circle">
              <Shield size={26} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="app-label">Field Admin</div>
            <h1 className="card-title">Sign in</h1>
            <p className="card-subtitle">to continue to Field Admin Dashboard</p>
          </div>

          <div className="divider" />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="field-wrap">
              <label className={`float-label${isFloating ? " up" : ""}${error && isFloating ? " err" : ""}`}>
                Password
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className={`field-input${error ? " err" : ""}`}
                  style={{ paddingRight: "48px" }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onChange={(e) => setHasValue(e.target.value.length > 0)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && (
                <div className="error-row">
                  <Lock size={11} />
                  {error}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-next">
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="footer-note">
            <Lock size={10} />
            Authorized personnel only
          </p>
        </div>

        {/* Footer links */}
        <div className="footer-links">
          <span className="footer-link">Help</span>
          <span className="footer-link">Privacy</span>
          <span className="footer-link">Terms</span>
        </div>
      </div>
    </>
  );
}