// src/features/ai-testing/components/SlideReaderTest.tsx
// Test component for MVP AI slide reading functionality

import { useState } from 'react';
import { usePresentationStore } from '../../../core/store/presentation';
import { aiSlideReader } from '../../../services/ai-slide-reader';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
// import { Alert } from '../../../components/ui/alert'; // Will add later if needed
import { Eye, Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * SlideReaderTest - MVP component to test AI slide reading
 * This proves the concept before building full intelligence
 */
export const SlideReaderTest = () => {
  const { currentPresentation } = usePresentationStore();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [slideContent, setSlideContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionValid, setConnectionValid] = useState<boolean | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  const slides = currentPresentation?.slides || [];
  
  /**
   * Test API key connection
   */
  const testConnection = async () => {
    if (!apiKey) {
      setConnectionValid(false);
      return;
    }
    
    aiSlideReader.setApiKey(apiKey);
    const isValid = await aiSlideReader.testConnection();
    setConnectionValid(isValid);
  };

  /**
   * Test AI slide reading on selected slide
   */
  const testSlideReading = async () => {
    if (!apiKey) {
      alert('Please add your OpenAI API key first');
      return;
    }

    if (!slides[selectedSlideIndex]) {
      alert('No slide selected. Upload a presentation first.');
      return;
    }
    
    setLoading(true);
    setSlideContent('');
    
    aiSlideReader.setApiKey(apiKey);
    const result = await aiSlideReader.readSlide(slides[selectedSlideIndex].imageUrl);
    
    // Handle deprecated AISlideReader result format
    try {
      setSlideContent(JSON.stringify(result, null, 2));
      console.log('🎉 AI successfully read slide:', result);
    } catch (error) {
      alert(`Error: ${error}`);
    }
    
    setLoading(false);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold text-blue-900">🤖 AI Slide Reader (MVP Testing)</h3>
      </div>
      
      <div className="space-y-4">
        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Key className="inline h-4 w-4 mr-1" />
            OpenAI API Key
          </label>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="sk-proj-..."
              value={apiKey}
              onChange={(e) => {
                const newKey = e.target.value;
                setApiKey(newKey);
                localStorage.setItem('openai_api_key', newKey);
                setConnectionValid(null);
              }}
              className="flex-1"
            />
            <Button
              onClick={testConnection}
              disabled={!apiKey}
              variant="outline"
              size="sm"
            >
              Test
            </Button>
          </div>
          
          {/* Connection Status */}
          {connectionValid !== null && (
            <div className="mt-2">
              {connectionValid ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  API key valid
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Invalid API key
                </div>
              )}
            </div>
          )}
          
          <p className="text-xs text-gray-600 mt-1">
            Get a key at{' '}
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              platform.openai.com
            </a>
          </p>
        </div>

        {/* Slide Selection */}
        {slides.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Slide to Read
            </label>
            <div className="flex gap-2 flex-wrap">
              {slides.map((slide, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSlideIndex(index)}
                  className={`relative rounded-lg border-2 p-2 transition-colors ${
                    selectedSlideIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={slide.imageUrl}
                    alt={`Slide ${index + 1}`}
                    className="w-16 h-12 object-cover rounded"
                  />
                  <div className="text-xs text-center mt-1">
                    Slide {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Test Button */}
        <Button
          onClick={testSlideReading}
          disabled={!apiKey || slides.length === 0 || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Reading slide...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Test AI Slide Reading
            </>
          )}
        </Button>

        {/* No Slides Warning */}
        {slides.length === 0 && (
          <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-orange-800">No slides found</strong>
                <p className="text-sm mt-1 text-orange-700">
                  Upload a PDF presentation first to test AI slide reading.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {slideContent && (
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <strong className="text-green-700">
                AI Read This From Slide {selectedSlideIndex + 1}:
              </strong>
            </div>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border font-mono">
              {slideContent}
            </pre>
          </div>
        )}

        {/* Cost Info */}
        <div className="text-xs text-gray-600 bg-gray-100 p-3 rounded">
          <strong>💰 Cost:</strong> ~$0.0001 per slide with GPT-4o-mini (very cheap for testing)
          <br />
          <strong>🔒 Privacy:</strong> Your API key stays in your browser, never sent to our servers
        </div>
      </div>
    </Card>
  );
};
