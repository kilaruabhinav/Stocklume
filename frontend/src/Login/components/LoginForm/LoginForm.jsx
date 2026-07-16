import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  getStoredUser,
  notifyAuthChange
} from "../../../services/Auth/authStorage";
import { buildApiUrl } from "../../../services/apiConfig";

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const requestedRedirect =
    searchParams.get("redirectTo") ||
    (location.state?.from
      ? `${location.state.from.pathname}${location.state.from.search || ""}`
      : "");
  const redirectTo = requestedRedirect.startsWith("/") ? requestedRedirect : "/dashboard";
  const sessionMessage =
    searchParams.get("reason") === "session-expired"
      ? "Your session expired. Please log in again."
      : location.state?.message || "";

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState(sessionMessage);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (getStoredUser()) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(buildApiUrl("/login"), {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed.");
        return;
      }

      localStorage.setItem("access_token", data.access_token);

      localStorage.setItem(
        "stockpulse_user",
        JSON.stringify({
          name: data.name,
          email: email,
          loggedInAt: new Date().toISOString()
        })
      );

      notifyAuthChange();
      setSuccess("Login successful. Redirecting...");

      setTimeout(() => {
        navigate(redirectTo);
      }, 600);

    } catch (error) {
      console.error("Login request failed:", error);
      setError("Could not connect to the backend.");
    }
  };

  return (
    <section className="login-card" aria-label="Login form">
      <div className="login-card__header">
        <span className="login-card__eyebrow">Account Access</span>
        <h1>Welcome back</h1>
        <p>Log in using your registered email and password.</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-form__field">
          <label htmlFor="email">Email</label>

          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            autoComplete="email"
          />
        </div>

        <div className="login-form__field">
          <label htmlFor="password">Password</label>

          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="login-form__message login-form__message--error">
            {error}
          </p>
        )}

        {success && (
          <p className="login-form__message login-form__message--success">
            {success}
          </p>
        )}

        <button className="login-form__button" type="submit">
          Login
        </button>
      </form>

      <p className="login-card__switch">
        Don&apos;t have an account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}

export default LoginForm;
