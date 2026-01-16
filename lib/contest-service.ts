import { createBrowserClient } from "@supabase/ssr"

const getSupabaseClient = () => {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export interface ContestData {
  id?: string
  title: string
  description: string
  theme: string
  startDate: string
  endDate: string
  status: "active" | "ended"
}

export interface ContestSubmissionData {
  id?: string
  contestId: string
  content: string
  imageUrl?: string
  votes: number
}

export const createContest = async (contest: ContestData): Promise<ContestData> => {
  const supabase = getSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("contests")
    .insert({
      title: contest.title,
      description: contest.description,
      theme: contest.theme,
      start_date: contest.startDate,
      end_date: contest.endDate,
      created_by: user.id,
      status: contest.status || "active",
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create contest: ${error.message}`)
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    theme: data.theme,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
  }
}

export const getContests = async (): Promise<ContestData[]> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("contests").select("*").order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch contests: ${error.message}`)
  }

  return data.map((contest) => ({
    id: contest.id,
    title: contest.title,
    description: contest.description,
    theme: contest.theme,
    startDate: contest.start_date,
    endDate: contest.end_date,
    status: contest.status,
  }))
}

export const submitContestEntry = async (
  contestId: string,
  content: string,
  imageFile?: File,
): Promise<ContestSubmissionData> => {
  const supabase = getSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  let imageUrl: string | undefined

  if (imageFile) {
    const fileName = `${contestId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("contest-entries")
      .upload(fileName, imageFile, {
        contentType: "image/jpeg",
      })

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    const { data: publicUrl } = supabase.storage.from("contest-entries").getPublicUrl(fileName)
    imageUrl = publicUrl.publicUrl
  }

  const { data, error } = await supabase
    .from("contest_submissions")
    .insert({
      contest_id: contestId,
      user_id: user.id,
      content,
      image_url: imageUrl,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to submit entry: ${error.message}`)
  }

  return {
    id: data.id,
    contestId: data.contest_id,
    content: data.content,
    imageUrl: data.image_url,
    votes: data.votes || 0,
  }
}

export const getContestSubmissions = async (contestId: string): Promise<ContestSubmissionData[]> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("contest_submissions")
    .select("*")
    .eq("contest_id", contestId)
    .order("votes", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch submissions: ${error.message}`)
  }

  return data.map((submission) => ({
    id: submission.id,
    contestId: submission.contest_id,
    content: submission.content,
    imageUrl: submission.image_url,
    votes: submission.votes || 0,
  }))
}

export const voteForSubmission = async (submissionId: string): Promise<boolean> => {
  const supabase = getSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Check if already voted
  const { data: existing } = await supabase
    .from("contest_votes")
    .select("id")
    .eq("submission_id", submissionId)
    .eq("user_id", user.id)
    .single()

  if (existing) {
    // Remove vote
    await supabase.from("contest_votes").delete().eq("id", existing.id)

    // Decrement vote count
    const { data: submission } = await supabase
      .from("contest_submissions")
      .select("votes")
      .eq("id", submissionId)
      .single()

    if (submission) {
      await supabase
        .from("contest_submissions")
        .update({ votes: submission.votes - 1 })
        .eq("id", submissionId)
    }

    return false
  } else {
    // Add vote
    await supabase.from("contest_votes").insert({
      submission_id: submissionId,
      user_id: user.id,
    })

    // Increment vote count
    const { data: submission } = await supabase
      .from("contest_submissions")
      .select("votes")
      .eq("id", submissionId)
      .single()

    if (submission) {
      await supabase
        .from("contest_submissions")
        .update({ votes: submission.votes + 1 })
        .eq("id", submissionId)
    }

    return true
  }
}

export const updateContestStatus = async (contestId: string, status: "active" | "ended"): Promise<void> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("contests").update({ status }).eq("id", contestId)

  if (error) {
    throw new Error(`Failed to update contest: ${error.message}`)
  }
}
