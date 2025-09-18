import { useState, useEffect } from 'react';
import { usePresentationStore } from './core/store/presentation';
import { EnhancedWelcome } from './features/upload/components/EnhancedWelcome';
import { SlideViewer } from './features/slides/components/SlideViewer';
import { ScriptEditor } from './features/script/components/ScriptEditor';
import { ScriptUpload } from './features/script/components/ScriptUpload';
import { SimplePracticeView } from './features/practice/components/SimplePracticeView';
// import { PracticeView } from './features/practice/components/PracticeView'; // 📝 Commented out - keeping old three-pane view for reference
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Check, AlertCircle } from 'lucide-react';
import { Toaster } from './components/ui/toast';

export default function App() {
  const { currentPresentation, clearPresentation, uploadStatus, currentSlideIndex, loadImagesFromIndexedDB } = usePresentationStore();
  const [currentMode, setCurrentMode] = useState<'setup' | 'practice'>('setup');
  const [setupComplete, setSetupComplete] = useState(false);
  
  // Load images from IndexedDB when app starts with a persisted presentation
  useEffect(() => {
    if (currentPresentation && currentPresentation.slides.some(slide => !slide.imageUrl || slide.imageUrl.trim() === '')) {
      console.log('📷 Loading images from IndexedDB for persisted presentation...');
      loadImagesFromIndexedDB();
    }
  }, [currentPresentation, loadImagesFromIndexedDB]);
  
  // Check if setup is complete
  useEffect(() => {
    if (currentPresentation) {
      const hasScripts = currentPresentation.slides.some(s => s.script?.trim());
      const hasGuides = currentPresentation.slides.some(s => s.guide);
      setSetupComplete(hasScripts && hasGuides);
    }
  }, [currentPresentation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Modern glass morphism header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                PresentationStudio
              </h1>
              {currentPresentation && (
                <Badge variant="secondary">
                  {currentPresentation.slides.length} slides
                </Badge>
              )}
            </div>
            {currentPresentation && (
              <Button variant="ghost" onClick={clearPresentation}>
                New Presentation
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!currentPresentation ? (
          <EnhancedWelcome 
            onScriptProvided={(script) => {
              // Store script globally for Setup mode access
              (window as any).uploadedScript = script;
              console.log('Script provided and stored globally:', script.substring(0, 50) + '...');
            }}
          />
        ) : (
          <Tabs value={currentMode} onValueChange={(value) => setCurrentMode(value as 'setup' | 'practice')} className="w-full">
            {/* Beautiful tab navigation */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {currentPresentation.title}
                </h2>
                <p className="text-gray-600">
                  Created {new Date(currentPresentation.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="setup" className="data-[state=active]:bg-white relative">
                  <span className="mr-2">📁</span> Setup
                  {!setupComplete && currentPresentation && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="practice" 
                  className="data-[state=active]:bg-white relative"
                  disabled={!setupComplete}
                >
                  <span className="mr-2">🎤</span> Practice
                  {setupComplete && (
                    <Check className="w-3 h-3 ml-1 text-green-600" />
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab content with modern cards */}
            <TabsContent value="setup" className="space-y-6">
              {/* Setup Progress Card */}
              <Card className={setupComplete ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/50"}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {setupComplete ? (
                        <>
                          <Check className="w-5 h-5 text-green-600" />
                          Setup Complete
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                          Setup In Progress
                        </>
                      )}
                    </span>
                    {setupComplete && (
                      <Button 
                        size="sm" 
                        onClick={() => setCurrentMode('practice')}
                        className="bg-green-600 hover:bg-green-700 min-h-[44px] px-4"
                      >
                        Ready for Practice →
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        {currentPresentation?.slides.some(s => s.script?.trim()) ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                        )}
                        <span className="text-sm">Scripts Added</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentPresentation?.slides.some(s => s.guide) ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                        )}
                        <span className="text-sm">Guides Generated</span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
              {/* Script Upload Card */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Upload Script</CardTitle>
                  <CardDescription>
                    Add your presentation script for all {currentPresentation.slides.length} slides
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScriptUpload 
                    onScriptUploaded={() => {
                      console.log('Script uploaded and parsed!');
                      // Force re-check of setup status
                      setSetupComplete(true);
                    }}
                    onNavigateToPractice={() => {
                      setCurrentMode('practice');
                    }}
                  />
                </CardContent>
              </Card>
              
              {/* Two column layout for slides and editor */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle>Slides</CardTitle>
                    <CardDescription>Navigate through your presentation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SlideViewer />
                  </CardContent>
                </Card>
                
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle>Slide Script</CardTitle>
                    <CardDescription>Edit the script for the current slide</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentPresentation && (
                      <ScriptEditor
                        slideId={currentPresentation.slides[currentSlideIndex]?.id}
                        initialScript={currentPresentation.slides[currentSlideIndex]?.script || ''}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="practice" className="p-0">
              {/* 🆕 SIMPLIFIED TWO-PANE PRACTICE VIEW - Full screen layout */}
              <SimplePracticeView 
                onBack={() => setCurrentMode('setup')}
              />
            </TabsContent>
          </Tabs>
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
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
