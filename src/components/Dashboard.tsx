import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { DailyStats, ShotType } from "../types";
import { SHOT_TYPES } from "../constants";
import { motion } from "motion/react";
import { Trophy, Target, TrendingUp, Calendar } from "lucide-react";

interface DashboardProps {
  history: DailyStats[];
  currentSession: {
    makes: number;
    misses: number;
    type: ShotType;
  } | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ history, currentSession }) => {
  const chartData = history.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accuracy: day.shots.length > 0 
      ? Math.round((day.shots.filter(s => s.made).length / day.shots.length) * 100)
      : 0,
    total: day.shots.length
  })).slice(-7);

  const totalShots = history.reduce((acc, day) => acc + day.shots.length, 0);
  const totalMakes = history.reduce((acc, day) => acc + day.shots.filter(s => s.made).length, 0);
  const overallAccuracy = totalShots > 0 ? Math.round((totalMakes / totalShots) * 100) : 0;

  const getBestShotType = () => {
    const typeStats: Record<string, { makes: number; total: number }> = {};
    history.forEach(day => {
      day.shots.forEach(shot => {
        if (!typeStats[shot.type]) typeStats[shot.type] = { makes: 0, total: 0 };
        typeStats[shot.type].total++;
        if (shot.made) typeStats[shot.type].makes++;
      });
    });

    let bestType = "N/A";
    let maxAcc = -1;

    Object.entries(typeStats).forEach(([type, stats]) => {
      const acc = stats.makes / stats.total;
      if (acc > maxAcc && stats.total > 5) {
        maxAcc = acc;
        bestType = SHOT_TYPES.find(t => t.value === type)?.label || type;
      }
    });

    return bestType;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-5 h-5 text-blue-500" />}
          label="Overall Accuracy"
          value={`${overallAccuracy}%`}
          subValue={`${totalMakes}/${totalShots} shots`}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          label="Best Shot Type"
          value={getBestShotType()}
          subValue="Min. 5 shots"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          label="Total Sessions"
          value={history.length.toString()}
          subValue="Days tracked"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-purple-500" />}
          label="Last Session"
          value={history.length > 0 ? new Date(history[history.length - 1].date).toLocaleDateString() : "None"}
          subValue="Latest activity"
        />
      </div>

      {/* Progress Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Performance Trend</h3>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Accuracy %
            </div>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAcc)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gray-900 text-white p-8 rounded-3xl overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2">AI Coach Recommendations</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md">
            Based on your last {totalShots} shots, here's what you should focus on to improve your game.
          </p>
          <div className="space-y-3">
            {getRecommendations(history).map((rec, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm font-medium">{rec}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] -mr-32 -mt-32" />
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string; subValue: string }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
    <div className="text-2xl font-black text-gray-900 tracking-tighter">{value}</div>
    <div className="text-xs text-gray-500 mt-1">{subValue}</div>
  </motion.div>
);

const getRecommendations = (history: DailyStats[]) => {
  if (history.length === 0) return ["Start your first session to get AI insights!"];
  
  const typeStats: Record<string, { makes: number; total: number }> = {};
  history.forEach(day => {
    day.shots.forEach(shot => {
      if (!typeStats[shot.type]) typeStats[shot.type] = { makes: 0, total: 0 };
      typeStats[shot.type].total++;
      if (shot.made) typeStats[shot.type].makes++;
    });
  });

  const recs: string[] = [];
  
  // Find weakest area
  let weakestType = "";
  let minAcc = 1.1;
  Object.entries(typeStats).forEach(([type, stats]) => {
    const acc = stats.makes / stats.total;
    if (acc < minAcc && stats.total > 3) {
      minAcc = acc;
      weakestType = SHOT_TYPES.find(t => t.value === type)?.label || type;
    }
  });

  if (weakestType) {
    recs.push(`Focus more on ${weakestType} - your current accuracy is ${Math.round(minAcc * 100)}%`);
  }

  if (history.length < 3) {
    recs.push("Consistency is key! Try to get at least 3 sessions this week.");
  }

  const recentAcc = history[history.length - 1].shots.length > 0
    ? history[history.length - 1].shots.filter(s => s.made).length / history[history.length - 1].shots.length
    : 0;

  if (recentAcc > 0.7) {
    recs.push("Great form today! Try stepping back for some 3pt practice.");
  } else if (recentAcc < 0.4 && history[history.length - 1].shots.length > 10) {
    recs.push("Focus on your follow-through. Slow down your release.");
  }

  return recs.slice(0, 3);
};
