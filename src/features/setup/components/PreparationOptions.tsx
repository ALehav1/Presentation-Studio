import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { usePresentationStore } from '../../../core/store/presentation';
import { Zap, Edit, Brain, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { ManualScriptAlignment } from '../../script/components/ManualScriptAlignment';
import { SimpleOpenAIProcessor } from '../../ai-premium/components/SimpleOpenAIProcessor';

export function PreparationOptions() {
  const { currentPresentation } = usePresentationStore();
  const [selectedOption, setSelectedOption] = useState<'quick' | 'manual' | 'ai' | null>(null);
  
  const slides = currentPresentation?.slides || [];
  const hasScript = currentPresentation?.fullScript || slides.some(s => s.script?.trim());
  const hasManualContent = slides.some(s => s.script?.trim());
  const hasAIContent = slides.some(s => s.guide && s.guide.keyMessages && s.guide.keyMessages.length > 0);
  
  if (!hasScript) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Please upload both slides and script to continue</p>
        </CardContent>
      </Card>
    );
  }
  
  // If an option is selected, show that interface
  if (selectedOption === 'manual') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setSelectedOption(null)}
        >
          ← Back to options
        </Button>
        <ManualScriptAlignment />
      </div>
    );
  }
  
  if (selectedOption === 'ai') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setSelectedOption(null)}
        >
          ← Back to options
        </Button>
        <SimpleOpenAIProcessor />
      </div>
    );
  }
  
  // Show the three preparation options
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your Preparation Method</h3>
        <p className="text-sm text-gray-600">
          Select how you want to prepare your presentation for practice
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {/* Quick Start */}
        <Card className="relative hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedOption('quick')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Start practicing immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Full script displayed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">✗</span>
                <span>No presenter guides</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">✗</span>
                <span>No script distribution</span>
              </li>
            </ul>
            
            <Button 
              className="w-full mt-4"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to practice mode
                const tabs = document.querySelector('[role="tablist"]');
                const practiceTab = tabs?.querySelector('[value="practice"]') as HTMLButtonElement;
                practiceTab?.click();
              }}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Start Practice
            </Button>
          </CardContent>
        </Card>
        
        {/* Manual Setup */}
        <Card className="relative hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedOption('manual')}>
          {hasManualContent && (
            <Badge className="absolute -top-2 -right-2" variant="secondary">
              <Check className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-500" />
              Manual Setup
            </CardTitle>
            <CardDescription>
              Full control over your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Distribute script manually</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Write your own guides</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Full customization</span>
              </li>
            </ul>
            
            <Button 
              className="w-full mt-4"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOption('manual');
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              {hasManualContent ? 'Edit Content' : 'Setup Manually'}
            </Button>
          </CardContent>
        </Card>
        
        {/* AI Setup */}
        <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-purple-200"
              onClick={() => setSelectedOption('ai')}>
          {hasAIContent && (
            <Badge className="absolute -top-2 -right-2" variant="default">
              <Check className="w-3 h-3 mr-1" />
              Enhanced
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Setup
            </CardTitle>
            <CardDescription>
              Let AI enhance your presentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Smart script distribution</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>AI-generated guides</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Practice tips & timing</span>
              </li>
            </ul>
            
            <Button 
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOption('ai');
              }}
            >
              <Brain className="w-4 h-4 mr-2" />
              {hasAIContent ? 'Re-process with AI' : 'Process with AI'}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>💡 <strong>Tip:</strong> You can always switch between methods or combine them.</p>
        <p>Manual setup + AI processing = Best of both worlds!</p>
      </div>
    </div>
  );
}
