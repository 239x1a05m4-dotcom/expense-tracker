import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import {
  Link,
  useNavigate
} from "react-router-dom";
import { auth } from "../firebase/config";
import PasswordInput from "../components/PasswordInput";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showReset, setShowReset] =
    useState(false);

  const [resetEmail, setResetEmail] =
    useState("");

  const [resetMessage, setResetMessage] =
    useState("");

  const [resetError, setResetError] =
    useState("");

  const [resetLoading, setResetLoading] =
    useState(false);

  const handleLogin = async (e) => {

    e.preventDefault();

    setError("");

    try {

      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      navigate("/dashboard");

    } catch (error) {

      console.error(error);

      setError(
        "Invalid email or password."
      );

    } finally {

      setLoading(false);

    }
  };

  const openReset = () => {
    setShowReset(true);
    setResetEmail(email);
    setResetMessage("");
    setResetError("");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setResetMessage("");
    setResetError("");

    if (!resetEmail.trim()) {
      setResetError("Please enter your email address.");
      return;
    }

    try {
      setResetLoading(true);

      await sendPasswordResetEmail(auth, resetEmail.trim());

      setResetMessage(
        "If an account exists for that email, a password reset link has been sent."
      );
    } catch (error) {
      console.error("Password reset error:", error);

      // Avoid revealing whether the email is registered
      setResetMessage(
        "If an account exists for that email, a password reset link has been sent."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-brand">

          <div className="brand-icon">
            ₹
          </div>

          <h1>Expense Tracker</h1>

          <p>
            Manage your personal finances
            efficiently.
          </p>

        </div>


        <h2>Welcome Back</h2>

        <p className="auth-subtitle">
          Login to continue to your dashboard.
        </p>


        {error && (
          <div className="error-message">
            {error}
          </div>
        )}


        <form onSubmit={handleLogin}>

          <div className="input-group">

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>


          <PasswordInput
            id="login-password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            autoComplete="current-password"
          />

          <div className="forgot-password-row">
            <button
              type="button"
              className="link-btn"
              onClick={openReset}
            >
              Forgot password?
            </button>
          </div>


          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Login"}
          </button>

        </form>


        <p className="auth-footer">

          Don't have an account?

          {" "}

          <Link to="/register">
            Create an account
          </Link>

        </p>

      </div>

      {showReset && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Reset Password</h2>
                <p>
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <button
                onClick={() => setShowReset(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            {resetMessage && (
              <p className="success-message">{resetMessage}</p>
            )}

            {resetError && (
              <div className="error-message">{resetError}</div>
            )}

            <form onSubmit={handleResetPassword}>
              <div className="input-group">
                <label>Email Address</label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowReset(false)}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Login;
