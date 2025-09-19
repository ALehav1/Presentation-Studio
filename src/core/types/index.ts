import type { ContentGuide } from '../../features/practice/utils/script-processor';

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  fullScript?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Slide {
  id: string;
  number: number;
  imageUrl: string;
  pdfPage?: number;
  script: string;
  notes: string;
  keyPoints: string[];
  guide?: ContentGuide;
}

export interface Session {
  id: string;
  presentationId: string;
  mode: "practice" | "delivery";
  startedAt: Date;
  endedAt?: Date;
  recordingUrl?: string;
}
