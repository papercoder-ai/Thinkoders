"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ArrowRight, CheckCircle, Sparkles } from "lucide-react";

export default function SigninPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center py-12 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50 to-white dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 -z-10"></div>
      
      {/* Animated blobs */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-40 right-10 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-800/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md px-4 relative z-10">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-teal-100 dark:from-indigo-900/40 dark:to-teal-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 group">
              <Sparkles className="w-3 h-3 mr-1.5 group-hover:rotate-12 transition-transform" />
              <span>Manager / HR / Admin Access</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Sign in to your LeaveFlow dashboard
            </p>
          </div>

          {/* Main Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-teal-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl p-8 space-y-6 hover:border-indigo-300/50 dark:hover:border-indigo-700/50 transition-colors duration-300">
              
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 dark:text-red-400 text-sm font-bold">!</span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600"
                    placeholder="you@company.com"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600"
                    placeholder="••••••••"
                  />
                </div>

                {/* Sign In Button */}
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 mt-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Dashboard</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">or</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Don't have an account?
                </p>
                <Link 
                  href="/signup"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 dark:hover:border-indigo-500 transition-all duration-300 group w-full"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2 p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 hover:border-indigo-300/50 dark:hover:border-indigo-700/50 transition-colors">
              <div className="text-2xl">🔒</div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Secure</p>
            </div>
            <div className="space-y-2 p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 hover:border-teal-300/50 dark:hover:border-teal-700/50 transition-colors">
              <div className="text-2xl">⚡</div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Instant</p>
            </div>
            <div className="space-y-2 p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-colors">
              <div className="text-2xl">✨</div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Modern</p>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            <p>By signing in, you agree to our Terms of Service</p>
          </div>
        </div>
      </div>
    </main>
  );
}
