import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, User, Mail, Lock, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Username can only contain letters, numbers, and underscores';
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register({ name: form.name, username: form.username, email: form.email, password: form.password });
      toast.success('Account created! Welcome to TaskFlow!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Alice Johnson', icon: User },
    { key: 'username', label: 'Username', type: 'text', placeholder: 'alice123', icon: AtSign },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'alice@example.com', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">TaskFlow</span>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Create account</h1>
          <p className="text-slate-500 text-sm mb-6">Join your team on TaskFlow</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, type, placeholder, icon: Icon }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={type}
                    className={`input pl-10 ${errors[key] ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
                {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  className={`input pl-10 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-slate-500 text-sm">Already have an account? </span>
            <Link to="/login" className="text-primary-500 font-medium text-sm hover:text-primary-600">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
