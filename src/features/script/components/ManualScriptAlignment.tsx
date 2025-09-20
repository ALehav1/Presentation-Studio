import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { usePresentationStore } from '../../../core/store/presentation';
import { Scissors, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

interface ScriptSegment {
  slideIndex: number;
  text: string;
}

export function ManualScriptAlignment() {
  const { currentPresentation, updateSlideScript } = usePresentationStore();
  const { toast } = useToast();
  const [segments, setSegments] = useState<ScriptSegment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const slides = currentPresentation?.slides || [];
  const fullScript = currentPresentation?.fullScript || '';
  
  // Initialize segments from existing slide scripts or create empty ones
  useEffect(() => {
    if (slides.length > 0) {
      const existingSegments = slides.map((slide, index) => ({
        slideIndex: index,
        text: slide.script || ''
      }));
      setSegments(existingSegments);
    }
  }, [slides]);
  
  // Check if scripts are already distributed
  const hasDistributedScripts = slides.some(s => s.script?.trim());
  
  const handleSegmentChange = (slideIndex: number, text: string) => {
    setSegments(prev => 
      prev.map(seg => 
        seg.slideIndex === slideIndex ? { ...seg, text } : seg
      )
    );
  };
  
  const handleSaveSegments = () => {
    // Save each segment to its corresponding slide
    segments.forEach(segment => {
      if (segment.text.trim()) {
        updateSlideScript(slides[segment.slideIndex].id, segment.text.trim(), 'setup');
      }
    });
    
    setIsEditing(false);
    toast({
      title: "✅ Scripts Saved",
      description: `Successfully assigned scripts to ${segments.filter(s => s.text.trim()).length} slides`,
    });
  };
  
  const handleReset = () => {
    // Clear all slide scripts
    slides.forEach(slide => {
      updateSlideScript(slide.id, '', 'setup');
    });
    
    // Reset segments
    setSegments(slides.map((_, index) => ({
      slideIndex: index,
      text: ''
    })));
    
    toast({
      title: "🔄 Scripts Reset",
      description: "All slide scripts have been cleared",
    });
  };
  
  const handleAutoSplit = () => {
    if (!fullScript) {
      toast({
        title: "❌ No Script Available",
        description: "Please upload a script first",
      });
      return;
    }
    
    // Simple auto-split: divide script evenly by slides
    const words = fullScript.split(/\s+/);
    const wordsPerSlide = Math.ceil(words.length / slides.length);
    
    const newSegments = slides.map((_, index) => {
      const start = index * wordsPerSlide;
      const end = Math.min((index + 1) * wordsPerSlide, words.length);
      const text = words.slice(start, end).join(' ');
      
      return {
        slideIndex: index,
        text
      };
    });
    
    setSegments(newSegments);
    setIsEditing(true);
    
    toast({
      title: "✂️ Script Auto-Split",
      description: "Script divided evenly across slides. You can now adjust each segment.",
    });
  };
  
  if (!currentPresentation || slides.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No presentation loaded</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Manual Script Alignment
          </span>
          <div className="flex items-center gap-2">
            {hasDistributedScripts && !isEditing && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Scripts Assigned
              </Badge>
            )}
            {isEditing && (
              <Badge variant="default">Editing</Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Manually assign script sections to each slide for better control
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                variant="default"
                size="sm"
              >
                <Scissors className="w-4 h-4 mr-2" />
                {hasDistributedScripts ? 'Edit Scripts' : 'Assign Scripts'}
              </Button>
              
              {!hasDistributedScripts && fullScript && (
                <Button
                  onClick={handleAutoSplit}
                  variant="outline"
                  size="sm"
                >
                  ✂️ Auto-Split Evenly
                </Button>
              )}
              
              {hasDistributedScripts && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={handleSaveSegments}
                variant="default"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Scripts
              </Button>
              
              <Button
                onClick={() => {
                  setIsEditing(false);
                  // Restore original segments
                  setSegments(slides.map((slide, index) => ({
                    slideIndex: index,
                    text: slide.script || ''
                  })));
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
        
        {/* Script Segments */}
        {isEditing && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {segments.map((segment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Slide {index + 1} Script
                  </label>
                  <span className="text-xs text-gray-500">
                    {segment.text.split(/\s+/).filter(w => w).length} words
                  </span>
                </div>
                <Textarea
                  value={segment.text}
                  onChange={(e) => handleSegmentChange(index, e.target.value)}
                  placeholder={`Enter script for slide ${index + 1}...`}
                  className="min-h-[100px] text-sm"
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Status Display */}
        {!isEditing && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Script Distribution Status:
            </div>
            <div className="grid grid-cols-5 gap-2">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`p-2 text-center rounded-lg text-xs ${
                    slide.script?.trim()
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <div className="font-medium">Slide {index + 1}</div>
                  <div>
                    {slide.script?.trim() 
                      ? `${slide.script.split(/\s+/).length} words`
                      : 'No script'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Tip:</strong> You can manually assign different parts of your script to specific slides.</p>
          <p>🤖 <strong>AI Compatible:</strong> The AI processor will use your manual assignments when enhancing the presentation.</p>
        </div>
      </CardContent>
    </Card>
  );
}
