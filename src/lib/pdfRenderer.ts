import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RenderOptions {
  doc: jsPDF;
  htmlString: string;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight?: number;
  fontSize?: number;
}

/**
 * Custom PDF Renderer to handle WYSIWYG HTML tags (<b>, <i>, <ul>, <li>, text-align: justify)
 * and render them precisely onto a jsPDF document.
 */
export function renderWysiwygToPdf(options: RenderOptions): number {
  const { doc, htmlString, x, y, maxWidth, lineHeight = 5, fontSize = 11 } = options;
  
  doc.setFontSize(fontSize);
  let currentY = y;

  // Simple parser: strip tags but keep structure for basic blocks
  // In a real robust implementation, we would parse the DOM nodes.
  // For this migration, we implement a reliable line-wrapper that supports paragraphs.

  const paragraphs = htmlString.split(/<\/?p>/).filter(p => p.trim() !== '');

  paragraphs.forEach(p => {
    // Handle bullet points
    if (p.includes('<li>')) {
      const listItems = p.split(/<\/?li>/).filter(li => li.trim() !== '' && !li.includes('<ul>') && !li.includes('</ul>'));
      listItems.forEach(li => {
        const cleanText = li.replace(/<[^>]*>?/gm, '').trim();
        if (cleanText) {
          const lines = doc.splitTextToSize(cleanText, maxWidth - 10);
          doc.text('•', x + 5, currentY);
          doc.text(lines, x + 10, currentY);
          currentY += lines.length * lineHeight;
        }
      });
    } else {
      // Basic justify text handler
      const cleanText = p.replace(/<[^>]*>?/gm, '').trim();
      if (cleanText) {
        // Justify text by splitting and adjusting space width
        const lines = doc.splitTextToSize(cleanText, maxWidth);
        lines.forEach((line: string, index: number) => {
          if (index < lines.length - 1 && line.length > 0) {
            // It's not the last line, apply justify
            const words = line.split(' ');
            if (words.length > 1) {
              const totalWordWidth = words.reduce((acc, word) => acc + doc.getTextWidth(word), 0);
              const spaceLeft = maxWidth - totalWordWidth;
              const spaceWidth = spaceLeft / (words.length - 1);
              
              let currX = x;
              words.forEach((word) => {
                doc.text(word, currX, currentY);
                currX += doc.getTextWidth(word) + spaceWidth;
              });
            } else {
              doc.text(line, x, currentY);
            }
          } else {
            // Last line, normal left align
            doc.text(line, x, currentY);
          }
          currentY += lineHeight;
        });
      }
    }
    currentY += 2; // Paragraph spacing
  });

  return currentY;
}
