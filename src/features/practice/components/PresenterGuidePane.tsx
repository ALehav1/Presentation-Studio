import { processScript, estimateSpeakingTime } from '../utils/script-processor';
import { Clock, Key, ArrowRight, Timer, Lightbulb, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PresenterGuidePaneProps {
  /** Script text to analyze */
  script: string;
  /** Whether the pane is visible */
  isVisible: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
  /** Current slide number for context */
  slideNumber: number;
  /** Total number of slides */
  totalSlides: number;
}

export function PresenterGuidePane({ 
  script, 
  isVisible, 
  onVisibilityChange,
  slideNumber,
  totalSlides 
}: PresenterGuidePaneProps) {
  const processedScript = processScript(script);

  if (!isVisible) {
    return (
      <Card className="h-full border-2 border-dashed border-muted-foreground/20 bg-muted/10">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
              <EyeOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-3">Presenter Guide Hidden</p>
              <Button
                variant="default"
                size="sm"
                onClick={() => onVisibilityChange?.(true)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Show Guide
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasContent = script.trim().length > 0;

  return (
    <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base text-gray-800">Presenter Guide</CardTitle>
              <CardDescription className="text-xs mt-1">
                Smart guidance for slide {slideNumber}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {slideNumber} of {totalSlides}
            </Badge>
            {onVisibilityChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVisibilityChange(false)}
                className="gap-2 h-8 px-3"
                title="Hide presenter guide"
              >
                <EyeOff className="h-3 w-3" />
                Hide
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-full">
          <div className="p-6">
        {hasContent ? (
          <div className="space-y-6">
            {/* Speaking Time */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Estimated Speaking Time</h4>
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">{estimateSpeakingTime(processedScript.wordCount)}</span>
                      <span className="text-blue-600"> • {processedScript.wordCount} words</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Points */}
            {processedScript.keyPoints.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                      <Key className="h-3 w-3 text-amber-600" />
                    </div>
                    <CardTitle className="text-sm text-amber-900">Key Points to Emphasize</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {processedScript.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-amber-800 flex items-start gap-3">
                        <Badge variant="secondary" className="mt-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Transition Phrases */}
            {processedScript.transitionPhrases.length > 0 && (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <ArrowRight className="h-3 w-3 text-purple-600" />
                    </div>
                    <CardTitle className="text-sm text-purple-900">Transition Cues</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {processedScript.transitionPhrases.map((phrase, index) => (
                      <li key={index} className="text-sm text-purple-800 flex items-start gap-3">
                        <ArrowRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>{phrase}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Timing Cues */}
            {processedScript.timingCues.length > 0 && (
              <Card className="border-indigo-200 bg-indigo-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Timer className="h-3 w-3 text-indigo-600" />
                    </div>
                    <CardTitle className="text-sm text-indigo-900">Timing & Delivery Cues</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {processedScript.timingCues.map((cue, index) => (
                      <li key={index} className="text-sm text-indigo-800 flex items-start gap-3">
                        <Timer className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* General Tips if no specific cues found */}
            {processedScript.keyPoints.length === 0 && 
             processedScript.transitionPhrases.length === 0 && 
             processedScript.timingCues.length === 0 && (
              <Card className="border-slate-200 bg-slate-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                      <Lightbulb className="h-3 w-3 text-slate-600" />
                    </div>
                    <CardTitle className="text-sm text-slate-800">General Presentation Tips</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                      Maintain eye contact with your audience
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                      Speak clearly and at a steady pace
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                      Use natural gestures to emphasize points
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                      Pause briefly between major points
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                      Watch for audience engagement cues
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Lightbulb className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">No script available for analysis</p>
                <p className="text-xs text-muted-foreground/80 mt-1">Add a script in Setup Mode to see intelligent presenter guidance</p>
              </div>
            </div>
          </div>
        )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Quick Reference Footer */}
      {hasContent && (
        <div className="px-6 py-4 bg-muted/30 border-t">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-2 text-foreground">Legend:</p>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-amber-100 rounded-full flex items-center justify-center">
                  <Key className="h-2 w-2 text-amber-600" />
                </div>
                Key Points
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-100 rounded-full flex items-center justify-center">
                  <ArrowRight className="h-2 w-2 text-purple-600" />
                </div>
                Transitions
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Timer className="h-2 w-2 text-indigo-600" />
                </div>
                Timing
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
