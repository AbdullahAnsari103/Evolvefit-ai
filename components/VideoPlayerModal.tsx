"use client"

import type React from "react"
import { useState } from "react"
import { getEmbeddedYoutubeUrl, verifyYoutubeUrl } from "@/lib/youtube-verification"

interface VideoPlayerModalProps {
  videoUrl: string
  title: string
  onClose: () => void
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ videoUrl, title, onClose }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const embeddedUrl = getEmbeddedYoutubeUrl(videoUrl)
  const isValid = verifyYoutubeUrl(videoUrl)

  if (!isValid || !embeddedUrl) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="bg-dark-800 rounded-[2rem] p-8 max-w-md text-center border border-white/10">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 4v2M6.343 17.657L7.757 16.243m2.828 2.828l1.414-1.414m2.828 2.828l1.414-1.414M17.657 6.343L16.243 7.757m2.828-2.828l-1.414 1.414m-2.828-2.828l-1.414 1.414"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Video Unavailable</h3>
          <p className="text-slate-400 mb-6">
            This video link appears to be broken or invalid. Please try another link or select a different exercise.
          </p>
          <button
            onClick={onClose}
            className="bg-brand-500 hover:bg-brand-600 text-black font-bold px-6 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="relative bg-black rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Title */}
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400 mt-1">Video Tutorial</p>
          </div>

          {/* Video Container */}
          <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <iframe
              src={embeddedUrl}
              title={title}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onLoad={() => setIsLoading(false)}
              onError={() => setHasError(true)}
            />

            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-800 text-white">
                <p>Failed to load video. Please try again or check the link.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-dark-800/50">
            <p className="text-xs text-slate-400">
              Video is being streamed directly from YouTube. Make sure to have a stable internet connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayerModal
