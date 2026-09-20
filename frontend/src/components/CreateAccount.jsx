import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './CreateAccount.css';

export default function CreateAccount({ onBackToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [touched, setTouched] = useState({});

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
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('Please complete all fields.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError(
        'Your password must contain at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      /*
       * Depending on your Supabase email-confirmation setting,
       * session may be null here.
       */

      if (data.session) {
        setSuccess('Your NOVA account has been created.');
      } else {
        setSuccess(
          'Account created. Check your email to confirm your account, then sign in.'
        );
      }

      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Create account error:', err);

      setError(
        err?.message ||
          'Unable to create your account. Please try again.'
      );
    } finally {
      setSubmitting(false);
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
      console.error(`${provider} sign up error:`, err);

      setError(
        err?.message ||
          `${provider} sign up is not available right now.`
      );
    }
  };

  return (
    <div className="nova-signup-page">

      <div className="nova-signup-layout">

        {/* LEFT */}
        <section className="nova-signup-art">

          <div className="nova-signup-brand">
            <span className="nova-signup-brand-mark">
              ✦
            </span>

            <span className="nova-signup-brand-name">
              NOVA
            </span>
          </div>

          <div className="nova-signup-date">
            <span>{dayName}</span>

            <strong>{today.getDate()}</strong>

            <small>{monthName}</small>
          </div>

          <div className="nova-signup-arc">
            <svg
              viewBox="0 0 460 260"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="novaSignupArcGradient"
                  x1="0"
                  y1="1"
                  x2="1"
                  y2="0"
                >
                  <stop
                    offset="0"
                    stopColor="#db2777"
                  />

                  <stop
                    offset="0.55"
                    stopColor="#f472b6"
                  />

                  <stop
                    offset="1"
                    stopColor="#f9a8d4"
                  />
                </linearGradient>

                <radialGradient id="novaSignupSunGradient">
                  <stop
                    offset="0"
                    stopColor="#fdf0f7"
                  />

                  <stop
                    offset="1"
                    stopColor="#f472b6"
                  />
                </radialGradient>
              </defs>

              <line
                x1="18"
                y1="228"
                x2="442"
                y2="228"
                className="nova-signup-tick"
                strokeDasharray="1 6"
              />

              <path
                className="nova-signup-arc-path"
                d="M 20 228 C 90 40, 370 40, 440 228"
              />

              <circle
                cx="230"
                cy="52"
                r="10"
                className="nova-signup-sun-glow"
              />

              <circle
                cx="230"
                cy="52"
                r="5.5"
                className="nova-signup-sun"
              />
            </svg>
          </div>

          <div className="nova-signup-copy">

            <h1>
              Make room for
              <br />
              what matters.
            </h1>

            <p>
              Create your NOVA account and bring your
              schedule, plans, reminders, and conversations
              into one calm place.
            </p>

          </div>

          <p className="nova-signup-quote">
            A clearer day begins with a clearer plan.
          </p>

        </section>

        {/* RIGHT */}
        <section className="nova-signup-form-panel">

          <div className="nova-signup-card">

            <div className="nova-signup-mobile-brand">
              <span className="nova-signup-brand-mark">
                ✦
              </span>

              <span className="nova-signup-brand-name">
                NOVA
              </span>
            </div>

            <h2>Create your account</h2>

            <p className="nova-signup-lede">
              Start organizing your time with NOVA.
            </p>

            <form
              onSubmit={handleSubmit}
              noValidate
            >

              {/* NAME */}
              <div className="nova-signup-field">

                <label htmlFor="signup-name">
                  Name
                </label>

                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  onBlur={() =>
                    setTouched((prev) => ({
                      ...prev,
                      name: true,
                    }))
                  }
                  placeholder="Your name"
                  autoComplete="name"
                  className={
                    touched.name && !name
                      ? 'nova-signup-invalid'
                      : ''
                  }
                />

              </div>

              {/* EMAIL */}
              <div className="nova-signup-field">

                <label htmlFor="signup-email">
                  Email
                </label>

                <input
                  id="signup-email"
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
                      ? 'nova-signup-invalid'
                      : ''
                  }
                />

              </div>

              {/* PASSWORD */}
              <div className="nova-signup-field">

                <label htmlFor="signup-password">
                  Password
                </label>

                <div className="nova-signup-password">

                  <input
                    id="signup-password"
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
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className={
                      touched.password && !password
                        ? 'nova-signup-invalid'
                        : ''
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>

                </div>

              </div>

              {/* CONFIRM PASSWORD */}
              <div className="nova-signup-field">

                <label htmlFor="signup-confirm-password">
                  Confirm password
                </label>

                <div className="nova-signup-password">

                  <input
                    id="signup-confirm-password"
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    onBlur={() =>
                      setTouched((prev) => ({
                        ...prev,
                        confirmPassword: true,
                      }))
                    }
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    className={
                      touched.confirmPassword &&
                      !confirmPassword
                        ? 'nova-signup-invalid'
                        : ''
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showConfirmPassword
                      ? 'Hide'
                      : 'Show'}
                  </button>

                </div>

              </div>

              {/* MESSAGES */}
              {error && (
                <div className="nova-signup-message nova-signup-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="nova-signup-message nova-signup-success">
                  {success}
                </div>
              )}

              {/* CREATE */}
              <button
                type="submit"
                className="nova-signup-submit"
                disabled={submitting}
              >
                {submitting
                  ? 'Creating account…'
                  : 'Create account'}

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

            <div className="nova-signup-divider">
              <span>or continue with</span>
            </div>

            <div className="nova-signup-social">

              <button
                type="button"
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

            <p className="nova-signup-footer">
              Already have an account?{' '}

              <button
                type="button"
                onClick={onBackToLogin}
              >
                Sign in
              </button>
            </p>

          </div>

        </section>

      </div>

    </div>
  );
}