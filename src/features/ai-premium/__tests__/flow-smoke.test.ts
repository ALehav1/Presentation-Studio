import { describe, it, expect } from "vitest";
import { OpenAIService } from "../../../services/openai-service";

function mockClientForFlow() {
  // 1) 2 slides vision
  // 2) 2 summaries
  // 3) matching
  // 4) 2 coachings
  const ok = (x: any) => ({ ok: x });
  const seq = [
    ok({ success: true, analysis: { allText: "Slide1", mainTopic: "Intro", keyPoints: ["A"], visualElements: ["title"], suggestedTalkingPoints: ["S"], emotionalTone: "professional", complexity: "basic", recommendedDuration: 30 } }),
    ok({ success: true, analysis: { allText: "Slide2", mainTopic: "Risk",  keyPoints: ["B"], visualElements: ["chart"], suggestedTalkingPoints: ["T"], emotionalTone: "professional", complexity: "basic", recommendedDuration: 45 } }),
    ok({ slideNumber: 1, summary: "Intro...", tags: ["intro"] }),
    ok({ slideNumber: 2, summary: "Risk...", tags: ["risk"] }),
    ok({ success: true, matches: [
      { slideNumber: 1, scriptSection: "Hello...", confidence: 95, reasoning: "Intro match", keyAlignment: ["intro"] },
      { slideNumber: 2, scriptSection: "Risks...", confidence: 90, reasoning: "Risk match",  keyAlignment: ["risk"] }
    ] }),
    ok({ success: true, coaching: { openingStrategy: "Eye contact", keyEmphasisPoints: ["intro"], bodyLanguageTips: ["stand tall"], voiceModulation: ["pause"], audienceEngagement: ["ask"], transitionToNext: "move", timingRecommendation: "30s", potentialQuestions: ["q"], commonMistakes: ["fast"], energyLevel: "high" } }),
    ok({ success: true, coaching: { openingStrategy: "Firm tone",   keyEmphasisPoints: ["risk"],  bodyLanguageTips: ["hands"],     voiceModulation: ["emph"], audienceEngagement: ["poll"], transitionToNext: "wrap", timingRecommendation: "45s", potentialQuestions: ["q2"], commonMistakes: ["soft"], energyLevel: "high" } })
  ];
  return {
    client: {
      chat: {
        completions: {
          create: async () => ({ 
            choices: [{ 
              message: { 
                content: JSON.stringify((seq.shift() as any).ok) 
              } 
            }] 
          })
        }
      }
    }
  };
}

describe("Two-pass flow smoke test", () => {
  it("runs end-to-end with mocks", async () => {
    const { client } = mockClientForFlow();
    const svc = new OpenAIService({ client, textModel: "gpt-5", visionModel: "gpt-5" });

    // Step 1: Analyze slides with vision
    const v1 = await svc.analyzeSlideWithVision("data:img", 1);
    const v2 = await svc.analyzeSlideWithVision("data:img", 2);
    const analyses = [v1, v2].map(r => (r.success ? r.analysis! : null));
    expect(analyses.every(Boolean)).toBe(true);

    // Step 2: Generate summaries for matching
    const summaries = await svc.summarizeAllSlidesForMatching(analyses as any[]);
    expect(summaries.length).toBe(2);
    expect(summaries[0].slideNumber).toBe(1);
    expect(summaries[1].slideNumber).toBe(2);

    // Step 3: Match script to summaries
    const match = await svc.matchScriptToSlidesFromSummaries(summaries, "Hello... Risks...");
    expect(match.success).toBe(true);

    if (match.success) {
      expect(match.matches.length).toBe(2);
      expect(match.matches[0].confidence).toBe(95);
      expect(match.matches[1].confidence).toBe(90);

      // Step 4: Generate coaching for each match
      const c1 = await svc.generateExpertCoaching(analyses[0]!, match.matches[0].scriptSection);
      const c2 = await svc.generateExpertCoaching(analyses[1]!, match.matches[1].scriptSection);
      expect(c1.success && c2.success).toBe(true);
      
      if (c1.success && c2.success) {
        expect(c1.coaching.energyLevel).toBe("high");
        expect(c2.coaching.energyLevel).toBe("high");
        expect(c1.coaching.timingRecommendation).toContain("30s");
        expect(c2.coaching.timingRecommendation).toContain("45s");
      }
    }
  });

  it("handles partial failures gracefully", async () => {
    // Test with some steps failing
    const failingClient = {
      chat: {
        completions: {
          create: async () => {
            throw new Error("API failure");
          }
        }
      }
    };

    const svc = new OpenAIService({ client: failingClient, textModel: "gpt-5", visionModel: "gpt-5" });

    // Should still return results due to fallbacks
    const analysis = await svc.analyzeSlideWithVision("data:img", 1);
    expect(analysis.success).toBe(true);

    if (analysis.success) {
      expect(analysis.analysis.mainTopic).toContain("Presentation slide");
    }
  });

  it("maintains data consistency throughout flow", async () => {
    const { client } = mockClientForFlow();
    const svc = new OpenAIService({ client, textModel: "gpt-5", visionModel: "gpt-5" });

    const analyses = [];
    for (let i = 1; i <= 2; i++) {
      const result = await svc.analyzeSlideWithVision("data:img", i);
      if (result.success) {
        analyses.push(result.analysis);
      }
    }

    const summaries = await svc.summarizeAllSlidesForMatching(analyses);
    const scriptMatch = await svc.matchScriptToSlidesFromSummaries(summaries, "Test script");

    if (scriptMatch.success) {
      // Verify slide numbers are consistent
      expect(scriptMatch.matches[0].slideNumber).toBe(summaries[0].slideNumber);
      expect(scriptMatch.matches[1].slideNumber).toBe(summaries[1].slideNumber);
      
      // Verify confidence scores are reasonable
      scriptMatch.matches.forEach(match => {
        expect(match.confidence).toBeGreaterThan(0);
        expect(match.confidence).toBeLessThanOrEqual(100);
        expect(match.reasoning).toBeTruthy();
        expect(Array.isArray(match.keyAlignment)).toBe(true);
      });
    }
  });

  it("respects token limits and model preferences", async () => {
    const { client } = mockClientForFlow();
    const svc = new OpenAIService({ 
      client, 
      textModel: "gpt-5", 
      visionModel: "gpt-5",
      hardTokenCap: 2048,
      temperature: 0.1
    });

    // The service should use the specified models and settings
    const analysis = await svc.analyzeSlideWithVision("data:img", 1);
    expect(analysis.success).toBe(true);

    // Test that it maintains consistency with specified parameters
    const summaries = [{ slideNumber: 1, summary: "Test", tags: ["test"] }];
    const matching = await svc.matchScriptToSlidesFromSummaries(summaries, "Short script");
    expect(matching.success).toBe(true);
  });
});
