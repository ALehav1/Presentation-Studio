// src/features/ai-premium/components/AIPremiumPanel.tsx
// Premium AI panel that can be added to any page

import { useState } from 'react';
import { SimpleOpenAIProcessor } from './SimpleOpenAIProcessor';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Crown,
  Zap
} from 'lucide-react';

interface AIPremiumPanelProps {
  className?: string;
  defaultExpanded?: boolean;
}

/**
 * AIPremiumPanel - Collapsible premium AI features panel
 * Can be easily added to Setup Mode, Practice Mode, or anywhere
 */
export const AIPremiumPanel = ({ 
  className = '', 
  defaultExpanded = false 
}: AIPremiumPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={className}>
      {/* Header - Always Visible */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          className="w-full p-4 h-auto justify-between hover:bg-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                  🤖 Premium AI Enhancement
                </h3>
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs">
                  NEW
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Transform blind allocation into intelligent presentation coaching
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
              💰 Only $0.10 per presentation
            </Badge>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </Button>
        
        {/* Teaser - Shown when collapsed */}
        {!isExpanded && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 text-xs bg-white/60 px-2 py-1 rounded-full">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <span>Read slide content</span>
              </div>
              <div className="flex items-center gap-1 text-xs bg-white/60 px-2 py-1 rounded-full">
                <Zap className="h-3 w-3 text-blue-500" />
                <span>Smart script matching</span>
              </div>
              <div className="flex items-center gap-1 text-xs bg-white/60 px-2 py-1 rounded-full">
                <Crown className="h-3 w-3 text-green-500" />
                <span>Expert coaching</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click to unlock GPT-5 with Vision - the most advanced AI for presentations
            </p>
          </div>
        )}
      </Card>

      {/* Full Processor - Shown when expanded */}
      {isExpanded && (
        <div className="mt-4">
          <SimpleOpenAIProcessor />
        </div>
      )}
    </div>
  );
};
