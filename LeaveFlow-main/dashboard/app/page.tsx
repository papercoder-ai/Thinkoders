"use client";

import Link from "next/link";
import { useState, useEffect, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "./lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  Calendar,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Clock,
  TrendingUp,
  Smartphone,
  Zap,
  Shield,
  Star,
  ChevronRight,
  Play,
  Sparkles,
  Globe,
  Lock,
  BarChart,
  UserCheck,
  CalendarDays,
  FileText,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  ArrowRightCircle,
  CheckIcon,
  LucideIcon
} from "lucide-react";

const LandingPage = memo(() => {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 sm:pt-32 sm:pb-48">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50 to-white dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 -z-10"></div>
        
        {/* Animated background blobs */}
        <div className="absolute top-40 left-0 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-20 right-10 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-800/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-10">
            {/* Badge */}
            <Link href="/signup" className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-teal-100 dark:from-indigo-900/40 dark:to-teal-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-semibold border border-indigo-200 dark:border-indigo-800 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer group">
              <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              <span>Manage leaves the WhatsApp way</span>
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-slate-900 dark:text-white leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 dark:from-indigo-400 dark:via-purple-400 dark:to-teal-400 bg-clip-text text-transparent">
                Leave Management,
              </span>
              <br />
              <span className="text-slate-900 dark:text-white">Reimagined for Teams</span>
            </h1>
            
            {/* Subheading */}
            <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-slate-700 dark:text-slate-300 leading-relaxed font-light">
              Approve requests in seconds, not days. AI-powered processing, WhatsApp integration, and powerful analytics—all in one platform.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/signup" className="inline-block">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-12 py-7 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                  Get Started Free
                  <ArrowRightCircle className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/requests" className="inline-block">
                <Button size="lg" variant="outline" className="px-12 py-7 text-lg font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 group">
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  View Demo
                </Button>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="pt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-full group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50 transition-colors">
                    <CheckIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <span className="font-medium">No card required</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <CheckIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium">7-day free trial</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <CheckIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="font-medium">Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-white dark:bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              An end-to-end solution
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to streamline leave management, from submission to analytics
            </p>
          </div>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 rounded-2xl mb-6">
                  <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">01</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Request via WhatsApp
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                  Employees submit leave requests directly through WhatsApp. Natural language processing understands what they need, instantly validates against policies, and checks team availability.
                </p>
                <Link href="/signup" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold group">
                  Learn more <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="flex-1 h-64 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/20 dark:to-indigo-900/10 rounded-2xl flex items-center justify-center border border-indigo-200 dark:border-indigo-900">
                <MessageSquare className="w-24 h-24 text-indigo-300 dark:text-indigo-800" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/50 dark:to-teal-800/30 rounded-2xl mb-6">
                  <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">02</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Intelligent Processing
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                  AI analyzes requests for policy compliance, detects conflicts, checks leave balances, and identifies potential issues—all automatically. Managers see smart recommendations for faster decisions.
                </p>
                <Link href="/requests" className="inline-flex items-center text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold group">
                  Explore features <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="flex-1 h-64 bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/20 dark:to-teal-900/10 rounded-2xl flex items-center justify-center border border-teal-200 dark:border-teal-900">
                <Zap className="w-24 h-24 text-teal-300 dark:text-teal-800" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/50 dark:to-purple-800/30 rounded-2xl mb-6">
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">03</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Instant Approvals
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                  Managers approve or reject requests instantly via WhatsApp. Employees get immediate confirmation, HR maintains complete audit trails, and the team calendar updates automatically.
                </p>
                <Link href="/requests/calendar" className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold group">
                  View calendar <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="flex-1 h-64 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-2xl flex items-center justify-center border border-purple-200 dark:border-purple-900">
                <CheckCircle className="w-24 h-24 text-purple-300 dark:text-purple-800" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 rounded-2xl mb-6">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">04</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Analytics & Insights
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                  Comprehensive dashboards show leave patterns, utilization rates, team trends, and predictive analytics. Make data-driven workforce planning decisions with confidence.
                </p>
                <Link href="/users" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold group">
                  View dashboard <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="flex-1 h-64 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-2xl flex items-center justify-center border border-blue-200 dark:border-blue-900">
                <BarChart3 className="w-24 h-24 text-blue-300 dark:text-blue-800" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Everything your team needs
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Powerful features designed for modern teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: WhatsApp Integration */}
            <Link href="/signup" className="group">
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent dark:from-indigo-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    WhatsApp Integration
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Manage leaves directly via WhatsApp. Real-time notifications, instant approvals.
                  </p>
                </div>
              </div>
            </Link>

            {/* Feature 2: AI Processing */}
            <Link href="/requests" className="group">
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent dark:from-teal-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/50 dark:to-teal-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    AI-Powered Processing
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Natural language understanding, smart validation, conflict detection, automated workflows.
                  </p>
                </div>
              </div>
            </Link>

            {/* Feature 3: Calendar */}
            <Link href="/requests/calendar" className="group">
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/50 dark:to-purple-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    Team Calendar
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Visual leave overview, prevent double-booking, plan team capacity with ease.
                  </p>
                </div>
              </div>
            </Link>

            {/* Feature 4: Analytics */}
            <Link href="/users" className="group">
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    Advanced Analytics
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Leave patterns, utilization rates, team trends. Data-driven workforce planning.
                  </p>
                </div>
              </div>
            </Link>

            {/* Feature 5: RBAC */}
            <Link href="/users" className="group">
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-pink-500 dark:hover:border-pink-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-transparent dark:from-pink-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/50 dark:to-pink-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-7 h-7 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    Role-Based Access
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Worker, Manager, HR, Admin. Granular permissions for every team member.
                  </p>
                </div>
              </div>
            </Link>

            {/* Feature 6: Security */}
            <Link href="/profile" className="group">
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    Enterprise Security
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    End-to-end encryption, audit logs, compliance ready. Your data is protected.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white dark:bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Why teams choose LeaveFlow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              {[
                {
                  title: "Instant Approvals",
                  desc: "Process requests in seconds, not days"
                },
                {
                  title: "Time Saved",
                  desc: "Automate 80% of leave management tasks"
                },
                {
                  title: "Error Prevention",
                  desc: "AI catches policy violations before they happen"
                },
                {
                  title: "Better Visibility",
                  desc: "Real-time team availability and capacity planning"
                }
              ].map((benefit, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-8">
              {[
                {
                  title: "Compliance Ready",
                  desc: "Audit logs and full compliance documentation"
                },
                {
                  title: "Secure by Default",
                  desc: "Enterprise-grade security and data protection"
                },
                {
                  title: "Easy Integration",
                  desc: "Connect with your existing HR systems seamlessly"
                },
                {
                  title: "24/7 Availability",
                  desc: "Access your platform anytime, anywhere"
                }
              ].map((benefit, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Enterprise-grade security
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Your data stays yours. Always encrypted, always secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Data Encryption
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                All data is encrypted at rest and in transit using industry-standard encryption algorithms.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Compliance
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                SOC 2 Type II and GDPR compliant, trusted by thousands of businesses for secure operations.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Your Data, Your Control
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Your data is only accessible to your team and is never used to train models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 -z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 to-slate-950/40 -z-10"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Ready to simplify leave management?
          </h2>
          
          <p className="text-xl text-white/90">
            Join thousands of teams already using LeaveFlow to streamline their leave processes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/signup">
              <Button size="lg" className="bg-white hover:bg-slate-100 text-indigo-600 font-semibold px-12 py-7 text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 group">
                Get Started Free
                <ArrowRightCircle className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/requests">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-12 py-7 text-lg rounded-xl transition-all duration-300 group">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                View Demo
              </Button>
            </Link>
          </div>

          <p className="text-white/80 text-sm">
            💳 No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>

    </div>
  );
});

const DashboardHome = memo(() => {
  const { user } = useAuth();

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests', user?.id, user?.role],
    queryFn: () => api.getPendingRequests(),
    enabled: Boolean(user && (user.role === 'manager' || user.role === 'hr' || user.role === 'admin')),
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  const { data: balance } = useQuery({
    queryKey: ['my-balance'],
    queryFn: () => api.getMyBalance(),
    staleTime: 60000,
    refetchInterval: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => [],
    staleTime: 30000,
  });

  const pendingCount = useMemo(() => pendingRequests?.length || 0, [pendingRequests]);
  const balanceData = useMemo(() => balance || { casual: 0, sick: 0, special: 0 }, [balance]);
  const activityData = useMemo(() => recentActivity || [], [recentActivity]);
  const totalBalance = useMemo(() => (balanceData.casual || 0) + (balanceData.sick || 0) + (balanceData.special || 0), [balanceData]);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBalance}</div>
              <p className="text-xs text-muted-foreground">
                Days remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">
                Active users
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest leave requests and approvals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity?.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {activity.user?.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <UserCheck className="w-4 h-4 mr-2" />
                Review Requests
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CalendarDays className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  );
});

export default memo(function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <DashboardHome />;
  }

  return <LandingPage />;
});