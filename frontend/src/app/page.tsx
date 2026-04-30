'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
  Layers, Zap, Database, Globe, BarChart2,
  ArrowRight, Check, Star, Github, Sparkles,
  Table2, FormInput, Bell, Upload
} from 'lucide-react';

const FEATURES = [
  { icon: Table2, title: 'Dynamic Tables', desc: 'Auto-generated tables with sort, filter, search & pagination' },
  { icon: FormInput, title: 'Smart Forms', desc: 'Config-driven forms with validation for any data model' },
  { icon: BarChart2, title: 'Live Dashboards', desc: 'Charts and stats that update in real-time from your data' },
  { icon: Database, title: 'Any Database Schema', desc: 'Define collections in JSON — no migrations needed' },
  { icon: Upload, title: 'CSV Import', desc: 'Upload CSV files with smart field mapping in 3 clicks' },
  { icon: Globe, title: 'Multi-language', desc: 'English, Hindi, Spanish — switch instantly' },
  { icon: Bell, title: 'Notifications', desc: 'Event-based alerts for every action in your app' },
  { icon: Github, title: 'Export to GitHub', desc: 'Download full codebase and push to your repo' },
];

const STEPS = [
  { step: '01', title: 'Write your config', desc: 'Describe your app in JSON — collections, pages, fields' },
  { step: '02', title: 'AppForge builds it', desc: 'Frontend, backend, and database auto-generated instantly' },
  { step: '03', title: 'Ship it', desc: 'Publish, share, and extend without rewriting anything' },
];

const EXAMPLE_CONFIG = `{
  "name": "Task Tracker",
  "collections": [{
    "name": "tasks",
    "fields": [
      { "name": "title", "type": "text", "required": true },
      { "name": "status", "type": "select",
        "options": ["todo","in_progress","done"] },
      { "name": "due_date", "type": "date" }
    ]
  }],
  "pages": [{
    "path": "/", "title": "All Tasks",
    "components": [{
      "type": "table",
      "collection": "tasks"
    }]
  }]
}`;

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  // Typewriter effect for config preview
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTyped(EXAMPLE_CONFIG.slice(0, i));
      i++;
      if (i > EXAMPLE_CONFIG.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || user) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">AppForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm">
              Start Building <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Config → Full Stack App in seconds
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Build apps from{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              JSON config
            </span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            AppForge converts your structured configuration into a fully working web app —
            frontend, backend, and database. No coding required.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/auth/register" className="btn-primary text-base px-8 py-3 shadow-lg shadow-indigo-200 hover:shadow-indigo-300">
              <Zap className="w-4 h-4" /> Start Building Free
            </Link>
            <Link href="/auth/login" className="btn-secondary text-base px-8 py-3">
              Sign In to Dashboard
            </Link>
          </div>

          {/* Code preview */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-sm opacity-20" />
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl text-left">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="ml-2 text-xs text-gray-400 font-mono">app-config.json</span>
              </div>
              <pre className="p-5 text-sm font-mono text-green-400 leading-relaxed h-64 overflow-hidden">
                {typed}
                <span className="animate-pulse text-white">|</span>
              </pre>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent" />
            </div>

            {/* Arrow + result preview */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm text-sm font-medium text-gray-600">
                JSON Config
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-400" />
              <div className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2 shadow-md text-sm font-medium">
                <Zap className="w-4 h-4" /> Full Stack App ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500">Three steps from idea to deployed app</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-indigo-200 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg mb-4 shadow-lg shadow-indigo-200">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need</h2>
            <p className="text-gray-500">Built-in features that work out of the box</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="card p-5 hover:shadow-md hover:border-indigo-200 transition-all group">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMPLATES */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Start from a template</h2>
            <p className="text-gray-500">Pick a starter and customize from there</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { name: 'CRM', emoji: '👥', desc: 'Contacts, deals, pipeline stages', tags: ['contacts', 'deals', 'pipeline'] },
              { name: 'Task Tracker', emoji: '✅', desc: 'Tasks with status, priority & due dates', tags: ['tasks', 'kanban', 'due dates'] },
              { name: 'Inventory', emoji: '📦', desc: 'Products, SKUs, stock levels', tags: ['products', 'stock', 'categories'] },
            ].map(tpl => (
              <Link key={tpl.name} href="/auth/register"
                className="card p-6 hover:shadow-lg hover:border-indigo-300 transition-all group cursor-pointer">
                <div className="text-4xl mb-3">{tpl.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{tpl.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{tpl.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {tpl.tags.map(tag => (
                    <span key={tag} className="badge badge-blue text-xs">{tag}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to build?</h2>
          <p className="text-indigo-200 mb-8 text-lg">
            Create your first app in under 2 minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg text-base">
              <Zap className="w-4 h-4" /> Start Building Free
            </Link>
            <Link href="/auth/login"
              className="inline-flex items-center justify-center gap-2 bg-indigo-500/40 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-indigo-500/60 transition-colors text-base border border-indigo-400">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-300">AppForge</span>
          </div>
          <p className="text-xs">© 2026 AppForge · Build apps from config · Made by Aditi Singh</p>
          <div className="flex gap-4 text-xs">
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/auth/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
