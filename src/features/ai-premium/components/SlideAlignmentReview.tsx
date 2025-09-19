// src/features/ai-premium/components/SlideAlignmentReview.tsx
import React from "react";

export type ScriptMatch = {
  slideNumber: number;
  scriptSection: string;
  confidence: number;
  reasoning: string;
  keyAlignment: string[];
};

type Props = {
  matches: ScriptMatch[];
  onJumpToSlide?: (slideNumber: number) => void;
  lowConfidenceThreshold?: number; // default 75
};

const confidenceColor = (c: number) =>
  c >= 90 ? "bg-green-100 text-green-800 border-green-300"
: c >= 75 ? "bg-yellow-100 text-yellow-800 border-yellow-300"
:          "bg-red-100 text-red-800 border-red-300";

export function SlideAlignmentReview({
  matches,
  onJumpToSlide,
  lowConfidenceThreshold = 75
}: Props) {
  const lowConfidence = matches.filter(m => (m.confidence ?? 0) < lowConfidenceThreshold);

  return (
    <div className="w-full space-y-4">
      {/* Top summary bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
        <div className="text-sm text-slate-700">
          <strong>{matches.length}</strong> mappings •{" "}
          <span className="text-slate-500">
            {lowConfidence.length} flagged for review (under {lowConfidenceThreshold})
          </span>
        </div>
        {lowConfidence.length > 0 && (
          <button
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            onClick={() => {
              const first = lowConfidence[0];
              if (first && onJumpToSlide) onJumpToSlide(first.slideNumber);
            }}
          >
            Review lowest-confidence
          </button>
        )}
      </div>

      {/* Match list */}
      <div className="grid grid-cols-1 gap-4">
        {matches.map((m, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Slide
                </span>
                <button
                  onClick={() => onJumpToSlide?.(m.slideNumber)}
                  className="text-sm font-semibold text-slate-900 hover:underline"
                  title="Jump to slide"
                >
                  #{m.slideNumber}
                </button>
              </div>

              <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${confidenceColor(m.confidence)}` }>
                Confidence {Math.round(m.confidence)}%
              </span>
            </div>

            {/* key alignments */}
            <div className="mt-3 flex flex-wrap gap-2">
              {m.keyAlignment?.slice(0, 6).map((k, i) => (
                <span
                  key={i}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                >
                  {k}
                </span>
              ))}
            </div>

            {/* reasoning (collapsible pattern simplified) */}
            <details className="mt-3 group">
              <summary className="cursor-pointer list-none text-sm text-slate-600 hover:text-slate-800">
                Rationale
                <span className="ml-1 text-slate-300 group-open:hidden">▸</span>
                <span className="ml-1 text-slate-300 hidden group-open:inline">▾</span>
              </summary>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {m.reasoning}
              </p>
            </details>

            {/* script excerpt */}
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Script Section</div>
              <p className="mt-1 text-sm text-slate-800 line-clamp-5">{m.scriptSection}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
