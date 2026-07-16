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

  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(htmlString, 'text/html');

  const renderTextTokens = (words: {word: string, bold: boolean}[], indentX: number, listMaxWidth: number, bulletStr?: string) => {
        if (words.length === 0) return;
        let lines: {words: {word: string, bold: boolean, width: number}[], width: number}[] = [];
        let currentLine: {word: string, bold: boolean, width: number}[] = [];
        let currentLineWidth = 0;
        
        for (let w of words) {
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
          
          if (bulletStr) {
             doc.setFont('helvetica', 'normal');
             doc.text(bulletStr, indentX - 6, currentY); // Bullet offset slightly to the left
          }
          
          lines.forEach((line, index) => {
              if (index > 0 && currentY > 280) { doc.addPage(); currentY = 20; }
              const isLastLine = index === lines.length - 1;
              
              if (!isLastLine && line.words.length > 1) {
                  let totalWordsWidth = line.words.reduce((acc, w) => acc + w.width, 0);
                  let spaceLeft = listMaxWidth - totalWordsWidth;
                  let spaceWidth = spaceLeft / (line.words.length - 1);
                  
                  let currX = indentX;
                  line.words.forEach(w => {
                      doc.setFont('helvetica', w.bold ? 'bold' : 'normal');
                      doc.text(w.word, currX, currentY);
                      currX += w.width + spaceWidth;
                  });
              } else {
                  let currX = indentX;
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
  };

  let globalListState = { ol: 1, ul: 1 };
  let lastListType = '';

  const processBlock = (el: Element, listContext?: { type: string, index: number, indent: number }) => {
      if (el.tagName === 'UL' || el.tagName === 'OL') {
          if (lastListType !== el.tagName) {
             globalListState[el.tagName.toLowerCase() as 'ol'|'ul'] = 1;
          }
          lastListType = el.tagName;
          
          let isNested = !!listContext;
          let idx = isNested ? 1 : globalListState[el.tagName.toLowerCase() as 'ol'|'ul'];
          
          Array.from(el.children).forEach(child => {
              if (child.tagName === 'LI') {
                  let indentClass = Array.from(child.classList).find(c => c.startsWith('ql-indent-'));
                  let classIndent = indentClass ? parseInt(indentClass.replace('ql-indent-', '')) : 0;
                  
                  let inheritedIndent = listContext ? listContext.indent + 1 : 0;
                  let finalIndent = Math.max(classIndent, inheritedIndent);
                  
                  if (classIndent > 0 && !isNested) {
                     // If it's a flat Quill list but has indent class, treat as nested for bullet styling
                     finalIndent = classIndent;
                  }
                  
                  processBlock(child, { type: el.tagName.toLowerCase(), index: idx++, indent: finalIndent });
                  
                  if (!isNested) {
                      globalListState[el.tagName.toLowerCase() as 'ol'|'ul'] = idx;
                  }
              }
          });
          if (!isNested) currentY += 2;
      } else if (el.tagName === 'LI') {
          let inlineHtml = '';
          let nestedBlocks: Element[] = [];
          
          Array.from(el.childNodes).forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                  let tag = (node as Element).tagName;
                  if (tag === 'UL' || tag === 'OL') {
                      nestedBlocks.push(node as Element);
                  } else {
                      inlineHtml += (node as Element).outerHTML;
                  }
              } else if (node.nodeType === Node.TEXT_NODE) {
                  inlineHtml += node.textContent;
              }
          });
          
          if (inlineHtml.trim()) {
              let preprocessed = inlineHtml.replace(/<strong>/gi, ' <strong> ')
                                  .replace(/<\/strong>/gi, ' </strong> ')
                                  .replace(/<b>/gi, ' <b> ')
                                  .replace(/<\/b>/gi, ' </b> ')
                                  .replace(/&nbsp;/g, ' ')
                                  .replace(/\n/g, ' ');
              let rawTokens = preprocessed.split(/\s+/).filter(w => w !== '');
              let wordsWithStyle: {word: string, bold: boolean}[] = [];
              let isBold = false;
              for (let token of rawTokens) {
                  if (token.toLowerCase() === '<strong>' || token.toLowerCase() === '<b>') { isBold = true; continue; }
                  if (token.toLowerCase() === '</strong>' || token.toLowerCase() === '</b>') { isBold = false; continue; }
                  let cleanText = decodeEntities(token.replace(/<[^>]*>?/gm, ''));
                  if (cleanText) wordsWithStyle.push({ word: cleanText, bold: isBold });
              }
              
              let indentLevel = listContext ? listContext.indent : 0;
              let listType = listContext?.type || 'ul';
              
              let bulletStr = '•';
              if (listType === 'ol') {
                  if (indentLevel === 1) {
                      bulletStr = `${String.fromCharCode(96 + (listContext?.index || 1))}.`;
                  } else if (indentLevel === 2) {
                      bulletStr = `${listContext?.index || 1})`;
                  } else {
                      bulletStr = `${listContext?.index || 1}.`;
                  }
              } else {
                  if (indentLevel === 1) {
                      bulletStr = '◦';
                  } else if (indentLevel >= 2) {
                      bulletStr = '▪';
                  }
              }
              
              let blockIndent = 10 + (indentLevel * 8);
              renderTextTokens(wordsWithStyle, x + blockIndent, maxWidth - blockIndent, bulletStr);
          }
          
          nestedBlocks.forEach(b => processBlock(b, { type: 'ul', index: 1, indent: listContext ? listContext.indent + 1 : 1 }));
          
      } else if (el.tagName === 'P' || el.tagName === 'DIV' || el.tagName === 'BODY' || el.tagName === 'SPAN') {
          let inlineHtml = '';
          let nestedBlocks: Element[] = [];
          
          Array.from(el.childNodes).forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                  let tag = (node as Element).tagName;
                  if (tag === 'UL' || tag === 'OL' || tag === 'P' || tag === 'DIV' || tag === 'H1' || tag === 'H2' || tag === 'H3') {
                      nestedBlocks.push(node as Element);
                  } else {
                      inlineHtml += (node as Element).outerHTML;
                  }
              } else if (node.nodeType === Node.TEXT_NODE) {
                  inlineHtml += node.textContent;
              }
          });
          
          if (inlineHtml.trim()) {
              let preprocessed = inlineHtml.replace(/<strong>/gi, ' <strong> ')
                                  .replace(/<\/strong>/gi, ' </strong> ')
                                  .replace(/<b>/gi, ' <b> ')
                                  .replace(/<\/b>/gi, ' </b> ')
                                  .replace(/&nbsp;/g, ' ')
                                  .replace(/\n/g, ' ');
              let rawTokens = preprocessed.split(/\s+/).filter(w => w !== '');
              let wordsWithStyle: {word: string, bold: boolean}[] = [];
              let isBold = false;
              for (let token of rawTokens) {
                  if (token.toLowerCase() === '<strong>' || token.toLowerCase() === '<b>') { isBold = true; continue; }
                  if (token.toLowerCase() === '</strong>' || token.toLowerCase() === '</b>') { isBold = false; continue; }
                  let cleanText = decodeEntities(token.replace(/<[^>]*>?/gm, ''));
                  if (cleanText) wordsWithStyle.push({ word: cleanText, bold: isBold });
              }
              
              if (wordsWithStyle.length > 0) {
                 renderTextTokens(wordsWithStyle, x, maxWidth);
                 if (el.tagName !== 'BODY') {
                     currentY += 2;
                 }
              }
          }
          
          nestedBlocks.forEach(b => processBlock(b));
      } else if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4' || el.tagName === 'H5' || el.tagName === 'H6') {
          let text = el.textContent || '';
          if (text.trim()) {
             doc.setFont('helvetica', 'bold');
             doc.text(text, x, currentY);
             currentY += lineHeight + 2;
             doc.setFont('helvetica', 'normal');
          }
      } else {
          // fallback for unknown wrappers
          Array.from(el.children).forEach(b => processBlock(b));
      }
  };

  processBlock(htmlDoc.body);

  return currentY;
}
