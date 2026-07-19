import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'https://cloudrisk-dashboard.onrender.com/api';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Validate username
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/signup`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        // Auto-login: save token and redirect
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <h1 style={styles.title}>CloudRisk AI</h1>
          <p style={styles.subtitle}>Create your account</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>Already have an account?</span>
        </div>

        <Link to="/login" style={styles.signinLink}>
          Sign In
        </Link>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    padding: '48px',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    maxWidth: '440px',
    width: '100%',
  },
  logoSection: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#0f172a',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#334155',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    background: '#f8fafc',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '14px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'background 0.2s',
    marginTop: '8px',
  },
  divider: {
    marginTop: '24px',
    textAlign: 'center',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '24px',
  },
  dividerText: {
    color: '#94a3b8',
    fontSize: '14px',
  },
  signinLink: {
    display: 'block',
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    textAlign: 'center',
    textDecoration: 'none',
    transition: 'background 0.2s',
    marginTop: '12px',
  },
};

export default Signup;