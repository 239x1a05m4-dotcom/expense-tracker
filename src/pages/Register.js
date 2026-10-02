import React, { useState } from "react";
import {
  createUserWithEmailAndPassword
} from "firebase/auth";
import {
  Link,
  useNavigate
} from "react-router-dom";
import {
  doc,
  setDoc
} from "firebase/firestore";
import {
  auth,
  db
} from "../firebase/config";
import PasswordInput from "../components/PasswordInput";

function Register() {

  const navigate = useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleRegister = async (e) => {

    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {

      setError(
        "Passwords do not match."
      );

      return;
    }

    if (password.length < 6) {

      setError(
        "Password must contain at least 6 characters."
      );

      return;
    }

    try {

      setLoading(true);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await setDoc(
        doc(
          db,
          "users",
          userCredential.user.uid
        ),
        {
          name,
          email,
          createdAt:
            new Date().toISOString()
        }
      );

      navigate("/dashboard");

    } catch (error) {

      console.error(error);

      setError(
        "Unable to create account. Please check your details."
      );

    } finally {

      setLoading(false);

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
            Create your account to manage
            your finances.
          </p>

        </div>


        <h2>Create Account</h2>

        <p className="auth-subtitle">
          Start tracking your financial activity.
        </p>


        {error && (
          <div className="error-message">
            {error}
          </div>
        )}


        <form onSubmit={handleRegister}>

          <div className="input-group">

            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />

          </div>


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
            id="register-password"
            name="password"
            label="Password"
            placeholder="Create a password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            autoComplete="new-password"
            showStrength
          />

          <PasswordInput
            id="register-confirm-password"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            required
            autoComplete="new-password"
          />


          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>

        </form>


        <p className="auth-footer">

          Already have an account?

          {" "}

          <Link to="/login">
            Login
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Register;