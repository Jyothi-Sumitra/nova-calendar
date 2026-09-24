import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Login.css';

export default function Login({ onCreateAccount, onForgotPassword, onGuestLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shake, setShake] = useState(false);

  const today = new Date();

  const dayName = today.toLocaleDateString(undefined, {
    weekday: 'short',
  });

  const monthName = today.toLocaleDateString(undefined, {
    month: 'short',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    setTouched({
      email: true,
      password: true,
    });

    if (!email.trim() || !password.trim()) {
      triggerShake();
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      triggerShake();
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        throw signInError;
      }

      if (!data.session) {
        throw new Error('Login succeeded, but no session was created.');
      }

      setSuccess('Welcome back to NOVA.');

      /*
       * Supabase automatically updates the session.
       * App.jsx is already listening to onAuthStateChange(),
       * so we do not need to manually redirect here.
       */
    } catch (err) {
      console.error('Login error:', err);

      let message = 'Unable to sign in. Please try again.';

      if (err?.message) {
        if (
          err.message.toLowerCase().includes('invalid login credentials')
        ) {
          message = 'Incorrect email or password.';
        } else {
          message = err.message;
        }
      }

      setError(message);
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  const triggerShake = () => {
    setShake(false);

    requestAnimationFrame(() => {
      setShake(true);
    });

    setTimeout(() => {
      setShake(false);
    }, 450);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Enter your email first, then choose Forgot password.');
      setTouched((prev) => ({
        ...prev,
        email: true,
      }));
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) {
        throw resetError;
      }

      setSuccess(
        'Password reset instructions have been sent to your email.'
      );
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err?.message ||
          'Unable to send the password reset email.'
      );
    }
  };

  const handleOAuth = async (provider) => {
    setError('');
    setSuccess('');

    try {
      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin,
          },
        });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      console.error(`${provider} login error:`, err);

      setError(
        err?.message ||
          `${provider} sign in is not available right now.`
      );
    }
  };

  return (
    <div className="nova-auth-page">
      <div className="nova-auth-layout">

        {/* LEFT PANEL */}
        <section className="nova-art-panel">

          <div className="nova-brand">
            <span className="nova-brand-mark">✦</span>
            <span className="nova-brand-name">NOVA</span>
          </div>

          <div className="nova-date-tab">
            <span className="nova-date-dow">
              {dayName}
            </span>

            <span className="nova-date-dom">
              {today.getDate()}
            </span>

            <span className="nova-date-mon">
              {monthName}
            </span>
          </div>

          <div className="nova-arc-wrap">
            <svg
              viewBox="0 0 460 260"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="novaArcGradient"
                  x1="0"
                  y1="1"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0" stopColor="#db2777" />
                  <stop offset="0.55" stopColor="#f472b6" />
                  <stop offset="1" stopColor="#f9a8d4" />
                </linearGradient>

                <radialGradient id="novaSunGradient">
                  <stop offset="0" stopColor="#fdf0f7" />
                  <stop offset="1" stopColor="#f472b6" />
                </radialGradient>
              </defs>

              <line
                x1="18"
                y1="228"
                x2="442"
                y2="228"
                className="nova-arc-tick"
                strokeDasharray="1 6"
              />

              <path
                className="nova-arc-path"
                d="M 20 228 C 90 40, 370 40, 440 228"
              />

              <circle
                cx="230"
                cy="52"
                r="10"
                className="nova-arc-sun-glow"
              />

              <circle
                cx="230"
                cy="52"
                r="5.5"
                className="nova-arc-sun"
              />
            </svg>
          </div>

          <div className="nova-hero-copy">
            <h1>
              Where every day
              <br />
              finds its rhythm.
            </h1>

            <p>
              One clear line through the noise of the day.
              NOVA keeps your time organized, your plans
              within reach, and the moments that matter
              exactly where they belong.
            </p>
          </div>

          <p className="nova-hero-quote">
            Your time is yours to shape.
          </p>
        </section>

        {/* RIGHT PANEL */}
        <section className="nova-form-panel">

          <div className="nova-auth-card">

            <div className="nova-mobile-brand">
              <span className="nova-brand-mark">✦</span>
              <span className="nova-brand-name">NOVA</span>
            </div>

            <h2>Welcome back</h2>

            <p className="nova-auth-lede">
              Sign in to pick up where you left off.
            </p>

            <form
              onSubmit={handleSubmit}
              noValidate
            >

              {/* EMAIL */}
              <div className="nova-field">

                <label htmlFor="login-email">
                  Email
                </label>

                <div className="nova-field-input">

                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    onBlur={() =>
                      setTouched((prev) => ({
                        ...prev,
                        email: true,
                      }))
                    }
                    placeholder="you@nova.app"
                    autoComplete="email"
                    className={
                      touched.email && !email
                        ? 'nova-invalid'
                        : ''
                    }
                  />

                </div>
              </div>

              {/* PASSWORD */}
              <div className="nova-field">

                <label htmlFor="login-password">
                  Password
                </label>

                <div className="nova-field-input">

                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    onBlur={() =>
                      setTouched((prev) => ({
                        ...prev,
                        password: true,
                      }))
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={
                      touched.password && !password
                        ? 'nova-invalid'
                        : ''
                    }
                  />

                  <button
                    type="button"
                    className="nova-toggle-vis"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.9 17.9A10.6 10.6 0 0 1 12 19c-7 0-11-7-11-7a19.4 19.4 0 0 1 5-5.5" />
                        <path d="M9.9 4.2A9.6 9.6 0 0 1 12 4c7 0 11 7 11 7a19.6 19.6 0 0 1-2.2 3.1" />
                        <path d="M14.1 14.1a3 3 0 1 1-4.2-4.2" />
                        <line
                          x1="1"
                          y1="1"
                          x2="23"
                          y2="23"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    )}
                  </button>

                </div>
              </div>

              {/* REMEMBER / FORGOT */}
              <div className="nova-row-between">

                <label className="nova-remember">

                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) =>
                      setRemember(e.target.checked)
                    }
                  />

                  <span>Remember me</span>

                </label>

                <a
                  href="#forgot"
                  className="nova-forgot-link"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </a>

              </div>

              {/* ERROR */}
              {error && (
                <div className="nova-auth-message nova-auth-error">
                  {error}
                </div>
              )}

              {/* SUCCESS */}
              {success && (
                <div className="nova-auth-message nova-auth-success">
                  {success}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                className={`nova-submit-btn ${
                  shake ? 'nova-shake' : ''
                }`}
                disabled={submitting}
              >
                {submitting
                  ? 'Signing in…'
                  : 'Sign in'}

                {!submitting && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                )}
              </button>

            </form>

            <div className="nova-divider">
              <span>or continue with</span>
            </div>

            {/* SOCIAL LOGIN */}
            <div className="nova-social-row">

              <button
                type="button"
                className="nova-social-btn"
                onClick={() => handleOAuth('google')}
              >
                <svg viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.4 14.7 2.4 12 2.4 6.9 2.4 2.7 6.6 2.7 12S6.9 21.6 12 21.6c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12Z"
                  />
                </svg>

                Google
              </button>

              <button
                type="button"
                className="nova-social-btn"
                onClick={() => handleOAuth('apple')}
              >
                <svg viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M16.1 1.5c.1 1.1-.3 2.2-1 3-.7.8-1.8 1.4-2.9 1.3-.1-1.1.4-2.2 1-3 .8-.8 2-1.4 2.9-1.3ZM19.7 17.3c-.5 1.1-.8 1.6-1.4 2.6-.9 1.4-2.2 3.1-3.7 3.1-1.4 0-1.7-.9-3.5-.9-1.8 0-2.2.9-3.5.9-1.5 0-2.7-1.6-3.6-3-2.5-3.7-2.8-8.1-1.2-10.4 1.1-1.6 2.8-2.6 4.4-2.6 1.6 0 2.7 1 4 1 1.3 0 2.1-1 4-1 1.4 0 2.9.8 4 2.1-3.5 1.9-2.9 6.9.5 8.2Z"
                  />
                </svg>

                Apple
              </button>

            </div>

            <p className="nova-footer-line">
              New to NOVA?{' '}

              <button
                type="button"
                className="nova-link-button"
                onClick={onCreateAccount}
              >
                Create an account
              </button>
            </p>

            {onGuestLogin && (
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={onGuestLogin}
                  style={{
                    background: 'rgba(244, 114, 182, 0.12)',
                    border: '1px solid rgba(244, 114, 182, 0.35)',
                    color: '#f472b6',
                    borderRadius: 10,
                    padding: '9px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>✨</span>
                  <span>Explore as Guest (Instant Access)</span>
                </button>
              </div>
            )}

          </div>

        </section>

      </div>
    </div>
  );
}