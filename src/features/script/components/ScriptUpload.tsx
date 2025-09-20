import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Upload, FileText } from 'lucide-react';
import { generateAllContentGuides } from '../../practice/utils/script-processor';
import { usePresentationStore } from '../../../core/store/presentation';
import { useToast } from '../../../hooks/use-toast';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';

interface ScriptUploadProps {
  /** Callback when script is successfully uploaded and parsed */
  onScriptUploaded?: () => void;
  onNavigateToPractice?: () => void;
}

/**
 * Enhanced script upload component with automatic parsing and alignment
 * Provides streamlined UX with immediate visual feedback
 */
// const VALID_EXTENSIONS = ['.txt', '.pdf']; // Currently unused

export function ScriptUpload({ onScriptUploaded, onNavigateToPractice }: ScriptUploadProps) {
  const { currentPresentation, parseAndApplyBulkScript, updateSlideGuide } = usePresentationStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [script, setScript] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  // New state variables for automatic parsing
  const [isParsing, setIsParsing] = useState(false);

  // Handle file upload with automatic parsing
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setScript(content); // Put file content in textarea
      setUploadedFileName(file.name);
      
      // Automatically trigger parsing after short delay
      setTimeout(() => {
        handleAutoParse(content);
      }, 500);
    };
    reader.readAsText(file);
  };

  // Auto-parse function using fixed parseAndApplyBulkScript
  const handleAutoParse = useCallback(async (scriptContent: string) => {
    if (!scriptContent.trim() || !currentPresentation) return;
    
    setIsParsing(true);
    
    // Use the FIXED parseAndApplyBulkScript method that splits scripts properly
    parseAndApplyBulkScript(scriptContent);
    
    // Wait for state to update, then generate guides with the new distributed scripts
    setTimeout(() => {
      const updatedPresentation = usePresentationStore.getState().currentPresentation;
      if (updatedPresentation) {
        // Generate presenter guides using the newly distributed scripts
        const guides = generateAllContentGuides(
          updatedPresentation.slides.map((slide) => ({
            id: slide.id,
            script: slide.script || '' // Now has the distributed content
          }))
        );
        
        // Save guides
        guides.forEach(({ slideId, guide }) => {
          updateSlideGuide(slideId, guide);
        });
      }
    }, 100); // Short delay to ensure state updates
    
    setIsParsing(false);
    onScriptUploaded?.();
    
    // Show success message
    toast({
      title: "✅ Part 1 Complete - Basic Setup Ready!",
      description: "PDF slides and script loaded. You can practice now or enhance with AI (Part 2).",
      action: onNavigateToPractice ? (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onNavigateToPractice()}
        >
          Start Basic Practice
        </Button>
      ) : undefined
    });
  }, [currentPresentation, parseAndApplyBulkScript, updateSlideGuide, onScriptUploaded, onNavigateToPractice, toast]);

  // Track if we've already processed this script to prevent double processing
  const [processedScript, setProcessedScript] = useState('');

  // Check for temp stored script on mount
  useEffect(() => {
    const { getTempUploadedScript, setTempUploadedScript } = usePresentationStore.getState();
    const tempScript = getTempUploadedScript();
    if (tempScript && !script && tempScript !== processedScript) {
      console.log('📝 Loading script from store');
      setScript(tempScript);
      setTempUploadedScript(null); // Clear temp storage after use
      
      // Trigger auto-parse after loading
      setTimeout(() => {
        handleAutoParse(tempScript);
        setProcessedScript(tempScript);
      }, 500);
    }
  }, []); // Remove dependencies to prevent infinite loop

  // Auto-parse effect for pasted content
  useEffect(() => {
    if (!script.trim() || uploadedFileName || isParsing || script === processedScript) return; // Skip if already processed
    
    const parseTimer = setTimeout(() => {
      handleAutoParse(script);
      setProcessedScript(script);
    }, 1500); // 1.5 second delay after typing stops
    
    return () => clearTimeout(parseTimer);
  }, [script, uploadedFileName, isParsing, processedScript]); // Add processedScript dependency




  if (!currentPresentation) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Upload PDF slides first</p>
          <p className="text-sm text-gray-500">
            You need to upload your presentation slides before adding scripts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <div className="space-y-2">
        <Label htmlFor="script-file">Upload Script File</Label>
        <p className="text-sm text-muted-foreground">
          Supports .txt and .pdf files (max 5MB) • Script will auto-parse after upload
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Script File
          </Button>
          {uploadedFileName && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {uploadedFileName}
            </Badge>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or paste script
          </span>
        </div>
      </div>

      {/* Script Textarea - Shows uploaded or pasted content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="script-text">Script Content</Label>
          {isParsing && (
            <Badge variant="outline" className="animate-pulse">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Auto-parsing...
            </Badge>
          )}
        </div>
        <Textarea
          id="script-text"
          placeholder={`Paste your complete script here. Use formats like:

Slide 1
Your content for slide 1...

Slide 2
Your content for slide 2...

Or separate sections with:
---

The script will automatically parse and align to your ${
            currentPresentation?.slides.length || 'slides'
          } slides.`}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="min-h-[200px] md:min-h-[150px] text-base md:text-sm font-mono p-4"
          style={{ fontSize: '16px' }}
          disabled={isParsing}
        />
        
        {/* Status indicator */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {script ? `${script.split(/\s+/).length} words`  : 'No script entered'}
          </span>
          {script && (
            <span className="text-muted-foreground">
              Will be split across {currentPresentation?.slides.length || 0} slides
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
