import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { usePresentationStore } from '../../../core/store/presentation';
import { convertPdfToImages } from '../utils/pdf-converter';

export function UploadZone() {
  const {
    setUploadStatus,
    setUploadProgress,
    setUploadError,
    createPresentation,
    uploadStatus,
    uploadProgress,
    uploadError
  } = usePresentationStore();
  
  const processPdf = useCallback(async (file: File) => {
    try {
      setUploadStatus('uploading');
      setUploadError(null);
      
      // Convert PDF to images
      setUploadStatus('converting');
      const images = await convertPdfToImages(file, (progress) => {
        setUploadProgress(progress.percentage);
      });
      
      // Create presentation with the images
      const title = file.name.replace('.pdf', '');
      createPresentation(title, images);
      
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
    }
  }, [setUploadStatus, setUploadError, setUploadProgress, createPresentation]);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      processPdf(file);
    } else {
      setUploadError('Please upload a PDF file');
    }
  }, [processPdf, setUploadError]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: uploadStatus === 'uploading' || uploadStatus === 'converting'
  });
  
  // Show loading state
  if (uploadStatus === 'converting' || uploadStatus === 'uploading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
        <p className="text-gray-600 mb-2">
          {uploadStatus === 'uploading' ? 'Reading PDF...' : 'Converting slides...'}
        </p>
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{uploadProgress}%</p>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 md:p-12
          transition-all duration-200 cursor-pointer
          ${isDragActive 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 hover:border-purple-400 bg-gray-50'
          }
          ${uploadError ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center text-center">
          {uploadError ? (
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          ) : isDragActive ? (
            <FileText className="w-12 h-12 text-purple-500 mb-4 animate-bounce" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
          )}
          
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {isDragActive 
              ? 'Drop your PDF here' 
              : 'Upload your presentation'
            }
          </h3>
          
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop a PDF file, or click to select
          </p>
          
          {uploadError && (
            <p className="text-sm text-red-600 mb-4">{uploadError}</p>
          )}
          
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors min-h-[48px]">
            Choose PDF
          </button>
          
          <p className="text-xs text-gray-400 mt-4">
            Maximum file size: 50MB
          </p>
        </div>
      </div>
    </div>
  );
}
