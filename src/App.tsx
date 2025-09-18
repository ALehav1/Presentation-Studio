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

export default function App() {
  const { currentPresentation, clearPresentation, uploadStatus, currentSlideIndex, loadImagesFromIndexedDB } = usePresentationStore();
  const [currentMode, setCurrentMode] = useState<'setup' | 'practice'>('setup');
  
  // Load images from IndexedDB when app starts with a persisted presentation
  useEffect(() => {
    if (currentPresentation && currentPresentation.slides.some(slide => !slide.imageUrl || slide.imageUrl.trim() === '')) {
      console.log('📷 Loading images from IndexedDB for persisted presentation...');
      loadImagesFromIndexedDB();
    }
  }, [currentPresentation, loadImagesFromIndexedDB]);

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
                <TabsTrigger value="setup" className="data-[state=active]:bg-white">
                  <span className="mr-2">📁</span> Setup
                </TabsTrigger>
                <TabsTrigger value="practice" className="data-[state=active]:bg-white">
                  <span className="mr-2">🎤</span> Practice
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab content with modern cards */}
            <TabsContent value="setup" className="space-y-6">
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
                    onScriptUploaded={() => console.log('Script uploaded and parsed!')}
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
    </div>
  );
}
