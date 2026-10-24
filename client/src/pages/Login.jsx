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

  async function handleSubmit(event) {
    event.preventDefault();

    const isSignup = pageState === "signup";
    if (!username || !password || (isSignup && !email)) {
      setErrorMessage(
        isSignup
          ? "Username, email and password are required"
          : "Username and password are required",
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
        setErrorMessage(data.message || "Unable to authenticate");
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
    setPageState(pageState === "login" ? "signup" : "login");
    setErrorMessage("");
  }

  return (
    <div className="login-container">
      <h1>{pageState === "login" ? "Login" : "Sign Up"}</h1>
      <form onSubmit={(event) => handleSubmit(event)}>
        <input
          type="text"
          onChange={(event) => setUserName(event.target.value)}
          value={username}
          placeholder="Username"
        />
        {pageState === "signup" && (
          <input
            type="email"
            onChange={(event) => setEmail(event.target.value)}
            value={email}
            placeholder="Email"
          />
        )}
        <input
          type={showPassword ? "text" : "password"}
          onChange={(event) => setPassword(event.target.value)}
          value={password}
          placeholder="Password"
        />
        <label>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
          />
          Show password
        </label>
        <p role="alert" className="error-message">
          {errorMessage}
        </p>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Submitting..."
            : pageState === "login"
              ? "Login"
              : "Sign up"}
        </button>
      </form>

      <div className="toggle-container">
        <p>
          {pageState === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
        </p>
        <button type="button" onClick={togglePageState}>
          {pageState === "login" ? "Sign Up" : "Login"}
        </button>
      </div>
    </div>
  );
}

export default Login;
