// src/pages/AITestPage.tsx
// Standalone page to test AI slide reading MVP

import { SlideReaderTest } from '../features/ai-testing/components/SlideReaderTest';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AITestPageProps {
  onBack?: () => void;
}

/**
 * Simple test page for AI slide reading functionality
 * Access this at /ai-test route
 */
export const AITestPage = ({ onBack }: AITestPageProps) => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🤖 AI Slide Reader - MVP Test</h1>
              <p className="text-gray-600 mt-1">
                Test OpenAI Vision API integration for reading slide content
              </p>
            </div>
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="font-semibold text-blue-900 mb-3">📋 How to Test:</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Upload a PDF presentation in the main app first</li>
            <li>Get your OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></li>
            <li>Enter your API key below and test the connection</li>
            <li>Select a slide and click "Test AI Slide Reading"</li>
            <li>See what the AI can extract from your slides!</li>
          </ol>
        </Card>

        {/* Main Test Component */}
        <SlideReaderTest />

        {/* Cost Information */}
        <Card className="p-4 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">💰 Cost Breakdown:</h3>
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>GPT-4o-mini:</strong> ~$0.0001 per slide (very cheap for testing)</p>
            <p><strong>5-slide presentation:</strong> ~$0.0005 total</p>
            <p><strong>Your cost:</strong> You pay OpenAI directly with your API key</p>
            <p><strong>Our cost:</strong> $0 - no middleman fees!</p>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-4 bg-purple-50 border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2">🚀 What's Next:</h3>
          <div className="text-sm text-purple-800 space-y-1">
            <p>1. <strong>Read slide content</strong> ✅ (This MVP)</p>
            <p>2. <strong>Match script to slides</strong> 🔄 (Next: Use slide content to intelligently match script sections)</p>
            <p>3. <strong>Generate real guidance</strong> 🔄 (Next: Create coaching tips based on slide content)</p>
            <p>4. <strong>Full AI integration</strong> 🔄 (Replace current blind allocation with AI intelligence)</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
