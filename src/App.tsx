import { useState } from 'react';
import { usePresentationStore } from './core/store/presentation';
import { EnhancedWelcome } from './features/upload/components/EnhancedWelcome';
import { SlideViewer } from './features/slides/components/SlideViewer';
import { ScriptEditor } from './features/script/components/ScriptEditor';
import { ScriptUpload } from './features/script/components/ScriptUpload';
import { PracticeView } from './features/practice/components/PracticeView';

export default function App() {
  const { currentPresentation, clearPresentation, uploadStatus, currentSlideIndex } = usePresentationStore();
  const [currentMode, setCurrentMode] = useState<'preparation' | 'practice'>('preparation');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            PresentationStudio
          </h1>
          {currentPresentation && (
            <button
              onClick={clearPresentation}
              className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              New Presentation
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!currentPresentation ? (
          <EnhancedWelcome 
            onScriptProvided={(script) => {
              // For future implementation: handle script-first workflow
              console.log('Script provided:', script.substring(0, 50) + '...');
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {currentPresentation.title}
                </h2>
                <p className="text-gray-600">
                  {currentPresentation.slides.length} slides • 
                  Created {new Date(currentPresentation.createdAt).toLocaleDateString()} •
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    currentMode === 'practice' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {currentMode === 'practice' ? 'Practice Mode' : 'Preparation Mode'}
                  </span>
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMode('preparation')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentMode === 'preparation'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📁 Setup
                </button>
                <button
                  onClick={() => setCurrentMode('practice')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentMode === 'practice'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🎤 Practice
                </button>
              </div>
            </div>

            {/* Main Content - Switch between modes */}
            {currentMode === 'preparation' ? (
              <div className="space-y-8">
                {/* Script Upload Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Upload Full Script
                  </h3>
                  <ScriptUpload 
                    onScriptUploaded={() => console.log('Script uploaded and parsed!')}
                  />
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Slide Viewer */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      Slide Viewer
                    </h3>
                    <SlideViewer />
                  </div>

                  {/* Script Editor */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      Individual Slide Script
                    </h3>
                    <div className="bg-white rounded-lg border p-6">
                      {currentPresentation && (
                        <ScriptEditor
                          slideId={currentPresentation.slides[currentSlideIndex]?.id}
                          initialScript={currentPresentation.slides[currentSlideIndex]?.script || ''}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Practice Mode - Three-pane view */
              <div className="h-[calc(100vh-200px)]">
                <PracticeView 
                  onBackToPreparation={() => setCurrentMode('preparation')}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Status indicator for uploads */}
      {uploadStatus !== 'idle' && uploadStatus !== 'complete' && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="text-sm font-medium">
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Converting slides...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
