import React, { useState } from "react";

/* =========================
   EYE ICONS (inline SVG, no extra deps)
========================= */

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.44 3.44M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/* =========================
   PASSWORD STRENGTH
========================= */

export function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "", percent: 0 };
  }

  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const levels = [
    { label: "Very weak", className: "very-weak", percent: 20 },
    { label: "Weak", className: "weak", percent: 40 },
    { label: "Fair", className: "fair", percent: 60 },
    { label: "Good", className: "good", percent: 80 },
    { label: "Strong", className: "strong", percent: 100 }
  ];

  const index = Math.max(
    0,
    Math.min(score - 1, levels.length - 1)
  );

  return {
    score,
    ...levels[index]
  };
}

function PasswordStrengthMeter({ password }) {
  const strength = getPasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className="password-strength">
      <div className="password-strength-track">
        <div
          className={`password-strength-fill ${strength.className}`}
          style={{ width: `${strength.percent}%` }}
        />
      </div>

      <span className={`password-strength-label ${strength.className}`}>
        {strength.label}
      </span>
    </div>
  );
}

/* =========================
   PASSWORD INPUT
========================= */

function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  showStrength
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={id}>
          {label}
        </label>
      )}

      <div className="password-input-wrapper">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setVisible((previous) => !previous)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {showStrength && (
        <PasswordStrengthMeter password={value} />
      )}
    </div>
  );
}

export default PasswordInput;
