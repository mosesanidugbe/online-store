import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api.js";
import AuthContext from "../context/AuthContext";

function Login() {
  const [pageState, setPageState] = useState("login"); // "login" or "signup"
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const isSignup = pageState === "signup";

  async function handleSubmit(event) {
    event.preventDefault();

    if (!username.trim() || !password || (isSignup && !email.trim())) {
      setErrorMessage(
        isSignup
          ? "Username, email and password are required."
          : "Username and password are required.",
      );
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/${isSignup ? "register" : "login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
            ...(isSignup ? { email } : {}),
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || "Unable to authenticate. Please try again.");
        return;
      }

      login(data);
      navigate("/");
    } catch {
      setErrorMessage("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function togglePageState() {
    setPageState(isSignup ? "login" : "signup");
    setErrorMessage("");
  }

  return (
    <main className="auth-page">
      <section className="login-container" aria-labelledby="auth-title">
        <p className="auth-eyebrow">A little something lovely</p>
        <h1 id="auth-title">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-intro">
          {isSignup
            ? "Join us to keep your favourite finds close."
            : "Sign in and pick up where you left off."}
        </p>

        <form onSubmit={handleSubmit} aria-describedby={errorMessage ? "auth-error" : undefined}>
          <div className="auth-field">
            <label htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              name="username"
              type="text"
              autoComplete="username"
              onChange={(event) => setUserName(event.target.value)}
              value={username}
              placeholder="Your username"
              required
            />
          </div>

          {isSignup && (
            <div className="auth-field">
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                value={email}
                placeholder="you@example.com"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              onChange={(event) => setPassword(event.target.value)}
              value={password}
              placeholder="Enter your password"
              required
            />
          </div>

          <label className="auth-password-toggle">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            <span>Show password</span>
          </label>

          {errorMessage && (
            <p id="auth-error" role="alert" className="error-message">
              {errorMessage}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="toggle-container">
          <p>{isSignup ? "Already have an account?" : "New around here?"}</p>
          <button type="button" onClick={togglePageState}>
            {isSignup ? "Sign in" : "Create an account"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default Login;
