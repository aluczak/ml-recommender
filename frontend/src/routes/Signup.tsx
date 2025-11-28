import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const { register, initializing } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
      await register({ email: email.trim().toLowerCase(), password, full_name: fullName.trim() || undefined });
      navigate("/catalog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up at the moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <header>
          <p className="eyebrow">Join the beta</p>
          <h2>Create your account</h2>
          <p>Track your interactions and unlock personalized recommendations.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>Full name</span>
            <input
              type="text"
              name="full_name"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={submitting}
            />
          </label>
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
              autoComplete="new-password"
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
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="form-footer">
          Already registered? <Link to="/login">Log in instead</Link>.
        </p>
      </div>
    </section>
  );
};

export default Signup;
