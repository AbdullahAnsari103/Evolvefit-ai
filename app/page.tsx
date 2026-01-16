"use client"

import { useEffect, useState } from "react"
import { Onboarding } from "@/components/Onboarding"
import { Dashboard } from "@/components/Dashboard"
import { SnapMeal } from "@/components/SnapMeal"
import { AITrainer } from "@/components/AITrainer"
import { Layout } from "@/components/Layout"
import { MealPlanPage, WorkoutPlanPage } from "@/components/Plans"
import { Community } from "@/components/Community"
import { Contests } from "@/components/Contests"
import { ProfilePage } from "@/components/ProfilePage"
import { AIInsights } from "@/components/AIInsights"
import { AdminDashboard } from "@/components/AdminDashboard"
import { AuthPage } from "@/components/AuthPage"
import { MuscleBook } from "@/components/MuscleBook"
import type { UserProfile, AuthUser } from "@/types"
import { getUserProfile, getCurrentSession, logoutUser } from "@/services/storageService"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [isAdminMode, setIsAdminMode] = useState(false)

  useEffect(() => {
    // Check persistent storage on mount (Authentication Check)
    const session = getCurrentSession()
    if (session) {
      setCurrentUser(session)
      // If session exists, try to get the fitness profile
      const profile = getUserProfile()
      if (profile) {
        setUserProfile(profile)
      }
    }
    setLoading(false)
  }, [])

  const handleAuthSuccess = (authUser: AuthUser) => {
    setCurrentUser(authUser)
    const profile = getUserProfile()
    if (profile) {
      setUserProfile(profile)
    }
    // If no profile, the main render will show Onboarding
  }

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile)
  }

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile)
  }

  const handleLogout = () => {
    logoutUser()
    setCurrentUser(null)
    setUserProfile(null)
    setActiveTab("dashboard")
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // 1. Auth Gate
  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />
  }

  // 2. Admin Gate
  if (isAdminMode) {
    return <AdminDashboard onExit={() => setIsAdminMode(false)} />
  }

  // 3. Onboarding Gate (Only if authenticated but no profile)
  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  // 4. Main App
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard user={userProfile} />
      case "musclebook":
        return <MuscleBook />
      case "insights":
        return <AIInsights user={userProfile} />
      case "snapmeal":
        return <SnapMeal />
      case "trainer":
        return <AITrainer user={userProfile} />
      case "meal-plan":
        return <MealPlanPage user={userProfile} />
      case "workout-plan":
        return <WorkoutPlanPage user={userProfile} />
      case "contests":
        return <Contests />
      case "community":
        return <Community />
      case "profile":
        return (
          <ProfilePage
            user={userProfile}
            onUpdate={handleProfileUpdate}
            onAdminEnter={() => setIsAdminMode(true)}
            onLogout={handleLogout}
          />
        )
      default:
        return <Dashboard user={userProfile} />
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} user={userProfile}>
      {renderContent()}
    </Layout>
  )
}
