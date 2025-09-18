import React, { useState, useEffect } from 'react';
import { SlideScriptEditor } from './SlideScriptEditor';
import { SimplifiedScriptView } from './SimplifiedScriptView';

interface ResponsiveScriptEditorProps {
  slides: Array<{ imageUrl: string; id: string }>;
  fullScript: string;
  onScriptUpdate: (slideScripts: Array<{ slideId: string; script: string }>) => void;
}

export const ResponsiveScriptEditor: React.FC<ResponsiveScriptEditorProps> = (props) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Render mobile view for screens < 768px, desktop view for larger screens
  return isMobile ? (
    <SimplifiedScriptView {...props} />
  ) : (
    <SlideScriptEditor {...props} />
  );
};

// Export individual components for direct use if needed
export { SlideScriptEditor, SimplifiedScriptView };
