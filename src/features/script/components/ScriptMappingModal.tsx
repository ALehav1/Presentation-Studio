import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { GripVertical, FileText, Image } from 'lucide-react';

interface ScriptSection {
  index: number;
  content: string;
  wordCount: number;
}

interface Slide {
  id: string;
  imageUrl: string;
}

interface ScriptMappingModalProps {
  sections: ScriptSection[];
  slides: Slide[];
  onApplyMapping: (mapping: { [slideId: string]: string }) => void;
  onClose: () => void;
}

/**
 * Modal component for manually mapping script sections to presentation slides
 * Features drag-and-drop interface for precise script-to-slide control
 */
export function ScriptMappingModal({
  sections,
  slides,
  onApplyMapping,
  onClose
}: ScriptMappingModalProps) {
  // Initialize mapping: sections[i] -> slides[i]
  const [mapping, setMapping] = useState<{ [slideIndex: number]: number }>(() => {
    const initial: { [slideIndex: number]: number } = {};
    slides.forEach((_, index) => {
      if (index < sections.length) {
        initial[index] = index;
      }
    });
    return initial;
  });

  const [draggedSection, setDraggedSection] = useState<number | null>(null);

  const handleDragStart = (sectionIndex: number) => {
    setDraggedSection(sectionIndex);
  };

  const handleDrop = (slideIndex: number) => {
    if (draggedSection === null) return;
    
    const newMapping = { ...mapping };
    // Remove the dragged section from any existing mapping
    Object.keys(newMapping).forEach(key => {
      if (newMapping[parseInt(key)] === draggedSection) {
        delete newMapping[parseInt(key)];
      }
    });
    // Add new mapping
    newMapping[slideIndex] = draggedSection;
    setMapping(newMapping);
    setDraggedSection(null);
  };

  const handleApply = () => {
    const finalMapping: { [slideId: string]: string } = {};
    slides.forEach((slide, index) => {
      if (mapping[index] !== undefined) {
        finalMapping[slide.id] = sections[mapping[index]].content;
      } else {
        finalMapping[slide.id] = '';
      }
    });
    onApplyMapping(finalMapping);
  };

  const handleAutoMap = () => {
    const auto: { [slideIndex: number]: number } = {};
    slides.forEach((_, index) => {
      if (index < sections.length) {
        auto[index] = index;
      }
    });
    setMapping(auto);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Review Script Mapping</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Drag script sections to slides to customize the mapping. 
            Found {sections.length} sections for {slides.length} slides.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Left: Script Sections */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Script Sections
            </h3>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    className={`p-3 border rounded-lg cursor-move hover:shadow-md transition-shadow ${
                      draggedSection === index ? 'opacity-50' : ''
                    } ${
                      Object.values(mapping).includes(index) 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">Section {index + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            {section.wordCount} words
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Slides */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Presentation Slides
            </h3>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(index);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className={`p-3 border-2 border-dashed rounded-lg transition-colors ${
                      mapping[index] !== undefined
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {slide.imageUrl && (
                        <img 
                          src={slide.imageUrl} 
                          alt={`Slide ${index + 1}` }
                          className="h-16 w-24 object-cover rounded border"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">Slide {index + 1}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {mapping[index] !== undefined
                            ? `Mapped to Section ${mapping[index] + 1}` 
                            : 'Drop a section here'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleAutoMap}>
            Reset to Auto-Map
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Mapping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
