import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  User,
  Layers,
  BarChart3,
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, switchDemoAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
      onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPreset = async (preset: 'citizen' | 'officer_roads' | 'officer_sanitation' | 'admin') => {
    try {
      setLoading(true);
      setError('');
      await switchDemoAccount(preset);
      if (preset === 'admin') onNavigate('admin');
      else if (preset.startsWith('officer')) onNavigate('officer');
      else onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Error signing into demo persona.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            onClick={() => onNavigate('home')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-white">Sign In to PeopleFix</h1>
          <p className="text-xs text-slate-400">
            Access your civic grievance dashboard and municipal services
          </p>
        </div>

        {/* 1-Click Demo Presets */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>1-Click Evaluator Demo Sign-In:</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoPreset('citizen')}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition cursor-pointer"
            >
              <div className="font-bold text-white flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Citizen</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Alex Johnson</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoPreset('officer_roads')}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition cursor-pointer"
            >
              <div className="font-bold text-indigo-300 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Roads Officer</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Rajesh Kumar</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoPreset('officer_sanitation')}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition cursor-pointer"
            >
              <div className="font-bold text-amber-300 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Sanitation Lead</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Priya Sharma</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoPreset('admin')}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition cursor-pointer"
            >
              <div className="font-bold text-rose-300 flex items-center space-x-1">
                <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
                <span>Admin Lead</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Commissioner Chen</div>
            </button>
          </div>
        </div>

        {/* Custom Auth Login Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@civicfix.org"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2 text-xs text-slate-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              Register here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
