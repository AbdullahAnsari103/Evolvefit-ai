import React, { useState, useRef, useEffect } from 'react';
import { ContestSubmission, Contest } from '../types';
import { saveContestSubmission, getContestSubmissions, getContests } from '../services/storageService';
import { analyzeContestProof } from '../services/geminiService';

interface LeaderboardUser {
    rank: number;
    name: string;
    points: string;
    img: string;
    streak?: number;
    isMe?: boolean;
}

// Confetti Component for Celebrations
const CelebrationEffect = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any[] = [];
        const colors = ['#22c55e', '#ffffff', '#eab308', '#3b82f6', '#ec4899'];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + Math.random() * 200,
                vx: Math.random() * 4 - 2,
                vy: -(Math.random() * 10 + 5),
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vr: Math.random() * 10 - 5
            });
        }

        let animationId: number;
        const animate = () => {
            if (!canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let activeParticles = 0;
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // Gravity
                p.rotation += p.vr;
                p.size *= 0.99; // Shrink

                if (p.size > 0.5 && p.y < canvas.height + 100) {
                    activeParticles++;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (activeParticles > 0) {
                animationId = requestAnimationFrame(animate);
            }
        };

        animate();
        return () => cancelAnimationFrame(animationId);
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-[200] pointer-events-none" />;
};

export const Contests: React.FC = () => {
    // --- Data ---
    const [globalLeaderboard] = useState<LeaderboardUser[]>([
        { rank: 1, name: "Sarah_Fit", points: "15,400", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200" },
        { rank: 2, name: "MikeLifts", points: "14,200", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200" },
        { rank: 3, name: "JennaRuns", points: "13,900", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&h=200" },
        { rank: 4, name: "Alex_Strong", points: "12,100", streak: 9, img: "https://ui-avatars.com/api/?name=Alex&background=random" },
        { rank: 5, name: "DavidGogginsFan", points: "11,850", streak: 0, img: "https://ui-avatars.com/api/?name=David&background=random" },
        { rank: 6, name: "YogaLover99", points: "10,200", streak: 15, img: "https://ui-avatars.com/api/?name=Yoga&background=random" },
    ]);

    // Initial Leaderboard state
    const [contestLeaderboard, setContestLeaderboard] = useState<LeaderboardUser[]>([
        { rank: 1, name: "AbsKing", points: "2,400", img: "https://ui-avatars.com/api/?name=King&background=random" },
        { rank: 2, name: "Sarah_Fit", points: "2,150", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200" },
        { rank: 3, name: "CoreCrusher", points: "1,900", img: "https://ui-avatars.com/api/?name=Core&background=random" },
        { rank: 42, name: "You", points: "850", img: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100", isMe: true },
        { rank: 43, name: "Ravi_Fit", points: "820", img: "https://ui-avatars.com/api/?name=Ravi&background=random" },
    ]);

    // Load contests from storage
    const [activeContests, setActiveContests] = useState<Contest[]>([]);

    useEffect(() => {
        const load = () => {
            const data = getContests();
            setActiveContests(data);
        };
        load();
        // Poll for new contests (simulating real-time)
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- State ---
    const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
    const [dashboardTab, setDashboardTab] = useState<'leaderboard' | 'submission'>('leaderboard');
    const [joinStatus, setJoinStatus] = useState<'idle' | 'processing' | 'success'>('idle');
    
    // Submission State
    const [proofMedia, setProofMedia] = useState<{ type: 'image' | 'video', data: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [aiVerdict, setAiVerdict] = useState<{ approved: boolean, reason: string, points: number } | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persistent Submission History
    const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);

    useEffect(() => {
        if (selectedContest) {
            setSubmissions(getContestSubmissions(selectedContest.id));
        }
    }, [selectedContest, submitting, dashboardTab]);

    // --- Actions ---

    const handleJoin = (id: number) => {
        setJoinStatus('processing');
        setTimeout(() => {
            setJoinStatus('success');
            setTimeout(() => {
                const updated = activeContests.map(c => 
                    c.id === id ? { ...c, isJoined: true, myRank: 42, myPoints: 850 } : c
                );
                setActiveContests(updated);
                
                // Update selected immediately to switch view
                const contest = updated.find(c => c.id === id) || null;
                setSelectedContest(contest);
                setJoinStatus('idle'); // Reset for next time
            }, 1000);
        }, 1500);
    };

    // Helper: Resize Image
    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800; // Limit resolution for API & Storage
                    const MAX_HEIGHT = 800;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    // Use JPEG with 0.7 quality to reduce size
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); 
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset previous state
        setAiVerdict(null);

        if (file.type.startsWith('video/')) {
            // Video Limit: 10MB to prevent browser crash / XHR errors
            if (file.size > 10 * 1024 * 1024) {
                alert("Video is too large. Please upload a clip under 10MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofMedia({ type: 'video', data: reader.result as string });
            };
            reader.readAsDataURL(file);
        } else {
            // Image Processing
            try {
                const resizedData = await resizeImage(file);
                setProofMedia({ type: 'image', data: resizedData });
            } catch (err) {
                console.error("Image processing failed", err);
                alert("Could not process image.");
            }
        }
    };

    const resetSubmission = () => {
        setProofMedia(null);
        setAiVerdict(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmitProof = async () => {
        if (!proofMedia || !selectedContest) return;
        setSubmitting(true);
        setAiVerdict(null);
        
        const userJson = localStorage.getItem('evolvefit_user');
        const userName = userJson ? JSON.parse(userJson).name : 'Unknown User';

        try {
            // 1. AI Analysis
            // Note: For video, sending large base64 might still fail if > 20MB. 
            // The file size check in handleProofUpload mitigates this.
            const base64 = proofMedia.data.split(',')[1];
            const verdict = await analyzeContestProof(base64, proofMedia.type, selectedContest);
            setAiVerdict(verdict);

            // 2. Save Submission with AI Verdict
            const newSubmission: ContestSubmission = {
                id: Date.now().toString(),
                contestId: selectedContest.id,
                contestTitle: selectedContest.title,
                userName: userName,
                timestamp: new Date().toISOString(),
                status: verdict.approved ? 'Approved' : 'Rejected',
                points: verdict.points,
                mediaType: proofMedia.type,
                // IMPORTANT: Do NOT save Video Data to localStorage to prevent Quota Exceeded
                // Only save image data (which is resized)
                mediaData: proofMedia.type === 'image' ? proofMedia.data : undefined
            };
            
            saveContestSubmission(newSubmission);

            // 3. Update Real-time State if Approved
            if (verdict.approved) {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 5000);

                const currentPoints = selectedContest.myPoints || 850;
                const newPoints = currentPoints + verdict.points;
                
                setContestLeaderboard(prev => prev.map(u => 
                    u.isMe ? { ...u, points: newPoints.toLocaleString() } : u
                ));

                const updatedContests = activeContests.map(c => 
                    c.id === selectedContest.id ? { ...c, myPoints: newPoints } : c
                );
                setActiveContests(updatedContests);
                setSelectedContest(prev => prev ? { ...prev, myPoints: newPoints } : null);
            }

        } catch (e) {
            console.error(e);
            alert("Verification issue. If uploading video, ensure it is short (<10s).");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // --- UI Components ---

    const renderPodium = (list: LeaderboardUser[]) => (
        <div className="flex justify-center items-end gap-2 md:gap-4 py-8">
            {/* 2nd Place */}
            <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-slate-300 p-1 relative shadow-[0_0_20px_rgba(203,213,225,0.2)] group-hover:scale-105 transition-transform">
                    <img src={list[1].img} className="w-full h-full rounded-full object-cover" />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-300 text-black text-xs font-black px-2 py-0.5 rounded-full border-2 border-dark-900">#2</div>
                </div>
                <p className="text-white font-bold mt-4 text-xs md:text-sm">{list[1].name}</p>
                <p className="text-slate-400 text-[10px] md:text-xs font-medium">{list[1].points}</p>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-8 group cursor-pointer z-10">
                <div className="relative">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-brand-500 p-1 relative shadow-[0_0_40px_rgba(34,197,94,0.4)] group-hover:scale-105 transition-transform">
                        <img src={list[0].img} className="w-full h-full rounded-full object-cover" />
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-brand-500 text-black text-sm font-black px-4 py-1 rounded-full border-4 border-dark-900 shadow-lg">#1</div>
                    </div>
                </div>
                <p className="text-white font-bold mt-6 text-sm md:text-lg">{list[0].name}</p>
                <p className="text-brand-500 text-xs md:text-sm font-bold tracking-widest">{list[0].points} PTS</p>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-amber-600 p-1 relative shadow-[0_0_20px_rgba(217,119,6,0.2)] group-hover:scale-105 transition-transform">
                    <img src={list[2].img} className="w-full h-full rounded-full object-cover" />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-black text-xs font-black px-2 py-0.5 rounded-full border-2 border-dark-900">#3</div>
                </div>
                <p className="text-white font-bold mt-4 text-xs md:text-sm">{list[2].name}</p>
                <p className="text-slate-400 text-[10px] md:text-xs font-medium">{list[2].points}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500 relative">
            {showCelebration && <CelebrationEffect />}
            
            {/* Main Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                     <h2 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">Competitive Arena</h2>
                     <h1 className="text-3xl font-black text-white italic">LEADERBOARDS</h1>
                </div>
            </div>

            {/* Global Leaderboard Preview */}
            <div className="bg-gradient-to-br from-dark-800 to-black rounded-[2rem] p-6 border border-white/5 relative overflow-hidden shadow-2xl">
                {/* Decorative BG */}
                <div className="absolute top-0 right-0 p-10 opacity-5 blur-xl bg-brand-500/30 rounded-full w-64 h-64 pointer-events-none"></div>
                
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 text-center">Global Rankings</h2>
                <h3 className="text-2xl font-black text-white text-center mb-4 tracking-tight">WEEKLY CHAMPIONS</h3>
                {renderPodium(globalLeaderboard)}
            </div>

            {/* Active Contests Grid */}
            <div>
                <div className="flex justify-between items-center mb-6 mt-12">
                    <h3 className="text-xl font-bold text-white tracking-tight">Active Challenges</h3>
                    <div className="h-px bg-white/10 flex-1 ml-6"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeContests.map(contest => (
                        <div 
                            key={contest.id} 
                            onClick={() => {
                                setSelectedContest(contest);
                                setDashboardTab('leaderboard'); 
                            }}
                            className="relative h-64 rounded-3xl overflow-hidden group border border-white/5 cursor-pointer shadow-lg hover:shadow-brand-500/10 transition-all hover:-translate-y-1"
                        >
                            <img src={contest.image} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                            
                            <div className="absolute top-4 right-4 z-10">
                                {contest.isJoined ? (
                                    <span className="bg-brand-500 text-black text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                                        <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
                                        ACTIVE
                                    </span>
                                ) : (
                                    <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/20">
                                        ENDS IN {contest.daysLeft} DAYS
                                    </span>
                                )}
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
                                <h4 className="text-white font-black text-2xl leading-none mb-3 italic">{contest.title}</h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                                        <span className={contest.color + " text-sm"}>{contest.icon}</span>
                                        <span className="text-slate-200 text-xs font-bold uppercase tracking-wide">{contest.prize}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                                        <span className="text-slate-400 text-xs">👥</span>
                                        <span className="text-slate-200 text-xs font-bold">{contest.participantsCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sticky Global Rank Footer */}
            <div className="fixed bottom-0 left-0 right-0 md:left-auto md:w-full md:max-w-7xl md:mx-auto p-4 z-40 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl pointer-events-auto max-w-sm mx-auto md:mr-0">
                     <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full border-2 border-brand-500 overflow-hidden relative">
                             <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-brand-500/20"></div>
                         </div>
                         <div>
                            <p className="text-white font-bold text-sm">Your Global Rank</p>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-white italic">#42</span>
                                <span className="text-[10px] text-brand-500 font-bold bg-brand-500/10 px-1.5 rounded">TOP 5%</span>
                            </div>
                         </div>
                     </div>
                </div>
            </div>

            {/* === FULL SCREEN CONTEST IMMERSIVE PAGE === */}
            {selectedContest && (
                <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-300 overflow-hidden flex flex-col">
                    
                    {/* Ambient Background */}
                    <div className="absolute inset-0 z-0">
                        <img src={selectedContest.image} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60 backdrop-blur-[2px]"></div>
                        <div className="absolute inset-0 bg-black/40"></div>
                    </div>

                    {/* Content Scroll Wrapper */}
                    <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-7xl mx-auto min-h-full flex flex-col p-6 md:p-12">
                            
                            {/* Header Nav */}
                            <div className="flex justify-between items-start mb-12">
                                <button 
                                    onClick={() => setSelectedContest(null)}
                                    className="group flex items-center gap-3 text-slate-300 hover:text-white transition-colors bg-black/20 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                    <span className="font-bold text-sm tracking-widest uppercase">Back to Arena</span>
                                </button>
                            </div>

                            {/* Hero Section */}
                            <div className="mb-16 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 border border-brand-500/30 bg-brand-500/10 px-3 py-1 rounded-full mb-6 backdrop-blur-sm">
                                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                                    <span className="text-brand-500 text-xs font-bold uppercase tracking-widest">{selectedContest.isJoined ? 'Active Mission' : 'Open Challenge'}</span>
                                </div>
                                <h1 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter mb-6 uppercase leading-none drop-shadow-2xl">
                                    {selectedContest.title}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8 text-slate-300 font-medium">
                                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
                                        <span className="text-2xl">👥</span> 
                                        <div>
                                            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Competitors</p>
                                            <p className="text-white font-bold text-lg leading-none">{selectedContest.participantsCount}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
                                        <span className="text-2xl">🏆</span> 
                                        <div>
                                            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Grand Prize</p>
                                            <p className="text-white font-bold text-lg leading-none">{selectedContest.prize}</p>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
                                        <span className="text-2xl">⏳</span> 
                                        <div>
                                            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Time Left</p>
                                            <p className="text-white font-bold text-lg leading-none">{selectedContest.daysLeft} Days</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dashboard or Marketing View */}
                            {!selectedContest.isJoined ? (
                                /* Marketing Layout */
                                <div className="grid md:grid-cols-2 gap-12 items-start animate-in slide-in-from-bottom-8 duration-700">
                                   <div className="space-y-10">
                                        <div className="prose prose-invert prose-lg">
                                            <h3 className="text-brand-500 uppercase tracking-widest font-bold text-sm mb-4 border-l-4 border-brand-500 pl-4">Mission Briefing</h3>
                                            <p className="text-slate-200 leading-relaxed text-2xl font-light">{selectedContest.description}</p>
                                        </div>
                                        <div className="space-y-6">
                                             <h3 className="text-slate-400 uppercase tracking-widest font-bold text-sm border-l-4 border-slate-600 pl-4">Directives</h3>
                                             <ul className="space-y-4">
                                                {selectedContest.rules.map((rule, i) => (
                                                    <li key={i} className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                                        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-black font-bold text-sm shrink-0">{i+1}</div>
                                                        <span className="text-white font-medium text-lg">{rule}</span>
                                                    </li>
                                                ))}
                                             </ul>
                                        </div>
                                   </div>
                                   
                                   <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center sticky top-8 shadow-2xl">
                                        <h3 className="text-3xl font-black text-white italic mb-4">READY TO COMPETE?</h3>
                                        <p className="text-slate-400 mb-10 text-lg">Join {selectedContest.participantsCount} others and prove your discipline. Top performers receive exclusive badges.</p>
                                        
                                        {joinStatus === 'idle' && (
                                            <button 
                                                onClick={() => handleJoin(selectedContest!.id)}
                                                className="w-full bg-brand-500 hover:bg-brand-400 text-black font-black text-xl py-6 rounded-2xl transition-all hover:scale-[1.02] shadow-[0_0_40px_rgba(34,197,94,0.4)] flex items-center justify-center gap-3 uppercase tracking-wide"
                                            >
                                                Accept Challenge
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                            </button>
                                        )}
                                        {joinStatus === 'processing' && (
                                            <button disabled className="w-full bg-dark-800 text-slate-400 font-bold text-xl py-6 rounded-2xl border border-white/10 flex items-center justify-center gap-3">
                                                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                INITIALIZING...
                                            </button>
                                        )}
                                        {joinStatus === 'success' && (
                                            <button disabled className="w-full bg-brand-500 text-black font-black text-xl py-6 rounded-2xl flex items-center justify-center gap-3 animate-in zoom-in">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                YOU'RE IN!
                                            </button>
                                        )}
                                   </div>
                                </div>
                            ) : (
                                /* Dashboard Layout */
                                <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-8 duration-700 delay-100">
                                     {/* Custom Tabs */}
                                     <div className="flex gap-8 border-b border-white/10 mb-8 sticky top-0 z-20 bg-black/50 backdrop-blur-xl pt-4 -mx-6 px-6 md:-mx-12 md:px-12">
                                        <button 
                                            onClick={() => setDashboardTab('leaderboard')}
                                            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors ${dashboardTab === 'leaderboard' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Live Standings
                                        </button>
                                        <button 
                                            onClick={() => setDashboardTab('submission')}
                                            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors ${dashboardTab === 'submission' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Proof Submission
                                        </button>
                                     </div>
                                     
                                     {/* Tab Content */}
                                     <div className="flex-1 max-w-6xl">
                                        {dashboardTab === 'leaderboard' && (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                {/* My Stats Banner */}
                                                <div className="bg-gradient-to-r from-brand-900/40 via-black/40 to-black/40 border border-brand-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden backdrop-blur-md">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                                                    
                                                    <div className="flex items-center gap-6 relative z-10">
                                                        <div className="w-20 h-20 rounded-full border-4 border-brand-500 p-1">
                                                            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100" className="w-full h-full rounded-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <p className="text-brand-500 font-bold text-xs uppercase tracking-widest mb-1">Current Standing</p>
                                                            <h3 className="text-white text-3xl md:text-4xl font-black italic">RANK #{selectedContest.myRank}</h3>
                                                            <p className="text-slate-400 text-sm mt-1">Top 15% of competitors</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-8 relative z-10 bg-black/40 px-6 py-4 rounded-2xl border border-white/10">
                                                        <div className="text-center">
                                                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">TOTAL POINTS</p>
                                                            <p className="text-white font-black text-2xl">{selectedContest.myPoints}</p>
                                                        </div>
                                                        <div className="w-px h-8 bg-white/10"></div>
                                                        <div className="text-center">
                                                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">STREAK</p>
                                                            <p className="text-brand-500 font-black text-2xl">🔥 12</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Top 3 */}
                                                {renderPodium(contestLeaderboard)}

                                                {/* List */}
                                                <div className="space-y-3 pt-4">
                                                    {contestLeaderboard.map((user) => (
                                                        <div key={user.rank} className={`rounded-2xl p-4 flex items-center justify-between border transition-all backdrop-blur-md ${user.isMe ? 'bg-brand-500/10 border-brand-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)] scale-[1.02]' : 'bg-black/40 border-white/5 hover:bg-black/60'}`}>
                                                            <div className="flex items-center gap-6">
                                                                <span className={`font-black w-8 text-center text-lg ${user.isMe ? 'text-brand-500' : 'text-slate-500'}`}>{user.rank}</span>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                                                        <img src={user.img} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <p className={`font-bold text-sm ${user.isMe ? 'text-brand-500' : 'text-white'}`}>{user.name} {user.isMe && '(You)'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                {user.streak && <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-1 rounded font-bold">🔥 {user.streak}</span>}
                                                                <span className="text-white font-black text-sm tracking-wide bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">{user.points}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {dashboardTab === 'submission' && (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                                                    {/* Upload Area */}
                                                    <div className="md:col-span-3">
                                                        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 h-full flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[400px]">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                            
                                                            <h3 className="text-white font-bold text-2xl mb-2 relative z-10">Log Today's Effort</h3>
                                                            <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto relative z-10">Upload proof to earn points. Video snippets or workout selfies accepted.</p>

                                                            {proofMedia ? (
                                                                <div className="mb-8 relative rounded-2xl overflow-hidden border border-white/10 h-64 w-full max-w-sm group/img mx-auto shadow-2xl bg-black">
                                                                    {proofMedia.type === 'video' ? (
                                                                        <video src={proofMedia.data} className="w-full h-full object-cover" autoPlay loop muted />
                                                                    ) : (
                                                                        <img src={proofMedia.data} className="w-full h-full object-cover" />
                                                                    )}
                                                                    
                                                                    {/* AI Verdict Overlay - Now handles stuck state better */}
                                                                    {aiVerdict && (
                                                                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 z-20">
                                                                            {aiVerdict.approved ? (
                                                                                <>
                                                                                    <div className="text-6xl mb-4 animate-bounce">🎉</div>
                                                                                    <h4 className="text-brand-500 font-black text-3xl uppercase italic mb-2">Approved!</h4>
                                                                                    <p className="text-white font-bold text-xl">+{aiVerdict.points} Points</p>
                                                                                    <p className="text-slate-400 text-xs mt-2 max-w-[250px] text-center">{aiVerdict.reason}</p>
                                                                                    <div className="mt-6 flex flex-col gap-3 w-full max-w-[200px]">
                                                                                        <button 
                                                                                            onClick={resetSubmission}
                                                                                            className="w-full bg-brand-500 hover:bg-brand-400 text-black font-bold py-3 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20"
                                                                                        >
                                                                                            Submit Another
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={() => setDashboardTab('leaderboard')}
                                                                                            className="w-full border border-white/20 hover:bg-white/10 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest"
                                                                                        >
                                                                                            View Ranking
                                                                                        </button>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <div className="text-5xl mb-4">❌</div>
                                                                                    <h4 className="text-red-500 font-black text-2xl uppercase italic">Rejected</h4>
                                                                                    <p className="text-slate-300 text-sm text-center mt-2 max-w-[200px]">{aiVerdict.reason}</p>
                                                                                    <button 
                                                                                        onClick={resetSubmission}
                                                                                        className="mt-6 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wide"
                                                                                    >
                                                                                        Try Again
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {!aiVerdict && (
                                                                        <button 
                                                                            onClick={() => setProofMedia(null)}
                                                                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white font-bold backdrop-blur-sm z-10"
                                                                        >
                                                                            Change File
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div 
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="border-2 border-dashed border-white/10 rounded-3xl h-56 w-full max-w-sm flex flex-col items-center justify-center mb-8 cursor-pointer hover:border-brand-500 hover:bg-white/5 transition-all relative z-10 group/drop"
                                                                >
                                                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover/drop:scale-110 transition-transform shadow-lg border border-white/10">
                                                                        <span className="text-3xl">📤</span>
                                                                    </div>
                                                                    <span className="text-sm text-slate-400 font-bold group-hover/drop:text-white transition-colors">Tap to Upload Photo/Video</span>
                                                                </div>
                                                            )}
                                                            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleProofUpload} />

                                                            {!aiVerdict && (
                                                                <button 
                                                                    onClick={handleSubmitProof}
                                                                    disabled={!proofMedia || submitting}
                                                                    className="w-full max-w-sm bg-brand-500 text-black font-black py-4 rounded-xl hover:bg-brand-400 transition-all disabled:opacity-50 disabled:grayscale shadow-[0_0_20px_rgba(34,197,94,0.3)] relative z-10 active:scale-95 flex items-center justify-center gap-3"
                                                                >
                                                                    {submitting ? (
                                                                        <>
                                                                            <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                                            AI VERIFYING...
                                                                        </>
                                                                    ) : (
                                                                        'SUBMIT ENTRY'
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Timeline */}
                                                    <div className="md:col-span-2">
                                                        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 h-full">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Submission History</h4>
                                                            {submissions.length === 0 ? (
                                                                <div className="text-center py-10 opacity-50">
                                                                    <p className="text-sm text-slate-400">No submissions yet.</p>
                                                                </div>
                                                            ) : (
                                                                <div className="relative pl-4 border-l border-white/10 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
                                                                    {submissions.map((sub, idx) => (
                                                                        <div key={sub.id} className="relative">
                                                                            <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full border-2 border-black ${sub.status === 'Approved' ? 'bg-brand-500' : sub.status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                                                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{formatDate(sub.timestamp)}</span>
                                                                                    <span className="text-lg">
                                                                                        {sub.status === 'Approved' ? '✅' : sub.status === 'Pending' ? '⏳' : '❌'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex justify-between items-center">
                                                                                    <div className="flex items-center gap-3">
                                                                                         <div className="w-8 h-8 rounded-lg bg-black border border-white/10 overflow-hidden flex items-center justify-center">
                                                                                             {sub.mediaData ? (
                                                                                                 sub.mediaType === 'video' ? <video src={sub.mediaData} className="w-full h-full object-cover" /> : <img src={sub.mediaData} className="w-full h-full object-cover" />
                                                                                             ) : (
                                                                                                 <span className="text-xs">{sub.mediaType === 'video' ? '🎥' : '📷'}</span>
                                                                                             )}
                                                                                         </div>
                                                                                         <span className={`text-xs font-bold px-2 py-0.5 rounded ${sub.status === 'Approved' ? 'bg-brand-500/10 text-brand-500' : sub.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>{sub.status}</span>
                                                                                    </div>
                                                                                    <span className="font-bold text-white text-sm">{sub.points} pts</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                     </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
