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
  imageUrl?: string;
  pdfPage?: number;
  script: string;
  keyPoints: string[];
  transition: string;
  duration: number;
  notes: string;
}

export interface Session {
  id: string;
  presentationId: string;
  mode: "practice" | "delivery";
  startedAt: Date;
  endedAt?: Date;
  recordingUrl?: string;
}
