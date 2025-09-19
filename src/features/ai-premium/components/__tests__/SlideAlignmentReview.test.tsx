import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { SlideAlignmentReview, type ScriptMatch } from "../SlideAlignmentReview";

const matches: ScriptMatch[] = [
  { slideNumber: 1, scriptSection: "Intro text...", confidence: 92, reasoning: "Clear title match", keyAlignment: ["intro","ai"] },
  { slideNumber: 2, scriptSection: "Risk framing...", confidence: 68, reasoning: "Partial topic overlap", keyAlignment: ["risk","uncertainty"] }
];

describe("SlideAlignmentReview", () => {
  it("renders counts and flags low-confidence items", () => {
    render(<SlideAlignmentReview matches={matches} lowConfidenceThreshold={75} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(content => content.includes("mappings"))).toBeInTheDocument();
    expect(screen.getByText(content => content.includes("1 flagged for review"))).toBeInTheDocument();
  });

  it("invokes onJumpToSlide for the lowest-confidence review button", () => {
    const onJump = vi.fn();
    render(<SlideAlignmentReview matches={matches} lowConfidenceThreshold={75} onJumpToSlide={onJump} />);
    fireEvent.click(screen.getByText(/Review lowest-confidence/i));
    expect(onJump).toHaveBeenCalledWith(2);
  });

  it("shows confidence chips and rationale details", async () => {
    render(<SlideAlignmentReview matches={matches} />);
    expect(screen.getByText(/Confidence 92%/)).toBeInTheDocument();
    const rationale = screen.getAllByText(/Rationale/i)[0];
    fireEvent.click(rationale);
    expect(screen.getByText(/Clear title match/i)).toBeInTheDocument();
  });

  it("renders slide jump buttons with correct slide numbers", () => {
    const onJump = vi.fn();
    render(<SlideAlignmentReview matches={matches} onJumpToSlide={onJump} />);
    
    const slide1Button = screen.getByText("#1");
    const slide2Button = screen.getByText("#2");
    
    fireEvent.click(slide1Button);
    expect(onJump).toHaveBeenCalledWith(1);
    
    fireEvent.click(slide2Button);
    expect(onJump).toHaveBeenCalledWith(2);
  });

  it("displays key alignment tags", () => {
    render(<SlideAlignmentReview matches={matches} />);
    expect(screen.getByText("intro")).toBeInTheDocument();
    expect(screen.getByText("ai")).toBeInTheDocument();
    expect(screen.getByText("risk")).toBeInTheDocument();
    expect(screen.getByText("uncertainty")).toBeInTheDocument();
  });

  it("shows script sections in excerpt boxes", () => {
    render(<SlideAlignmentReview matches={matches} />);
    expect(screen.getByText("Intro text...")).toBeInTheDocument();
    expect(screen.getByText("Risk framing...")).toBeInTheDocument();
  });

  it("handles empty matches gracefully", () => {
    render(<SlideAlignmentReview matches={[]} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(content => content.includes("mappings"))).toBeInTheDocument();
    expect(screen.getByText(content => content.includes("flagged for review"))).toBeInTheDocument();
  });

  it("applies correct confidence color coding", () => {
    const highConfidenceMatch = [
      { slideNumber: 1, scriptSection: "High confidence", confidence: 95, reasoning: "Perfect match", keyAlignment: ["perfect"] }
    ];
    const { rerender } = render(<SlideAlignmentReview matches={highConfidenceMatch} />);
    expect(screen.getByText(/Confidence 95%/)).toHaveClass("bg-green-100", "text-green-800");

    const mediumConfidenceMatch = [
      { slideNumber: 1, scriptSection: "Medium confidence", confidence: 80, reasoning: "Good match", keyAlignment: ["good"] }
    ];
    rerender(<SlideAlignmentReview matches={mediumConfidenceMatch} />);
    expect(screen.getByText(/Confidence 80%/)).toHaveClass("bg-yellow-100", "text-yellow-800");

    const lowConfidenceMatch = [
      { slideNumber: 1, scriptSection: "Low confidence", confidence: 60, reasoning: "Weak match", keyAlignment: ["weak"] }
    ];
    rerender(<SlideAlignmentReview matches={lowConfidenceMatch} />);
    expect(screen.getByText(/Confidence 60%/)).toHaveClass("bg-red-100", "text-red-800");
  });

  it("does not show review button when no low-confidence items", () => {
    const highConfidenceMatches = [
      { slideNumber: 1, scriptSection: "High confidence", confidence: 90, reasoning: "Great match", keyAlignment: ["great"] }
    ];
    render(<SlideAlignmentReview matches={highConfidenceMatches} lowConfidenceThreshold={75} />);
    expect(screen.queryByText(/Review lowest-confidence/i)).not.toBeInTheDocument();
  });

  it("limits key alignment tags to 6 items", () => {
    const manyTagsMatch = [
      { 
        slideNumber: 1, 
        scriptSection: "Many tags", 
        confidence: 85, 
        reasoning: "Multiple alignments", 
        keyAlignment: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"] 
      }
    ];
    render(<SlideAlignmentReview matches={manyTagsMatch} />);
    
    // Should only show first 6 tags
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag6")).toBeInTheDocument();
    expect(screen.queryByText("tag7")).not.toBeInTheDocument();
    expect(screen.queryByText("tag8")).not.toBeInTheDocument();
  });
});
