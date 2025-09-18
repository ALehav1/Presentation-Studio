import { useState } from 'react';
import { Maximize2, X, Monitor, Eye, EyeOff, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface SlideThumbnailPaneProps {
  /** URL of the slide image */
  imageUrl: string;
  /** Current slide number for display */
  slideNumber: number;
  /** Total number of slides */
  totalSlides: number;
  /** Whether the pane is visible */
  isVisible: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

export function SlideThumbnailPane({ 
  imageUrl, 
  slideNumber, 
  totalSlides, 
  isVisible, 
  onVisibilityChange 
}: SlideThumbnailPaneProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);

  if (!isVisible) {
    return (
      <Card className="h-full border-2 border-dashed border-muted-foreground/20 bg-muted/10">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
              <EyeOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-3">Slide Hidden</p>
              <Button
                variant="default"
                size="sm"
                onClick={() => onVisibilityChange?.(true)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Show Slide
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                <Monitor className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base text-gray-800">Current Slide</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Presentation view
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {slideNumber} of {totalSlides}
              </Badge>
              
              {/* Enlarge Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEnlarged(true)}
                className="gap-2 h-8 px-3"
                title="Enlarge slide"
              >
                <Maximize2 className="h-3 w-3" />
                Enlarge
              </Button>
              
              {/* Hide Button */}
              {onVisibilityChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVisibilityChange(false)}
                  className="gap-2 h-8 px-3"
                  title="Hide slide"
                >
                  <EyeOff className="h-3 w-3" />
                  Hide
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Slide Content */}
        <CardContent className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
          {imageUrl && imageUrl.trim() !== '' ? (
            <div 
              className="relative max-w-full max-h-full cursor-pointer group"
              onClick={() => setIsEnlarged(true)}
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                <img
                  src={imageUrl}
                  alt={`Slide ${slideNumber}`}
                  className="max-w-full max-h-full object-contain bg-white"
                />
                
                {/* Hover overlay with enlarge hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 
                                flex items-center justify-center opacity-0 group-hover:opacity-100 
                                transition-all duration-200">
                  <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-700 shadow-lg">
                    <Maximize2 className="w-4 h-4 inline mr-2" />
                    Click to enlarge
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center mx-auto">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Slide Image Unavailable</p>
                <p className="text-xs text-muted-foreground/80 mt-2 max-w-xs">
                  Images are cleared on page refresh to save storage.
                  Re-upload your PDF to see slides again.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer with slide info */}
        <div className="px-6 py-4 bg-muted/30 border-t">
          <div className="text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <Monitor className="h-3 w-3" />
              <span className="font-medium text-foreground">Slide {slideNumber}</span> 
              <span>•</span>
              <span>Click to enlarge for better viewing</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Enlarged Modal */}
      <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
          <DialogTitle className="sr-only">Enlarged slide view</DialogTitle>
          <div className="relative h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEnlarged(false)}
              className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
            >
              <X className="h-6 w-6" />
            </Button>
            
            {/* Slide Info */}
            <div className="absolute top-4 left-4 text-white">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
                Slide {slideNumber} of {totalSlides}
              </Badge>
            </div>
            
            {/* Enlarged Image */}
            <div className="p-8 flex items-center justify-center h-full">
              <img
                src={imageUrl}
                alt={`Slide ${slideNumber} - Enlarged`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
            
            {/* Keyboard Hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-white text-xs text-center">
                  Press ESC to close • Use arrow keys to navigate slides
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

