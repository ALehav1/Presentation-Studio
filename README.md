# PresentationStudio

A comprehensive presentation workflow application covering setup, practice, and delivery. Upload PDF slides, add speaker scripts, rehearse with interactive tools, and deliver presentations with a clean presenter interface.

## ✨ Features

### Core Functionality
- **📁 Setup Mode**: Upload PDF slides and speaker scripts with intuitive workflow
- **🎤 Practice Mode**: Three-pane layout with slides, scripts, and presenter guidance  
- **🎙️ Delivery Mode**: Clean presenter interface for actual presentations *(planned)*
- **Script Processing**: Automatic distribution of scripts across slides with smart parsing
- **File Support**: PDF slides and TXT script files with comprehensive error handling
- **Navigation**: Keyboard shortcuts, slide thumbnails, and smooth transitions
- **Persistent Storage**: Auto-save presentations to localStorage with Zustand persistence
- **Mobile Responsive**: Optimized for all device sizes (minimum 375px width)

### Script & Content Management  
- **TXT Script Upload**: Clean text file processing with RTF artifact removal
- **Script Distribution**: Intelligent parsing to distribute content across slides
- **Copy-Paste Support**: Manual script input with textarea functionality
- **Content Cleaning**: Automatic removal of formatting artifacts from converted files

### User Experience
- **Progress Tracking**: Real-time upload and conversion progress indicators
- **Error Handling**: Comprehensive error messages and graceful failure recovery
- **Loading States**: Professional loading animations and status updates
- **Accessibility**: Screen reader support with ARIA labels and keyboard navigation

### Technical Features
- **Modern Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS
- **State Management**: Zustand with persistence middleware
- **PDF Processing**: PDF.js 3.11.174 with worker support for performance
- **File Handling**: React Dropzone for robust file uploads

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone [your-repo-url]
cd presentation-studio

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Dependencies
```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "zustand": "^5.0.8",
    "pdfjs-dist": "3.11.174",
    "react-dropzone": "^14.3.8",
    "file-saver": "^2.0.5",
    "lucide-react": "^0.544.0"
  }
}
```

## 📁 Project Structure

```
src/
├── core/                     # Core application logic
│   ├── store/               # Zustand state management
│   │   └── presentation.ts  # Main presentation store with persistence
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts        # Shared interfaces and types
│   └── utils/              # Core utilities
├── features/               # Feature-based organization
│   ├── upload/            # PDF upload functionality
│   │   ├── components/    # Upload UI components
│   │   │   └── UploadZone.tsx
│   │   └── utils/         # Upload utilities
│   │       └── pdf-converter.ts
│   └── slides/            # Slide viewing functionality
│       ├── components/    # Slide UI components
│       │   └── SlideViewer.tsx
│       └── hooks/         # Slide-specific hooks
├── shared/                # Shared components and utilities
├── utils/                 # Application-wide utilities
│   └── pdf-setup.ts      # PDF.js worker configuration
└── App.tsx               # Main application component
```

## 🏗️ Architecture & Design

### State Management
- **Zustand Store**: Centralized state with presentation data, upload status, and navigation
- **Persistence**: Automatic localStorage synchronization for presentations and settings
- **Error Handling**: Comprehensive error states and recovery mechanisms

### PDF Processing Flow
1. **File Upload**: User drops/selects PDF file
2. **Validation**: File type and size validation
3. **Conversion**: PDF.js processes each page into high-quality PNG images
4. **Storage**: Images stored as data URLs in application state
5. **Persistence**: Presentation data automatically saved to localStorage

### Component Architecture
- **Feature-based**: Organized by functionality (upload, slides, script)
- **Separation of Concerns**: UI components separate from business logic
- **Reusable Components**: Shared components for consistent UI patterns
- **TypeScript**: Full type safety throughout the application

## 🎯 Usage

### Basic Workflow
1. **📁 Setup Phase** *(Available)*:
   - Upload PDF slides (drag-and-drop or browse)
   - Upload TXT script file or paste script content
   - Click "Parse & Apply Script" to distribute content across slides

2. **🎤 Practice Phase** *(Available)*:
   - Switch to Practice Mode for three-pane layout
   - Navigate slides with arrows or slide selector
   - View script content for current slide
   - Use presenter guidance panel

3. **🎙️ Delivery Phase** *(Planned)*:
   - Clean presenter interface without practice tools
   - Teleprompter-style script scrolling
   - Full-screen slide display for presentations
   - Timer and progress tracking

### Keyboard Shortcuts
- `←` Previous slide
- `→` Next slide  
- `Escape` Exit practice mode

### File Format Support
- **PDF Slides**: Any standard PDF with multiple pages
- **Scripts**: Plain text (.txt) files only
- **RTF Files**: Convert to TXT first using:
  ```bash
  # Mac Terminal
  textutil -convert txt "your-file.rtf"
  
  # Or use TextEdit: Format → Make Plain Text → Save as .txt
  ```

### Mobile Support
- Touch-friendly interface with 48px minimum touch targets
- Swipe gestures for slide navigation
- Responsive layout adapting to screen size
- File picker fallback for drag-and-drop

## 🔧 Configuration

