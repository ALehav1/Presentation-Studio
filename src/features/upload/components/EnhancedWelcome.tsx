import { useState } from 'react';
import { UploadZone } from './UploadZone';
import { ScriptInput } from './ScriptInput';
import { usePresentationStore } from '../../../core/store/presentation';
import { FileText, Upload, ArrowRight } from 'lucide-react';

interface EnhancedWelcomeProps {
  onScriptProvided?: (script: string) => void;
}

export function EnhancedWelcome({ onScriptProvided }: EnhancedWelcomeProps) {
  const [selectedFlow, setSelectedFlow] = useState<'slides' | 'script' | null>(null);

  const handleScriptProvided = (script: string) => {
    // Store script in Zustand store so ScriptUpload component can access it
    const { setTempUploadedScript } = usePresentationStore.getState();
    setTempUploadedScript(script);
    console.log('Script provided and stored in store:', script.substring(0, 100) + '...');
    
    // Show slides upload screen after script is provided
    setSelectedFlow('slides');
    
    // Call the parent callback if provided
    onScriptProvided?.(script);
  };

  if (selectedFlow === 'slides') {
    const { getTempUploadedScript } = usePresentationStore.getState();
    const hasScript = !!getTempUploadedScript();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => setSelectedFlow(null)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              ← Back to options
            </button>
          </div>
          {hasScript && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ Script loaded successfully! Now add your slides to complete Part 1.
              </p>
            </div>
          )}
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            {hasScript ? 'Step 2: Upload Your Slides' : 'Upload Your Slides'}
          </h3>
          <p className="text-gray-600 mb-6">
            Upload your PDF presentation to {hasScript ? 'complete the setup' : 'get started with slide navigation and practice'}.
          </p>
        </div>
        <UploadZone />
      </div>
    );
  }

  if (selectedFlow === 'script') {
    return (
      <div className="space-y-6">
        <ScriptInput 
          onScriptProvided={handleScriptProvided}
          onCancel={() => setSelectedFlow(null)}
        />
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        Welcome to PresentationStudio
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Transform your presentations into interactive practice sessions. 
        Choose how you'd like to get started:
      </p>
      
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
        {/* Option A: Start with Script */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Start with Script
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Perfect if you've already written your presentation script. 
              We'll analyze it for key points and transitions.
            </p>
            <ul className="text-sm text-gray-500 mb-6 space-y-1">
              <li>✓ Paste or upload your script</li>
              <li>✓ Auto-extract key points</li>
              <li>✓ Add slides later</li>
            </ul>
            <button
              onClick={() => setSelectedFlow('script')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start with Script
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Option B: Start with Slides */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-green-300 hover:shadow-md transition-all">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Start with Slides
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Upload your PDF presentation first, then add scripts 
              and notes for each slide.
            </p>
            <ul className="text-sm text-gray-500 mb-6 space-y-1">
              <li>✓ Drag & drop PDF upload</li>
              <li>✓ Navigate through slides</li>
              <li>✓ Add scripts per slide</li>
            </ul>
            <button
              onClick={() => setSelectedFlow('slides')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Upload Slides
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">
          Both paths lead to the same powerful practice experience:
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          <span>✓ Auto-extracted key points</span>
          <span>✓ Presenter guidance</span>
          <span>✓ Three-pane practice mode</span>
          <span>✓ Mobile-friendly interface</span>
        </div>
      </div>
    </div>
  );
}
