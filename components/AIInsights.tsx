import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { UserProfile, DailyLog } from '../types';
import { getRecentLogs } from '../services/storageService';
import { generateInsightAnalysis } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AIInsightsProps {
    user: UserProfile;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ user }) => {
    const [data, setData] = useState<DailyLog[]>([]);
    const [insight, setInsight] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const recentLogs = getRecentLogs(7);
            // Sort by date just in case
            recentLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            // Format for charts
            setData(recentLogs);

            // Generate AI Insight
            const analysis = await generateInsightAnalysis(recentLogs, user.targets);
            setInsight(analysis);
            setLoading(false);
        };
        loadData();
    }, [user]);

    // Chart Data Preparation
    const calorieData = data.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
        calories: d.totalMacros.calories,
        target: user.targets.calories
    }));

    const macroData = data.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
        protein: d.totalMacros.protein,
        targetProtein: user.targets.protein
    }));

    // Stats
    const avgCals = Math.round(data.reduce((acc, curr) => acc + curr.totalMacros.calories, 0) / 7);
    const avgProtein = Math.round(data.reduce((acc, curr) => acc + curr.totalMacros.protein, 0) / 7);
    const consistency = Math.round((data.filter(d => d.totalMacros.calories > 0).length / 7) * 100);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-dark-900 border border-white/10 p-4 rounded-xl shadow-xl">
                    <p className="text-white font-bold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs font-medium" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-brand-500 font-bold tracking-widest text-xs uppercase">Crunching Metabolic Data...</p>
            </div>
        );
    }

    return (
        <div className="pb-20 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">Metabolic Intelligence</h2>
                    <h1 className="text-3xl font-black text-white italic">WEEKLY INSIGHTS</h1>
                </div>
                <div className="flex gap-4">
                     <div className="bg-dark-800 border border-white/5 rounded-2xl px-5 py-3 text-center min-w-[100px]">
                         <p className="text-[10px] text-slate-500 font-bold uppercase">Avg Intake</p>
                         <p className="text-xl font-black text-white">{avgCals} <span className="text-xs text-slate-500">kcal</span></p>
                     </div>
                     <div className="bg-dark-800 border border-white/5 rounded-2xl px-5 py-3 text-center min-w-[100px]">
                         <p className="text-[10px] text-slate-500 font-bold uppercase">Consistency</p>
                         <p className="text-xl font-black text-white">{consistency}%</p>
                     </div>
                </div>
            </div>

            {/* AI Analysis Card */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-[2rem] p-8 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">AI Coach Analysis</h3>
                        <p className="text-xs text-blue-400 font-bold uppercase tracking-wide">Last 7 Days Evaluation</p>
                    </div>
                </div>
                
                <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5">
                    <ReactMarkdown>{insight}</ReactMarkdown>
                </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Calorie Trend */}
                <div className="bg-dark-800 rounded-3xl p-6 border border-white/5 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white">Calorie Consistency</h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                             <span className="w-2 h-2 rounded-full bg-brand-500"></span> Intake
                             <span className="w-2 h-2 rounded-full bg-slate-600"></span> Goal
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={calorieData}>
                                <defs>
                                    <linearGradient id="colorCals" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" tick={{fill: '#888', fontSize: 10}} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" tick={{fill: '#888', fontSize: 10}} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="calories" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorCals)" name="Calories" />
                                <Area type="monotone" dataKey="target" stroke="#475569" strokeDasharray="5 5" strokeWidth={2} fill="none" name="Target" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Protein Trend */}
                <div className="bg-dark-800 rounded-3xl p-6 border border-white/5 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white">Protein Performance</h3>
                         <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                             <span className="w-2 h-2 rounded-full bg-blue-500"></span> Protein
                             <span className="w-2 h-2 rounded-full bg-slate-600"></span> Target
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={macroData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" tick={{fill: '#888', fontSize: 10}} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" tick={{fill: '#888', fontSize: 10}} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="protein" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={12} name="Protein">
                                    {macroData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.protein >= entry.targetProtein ? '#3b82f6' : '#1e3a8a'} />
                                    ))}
                                </Bar>
                                <Area type="monotone" dataKey="targetProtein" stroke="#475569" strokeDasharray="5 5" strokeWidth={2} fill="none" name="Target" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed History Table */}
            <div className="bg-dark-800 rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="font-bold text-white">Log History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-black/20 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Calories</th>
                                <th className="px-6 py-4">Protein</th>
                                <th className="px-6 py-4">Carbs</th>
                                <th className="px-6 py-4">Fats</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((log, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{new Date(log.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{log.totalMacros.calories}</td>
                                    <td className="px-6 py-4">{log.totalMacros.protein}g</td>
                                    <td className="px-6 py-4">{log.totalMacros.carbs}g</td>
                                    <td className="px-6 py-4">{log.totalMacros.fats}g</td>
                                    <td className="px-6 py-4">
                                        {log.totalMacros.calories >= user.targets.calories * 0.9 ? (
                                            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded font-bold uppercase">On Track</span>
                                        ) : (
                                            <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded font-bold uppercase">Deficit</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
