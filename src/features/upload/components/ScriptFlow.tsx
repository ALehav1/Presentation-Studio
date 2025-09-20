import { ScriptInput } from './ScriptInput';
import { Check } from 'lucide-react';

interface ScriptFlowProps {
  onComplete?: () => void;
}

export function ScriptFlow({ onComplete }: ScriptFlowProps) {
  const handleScriptProvided = () => {
    // Script is already stored in the store by ScriptInput
    console.log('Script flow complete, navigating to setup...');
    
    // Call completion callback to navigate to main setup
    onComplete?.();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Slides uploaded successfully! Now add your script to complete Part 1.
          </p>
        </div>
        <h3 className="text-xl font-medium text-gray-800 mb-2">
          Step 2: Add Your Script
        </h3>
        <p className="text-gray-600 mb-6">
          Choose how you'd like to add your presentation script.
        </p>
      </div>
      
      <ScriptInput 
        onScriptProvided={handleScriptProvided}
        onCancel={() => {
          // In slides-first flow, we can't really cancel
          // Maybe show a warning?
          console.log('Script is required to continue');
        }}
      />
    </div>
  );
}
