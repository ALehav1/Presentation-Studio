import { describe, it, expect, vi } from "vitest";
import { OpenAIService, type SlideAnalysis } from "../openai-service";

function makeMockClient(sequence: Array<{ ok?: any; fail?: Error }>) {
  const calls: any[] = [];
  return {
    calls,
    client: {
      chat: {
        completions: {
          create: vi.fn(async () => {
            calls.push(true);
            const step = sequence.shift();
            if (!step) throw new Error("No mock step");
            if (step.fail) throw step.fail;
            return { 
              choices: [{ 
                message: { 
                  content: JSON.stringify(step.ok) 
                } 
              }] 
            };
          })
        }
      }
    }
  };
}

const sampleAnalysis: SlideAnalysis = {
  allText: "BUILDING AN INTELLIGENT CORRIDOR...",
  mainTopic: "AI-Powered Cross-Border Trade Enhancement",
  keyPoints: ["AI integration", "Cross-border efficiency", "Trade automation"],
  visualElements: ["chart", "title", "logo"],
  suggestedTalkingPoints: ["Introduce AI benefits", "Explain corridor concept"],
  emotionalTone: "professional",
  complexity: "moderate",
  recommendedDuration: 60
};

describe("OpenAIService (mocked)", () => {
  it("analyzeSlideWithVision returns structured analysis on success", async () => {
    const { client } = makeMockClient([
      { ok: { success: true, analysis: sampleAnalysis } }
    ]);

    const svc = new OpenAIService({ client, textModel: "gpt-5", visionModel: "gpt-5" });
    const res = await svc.analyzeSlideWithVision("data:image/png;base64,XXX", 1);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.analysis.mainTopic).toContain("Cross-Border");
      expect(res.analysis.keyPoints.length).toBeGreaterThan(0);
    }
  });

  it("analyzeSlideWithVision falls back to gpt-4o when first call fails", async () => {
    const { client } = makeMockClient([
      { fail: new Error("gpt-5 hiccup") },                                // first call fails
      { ok: { success: true, analysis: sampleAnalysis } }                 // fallback succeeds
    ]);

    const svc = new OpenAIService({ client, textModel: "gpt-5", visionModel: "gpt-5" });
    const res = await svc.analyzeSlideWithVision("data:image/png;base64,XXX", 2);
    expect(res.success).toBe(true);
  });

  it("summarizeSlideForMatching produces compact JSON or local fallback", async () => {
    const { client } = makeMockClient([
      { ok: { slideNumber: 1, summary: "Short summary...", tags: ["ai", "trade"] } }
    ]);
    const svc = new OpenAIService({ client, textModel: "gpt-5" });
    const out = await svc.summarizeSlideForMatching(1, sampleAnalysis);
    expect(out.slideNumber).toBe(1);
    expect(out.tags.length).toBeGreaterThan(0);
  });

  it("matchScriptToSlidesFromSummaries returns matches array", async () => {
    const { client } = makeMockClient([
      { ok: { success: true, matches: [
        { slideNumber: 1, scriptSection: "Good morning...", confidence: 93, reasoning: "Topic alignment", keyAlignment: ["corridor","ai"] }
      ] } }
    ]);

    const svc = new OpenAIService({ client, textModel: "gpt-5" });
    const summaries = [{ slideNumber: 1, summary: "Corridor intro", tags: ["ai","trade"] }];
    const res = await svc.matchScriptToSlidesFromSummaries(summaries, "Good morning...");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.matches[0].confidence).toBeGreaterThan(0);
    }
  });

  it("generateExpertCoaching returns coaching JSON", async () => {
    const { client } = makeMockClient([
      { ok: { success: true, coaching: {
        openingStrategy: "Eye contact",
        keyEmphasisPoints: ["intelligent","corridor"],
        bodyLanguageTips: ["Stand tall"],
        voiceModulation: ["Pause after greeting"],
        audienceEngagement: ["Ask experience"],
        transitionToNext: "Move to risks",
        timingRecommendation: "60 seconds - intro",
        potentialQuestions: ["How does AI help trade?"],
        commonMistakes: ["Speaking too fast"],
        energyLevel: "high"
      } } }
    ]);
    const svc = new OpenAIService({ client, textModel: "gpt-5" });
    const res = await svc.generateExpertCoaching(sampleAnalysis, "Good morning...");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.coaching.energyLevel).toBe("high");
    }
  });

  it("safeJson tolerates noisy wrappers (defense-in-depth)", async () => {
    const noisy = "Here you go:\n\n{ \"success\": true, \"analysis\": " +
      JSON.stringify(sampleAnalysis) + " }\n\nNote: Done.";
    const { client } = makeMockClient([{ ok: noisy }]);
    const svc = new OpenAIService({ client, textModel: "gpt-5" });
    const res = await svc.analyzeSlideWithVision("data:image/png;base64,XXX", 3);
    expect(res.success).toBe(true);
  });

  it("returns fallback when all analysis fails", async () => {
    const { client } = makeMockClient([
      { fail: new Error("gpt-5 failed") },
      { fail: new Error("gpt-4o failed") }
    ]);

    const svc = new OpenAIService({ client, textModel: "gpt-5", visionModel: "gpt-5" });
    const res = await svc.analyzeSlideWithVision("data:image/png;base64,XXX", 4);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.analysis.allText).toContain("Slide 4");
    }
  });

  it("handles empty response gracefully", async () => {
    const { client } = makeMockClient([
      { ok: "" }  // Empty response
    ]);

    const svc = new OpenAIService({ client, textModel: "gpt-5" });
    const res = await svc.analyzeSlideWithVision("data:image/png;base64,XXX", 5);
    expect(res.success).toBe(true); // Should fallback to default
  });

  it("summarizeAllSlidesForMatching processes multiple slides", async () => {
    const { client } = makeMockClient([
      { ok: { slideNumber: 1, summary: "First slide summary", tags: ["intro"] } },
      { ok: { slideNumber: 2, summary: "Second slide summary", tags: ["data"] } }
    ]);

    const svc = new OpenAIService({ client, textModel: "gpt-5" });
    const analyses = [sampleAnalysis, sampleAnalysis];
    const summaries = await svc.summarizeAllSlidesForMatching(analyses);
    
    expect(summaries.length).toBe(2);
    expect(summaries[0].slideNumber).toBe(1);
    expect(summaries[1].slideNumber).toBe(2);
  });
});
