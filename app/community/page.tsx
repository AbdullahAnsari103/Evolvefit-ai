import { CommunityHub } from "@/components/CommunityHub"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Community Hub - EvolveFit",
  description: "Connect with the fitness community, participate in contests, and climb the leaderboard",
  openGraph: {
    title: "Community Hub - EvolveFit",
    description: "Connect with the fitness community, participate in contests, and climb the leaderboard",
    type: "website",
  },
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      <CommunityHub />
    </div>
  )
}
