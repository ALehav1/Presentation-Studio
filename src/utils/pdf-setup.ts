import * as pdfjsLib from 'pdfjs-dist';

// Use CDN for worker - always works
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const pdfjs = pdfjsLib;
