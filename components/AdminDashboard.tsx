"use client"

import React, { useState, useEffect } from "react"
import type { ContestSubmission, Contest, Post } from "../types"
import {
  getContestSubmissions,
  updateSubmissionStatus,
  getAllUsers,
  getPlatformStats,
  saveContest,
  getPosts,
  deletePost,
  banUser,
  deleteContest,
  getContests,
  deleteUser,
} from "../services/storageService"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { realtimeManager, type RealtimeSubscription } from "@/lib/realtime-updates"

export const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "verifications" | "contests" | "content">(
    "overview",
  )

  // Live Data State
  const [stats, setStats] = useState({
    userCount: 0,
    totalMealsLogged: 0,
    pendingVerifications: 0,
    activeContests: 0,
    revenue: 0,
    databaseSize: 0,
    totalPosts: 0,
  })

  const [submissions, setSubmissions] = useState<ContestSubmission[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [adminContests, setAdminContests] = useState<Contest[]>([])
  const [loadDataPoints, setLoadDataPoints] = useState<any[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Contest Creation State
  const [newContest, setNewContest] = useState<Partial<Contest>>({
    title: "",
    description: "",
    prize: "",
    participantsCount: "0",
    daysLeft: 30,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1600&q=80", // Default gym img
    rules: [""],
  })

  const subscriptionsRef = React.useRef<RealtimeSubscription[]>([])

  // --- Real-time Data Fetching & System Monitor ---
  useEffect(() => {
    const refreshData = () => {
      // 1. Platform Stats
      const currentStats = getPlatformStats()
      setStats(currentStats)

      // 2. Pending Submissions
      const allSubs = getContestSubmissions()
      const pending = allSubs
        .filter((s: any) => s.status === "Pending")
        .map((s: any) => ({
          ...s,
          userName: s.userName || "Unknown User",
          contestTitle: s.contestTitle || "Unknown Contest",
        }))
      setSubmissions(pending)

      // 3. User List - Using the updated getAllUsers from storageService
      const allUsers = getAllUsers()
      setUsers(allUsers)

      // 4. Community Posts (Only refresh if not editing or dragging, here simplified to always for demo)
      setPosts((prev) => {
        const latest = getPosts()
        // Simple equality check to prevent unneeded re-renders if nothing changed
        return JSON.stringify(latest) !== JSON.stringify(prev) ? latest : prev
      })

      // 5. Active Contests
      setAdminContests(getContests())

      // 6. Update System Load Graph (Simulated Heartbeat based on Real Data Size)
      setLoadDataPoints((prev) => {
        const now = new Date()
        const timeLabel = now.toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        // Simulate CPU load based on "database size" (localstorage length) plus random noise
        const baseLoad = Math.min((currentStats.databaseSize / 10000) * 10, 30)
        const randomFluctuation = Math.random() * 20
        const newPoint = {
          time: timeLabel,
          load: Math.round(baseLoad + randomFluctuation + 10), // Base idle load ~10%
        }
        const updated = [...prev, newPoint]
        if (updated.length > 20) updated.shift() // Keep last 20 points
        return updated
      })
    }

    refreshData()

    const contestSub = realtimeManager.subscribe("contests", () => {
      refreshData()
      setToastMessage("Contest activity detected - data refreshed")
    })

    const communitySub = realtimeManager.subscribe("community", () => {
      refreshData()
      setToastMessage("Community activity detected - feed updated")
    })

    subscriptionsRef.current = [contestSub, communitySub]

    const interval = setInterval(refreshData, 2000) // 2-second heartbeat

    return () => {
      clearInterval(interval)
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe())
      subscriptionsRef.current = []
    }
  }, [])

  // Toast Timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // --- Actions with Real-time Broadcast ---

  const handleVerdict = (id: string, status: "Approved" | "Rejected") => {
    updateSubmissionStatus(id, status)
    // Optimistic UI update
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
    setToastMessage(`Submission ${status}`)

    realtimeManager.broadcast("admin-update", {
      type: "admin-update",
      data: {
        event: "submission_verified",
        submissionId: id,
        status,
        timestamp: Date.now(),
      },
    })
  }

  const handleDeletePost = (id: number) => {
    const updatedList = deletePost(id)
    setPosts(updatedList)
    setToastMessage("Post Deleted Successfully")

    realtimeManager.broadcast("community", {
      type: "post",
      data: {
        event: "post_deleted",
        postId: id,
        timestamp: Date.now(),
      },
    })
  }

  const handleBanUser = (username: string) => {
    if (confirm(`Ban ${username} and remove all posts?`)) {
      const updatedList = banUser(username)
      setPosts(updatedList)
      setToastMessage(`User ${username} Banned`)

      realtimeManager.broadcast("admin-update", {
        type: "admin-update",
        data: {
          event: "user_banned",
          username,
          timestamp: Date.now(),
        },
      })
    }
  }

  const handleCreateContest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContest.title || !newContest.description) return

    const contest: Contest = {
      id: Date.now(),
      title: newContest.title!,
      description: newContest.description!,
      prize: newContest.prize || "Badge",
      participantsCount: "0",
      daysLeft: newContest.daysLeft || 30,
      image: newContest.image!,
      rules: newContest.rules || ["Have fun"],
      icon: "🆕",
      color: "text-purple-500",
    }

    saveContest(contest)
    setToastMessage("Contest Deployed")
    // Update local state immediately
    setAdminContests((prev) => [contest, ...prev])
    setNewContest({ ...newContest, title: "", description: "" })

    realtimeManager.broadcast("contests", {
      type: "contest",
      data: {
        event: "new_contest",
        contest,
        timestamp: Date.now(),
      },
    })
  }

  const handleDeleteContest = (id: number) => {
    if (confirm("Delete this contest permanently? This action cannot be undone.")) {
      deleteContest(id)
      setToastMessage("Contest Deleted")
      setAdminContests((prev) => prev.filter((c) => c.id !== id))

      realtimeManager.broadcast("contests", {
        type: "contest",
        data: {
          event: "contest_deleted",
          contestId: id,
          timestamp: Date.now(),
        },
      })
    }
  }

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete user "${userName}"? This will wipe all their data.`)) {
      const updatedUsers = deleteUser(userId)
      setUsers(updatedUsers)
      setToastMessage("User Deleted Successfully")

      realtimeManager.broadcast("admin-update", {
        type: "admin-update",
        data: {
          event: "user_deleted",
          userId,
          userName,
          timestamp: Date.now(),
        },
      })
    }
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans flex flex-col md:flex-row relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 bg-brand-500 text-black px-6 py-3 rounded-xl font-bold shadow-2xl z-[100] animate-in slide-in-from-right-10 fade-in duration-300 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Lightbox for Images */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-full">
            <img
              src={selectedImage || "/placeholder.svg"}
              className="w-full h-full object-contain rounded-xl border border-white/10 shadow-2xl"
            />
            <button className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <p className="text-center text-slate-400 mt-4 text-sm font-bold tracking-widest">CONTENT INSPECTION</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-full md:w-64 bg-dark-900 border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-black font-bold text-xs">
            EF
          </div>
          <span className="font-bold text-white tracking-wide">ADMIN</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "overview", icon: "📊", label: "Overview" },
            { id: "users", icon: "👥", label: "Users" },
            { id: "contests", icon: "🏆", label: "Contests" },
            { id: "verifications", icon: "✅", label: "Approvals", badge: submissions.length },
            { id: "content", icon: "🛡️", label: "Moderation" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? "bg-brand-500/10 text-brand-500 border border-brand-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <div className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-2 text-slate-500 hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Exit Portal
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto h-screen bg-black p-6 md:p-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white capitalize">
            {activeTab === "content" ? "Content Moderation" : activeTab + " Dashboard"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-green-500 uppercase">Live Connection</span>
            </div>
            <div className="w-8 h-8 bg-dark-800 rounded-full flex items-center justify-center border border-white/10">
              👤
            </div>
          </div>
        </div>

        {/* --- TAB CONTENT: OVERVIEW --- */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Real Data Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Total Users</h3>
                <p className="text-3xl font-black text-white">{stats.userCount}</p>
                <p className="text-xs text-slate-500 mt-2">Registered Accounts</p>
              </div>
              <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Est. Revenue</h3>
                <p className="text-3xl font-black text-green-500">${stats.revenue}</p>
                <p className="text-xs text-slate-500 mt-2">Based on Pro users</p>
              </div>
              <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Total Interactions</h3>
                <p className="text-3xl font-black text-blue-400">{stats.totalMealsLogged}</p>
                <p className="text-xs text-slate-500 mt-2">Meals Logged</p>
              </div>
              <div className="bg-dark-900 border border-white/5 p-6 rounded-2xl">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Community Posts</h3>
                <p className="text-3xl font-black text-purple-500">{stats.totalPosts}</p>
                <p className="text-xs text-slate-500 mt-2">Total Feed Items</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* System Load Graph */}
              <div className="lg:col-span-2 bg-dark-900 border border-white/5 rounded-3xl p-8 h-96 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-white font-bold text-lg">System Load Monitor</h4>
                  <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded font-bold uppercase">
                    Real-time
                  </span>
                </div>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={loadDataPoints}>
                      <defs>
                        <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis
                        dataKey="time"
                        stroke="#666"
                        tick={{ fill: "#888", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#666"
                        tick={{ fill: "#888", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333" }} />
                      <Area
                        type="monotone"
                        dataKey="load"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorLoad)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Server Stats */}
              <div className="bg-dark-900 border border-white/5 rounded-3xl p-8">
                <h4 className="text-white font-bold mb-4">Database Health</h4>
                <div className="space-y-6">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Storage Usage</p>
                    <div className="w-full bg-dark-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: "12%" }}></div>
                    </div>
                    <p className="text-right text-xs text-slate-400 mt-1">
                      {(stats.databaseSize / 1024).toFixed(2)} KB / 5 MB
                    </p>
                  </div>
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Active Sessions</p>
                    <p className="text-2xl font-black text-white">{stats.userCount > 0 ? "1" : "0"}</p>
                    <p className="text-[10px] text-green-500 mt-1">● Localhost Connected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: CONTESTS (CREATE & MANAGE) --- */}
        {activeTab === "contests" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-dark-900 border border-white/5 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Deploy New Contest</h3>
              <form onSubmit={handleCreateContest} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Challenge Title</label>
                    <input
                      value={newContest.title}
                      onChange={(e) => setNewContest({ ...newContest, title: e.target.value })}
                      className="w-full bg-dark-800 border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                      placeholder="e.g. Winter Bulk 2024"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Description</label>
                    <textarea
                      value={newContest.description}
                      onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
                      className="w-full bg-dark-800 border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none h-32 resize-none"
                      placeholder="Describe the challenge rules and goals..."
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Grand Prize</label>
                    <input
                      value={newContest.prize}
                      onChange={(e) => setNewContest({ ...newContest, prize: e.target.value })}
                      className="w-full bg-dark-800 border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                      placeholder="e.g. 1 Year Premium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Duration (Days)</label>
                      <input
                        type="number"
                        value={newContest.daysLeft}
                        onChange={(e) => setNewContest({ ...newContest, daysLeft: Number.parseInt(e.target.value) })}
                        className="w-full bg-dark-800 border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Image URL</label>
                      <input
                        value={newContest.image}
                        onChange={(e) => setNewContest({ ...newContest, image: e.target.value })}
                        className="w-full bg-dark-800 border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-500 text-black font-black py-4 rounded-xl mt-4 hover:bg-brand-400"
                  >
                    LAUNCH CONTEST
                  </button>
                </div>
              </form>
            </div>

            {/* List of Active Contests */}
            <div className="bg-dark-900 border border-white/5 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Active Campaigns</h3>
              <div className="space-y-4">
                {adminContests.length === 0 ? (
                  <p className="text-slate-500 text-sm">No active contests found.</p>
                ) : (
                  adminContests.map((contest) => (
                    <div
                      key={contest.id}
                      className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-dark-800 overflow-hidden border border-white/10">
                          <img
                            src={contest.image || "/placeholder.svg"}
                            className="w-full h-full object-cover"
                            alt="contest"
                          />
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{contest.title}</h4>
                          <p className="text-xs text-slate-500 max-w-sm truncate">{contest.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">
                              {contest.daysLeft} Days Left
                            </span>
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">
                              {contest.participantsCount} Participants
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteContest(contest.id)}
                        className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-xs font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: VERIFICATIONS (REAL) --- */}
        {activeTab === "verifications" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Pending Proofs ({submissions.length})</h3>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-dark-900 rounded-3xl p-12 text-center border border-dashed border-white/10">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-white font-bold">All Caught Up!</h3>
                <p className="text-slate-500 text-sm">No pending submissions from users.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-dark-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col"
                  >
                    <div
                      className="relative h-48 bg-black group cursor-pointer"
                      onClick={() => sub.mediaData && setSelectedImage(sub.mediaData)}
                    >
                      {sub.mediaType === "video" ? (
                        <video src={sub.mediaData} className="w-full h-full object-cover" controls />
                      ) : (
                        <img
                          src={sub.mediaData || "/placeholder.svg"}
                          className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                        />
                      )}
                      {sub.mediaType !== "video" && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-black/50 text-white px-2 py-1 rounded text-xs font-bold">Zoom</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-white font-bold text-sm">Submission #{sub.id.slice(-4)}</h4>
                          <p className="text-xs text-slate-400">
                            User: <span className="text-white">{sub.userName}</span>
                          </p>
                          <p className="text-xs text-brand-500">{sub.contestTitle}</p>
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                        <button
                          onClick={() => handleVerdict(sub.id, "Rejected")}
                          className="py-2 rounded-lg border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerdict(sub.id, "Approved")}
                          className="py-2 rounded-lg bg-brand-500 text-black text-xs font-bold hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB CONTENT: CONTENT MODERATION --- */}
        {activeTab === "content" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Community Feed Control</h3>
                <p className="text-xs text-slate-500">Monitor and remove inappropriate content</p>
              </div>
              <span className="text-xs font-bold bg-white/5 px-3 py-1 rounded-full text-slate-300">
                {posts.length} Live Posts
              </span>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-20 bg-dark-900 rounded-3xl border border-white/5">
                <p className="text-slate-500">No community posts found.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/5 bg-dark-900">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-black/30 text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Content</th>
                      <th className="px-6 py-4">Media</th>
                      <th className="px-6 py-4">Engagement</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{post.user}</div>
                          <div className="text-[10px] text-slate-500">{post.time}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="truncate text-white max-w-[200px]">{post.caption}</p>
                          <div className="flex gap-1 mt-1">
                            {post.tags.map((t) => (
                              <span key={t} className="text-[9px] bg-brand-500/10 text-brand-500 px-1 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {post.image ? (
                            <div
                              className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-brand-500"
                              onClick={() => setSelectedImage(post.image!)}
                            >
                              <img src={post.image || "/placeholder.svg"} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600 bg-black/20 px-2 py-1 rounded">Text Only</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3 text-xs font-mono">
                            <span className="text-red-400">❤️ {post.likes}</span>
                            <span className="text-blue-400">💬 {post.commentsCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleBanUser(post.user)}
                              className="text-xs bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-orange-500/20"
                              title="Ban User"
                            >
                              Ban
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TAB CONTENT: USERS (REAL) --- */}
        {activeTab === "users" && (
          <div className="bg-dark-900 border border-white/5 rounded-3xl overflow-hidden animate-in fade-in duration-300">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-black/30 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No users registered on this device.
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center font-bold text-white border border-white/10">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-bold">
                              {u.name}{" "}
                              {u.isAdmin && <span className="text-brand-500 text-[10px] uppercase ml-1">(Admin)</span>}
                            </p>
                            <p className="text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.status === "Active" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{u.joined}</td>
                      <td className="px-6 py-4 text-right">
                        {!u.isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-red-500/20"
                          >
                            Delete User
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
