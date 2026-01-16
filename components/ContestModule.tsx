"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getContests, getContestSubmissions, submitContestEntry, voteForSubmission } from "@/lib/contest-service"
import { useToast } from "@/hooks/use-toast"

interface Contest {
  id?: string
  title: string
  description: string
  theme: string
  startDate: string
  endDate: string
  status: "active" | "ended"
}

interface Submission {
  id?: string
  contestId: string
  content: string
  imageUrl?: string
  votes: number
}

export const ContestModule: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([])
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadContests = async () => {
      try {
        const data = await getContests()
        setContests(data)
        if (data.length > 0) {
          setSelectedContest(data[0])
        }
      } catch (error) {
        console.error("[v0] Failed to load contests:", error)
        toast({
          title: "Error",
          description: "Failed to load contests",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadContests()
  }, [])

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!selectedContest?.id) return

      try {
        const data = await getContestSubmissions(selectedContest.id)
        setSubmissions(data)
      } catch (error) {
        console.error("[v0] Failed to load submissions:", error)
      }
    }

    loadSubmissions()
  }, [selectedContest])

  const handleVote = async (submissionId: string | undefined) => {
    if (!submissionId) return

    try {
      await voteForSubmission(submissionId)
      // Refresh submissions
      if (selectedContest?.id) {
        const data = await getContestSubmissions(selectedContest.id)
        setSubmissions(data)
      }
    } catch (error) {
      console.error("[v0] Vote failed:", error)
      toast({
        title: "Error",
        description: "Failed to vote",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Community Contests</h1>
        <p className="text-muted-foreground">Participate in daily challenges and win rewards</p>
      </div>

      {/* Contest Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {contests.map((contest) => (
          <button
            key={contest.id}
            onClick={() => setSelectedContest(contest)}
            className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedContest?.id === contest.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {contest.title}
          </button>
        ))}
      </div>

      {selectedContest && (
        <div className="space-y-6">
          {/* Contest Details */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{selectedContest.title}</h2>
                <p className="text-muted-foreground mb-3">{selectedContest.description}</p>
                <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Theme: {selectedContest.theme}
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold hover:bg-primary/90 transition-colors"
              >
                Submit Entry
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-muted-foreground">
                Ends:{" "}
                <span className="text-foreground font-medium">
                  {new Date(selectedContest.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="text-muted-foreground">
                Entries: <span className="text-foreground font-medium">{submissions.length}</span>
              </div>
            </div>
          </div>

          {/* Submissions Leaderboard */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">Top Entries</h3>
            </div>

            <div className="divide-y divide-border">
              {submissions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No entries yet. Be the first to submit!</p>
                </div>
              ) : (
                submissions.map((submission, idx) => (
                  <div key={submission.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl font-bold text-primary w-8 text-center">#{idx + 1}</div>

                      {submission.imageUrl && (
                        <img
                          src={submission.imageUrl || "/placeholder.svg"}
                          alt="Submission"
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      )}

                      <div className="flex-1">
                        <p className="text-foreground mb-1">{submission.content}</p>
                        <div className="text-sm text-muted-foreground">
                          {new Date(submission.contestId).toLocaleDateString()}
                        </div>
                      </div>

                      <button
                        onClick={() => handleVote(submission.id)}
                        className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-sm font-bold">{submission.votes}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedContest && (
        <ContestSubmitModal
          contest={selectedContest}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={() => {
            setShowSubmitModal(false)
            if (selectedContest.id) {
              getContestSubmissions(selectedContest.id).then(setSubmissions)
            }
          }}
        />
      )}
    </div>
  )
}

interface ContestSubmitModalProps {
  contest: Contest
  onClose: () => void
  onSubmitted: () => void
}

const ContestSubmitModal: React.FC<ContestSubmitModalProps> = ({ contest, onClose, onSubmitted }) => {
  const [content, setContent] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please add a description",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await submitContestEntry(contest.id || "", content, selectedImage || undefined)
      toast({
        title: "Success",
        description: "Entry submitted successfully",
      })
      onSubmitted()
    } catch (error) {
      console.error("[v0] Submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit entry",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Submit Entry</h2>
          <p className="text-sm text-muted-foreground mt-1">Theme: {contest.theme}</p>
        </div>

        <div className="p-6 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your entry..."
            className="w-full bg-muted rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none min-h-[100px]"
            disabled={isLoading}
          />

          <button
            onClick={() => document.querySelector('input[type="file"]')?.click?.()}
            className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
            disabled={isLoading}
          >
            Click to upload image (optional)
          </button>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
          />

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !content.trim()}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
