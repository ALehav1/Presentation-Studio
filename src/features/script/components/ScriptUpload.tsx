import { useState, useEffect } from 'react';
import { AlertCircle, Upload, FileText, Check, FileType, File } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePresentationStore } from '../../../core/store/presentation';

interface ScriptUploadProps {
  /** Callback when script is successfully uploaded and parsed */
  onScriptUploaded?: () => void;
}

/**
 * Component for uploading and parsing full presentation scripts
 * Supports both file upload and copy/paste functionality
 */
// Valid file extensions for script uploads - only formats that work reliably
const VALID_EXTENSIONS = ['.txt', '.pdf'];

export function ScriptUpload({ onScriptUploaded }: ScriptUploadProps) {
  const { currentPresentation, parseAndApplyBulkScript } = usePresentationStore();
  const [script, setScript] = useState('');
  
  // Debug: Check if script exists in store or localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('presentationData');
    const parsedData = storedData ? JSON.parse(storedData) : null;
    
    console.log('🔍 ScriptUpload Debug - Checking for existing script:', {
      localScript: script.substring(0, 100),
      storedScript: parsedData?.script?.substring(0, 100) || 'None',
      currentPresentationExists: !!currentPresentation
    });
    
    // If there's a stored script but no local script, use the stored one
    if (parsedData?.script && !script) {
      console.log('📝 Found stored script, loading into component');
      setScript(parsedData.script);
      setUploadStatus('success');
    }
  }, []);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  /**
   * Extract text content from PDF files using PDF.js
   */
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (item as { str: string }).str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  };

  /**
   * Better RTF to text conversion - extracts actual readable content
   */
  const simpleRtfToText = (rtfContent: string): string => {
    console.log('🔄 Attempting better RTF text extraction...');
    
    // Step 1: Find all text that looks like real content
    // Look for common English words to identify where actual content starts
    const contentIndicators = ['Good morning', 'Opening', 'In preparing', 'Mexico', 'presentation', 'talk', 'slide'];
    let contentStart = -1;
    
    for (const indicator of contentIndicators) {
      const index = rtfContent.toLowerCase().indexOf(indicator.toLowerCase());
      if (index > -1) {
        contentStart = index;
        console.log(`📍 Found content indicator "${indicator}" at position ${index}`);
        break;
      }
    }
    
    // If no indicators found, try to find first sentence-like pattern
    if (contentStart === -1) {
      const sentencePattern = /[A-Z][a-z]+ [a-z]+ [a-z]+/;
      const match = rtfContent.match(sentencePattern);
      if (match) {
        contentStart = match.index || 0;
        console.log('📍 Found sentence pattern at position', contentStart);
      }
    }
    
    // Extract from content start to end, or entire content if no start found
    const textToProcess = contentStart > -1 ? rtfContent.substring(contentStart) : rtfContent;
    
    // Step 2: Clean up RTF artifacts more aggressively
    const cleanText = textToProcess
      // Remove all RTF control sequences
      .replace(/\\[a-z]+\d*\s*/gi, '')
      .replace(/[{}]/g, ' ')
      
      // Remove the specific artifacts we see
      .replace(/-?360[\s-]*360[\s-]*360[\s-]*360/g, ' ')
      .replace(/deftab\d+/gi, ' ')
      .replace(/tightenfactor\d+/gi, ' ')
      
      // Remove any sequences of numbers and dashes
      .replace(/[\s-]*\d+[\s-]+\d+[\s-]*/g, ' ')
      .replace(/\b\d{3,}\b/g, ' ')
      
      // Clean up whitespace
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    // Step 3: Extract meaningful sentences
    const sentences = cleanText.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => {
        return s.length > 20 && // Longer sentences
               /[a-zA-Z]{4,}/.test(s) && // Contains real words
               !/^\d/.test(s) && // Doesn't start with numbers
               !s.includes('font') && // Not formatting
               !s.includes('Times') && // Not font names
               !s.includes('disc') && // Not bullet artifacts
               s.split(' ').length >= 4; // At least 4 words
      })
      .slice(0, 30); // Limit for safety
    
    const result = sentences.join('. ').replace(/\.\s*\./g, '.').trim();
    
    console.log('📝 Better RTF extraction result:', {
      originalLength: rtfContent.length,
      contentStartAt: contentStart,
      extractedLength: result.length,
      sentences: sentences.length,
      preview: result.substring(0, 200)
    });
    
    return result;
  };

  /**
   * Handle RTF to text conversion button click
   */
  const handleRtfConversion = () => {
    const rtfContent = (window as any).rtfContent;
    if (!rtfContent) {
      setError('No RTF content found. Please upload the RTF file again.');
      return;
    }
    
    console.log('🔄 Converting RTF to text...');
    const convertedText = simpleRtfToText(rtfContent);
    
    if (convertedText && convertedText.length > 50) {
      setScript(convertedText);
      setUploadStatus('success');
      setError(null);
      console.log('✅ RTF conversion successful, text added to script area');
    } else {
      setError('RTF conversion failed to extract readable text. Please use manual conversion instructions below.');
      console.log('❌ RTF conversion failed - insufficient text extracted');
    }
  };

  /**
   * Nuclear RTF cleanup - removes ALL artifacts aggressively
   */
  const stripRtfFormatting = (rtfText: string): string => {
    console.log('🔄 Aggressive RTF cleaning...');
    console.log('📥 RTF Input Preview:', rtfText.substring(0, 200));
    
    let text = rtfText;
    
    // Step 1: Extract ONLY the visible text between RTF markers
    // Remove everything from start to first real text
    text = text.replace(/^[\s\S]*?(?=\b[A-Z][a-z]+\b)/m, '');
    
    // Step 2: Remove ALL sequences of numbers with spaces/dashes (like "360 -360-360")
    text = text.replace(/(?:\s*-?\d+\s*){2,}/g, ' ');
    text = text.replace(/\b\d+(?:\s*-\s*\d+)+\b/g, '');
    
    // Step 3: Remove ALL words that contain numbers (RTF artifacts)
    text = text.replace(/\b\w*\d+\w*\b/g, '');
    
    // Step 4: Remove backslash commands
    text = text.replace(/\\[a-z]+\d*/gi, '');
    text = text.replace(/\\par/g, '\n');
    text = text.replace(/\\line/g, '\n');
    
    // Step 5: Remove all braces and special characters
    text = text.replace(/[{}\\]/g, '');
    
    // Step 6: Fix concatenated words (like "Mexico CityTalk" -> "Mexico City\nTalk")
    text = text.replace(/([a-z])([A-Z])/g, '$1 $2');
    text = text.replace(/([A-Z][a-z]+)([A-Z][a-z])/g, '$1\n$2');
    
    // Step 7: Manual fixes for known RTF artifacts
    text = text.replace(/deftab\w*/g, '');
    text = text.replace(/tightenfactor\w*/g, '');
    text = text.replace(/cocoartf\w*/g, '');
    text = text.replace(/ansi\w*/g, '');
    text = text.replace(/viewkind\w*/g, '');
    
    // Step 8: Clean up excessive whitespace
    text = text.replace(/\s{2,}/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/\n\s+/g, '\n');
    
    // Step 9: Fix section headers that got mangled
    text = text.replace(/Opening\s*\w*\s*/g, 'Opening\n');
    text = text.replace(/Documentation Foundation\s*/g, 'Documentation Foundation\n');
    text = text.replace(/Capability Stack\s*/g, 'Capability Stack\n');
    text = text.replace(/Activation Layer\s*/g, 'Activation Layer\n');
    text = text.replace(/FIRST Framework\s*/g, 'FIRST Framework\n');
    text = text.replace(/Close\s*/g, 'Close\n');
    
    // Step 10: Final cleanup
    text = text.trim();
    
    console.log('✅ Nuclear RTF cleanup complete');
    console.log('📝 Cleaned text preview:', text.substring(0, 400));
    console.log('📊 Cleanup stats:', {
      originalLength: rtfText.length,
      cleanedLength: text.length,
      artifactsRemoved: Math.round((1 - text.length / rtfText.length) * 100) + '%'
    });
    
    return text;
  };

  // Enhanced file upload handler with better RTF support
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileSize = file.size;
    const fileType = file.type;

    console.log('🔍 File Upload Debug:', {
      fileName,
      fileType,
      fileSize
    });

    
    // Validate file type - prioritize extensions (more reliable for RTF files)
    const hasValidExtension = VALID_EXTENSIONS.some(ext => fileName.endsWith(ext));

    console.log('🔍 File Validation:', {
      fileName,
      fileType,
      hasValidExtension,
      detectedExtension: VALID_EXTENSIONS.find(ext => fileName.endsWith(ext)) || 'none'
    });

    if (!hasValidExtension) {
      let errorMessage = `File "${file.name}" is not supported. Please upload a .txt or .pdf file.`;
      
      // Special message for RTF files
      if (fileName.endsWith('.rtf')) {
        errorMessage = `RTF files are not supported. Please convert "${file.name}" to plain text first:\n\nMac: textutil -convert txt "${file.name}"\nOr: Open in TextEdit → Format → Make Plain Text → Save as .txt`;
      }
      
      setError(errorMessage);
      setUploadStatus('error');
      // Clear the file input
      event.target.value = '';
      return;
    }

    // Validate file size (max 5MB for scripts)
    if (fileSize > 5 * 1024 * 1024) {
      setError('File too large. Please upload files smaller than 5MB');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');
    setError(null);
    setUploadedFileName(file.name);

    try {
      let scriptText = '';

      // Process by file extension first (most reliable)
      if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        scriptText = await file.text();
        
        // Auto-clean common RTF artifacts even in TXT files (from textutil conversion)
        if (scriptText.includes('deftab') || scriptText.includes('360 -360') || scriptText.includes('tightenfactor')) {
          console.log('🧹 Auto-cleaning RTF artifacts from text file...');
          scriptText = scriptText
            .replace(/(?:\s*-?\d+\s*){3,}/g, ' ')  // Remove number sequences like "360 -360-360"
            .replace(/deftab\d+\w*/g, '')          // Remove deftab artifacts  
            .replace(/tightenfactor\d+/g, '')      // Remove tightenfactor
            .replace(/\s+/g, ' ')                  // Fix spacing
            .trim();
          console.log('✅ RTF artifacts cleaned from text');
        }
      } 
      else if (fileName.endsWith('.pdf')) {
        // PDF files - extract text using PDF.js
        console.log('📄 Processing PDF file:', fileName);
        scriptText = await extractTextFromPDF(file);
      }
      // Fallback to MIME type checking
      else if (fileType === 'text/plain' || fileType === 'text/markdown') {
        scriptText = await file.text();
      }
      else if (fileType === 'application/pdf') {
        scriptText = await extractTextFromPDF(file);
      }
      else {
        throw new Error('Unsupported file format');
      }

      if (!scriptText.trim()) {
        throw new Error('No text content found in file');
      }

      console.log('📝 Setting script content...', {
        contentLength: scriptText.length,
        preview: scriptText.substring(0, 100)
      });
      
      // Force state update with React's batching
      setError(null);
      setUploadStatus('success');
      setScript(scriptText);
      
      console.log('✅ File content loaded successfully:', {
        fileName,
        contentLength: scriptText.length,
        uploadStatus: 'success'
      });
    } catch (error) {
      console.error('File processing error:', error);
      setError(`Failed to read ${fileName}. Please try a different file format.`);
      setUploadStatus('error');
      setUploadedFileName(null);
    }
  };

  // Handle script parsing and application
  const handleParseScript = () => {
    if (!currentPresentation) {
      setError('Please upload PDF slides first');
      return;
    }

    // Try to get script from multiple sources
    let scriptToProcess = script;
    if (!scriptToProcess.trim()) {
      // Check if script exists in window object (from welcome screen)
      const windowScript = (window as any).uploadedScript;
      if (windowScript) {
        scriptToProcess = windowScript;
        console.log('📝 Using script from window object');
      }
    }

    if (!scriptToProcess.trim()) {
      setError('Please upload a script or paste script content');
      return;
    }

    try {
      console.log('🔄 Starting script parsing and application with script:', {
        source: script.trim() ? 'component state' : 'window object',
        length: scriptToProcess.length,
        preview: scriptToProcess.substring(0, 100)
      });
      parseAndApplyBulkScript(scriptToProcess);
      
      onScriptUploaded?.();
      
      // Clear the script input after successful parsing
      setTimeout(() => {
        setScript('');
        setUploadStatus('idle');
      }, 2000);
    } catch (err) {
      setError('Failed to parse script. Please check the format and try again.');
      setUploadStatus('error');
    }
  };

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
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Script for {currentPresentation.slides.length} Slides
        </h3>
        <p className="text-sm text-gray-600">
          Upload a complete script file or paste your script below. It will be automatically 
          split into sections for each slide.
        </p>
      </div>

      {/* Enhanced file upload section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Script File
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Supports .txt and .pdf files (max 5MB) • For RTF files, convert to .txt first
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="file"
            id="script-file"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploadStatus === 'uploading'}
          />
          <label
            htmlFor="script-file"
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg 
                       cursor-pointer transition-colors ${
              uploadStatus === 'uploading' 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'hover:bg-gray-50'
            }`}
          >
            <Upload className="h-4 w-4" />
            Choose Script File
          </label>
          
          {uploadedFileName && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded">
              <File className="h-4 w-4" />
              <span className="text-sm font-medium">{uploadedFileName}</span>
              <button
                onClick={() => {
                  setUploadedFileName(null);
                  setScript('');
                  setUploadStatus('idle');
                  setError(null);
                }}
                className="text-blue-500 hover:text-blue-700"
                title="Remove file"
              >
                ×
              </button>
            </div>
          )}
          
          {uploadStatus === 'success' && !error && (
            <div className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-sm">File processed</span>
            </div>
          )}
        </div>
      </div>


      {/* Manual script input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or Paste Script Here
        </label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder={`Paste your complete script here. Use formats like:

Slide 1
Your content for slide 1...

Slide 2  
Your content for slide 2...

Or separate sections with:
---

The script will be automatically split across your ${currentPresentation.slides.length} slides.`}
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none font-mono text-sm"
          disabled={uploadStatus === 'uploading'}
        />
        <div className="mt-2 flex justify-between">
          <p className="text-sm text-gray-500">
            {script.length > 0 ? `${script.split(' ').filter(w => w.length > 0).length} words` : 'No script entered'}
          </p>
          <p className="text-sm text-gray-500">
            Will be split across {currentPresentation.slides.length} slides
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setScript('');
            setUploadStatus('idle');
            setError(null);
          }}
          disabled={uploadStatus === 'uploading'}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 
                     disabled:opacity-50 transition-colors"
        >
          Clear
        </button>
        
        <button
          onClick={handleParseScript}
          disabled={false}
          onMouseEnter={() => {
            // Check all possible script sources for debugging
            const windowScript = (window as any).uploadedScript;
            console.log('🔍 Button state debug:', {
              localScript: script.substring(0, 50) + '...',
              localScriptLength: script.length,
              windowScript: windowScript ? windowScript.substring(0, 50) + '...' : 'None',
              windowScriptLength: windowScript ? windowScript.length : 0,
              uploadStatus,
              buttonDisabled: false
            });
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                     transition-colors ${
            uploadStatus === 'success' && !error
              ? 'bg-green-600 text-white hover:bg-green-700'
              : uploadStatus === 'uploading'
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
          }`}
        >
          {uploadStatus === 'uploading' && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {uploadStatus === 'success' && !error ? (
            <>
              <Check className="h-4 w-4" />
              Script Applied!
            </>
          ) : (
            <>
              <FileType className="h-4 w-4" />
              Parse & Apply Script
            </>
          )}
        </button>
      </div>

      {/* Enhanced help text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          <strong>📄 File Upload:</strong> Upload .txt, .rtf, .pdf, or .md files containing your complete presentation script.
        </p>
        <p className="text-sm text-blue-800">
          <strong>🔄 Auto-Processing:</strong> Scripts are intelligently parsed using "Slide X" markers, 
          "---" dividers, or paragraph breaks. Key points and transitions are automatically 
          extracted for your presenter guide.
        </p>
      </div>
    </div>
  );
}
