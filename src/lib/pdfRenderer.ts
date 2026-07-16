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
      let isOrdered = p.includes('<ol>');
      let indexNum = 1;
      const listItems = p.split(/<\/?li>/).filter(li => li.trim() !== '' && !li.includes('<ul>') && !li.includes('</ul>') && !li.includes('<ol>') && !li.includes('</ol>'));
      listItems.forEach(li => {
        // Parse styles for list items
        let preprocessed = li.replace(/<strong>/g, ' <strong> ')
                            .replace(/<\/strong>/g, ' </strong> ')
                            .replace(/<b>/g, ' <b> ')
                            .replace(/<\/b>/g, ' </b> ')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/\n/g, ' ');
        let rawTokens = preprocessed.split(/\s+/).filter(w => w !== '');
        
        let wordsWithStyle: {word: string, bold: boolean}[] = [];
        let isBold = false;
        let listMaxWidth = maxWidth - 10;
        
        for (let token of rawTokens) {
            if (token === '<strong>' || token === '<b>') { isBold = true; continue; }
            if (token === '</strong>' || token === '</b>') { isBold = false; continue; }
            let cleanText = decodeEntities(token.replace(/<[^>]*>?/gm, ''));
            if (cleanText) wordsWithStyle.push({ word: cleanText, bold: isBold });
        }

        let lines: {words: {word: string, bold: boolean, width: number}[], width: number}[] = [];
        let currentLine: {word: string, bold: boolean, width: number}[] = [];
        let currentLineWidth = 0;
        
        for (let w of wordsWithStyle) {
            doc.setFont('helvetica', w.bold ? 'bold' : 'normal');
            let wWidth = doc.getTextWidth(w.word);
            doc.setFont('helvetica', 'normal');
            let spaceWidth = doc.getTextWidth(' ');
            
            if (currentLine.length === 0) {
                currentLine.push({ ...w, width: wWidth });
                currentLineWidth = wWidth;
            } else {
                if (currentLineWidth + spaceWidth + wWidth > listMaxWidth) {
                    lines.push({ words: currentLine, width: currentLineWidth });
                    currentLine = [{ ...w, width: wWidth }];
                    currentLineWidth = wWidth;
                } else {
                    currentLine.push({ ...w, width: wWidth });
                    currentLineWidth += spaceWidth + wWidth;
                }
            }
        }
        if (currentLine.length > 0) {
            lines.push({ words: currentLine, width: currentLineWidth });
        }

        if (lines.length > 0) {
          if (currentY > 275) { doc.addPage(); currentY = 20; }
          doc.setFont('helvetica', 'normal');
          doc.text(isOrdered ? `${indexNum}.` : '•', x + 5, currentY);
          indexNum++;
          
          lines.forEach((line, index) => {
              if (index > 0 && currentY > 280) { doc.addPage(); currentY = 20; }
              const isLastLine = index === lines.length - 1;
              
              if (!isLastLine && line.words.length > 1) {
                  let totalWordsWidth = line.words.reduce((acc, w) => acc + w.width, 0);
                  let spaceLeft = listMaxWidth - totalWordsWidth;
                  let spaceWidth = spaceLeft / (line.words.length - 1);
                  
                  let currX = x + 10;
                  line.words.forEach(w => {
                      doc.setFont('helvetica', w.bold ? 'bold' : 'normal');
                      doc.text(w.word, currX, currentY);
                      currX += w.width + spaceWidth;
                  });
              } else {
                  let currX = x + 10;
                  line.words.forEach(w => {
                      doc.setFont('helvetica', w.bold ? 'bold' : 'normal');
                      doc.text(w.word, currX, currentY);
                      doc.setFont('helvetica', 'normal');
                      currX += w.width + doc.getTextWidth(' ');
                  });
              }
              currentY += lineHeight;
          });
        }
      });
    } else {
        let preprocessed = p.replace(/<strong>/g, ' <strong> ')
                            .replace(/<\/strong>/g, ' </strong> ')
                            .replace(/<b>/g, ' <b> ')
                            .replace(/<\/b>/g, ' </b> ')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/\n/g, ' ');
                            
        let rawTokens = preprocessed.split(/\s+/).filter(w => w !== '');
        
        let wordsWithStyle: {word: string, bold: boolean}[] = [];
        let isBold = false;
        
        for (let token of rawTokens) {
            if (token === '<strong>' || token === '<b>') { isBold = true; continue; }
            if (token === '</strong>' || token === '</b>') { isBold = false; continue; }
            let cleanText = decodeEntities(token.replace(/<[^>]*>?/gm, ''));
            if (cleanText) wordsWithStyle.push({ word: cleanText, bold: isBold });
        }
        
        let lines: {words: {word: string, bold: boolean, width: number}[], width: number}[] = [];
        let currentLine: {word: string, bold: boolean, width: number}[] = [];
        let currentLineWidth = 0;
        
        for (let w of wordsWithStyle) {
            doc.setFont('helvetica', w.bold ? 'bold' : 'normal');
            let wWidth = doc.getTextWidth(w.word);
            doc.setFont('helvetica', 'normal');
            let spaceWidth = doc.getTextWidth(' ');
            
            if (currentLine.length === 0) {
                currentLine.push({ ...w, width: wWidth });
                currentLineWidth = wWidth;
            } else {
                if (currentLineWidth + spaceWidth + wWidth > maxWidth) {
                    lines.push({ words: currentLine, width: currentLineWidth });
                    currentLine = [{ ...w, width: wWidth }];
                    currentLineWidth = wWidth;
                } else {
                    currentLine.push({ ...w, width: wWidth });
                    currentLineWidth += spaceWidth + wWidth;
                }
            }
        }
        if (currentLine.length > 0) {
            lines.push({ words: currentLine, width: currentLineWidth });
        }
        
        lines.forEach((line, index) => {
            if (currentY > 280) { doc.addPage(); currentY = 20; }
            
            const isLastLine = index === lines.length - 1;
            
            if (!isLastLine && line.words.length > 1) {
                let totalWordsWidth = line.words.reduce((acc, w) => acc + w.width, 0);
                let spaceLeft = maxWidth - totalWordsWidth;
                let spaceWidth = spaceLeft / (line.words.length - 1);
                
                let currX = x;
                line.words.forEach(w => {
                    doc.setFont('helvetica', w.bold ? 'bold' : 'normal');
                    doc.text(w.word, currX, currentY);
                    currX += w.width + spaceWidth;
                });
            } else {
                let currX = x;
                line.words.forEach(w => {
                    doc.setFont('helvetica', w.bold ? 'bold' : 'normal');
                    doc.text(w.word, currX, currentY);
                    doc.setFont('helvetica', 'normal');
                    currX += w.width + doc.getTextWidth(' ');
                });
            }
            currentY += lineHeight;
        });
    }
    currentY += 2; 
  });

  return currentY;
}
