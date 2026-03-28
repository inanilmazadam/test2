import React, { useState, useEffect } from "react";
import { CameraView } from "./components/CameraView";
import { Dashboard } from "./components/Dashboard";
import { SHOT_TYPES, STORAGE_KEY, THEMES, THEME_KEY } from "./constants";
import { DailyStats, Shot, ShotType, SessionState, Theme } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { History, Settings, Plus, ChevronRight, Trophy, X, Trash2, Palette, Check } from "lucide-react";
import { cn } from "./lib/utils";

export default function App() {
  const [history, setHistory] = useState<DailyStats[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [session, setSession] = useState<SessionState>({
    isActive: false,
    type: "midrange",
    makes: 0,
    misses: 0,
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load history and theme on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const savedThemeId = localStorage.getItem(THEME_KEY);
    if (savedThemeId) {
      const theme = THEMES.find(t => t.id === savedThemeId);
      if (theme) setCurrentTheme(theme);
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  // Save theme when it changes
  useEffect(() => {
    localStorage.setItem(THEME_KEY, currentTheme.id);
  }, [currentTheme]);

  const handleShotDetected = (made: boolean) => {
    setSession(prev => ({
      ...prev,
      makes: made ? prev.makes + 1 : prev.makes,
      misses: made ? prev.misses : prev.misses + 1,
    }));

    // Add to current day's stats
    const today = new Date().toISOString().split('T')[0];
    const newShot: Shot = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: session.type,
      made,
    };

    setHistory(prev => {
      const existingDayIdx = prev.findIndex(d => d.date === today);
      if (existingDayIdx > -1) {
        const newHistory = [...prev];
        newHistory[existingDayIdx] = {
          ...newHistory[existingDayIdx],
          shots: [...newHistory[existingDayIdx].shots, newShot],
        };
        return newHistory;
      } else {
        return [...prev, { date: today, shots: [newShot] }];
      }
    });
  };

  const startSession = (type: ShotType) => {
    setSession({
      isActive: true,
      type,
      makes: 0,
      misses: 0,
    });
  };

  const endSession = () => {
    setSession(prev => ({ ...prev, isActive: false }));
  };

  const resetHistory = () => {
    if (confirm("Are you sure you want to clear all training history? This cannot be undone.")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
      setShowSettings(false);
    }
  };

  return (
    <div className={cn("min-h-screen text-gray-900 font-sans selection:bg-blue-100 relative transition-colors duration-500", currentTheme.color)}>
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none transition-all duration-700"
        style={{ 
          backgroundImage: `url(${currentTheme.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(20%)'
        }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Trophy className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase">HoopSense<span className="text-blue-600">AI</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <History className="w-5 h-5 text-gray-500" />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Dashboard */}
          <div className="lg:col-span-2 space-y-8">
            <header>
              <h1 className="text-4xl font-black tracking-tighter mb-2">Welcome back, Champ.</h1>
              <p className="text-gray-500 font-medium">Ready to improve your accuracy today?</p>
            </header>

            <Dashboard history={history} currentSession={session.isActive ? session : null} />
          </div>

          {/* Right Column: Quick Start & Recent */}
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Quick Start</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {SHOT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => startSession(type.value)}
                    className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">{type.label}</p>
                        <p className="text-xs text-gray-500">Start tracking session</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {history.slice().reverse().slice(0, 3).map((day, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                      <p className="text-xs text-gray-500">{day.shots.length} shots tracked</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-blue-600">
                        {day.shots.length > 0 ? Math.round((day.shots.filter(s => s.made).length / day.shots.length) * 100) : 0}%
                      </p>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Accuracy</p>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-400 font-medium">No sessions yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Camera Modal */}
      <AnimatePresence>
        {session.isActive && (
          <CameraView
            shotType={session.type}
            onShotDetected={handleShotDetected}
            onClose={endSession}
          />
        )}
      </AnimatePresence>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tighter">Training History</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                {history.slice().reverse().map((day, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                        <h3 className="text-xl font-black tracking-tight">
                          {new Date(day.date).toLocaleDateString('en-US', { day: 'numeric', weekday: 'long' })}
                        </h3>
                      </div>
                      <div className="bg-white px-3 py-1 rounded-full border border-gray-200 text-sm font-bold">
                        {day.shots.length > 0 ? Math.round((day.shots.filter(s => s.made).length / day.shots.length) * 100) : 0}%
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-3 rounded-2xl text-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Makes</p>
                        <p className="font-bold text-green-600">{day.shots.filter(s => s.made).length}</p>
                      </div>
                      <div className="bg-white p-3 rounded-2xl text-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Misses</p>
                        <p className="font-bold text-red-600">{day.shots.filter(s => !s.made).length}</p>
                      </div>
                      <div className="bg-white p-3 rounded-2xl text-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Total</p>
                        <p className="font-bold">{day.shots.length}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-20">
                    <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No history recorded yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white z-50 shadow-2xl p-8 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black tracking-tighter">Settings</h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-6">
                <section>
                  <div className="flex items-center gap-2 mb-4 text-gray-400">
                    <Palette className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Theme & Background</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setCurrentTheme(theme)}
                        className={cn(
                          "relative h-20 rounded-2xl overflow-hidden border-2 transition-all group",
                          currentTheme.id === theme.id ? "border-blue-500 ring-2 ring-blue-100" : "border-transparent hover:border-gray-200"
                        )}
                      >
                        <img 
                          src={theme.image} 
                          alt={theme.name} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-[10px] font-black text-white uppercase tracking-tighter">{theme.name}</span>
                        </div>
                        {currentTheme.id === theme.id && (
                          <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                <button
                  onClick={resetHistory}
                  className="w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5" />
                    <span>Clear All History</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">App Version</p>
                  <p className="font-bold text-gray-900">v1.1.0 (Custom Themes)</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