### PDF.js Worker Setup
```typescript
// src/utils/pdf-setup.ts
// Configures PDF.js worker for Vite environment
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
```

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'), // Path aliases
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'], // Pre-bundle PDF.js
  },
});
```

## 🐛 Error Handling

### PDF Upload Errors
- **Invalid File Type**: Clear message for non-PDF files
- **File Too Large**: Size limit warnings
- **Corrupt PDF**: Graceful handling of damaged files
- **Conversion Failures**: Fallback mechanisms and error reporting

### Network & Storage Errors
- **localStorage Full**: Automatic cleanup and user notification
- **Memory Issues**: Progress monitoring and cleanup
- **Browser Compatibility**: Feature detection and fallbacks

## 🧪 Current Testing Status

### ✅ Implemented Features Ready for Testing:
1. **PDF Upload & Conversion**: Drag-and-drop with progress tracking
2. **Slide Navigation**: Arrow keys, thumbnails, slide selector
3. **Individual Script Editor**: Per-slide script editing with auto-save
4. **Bulk Script Upload**: Parse full scripts and apply to all slides
5. **Script Processing**: Extract key points, transitions, timing cues
6. **Practice Mode**: Three-pane layout (Script | Guide | Slide)
7. **Responsive Design**: Mobile and desktop layouts
8. **Hide/Show Controls**: Toggle pane visibility
9. **Slide Enlargement**: Modal view for full-screen slides

### 🛠️ Recent Bug Fixes & Features

- **Script Parser Fix**: Fixed regex parsing issue where "Slide X" markers weren't properly splitting script sections
- **Enhanced Debugging**: Added comprehensive logging throughout script processing pipeline
- **State Verification**: Added final state verification to ensure scripts are properly applied to slides
- **Script File Upload**: Added support for .txt, .rtf, .pdf, and .md file uploads (up to 5MB)
- **PDF Text Extraction**: Integrated PDF.js for extracting text content from PDF scripts
- **RTF Warning System**: Shows helpful conversion instructions for RTF files with exact commands
- **File Format Guidance**: Clear instructions for Mac (textutil/TextEdit) and Windows (WordPad) conversion

### 🔍 Testing Priorities (In Progress)

- [x] Development server running at http://localhost:5173/
- [x] **RTF Warning System**: Shows conversion instructions when RTF uploaded
- [ ] **PDF Upload Test**: Upload 2-3 page PDF and verify conversion
- [ ] **Script Parsing Test**: Add test script with keywords ("important", "key", "moving on")
- [ ] **Practice Mode Test**: Verify three-pane layout displays correctly
- [ ] **Mobile Responsiveness**: Test at 375px viewport
- [ ] **Controls Test**: Verify hide/show toggles and expand button
- [ ] **Auto-extraction Test**: Confirm presenter guide extracts key points

### 📝 Test Script for Validation:
```
Slide 1
Good morning. In preparing for this talk, I spent time diving into trade dynamics.
A lot of discussion revolves around challenges. Important: Mexico is building resilience.
Transition: Let's start with documentation.

Slide 2  
Mexico's Carta Porte captures 185+ structured fields per shipment.
Key insight: Each crossing produces labeled experience.
Remember: $2,000 penalties become tuition for the system.
Moving on to the capability stack.

Slide 3
This is where the important transformation happens.
Key point: Data becomes intelligence through systematic processing.
Next, we'll examine the implementation details.
```

## 🔮 Future Enhancements

### Planned Features
- **Export Options**: PDF export with embedded notes
- **Cloud Sync**: Optional cloud storage integration
- **Presentation Templates**: Pre-built layouts and themes
- **Analytics**: Practice session tracking and improvement metrics

### Technical Improvements
- **Service Worker**: Offline support and caching
- **WebRTC**: Recording capabilities for practice sessions
- **PWA**: Installable progressive web app
- **Performance**: Lazy loading and virtual scrolling for large presentations

## 📝 Development Notes

### Code Quality
- **ESLint**: Configured with React and TypeScript rules
- **Type Safety**: Full TypeScript coverage with strict mode
- **Error Boundaries**: React error boundaries for graceful failures
- **Accessibility**: ARIA labels and keyboard navigation support

### Testing Strategy (Planned)
- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: Feature workflows and state management

## 📊 Current Status

### ✅ Completed Features
- **File Upload System**: PDF slides and TXT scripts working reliably
- **Script Processing**: RTF artifact cleaning and content extraction
- **Navigation**: Slide navigation with keyboard shortcuts and UI controls
- **State Management**: Persistent storage with Zustand and localStorage
- **UX Improvements**: Intuitive mode names (Setup/Practice) and workflow
- **Component Architecture**: Clean separation between upload, script, and practice modes

### 🚧 In Progress
- **Script Distribution**: Enhanced debugging added, ready for testing
- **Practice Mode Layout**: Three-pane interface functional, needs script integration testing

### 📋 Next Priorities
1. **Test Core Workflow**: Upload PDF → Upload TXT → Parse Script → Practice Mode
2. **Script Distribution Validation**: Ensure scripts distribute correctly across slides
3. **Mobile Responsiveness**: Test and fix mobile experience at 375px
4. **Error Handling Polish**: Improve user feedback for edge cases

### 🐛 Known Issues
- Script parsing may need adjustment based on content structure
- Mobile layout could benefit from touch gesture optimization
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Memory usage and rendering performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
