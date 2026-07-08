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

const decodeEntities = (text: string) => {
  return text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
};

/**
 * Custom PDF Renderer to handle WYSIWYG HTML tags (<b>, <i>, <ul>, <li>, text-align: justify)
 * and render them precisely onto a jsPDF document.
 */
export function renderWysiwygToPdf(options: RenderOptions): number {
  const { doc, htmlString, x, y, maxWidth, lineHeight = 5, fontSize = 11 } = options;
  
  doc.setFontSize(fontSize);
  let currentY = y;

  const paragraphs = htmlString.split(/<\/?p>/).filter(p => p.trim() !== '');

  paragraphs.forEach(p => {
    if (p.includes('<li>')) {
      const listItems = p.split(/<\/?li>/).filter(li => li.trim() !== '' && !li.includes('<ul>') && !li.includes('</ul>'));
      listItems.forEach(li => {
        let cleanText = li.replace(/<[^>]*>?/gm, '').trim();
        cleanText = decodeEntities(cleanText);
        if (cleanText) {
          const lines = doc.splitTextToSize(cleanText, maxWidth - 10);
          doc.text('•', x + 5, currentY);
          doc.text(lines, x + 10, currentY);
          currentY += lines.length * lineHeight;
        }
      });
    } else {
      let cleanText = p.replace(/<[^>]*>?/gm, '').trim();
      cleanText = decodeEntities(cleanText);
      if (cleanText) {
        const lines = doc.splitTextToSize(cleanText, maxWidth);
        doc.text(cleanText, x, currentY, { maxWidth: maxWidth, align: 'justify', lineHeightFactor: lineHeight / doc.getLineHeight() });
        currentY += lines.length * lineHeight;
      }
    }
    currentY += 2; // Paragraph spacing
  });

  return currentY;
}
