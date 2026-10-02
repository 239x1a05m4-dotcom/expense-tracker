import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import Navbar from "../components/Navbar";
import PasswordInput from "../components/PasswordInput";

import {
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";

import {
  updateProfile,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";

import { auth, db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function formatMemberSince(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });
}

function Profile() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    createdAt: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const currentUser = auth.currentUser;

      const userRef = doc(
        db,
        "users",
        currentUser.uid
      );

      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data();

        setProfileData({
          name:
            data.name ||
            currentUser.displayName ||
            "",
          email: currentUser.email || "",
          createdAt:
            data.createdAt ||
            currentUser.metadata?.creationTime ||
            ""
        });
      } else {
        setProfileData({
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          createdAt: currentUser.metadata?.creationTime || ""
        });
      }
    } catch (err) {
      console.error(
        "Error loading profile:",
        err
      );

      setError(
        "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfileData((previous) => ({
      ...previous,
      [name]: value
    }));

    setMessage("");
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    if (!profileData.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      setSaving(true);

      const currentUser = auth.currentUser;

      await updateProfile(currentUser, {
        displayName: profileData.name.trim()
      });

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          name: profileData.name.trim(),
          email: currentUser.email || ""
        },
        {
          merge: true
        }
      );

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Error updating profile:",
        err
      );

      setError(
        "Unable to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordFieldChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setPasswordMessage("");
    setPasswordError("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    if (!auth.currentUser || !auth.currentUser.email) {
      setPasswordError("Unable to verify your account. Please log in again.");
      return;
    }

    try {
      setPasswordSaving(true);

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(
        auth.currentUser,
        credential
      );

      await updatePassword(auth.currentUser, newPassword);

      setPasswordMessage("Password changed successfully.");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      console.error("Error changing password:", err);

      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPasswordError("Your current password is incorrect.");
      } else if (err.code === "auth/too-many-requests") {
        setPasswordError("Too many attempts. Please try again later.");
      } else {
        setPasswordError("Unable to change password. Please try again.");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error(
        "Logout error:",
        err
      );
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Navbar />

        <main className="main-content">
          <div className="loading-box">
            Loading profile...
          </div>
        </main>
      </div>
    );
  }

  const initial = profileData.name
    ? profileData.name.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content profile-page">
        <header className="page-header">
          <div>
            <h1>Profile Settings</h1>

            <p>
              Manage your account information, security and preferences.
            </p>
          </div>
        </header>

        <div className="profile-layout">

          {/* SUMMARY CARD */}

          <section className="content-card profile-summary-card">
            <div className="profile-avatar-ring">
              <div className="profile-avatar">
                {initial}
              </div>
            </div>

            <h2 className="profile-name">
              {profileData.name || "User"}
            </h2>

            <p className="profile-email">
              {profileData.email}
            </p>

            <span className="profile-badge">
              <span className="profile-badge-dot" />
              Active account
            </span>

            <div className="profile-meta">
              <div className="profile-meta-item">
                <span className="profile-meta-label">Member since</span>
                <span className="profile-meta-value">
                  {formatMemberSince(profileData.createdAt)}
                </span>
              </div>
            </div>

            <div className="profile-summary-actions">
              <button
                className="secondary-btn"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </button>

              <button
                className="logout-profile-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </section>

          {/* RIGHT COLUMN */}

          <div className="profile-main-column">

            {/* PERSONAL INFORMATION */}

            <section className="content-card">
              <div className="card-header profile-section-header">
                <div>
                  <h3>Personal Information</h3>
                  <p>Update your name and view your account email.</p>
                </div>
              </div>

              <form
                className="profile-form"
                onSubmit={handleSave}
              >
                <div className="input-row">
                  <div className="input-group">
                    <label htmlFor="profile-name">Full Name</label>

                    <input
                      id="profile-name"
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="profile-email">Email Address</label>

                    <input
                      id="profile-email"
                      type="email"
                      value={profileData.email}
                      disabled
                    />
                  </div>
                </div>

                {message && (
                  <p className="success-message">
                    {message}
                  </p>
                )}

                {error && (
                  <p className="error-message">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="primary-btn profile-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </form>
            </section>

            {/* CHANGE PASSWORD */}

            <section className="content-card">
              <div className="card-header profile-section-header">
                <div>
                  <h3>Change Password</h3>
                  <p>Choose a strong password you don't use elsewhere.</p>
                </div>
              </div>

              <form
                className="profile-form"
                onSubmit={handleChangePassword}
              >
                <PasswordInput
                  id="current-password"
                  name="currentPassword"
                  label="Current Password"
                  placeholder="Enter your current password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordFieldChange}
                  autoComplete="current-password"
                />

                <div className="input-row">
                  <PasswordInput
                    id="new-password"
                    name="newPassword"
                    label="New Password"
                    placeholder="Enter a new password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFieldChange}
                    autoComplete="new-password"
                    showStrength
                  />

                  <PasswordInput
                    id="confirm-new-password"
                    name="confirmPassword"
                    label="Confirm New Password"
                    placeholder="Re-enter the new password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFieldChange}
                    autoComplete="new-password"
                  />
                </div>

                {passwordMessage && (
                  <p className="success-message">
                    {passwordMessage}
                  </p>
                )}

                {passwordError && (
                  <p className="error-message">
                    {passwordError}
                  </p>
                )}

                <button
                  type="submit"
                  className="primary-btn profile-save-btn"
                  disabled={passwordSaving}
                >
                  {passwordSaving
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </form>
            </section>

            {/* PREFERENCES */}

            <section className="content-card">
              <div className="card-header profile-section-header">
                <div>
                  <h3>Preferences</h3>
                  <p>Personalize how Expense Tracker looks for you.</p>
                </div>
              </div>

              <div className="preference-row">
                <div className="preference-info">
                  <h4>Dark Mode</h4>
                  <p>Switch between light and dark themes.</p>
                </div>

                <button
                  type="button"
                  className={
                    theme === "dark"
                      ? "preference-toggle active"
                      : "preference-toggle"
                  }
                  onClick={toggleTheme}
                  aria-pressed={theme === "dark"}
                  aria-label="Toggle dark mode"
                >
                  <span />
                </button>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
