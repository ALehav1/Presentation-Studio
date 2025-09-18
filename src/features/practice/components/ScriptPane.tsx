import { useState, useEffect } from 'react';
import { usePresentationStore } from '../../../core/store/presentation';
import { processScript, estimateSpeakingTime } from '../utils/script-processor';
import { FileText, Clock, Edit, Eye, EyeOff, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScriptPaneProps {
  /** ID of the current slide */
  slideId: string;
  /** Initial script text */
  initialScript: string;
  /** Whether the pane is visible (for hide/show functionality) */
  isVisible: boolean;
  /** Whether the script is editable (false in practice mode) */
  isEditable?: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

export function ScriptPane({ 
  slideId, 
  initialScript, 
  isVisible, 
  isEditable = true,
  onVisibilityChange 
}: ScriptPaneProps) {
  const { updateSlideScript } = usePresentationStore();
  const [script, setScript] = useState(initialScript);
  const [isSaving, setIsSaving] = useState(false);

  // Update script when slide changes
  useEffect(() => {
    setScript(initialScript);
  }, [initialScript, slideId]);

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!isEditable || script === initialScript) return;

    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      updateSlideScript(slideId, script);
      setTimeout(() => setIsSaving(false), 500);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [script, slideId, updateSlideScript, initialScript, isEditable]);

  // Process script for stats
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
              <p className="text-muted-foreground text-sm mb-3">Script Hidden</p>
              <Button
                variant="default"
                size="sm"
                onClick={() => onVisibilityChange?.(true)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Show Script
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base text-gray-800">Speaker Script</CardTitle>
                {isSaving && (
                  <div className="flex items-center gap-1">
                    <Save className="h-3 w-3 text-blue-600 animate-pulse" />
                    <span className="text-xs text-blue-600">Saving...</span>
                  </div>
                )}
              </div>
              <CardDescription className="text-xs mt-1">
                {isEditable ? 'Edit your presentation script' : 'Practice with your script'}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Script Stats */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <FileText className="h-3 w-3" />
                {processedScript.wordCount} words
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                {estimateSpeakingTime(processedScript.wordCount)}
              </Badge>
            </div>
            
            {/* Hide Button */}
            {onVisibilityChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVisibilityChange(false)}
                className="gap-2 h-8 px-3"
                title="Hide script"
              >
                <EyeOff className="h-3 w-3" />
                Hide
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Script Content */}
      <CardContent className="p-0 flex-1">
        {isEditable ? (
          <div className="p-6 h-full">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Add your speaker notes here...

💡 Tips for great scripts:
• Use keywords like 'important' or 'key' to highlight main points
• Add transition phrases like 'moving on' or 'next' for flow  
• Include timing cues like 'pause' or 'emphasize' for delivery
• Write in a conversational tone as if speaking to your audience
• Practice reading aloud to find natural rhythm"
              className="w-full h-full p-0 border-0 resize-none focus:ring-0 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400"
            />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-6">
              {script ? (
                <div className="prose prose-sm max-w-none">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                    {/* Render highlighted script with modern highlighting */}
                    {processedScript.highlightedScript.split('**').map((part, index) => 
                      index % 2 === 1 ? (
                        <mark key={index} className="bg-yellow-200/60 font-semibold px-1 py-0.5 rounded">
                          {part}
                        </mark>
                      ) : (
                        <span key={index}>{part}</span>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">No script available for this slide</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">Switch to Setup Mode to add a script</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Footer with helpful tips for practice mode */}
      {!isEditable && script && (
        <div className="px-6 py-4 bg-blue-50/80 border-t border-blue-100">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Edit className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-blue-900 mb-1">Practice Tip</h4>
                  <p className="text-xs text-blue-800">
                    Focus on the <mark className="bg-yellow-200/60 px-1 py-0.5 rounded font-medium">highlighted keywords</mark> for emphasis. 
                    Use natural gestures and maintain eye contact with your audience.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
