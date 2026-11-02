import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { ShieldAlert, Mail, ArrowRight, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (tab: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; resetToken?: string } | null>(null);

  // New password state when token exists
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      const res = await api.auth.forgotPassword(email);
      setResult(res);
      if (res.resetToken) {
        setResetTokenInput(res.resetToken);
      }
    } catch (err: any) {
      alert(err.message || 'Error requesting reset token');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTokenInput || !newPassword) return;
    try {
      setResetting(true);
      await api.auth.resetPassword({
        token: resetTokenInput,
        newPassword,
      });
      setResetSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Error resetting password');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div
            onClick={() => onNavigate('home')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-white">Reset Account Password</h1>
          <p className="text-xs text-slate-400">
            Secure, time-limited cryptographic password recovery
          </p>
        </div>

        {!resetSuccess ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
            {!result ? (
              <form onSubmit={handleRequestToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email</label>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>{loading ? 'Generating...' : 'Generate Reset Token'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                  <p className="font-semibold">{result.message}</p>
                  {result.resetToken && (
                    <div className="mt-2 text-[11px] bg-slate-900 p-2 rounded border border-slate-800 font-mono break-all text-slate-200">
                      Token: {result.resetToken}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">New Secure Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars, uppercase, lowercase, number"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetting}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>{resetting ? 'Updating...' : 'Set New Password'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-xs text-slate-400 hover:text-white flex items-center justify-center space-x-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Password Updated!</h3>
            <p className="text-xs text-slate-400">
              Your password has been successfully updated. All previous sessions have been securely invalidated.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer"
            >
              Sign In with New Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
