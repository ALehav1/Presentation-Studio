import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { usePresentationStore } from '../../../core/store/presentation';
import { Zap, Brain, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { SimpleOpenAIProcessor } from '../../ai-premium/components/SimpleOpenAIProcessor';

export function PreparationOptions() {
  const { currentPresentation, getTempUploadedScript } = usePresentationStore();
  const [showAI, setShowAI] = useState(false);
  
  const slides = currentPresentation?.slides || [];
  const tempScript = getTempUploadedScript();
  const hasScript = currentPresentation?.fullScript || slides.some(s => s.script?.trim()) || tempScript;
  
  // Don't show this component if we don't have both slides and script
  if (!currentPresentation || !hasScript) {
    return null;
  }
  
  // If AI is selected, show that interface
  if (showAI) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowAI(false)}
        >
          ← Back to options
        </Button>
        <SimpleOpenAIProcessor />
      </div>
    );
  }
  
  // Show two simple options
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">What would you like to do?</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Practice Now Option */}
        <Card 
          className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
          onClick={() => {
            // Navigate directly to practice tab
            const tabs = document.querySelector('[role="tablist"]');
            const practiceTab = tabs?.querySelector('[value="practice"]') as HTMLButtonElement;
            practiceTab?.click();
          }}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Practice Now</h3>
              <p className="text-gray-600 text-sm">
                Start practicing immediately with your full script
              </p>
              <Badge variant="secondary">Basic Mode</Badge>
              <Button className="mt-4 w-full">
                <ArrowRight className="w-4 h-4 mr-2" />
                Start Practice
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* AI Enhancement Option */}
        <Card 
          className="cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
          onClick={() => setShowAI(true)}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg">Process with AI</h3>
              <p className="text-gray-600 text-sm">
                Enhance your practice with AI-generated guides
              </p>
              <Badge variant="default" className="bg-purple-600">Enhanced Mode</Badge>
              <Button className="mt-4 w-full" variant="outline">
                <ArrowRight className="w-4 h-4 mr-2" />
                Setup AI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
