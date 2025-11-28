import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, initializing } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (initializing) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/catalog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <header>
          <p className="eyebrow">Welcome back</p>
          <h2>Log in to continue</h2>
          <p>Access your personalized cart and interaction history.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
            />
          </label>
          {error && (
            <p className="status status-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? "Signing in…" : "Log in"}
          </button>
        </form>
        <p className="form-footer">
          Need an account? <Link to="/signup">Create one</Link>.
        </p>
      </div>
    </section>
  );
};

export default Login;
