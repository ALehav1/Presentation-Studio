import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { usePresentationStore } from '../../../core/store/presentation';
import { Scissors, Save, RotateCcw, CheckCircle, AlertCircle, Lightbulb, FileText } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { ContentGuide } from '../../../core/types/presentation';

interface SlideContent {
  slideIndex: number;
  script: string;
  guide: ContentGuide;
}

export function EnhancedManualAlignment() {
  const { currentPresentation, updateSlideScript, updateSlideGuide } = usePresentationStore();
  const { toast } = useToast();
  const [slideContents, setSlideContents] = useState<SlideContent[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = currentPresentation?.slides || [];
  const fullScript = currentPresentation?.fullScript || '';
  
  // Initialize slide contents from existing data
  useEffect(() => {
    if (slides.length > 0) {
      const contents = slides.map((slide, index) => ({
        slideIndex: index,
        script: slide.script || '',
        guide: slide.guide || {
          keyPoints: [],
          tips: [],
          transitions: { entry: '', exit: '' },
          timing: { suggested: 60, minimum: 30, maximum: 120 }
        }
      }));
      setSlideContents(contents);
    }
  }, [slides]);
  
  // Check if content is already distributed
  const hasDistributedContent = slides.some(s => s.script?.trim() || s.guide?.keyPoints?.length > 0);
  
  const handleScriptChange = (slideIndex: number, script: string) => {
    setSlideContents(prev => 
      prev.map(content => 
        content.slideIndex === slideIndex ? { ...content, script } : content
      )
    );
  };
  
  const handleGuideChange = (slideIndex: number, field: string, value: any) => {
    setSlideContents(prev => 
      prev.map(content => {
        if (content.slideIndex !== slideIndex) return content;
        
        const updatedGuide = { ...content.guide };
        
        switch (field) {
          case 'keyPoints':
            updatedGuide.keyPoints = value.split('\n').filter((p: string) => p.trim());
            break;
          case 'tips':
            updatedGuide.tips = value.split('\n').filter((t: string) => t.trim());
            break;
          case 'entryTransition':
            updatedGuide.transitions.entry = value;
            break;
          case 'exitTransition':
            updatedGuide.transitions.exit = value;
            break;
          case 'timing':
            updatedGuide.timing.suggested = parseInt(value) || 60;
            break;
        }
        
        return { ...content, guide: updatedGuide };
      })
    );
  };
  
  const handleSave = () => {
    // Save all content
    slideContents.forEach(content => {
      const slide = slides[content.slideIndex];
      if (slide) {
        // Save script
        updateSlideScript(slide.id, content.script.trim(), 'setup');
        
        // Save guide if it has content
        if (content.guide.keyPoints.length > 0 || content.guide.tips.length > 0) {
          updateSlideGuide(slide.id, content.guide);
        }
      }
    });
    
    setIsEditing(false);
    
    const scriptsCount = slideContents.filter(c => c.script.trim()).length;
    const guidesCount = slideContents.filter(c => c.guide.keyPoints.length > 0).length;
    
    toast({
      title: "✅ Content Saved",
      description: `${scriptsCount} scripts and ${guidesCount} guides saved successfully`,
    });
  };
  
  const handleReset = () => {
    // Clear all content
    slides.forEach(slide => {
      updateSlideScript(slide.id, '', 'setup');
      updateSlideGuide(slide.id, {
        keyPoints: [],
        tips: [],
        transitions: { entry: '', exit: '' },
        timing: { suggested: 60, minimum: 30, maximum: 120 }
      });
    });
    
    // Reset local state
    setSlideContents(slides.map((_, index) => ({
      slideIndex: index,
      script: '',
      guide: {
        keyPoints: [],
        tips: [],
        transitions: { entry: '', exit: '' },
        timing: { suggested: 60, minimum: 30, maximum: 120 }
      }
    })));
    
    toast({
      title: "🔄 Content Reset",
      description: "All scripts and guides have been cleared",
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
    
    const newContents = slides.map((_, index) => {
      const start = index * wordsPerSlide;
      const end = Math.min((index + 1) * wordsPerSlide, words.length);
      const script = words.slice(start, end).join(' ');
      
      return {
        slideIndex: index,
        script,
        guide: slideContents[index]?.guide || {
          keyPoints: [],
          tips: [],
          transitions: { entry: '', exit: '' },
          timing: { suggested: 60, minimum: 30, maximum: 120 }
        }
      };
    });
    
    setSlideContents(newContents);
    setIsEditing(true);
    
    toast({
      title: "✂️ Script Auto-Split",
      description: "Script divided evenly. Now add your presenter guides!",
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
  
  const currentContent = slideContents[currentSlide];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Manual Preparation
          </span>
          <div className="flex items-center gap-2">
            {hasDistributedContent && !isEditing && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Content Ready
              </Badge>
            )}
            {isEditing && (
              <Badge variant="default">Editing</Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Manually prepare your scripts and presenter guides for each slide
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
                {hasDistributedContent ? 'Edit Content' : 'Prepare Manually'}
              </Button>
              
              {!hasDistributedContent && fullScript && (
                <Button
                  onClick={handleAutoSplit}
                  variant="outline"
                  size="sm"
                >
                  ✂️ Auto-Split Script
                </Button>
              )}
              
              {hasDistributedContent && (
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
                onClick={handleSave}
                variant="default"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save All Content
              </Button>
              
              <Button
                onClick={() => {
                  setIsEditing(false);
                  // Restore original content
                  setSlideContents(slides.map((slide, index) => ({
                    slideIndex: index,
                    script: slide.script || '',
                    guide: slide.guide || {
                      keyPoints: [],
                      tips: [],
                      transitions: { entry: '', exit: '' },
                      timing: { suggested: 60, minimum: 30, maximum: 120 }
                    }
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
        
        {/* Content Editor */}
        {isEditing && currentContent && (
          <div className="space-y-4">
            {/* Slide Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {slides.map((_, index) => (
                <Button
                  key={index}
                  variant={currentSlide === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentSlide(index)}
                  className="flex-shrink-0"
                >
                  Slide {index + 1}
                  {slideContents[index]?.script.trim() && (
                    <CheckCircle className="w-3 h-3 ml-1" />
                  )}
                </Button>
              ))}
            </div>
            
            {/* Content Tabs */}
            <Tabs defaultValue="script" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="script">
                  <FileText className="w-4 h-4 mr-2" />
                  Script
                </TabsTrigger>
                <TabsTrigger value="guide">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Presenter Guide
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="script" className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Slide {currentSlide + 1} Script
                  </label>
                  <span className="text-xs text-gray-500">
                    {currentContent.script.split(/\s+/).filter(w => w).length} words
                  </span>
                </div>
                <Textarea
                  value={currentContent.script}
                  onChange={(e) => handleScriptChange(currentSlide, e.target.value)}
                  placeholder={`Enter script for slide ${currentSlide + 1}...`}
                  className="min-h-[200px] text-sm"
                />
              </TabsContent>
              
              <TabsContent value="guide" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Key Points</label>
                  <Textarea
                    value={currentContent.guide.keyPoints.join('\n')}
                    onChange={(e) => handleGuideChange(currentSlide, 'keyPoints', e.target.value)}
                    placeholder="Enter key points (one per line)..."
                    className="min-h-[100px] text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Presenter Tips</label>
                  <Textarea
                    value={currentContent.guide.tips.join('\n')}
                    onChange={(e) => handleGuideChange(currentSlide, 'tips', e.target.value)}
                    placeholder="Enter tips for yourself (one per line)..."
                    className="min-h-[100px] text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Entry Transition</label>
                    <input
                      type="text"
                      value={currentContent.guide.transitions.entry}
                      onChange={(e) => handleGuideChange(currentSlide, 'entryTransition', e.target.value)}
                      placeholder="How to introduce this slide..."
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Suggested Time (seconds)</label>
                    <input
                      type="number"
                      value={currentContent.guide.timing.suggested}
                      onChange={(e) => handleGuideChange(currentSlide, 'timing', e.target.value)}
                      min="10"
                      max="300"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Status Display */}
        {!isEditing && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Content Preparation Status:
            </div>
            <div className="grid grid-cols-5 gap-2">
              {slides.map((slide, index) => {
                const hasScript = slide.script?.trim();
                const hasGuide = slide.guide?.keyPoints?.length > 0;
                
                return (
                  <div
                    key={index}
                    className={`p-2 text-center rounded-lg text-xs ${
                      hasScript && hasGuide
                        ? 'bg-green-100 text-green-700'
                        : hasScript || hasGuide
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <div className="font-medium">Slide {index + 1}</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {hasScript && <FileText className="w-3 h-3" />}
                      {hasGuide && <Lightbulb className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Tip:</strong> Create your own presenter guides to help during practice.</p>
          <p>📝 <strong>Scripts:</strong> What you'll say for each slide.</p>
          <p>🎯 <strong>Guides:</strong> Key points, tips, and transitions to help you present.</p>
        </div>
      </CardContent>
    </Card>
  );
}
