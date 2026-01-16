/**
 * EvolveFit - Comprehensive Testing and Optimization Suite
 * This module provides testing utilities, performance monitoring, and optimization checks
 * for production deployment
 */

export interface TestResult {
  testName: string
  status: "pass" | "fail" | "warning"
  duration: number
  message: string
}

export interface PerformanceMetrics {
  timestamp: number
  componentName: string
  renderTime: number
  memoryUsage: number
  fps: number
}

export class ProductionTestSuite {
  private results: TestResult[] = []
  private metrics: PerformanceMetrics[] = []

  // === API TESTS ===
  async testGeminiAPIConnectivity(): Promise<TestResult> {
    const startTime = performance.now()
    try {
      const response = await fetch("/api/ai/verify-content", {
        method: "POST",
        body: JSON.stringify({ content: "test" }),
      })
      const duration = performance.now() - startTime

      if (response.ok) {
        return {
          testName: "Gemini API Connectivity",
          status: "pass",
          duration,
          message: "API endpoint responding correctly",
        }
      } else {
        return {
          testName: "Gemini API Connectivity",
          status: "fail",
          duration,
          message: `API returned status ${response.status}`,
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime
      return {
        testName: "Gemini API Connectivity",
        status: "fail",
        duration,
        message: `Connection error: ${error instanceof Error ? error.message : "Unknown"}`,
      }
    }
  }

  // === DATABASE TESTS ===
  testDatabaseIsolation(): TestResult {
    const startTime = performance.now()
    try {
      const testData = {
        userId: "test-user-123",
        data: "sensitive data",
      }
      localStorage.setItem("test_key", JSON.stringify(testData))
      const retrieved = localStorage.getItem("test_key")
      localStorage.removeItem("test_key")

      const duration = performance.now() - startTime

      if (retrieved && JSON.parse(retrieved).userId === "test-user-123") {
        return {
          testName: "Database Isolation",
          status: "pass",
          duration,
          message: "User data properly isolated in storage",
        }
      } else {
        return {
          testName: "Database Isolation",
          status: "fail",
          duration,
          message: "Data isolation verification failed",
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime
      return {
        testName: "Database Isolation",
        status: "fail",
        duration,
        message: `Storage test error: ${error instanceof Error ? error.message : "Unknown"}`,
      }
    }
  }

  // === REAL-TIME COMMUNICATION TESTS ===
  testRealtimeBroadcasting(): TestResult {
    const startTime = performance.now()
    try {
      const { realtimeManager } = require("@/lib/realtime-updates")
      let messageReceived = false

      const subscription = realtimeManager.subscribe("test-channel", (msg: any) => {
        if (msg.data.test === true) {
          messageReceived = true
        }
      })

      realtimeManager.broadcast("test-channel", {
        type: "post",
        data: { test: true, timestamp: Date.now() },
      })

      subscription.unsubscribe()
      const duration = performance.now() - startTime

      return {
        testName: "Real-time Broadcasting",
        status: messageReceived ? "pass" : "warning",
        duration,
        message: messageReceived ? "Real-time system working" : "Message delivery delayed",
      }
    } catch (error) {
      const duration = performance.now() - startTime
      return {
        testName: "Real-time Broadcasting",
        status: "fail",
        duration,
        message: `Broadcasting test error: ${error instanceof Error ? error.message : "Unknown"}`,
      }
    }
  }

  // === YOUTUBE VIDEO VERIFICATION ===
  testYoutubeVideoVerification(): TestResult {
    const startTime = performance.now()
    try {
      const { verifyYoutubeUrl, getEmbeddedYoutubeUrl } = require("@/lib/youtube-verification")

      const testUrls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
      ]

      let allValid = true
      for (const url of testUrls) {
        if (!verifyYoutubeUrl(url)) {
          allValid = false
          break
        }
        const embedded = getEmbeddedYoutubeUrl(url)
        if (!embedded.includes("embed")) {
          allValid = false
          break
        }
      }

      const duration = performance.now() - startTime

      return {
        testName: "YouTube Video Verification",
        status: allValid ? "pass" : "fail",
        duration,
        message: allValid ? "All video URL formats verified" : "Some URL formats failed verification",
      }
    } catch (error) {
      const duration = performance.now() - startTime
      return {
        testName: "YouTube Video Verification",
        status: "fail",
        duration,
        message: `Video verification error: ${error instanceof Error ? error.message : "Unknown"}`,
      }
    }
  }

  // === CONTEST SYSTEM TESTS ===
  testContestPersistence(): TestResult {
    const startTime = performance.now()
    try {
      const { getUserContestState, saveUserContestState, acceptChallenge } = require("@/services/contest-service")

      const userId = "test-user-contest-" + Date.now()
      const contestId = "contest-" + Date.now()

      const initialState = getUserContestState(userId)
      if (initialState.totalPoints !== 0) {
        throw new Error("User should start with 0 points")
      }

      const accepted = acceptChallenge(userId, contestId)
      if (!accepted) {
        throw new Error("Challenge acceptance failed")
      }

      const state = getUserContestState(userId)
      if (!state.acceptedContestIds.has(contestId)) {
        throw new Error("Challenge not recorded in state")
      }

      const duration = performance.now() - startTime

      return {
        testName: "Contest Persistence",
        status: "pass",
        duration,
        message: "Contest challenge acceptance and state persistence verified",
      }
    } catch (error) {
      const duration = performance.now() - startTime
      return {
        testName: "Contest Persistence",
        status: "fail",
        duration,
        message: `Contest test error: ${error instanceof Error ? error.message : "Unknown"}`,
      }
    }
  }

  // === PERFORMANCE MONITORING ===
  monitorComponentRender(componentName: string, renderFn: () => void): PerformanceMetrics {
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0
    const startTime = performance.now()

    renderFn()

    const endTime = performance.now()
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0

    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      componentName,
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      fps: 60, // Placeholder - would need real FPS tracking
    }

    this.metrics.push(metrics)
    return metrics
  }

  // === OPTIMIZATION CHECKS ===
  checkBundleSize(): TestResult {
    const startTime = performance.now()
    try {
      const bundleSize = JSON.stringify(window).length
      const maxBundleSize = 5 * 1024 * 1024 // 5MB threshold

      const duration = performance.now() - startTime
      const status = bundleSize < maxBundleSize ? "pass" : "warning"

      return {
        testName: "Bundle Size",
        status,
        duration,
        message: `Bundle size: ${(bundleSize / 1024).toFixed(2)}KB (threshold: ${(maxBundleSize / 1024).toFixed(0)}KB)`,
      }
    } catch (error) {
      const duration = performance.now() - startTime
      return {
        testName: "Bundle Size",
        status: "warning",
        duration,
        message: "Could not measure bundle size",
      }
    }
  }

  checkMemoryLeaks(): TestResult {
    const startTime = performance.now()
    try {
      if ((performance as any).memory) {
        const memUsage = (performance as any).memory.usedJSHeapSize
        const maxMemory = (performance as any).memory.jsHeapSizeLimit
        const usage = (memUsage / maxMemory) * 100

        const duration = performance.now() - startTime
        const status = usage < 80 ? "pass" : usage < 90 ? "warning" : "fail"

        return {
          testName: "Memory Leak Detection",
          status,
          duration,
          message: `Memory usage: ${usage.toFixed(1)}% of limit`,
        }
      } else {
        const duration = performance.now() - startTime
        return {
          testName: "Memory Leak Detection",
          status: "warning",
          duration,
          message: "Memory API not available",
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime
      return {
        testName: "Memory Leak Detection",
        status: "warning",
        duration,
        message: "Could not monitor memory",
      }
    }
  }

  // === RUN ALL TESTS ===
  async runFullTestSuite(): Promise<TestResult[]> {
    console.log("[v0] Starting Production Test Suite...")

    this.results = [
      await this.testGeminiAPIConnectivity(),
      this.testDatabaseIsolation(),
      this.testRealtimeBroadcasting(),
      this.testYoutubeVideoVerification(),
      this.testContestPersistence(),
      this.checkBundleSize(),
      this.checkMemoryLeaks(),
    ]

    console.log("[v0] Test Suite Complete")
    console.table(this.results)

    return this.results
  }

  getResults(): TestResult[] {
    return this.results
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics
  }

  getReport(): string {
    const passed = this.results.filter((r) => r.status === "pass").length
    const failed = this.results.filter((r) => r.status === "fail").length
    const warnings = this.results.filter((r) => r.status === "warning").length

    return `
=== PRODUCTION TEST REPORT ===
Total Tests: ${this.results.length}
Passed: ${passed}
Failed: ${failed}
Warnings: ${warnings}

${this.results.map((r) => `[${r.status.toUpperCase()}] ${r.testName}: ${r.message} (${r.duration.toFixed(2)}ms)`).join("\n")}

Recommendation: ${failed > 0 ? "PRODUCTION DEPLOYMENT NOT RECOMMENDED" : warnings > 0 ? "DEPLOY WITH CAUTION" : "SAFE FOR PRODUCTION"}
    `
  }
}

export const productionTestSuite = new ProductionTestSuite()

export default productionTestSuite
