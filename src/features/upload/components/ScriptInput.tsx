import { useState, useRef } from 'react';
import { FileText, Upload, PenTool, X } from 'lucide-react';

interface ScriptInputProps {
  onScriptProvided: (script: string) => void;
  onCancel: () => void;
}

export function ScriptInput({ onScriptProvided, onCancel }: ScriptInputProps) {
  const [script, setScript] = useState('');
  const [activeMode, setActiveMode] = useState<'paste' | 'file' | 'write' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setScript(content);
      setActiveMode('write'); // Switch to edit mode after loading
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (script.trim()) {
      onScriptProvided(script.trim());
    }
  };

  if (!activeMode) {
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Start with Your Script
          </h3>
          <p className="text-gray-600 mb-6">
            Many presenters start with their script first. Choose how you'd like to add yours:
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setActiveMode('paste')}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Paste Script
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload Text File
            </button>
            
            <button
              onClick={() => setActiveMode('write')}
              className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PenTool className="h-4 w-4" />
              Write Script
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.docx,.doc"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload script file"
            title="Upload script file (.txt, .docx, .doc)"
          />

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip and upload slides first
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">
          {activeMode === 'paste' && 'Paste Your Script'}
          {activeMode === 'file' && 'Upload Script File'}  
          {activeMode === 'write' && 'Write Your Script'}
        </h3>
        <button
          onClick={() => setActiveMode(null)}
          className="p-1 text-gray-400 hover:text-gray-600"
          title="Close script editor"
          aria-label="Close script editor"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder={`${activeMode === 'paste' ? 'Paste your complete presentation script here...' : 'Write your presentation script here...'}

Tips for better analysis:
• Use keywords like 'important', 'key', 'remember' to highlight main points
• Add transition phrases like 'moving on', 'next', 'let's look at'
• Include timing cues like 'pause here', 'emphasize this', 'click to advance'
• Write in a conversational tone as you'll speak to your audience`}
        className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          {script.trim().split(/\s+/).filter(word => word.length > 0).length} words
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!script.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue with Script
          </button>
        </div>
      </div>
    </div>
  );
}
