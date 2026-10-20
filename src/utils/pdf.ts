export const downloadPdfFile = async (
  elementIdOrEl: string | HTMLElement,
  filename: string,
  onStatusChange?: (isGenerating: boolean, message?: string) => void
) => {
  if (onStatusChange) onStatusChange(true, "Menyiapkan berkas PDF...");
  try {
    // 1. Resolve target element with polling if mounting
    let element: HTMLElement | null = typeof elementIdOrEl === 'string' ? document.getElementById(elementIdOrEl) : elementIdOrEl;
    if (!element && typeof elementIdOrEl === 'string') {
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 100));
        element = document.getElementById(elementIdOrEl);
        if (element) break;
      }
    }

    if (!element) {
      if (onStatusChange) onStatusChange(false, "Elemen dokumen tidak ditemukan.");
      return;
    }

    // 2. Ensure html2pdf.js library is loaded
    if (!(window as any).html2pdf) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Canvas 2D context to normalize any modern color function (oklch, color-mix) to standard hex/rgba
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 1;
    colorCanvas.height = 1;
    const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

    const parseCssColorToRgb = (colorStr: string, defaultFallback = '#334155'): string => {
      if (!colorStr || !colorCtx) return defaultFallback;
      const trimmed = colorStr.trim();
      if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/i.test(trimmed) || /^#[0-9a-f]{3,8}$/i.test(trimmed)) {
        return trimmed;
      }
      try {
        colorCtx.clearRect(0, 0, 1, 1);
        colorCtx.fillStyle = 'rgba(0, 0, 0, 0)';
        colorCtx.fillStyle = trimmed;
        colorCtx.fillRect(0, 0, 1, 1);
        const data = colorCtx.getImageData(0, 0, 1, 1).data;
        if (data[3] === 0) {
          return 'transparent';
        }
        return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${(data[3] / 255).toFixed(3)})`;
      } catch {
        // fallback
      }
      return defaultFallback;
    };

    const targetId = typeof elementIdOrEl === 'string' ? elementIdOrEl : (element.id || 'export-pdf-target');
    if (!element.id) {
      element.id = targetId;
    }

    const opt = {
      margin: [6, 6, 6, 6],
      filename: filename || 'Laporan_CBT.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        scrollY: 0,
        scrollX: 0,
        x: 0,
        y: 0,
        onclone: (clonedDoc: Document, clonedElement?: any) => {
          try {
            const originalTarget = element;
            const clonedTarget: HTMLElement = (clonedElement as HTMLElement) || (targetId ? clonedDoc.getElementById(targetId) : null) || clonedDoc.body;

            if (clonedTarget && originalTarget) {
              // A. Map of live elements to cloned elements
              const origElements = [originalTarget, ...Array.from(originalTarget.querySelectorAll('*'))] as HTMLElement[];
              const clonedElements = [clonedTarget, ...Array.from(clonedTarget.querySelectorAll('*'))] as HTMLElement[];

              // B. Transfer computed styles from live DOM to cloned elements
              const minLen = Math.min(origElements.length, clonedElements.length);
              for (let i = 0; i < minLen; i++) {
                const origEl = origElements[i];
                const clonedEl = clonedElements[i];
                if (!origEl || !clonedEl) continue;

                try {
                  const cs = window.getComputedStyle(origEl);
                  
                  // Text and colors
                  if (cs.color) clonedEl.style.color = parseCssColorToRgb(cs.color, '#0f172a');
                  if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') {
                    clonedEl.style.backgroundColor = parseCssColorToRgb(cs.backgroundColor, '#ffffff');
                  }
                  if (cs.borderColor && cs.borderColor !== 'rgba(0, 0, 0, 0)' && cs.borderColor !== 'transparent') {
                    clonedEl.style.borderColor = parseCssColorToRgb(cs.borderColor, '#cbd5e1');
                  }

                  // Typography
                  if (cs.fontSize) clonedEl.style.fontSize = cs.fontSize;
                  if (cs.fontWeight) clonedEl.style.fontWeight = cs.fontWeight;
                  if (cs.fontFamily) clonedEl.style.fontFamily = cs.fontFamily;
                  if (cs.lineHeight) clonedEl.style.lineHeight = cs.lineHeight;
                  if (cs.textAlign) clonedEl.style.textAlign = cs.textAlign;

                  // Layout
                  if (cs.display && cs.display !== 'inline') clonedEl.style.display = cs.display;
                  if (cs.gridTemplateColumns && cs.gridTemplateColumns !== 'none') clonedEl.style.gridTemplateColumns = cs.gridTemplateColumns;
                  if (cs.flexDirection) clonedEl.style.flexDirection = cs.flexDirection;
                  if (cs.alignItems) clonedEl.style.alignItems = cs.alignItems;
                  if (cs.justifyContent) clonedEl.style.justifyContent = cs.justifyContent;
                  if (cs.gap && cs.gap !== 'normal') clonedEl.style.gap = cs.gap;

                  // Spacing & borders
                  if (cs.padding && cs.padding !== '0px') clonedEl.style.padding = cs.padding;
                  if (cs.borderWidth && cs.borderWidth !== '0px') clonedEl.style.borderWidth = cs.borderWidth;
                  if (cs.borderStyle && cs.borderStyle !== 'none') clonedEl.style.borderStyle = cs.borderStyle;
                  if (cs.borderRadius && cs.borderRadius !== '0px') clonedEl.style.borderRadius = cs.borderRadius;
                } catch {
                  // ignore
                }
              }

              // C. Unhide print-only elements & hide interactive controls
              const printBlocks = clonedTarget.querySelectorAll('.print\\:block, [class*="print:block"]');
              printBlocks.forEach((el) => {
                (el as HTMLElement).style.display = 'block';
              });

              const printHiddens = clonedTarget.querySelectorAll('.print\\:hidden, [class*="print:hidden"]');
              printHiddens.forEach((el) => {
                (el as HTMLElement).style.display = 'none';
              });

              // D. Expand all scrollable containers so all rows/content are visible
              const clonedScrollables = clonedTarget.querySelectorAll('.overflow-x-auto, .overflow-y-auto, [class*="max-h-"], [class*="overflow-"]');
              clonedScrollables.forEach((child) => {
                const htmlChild = child as HTMLElement;
                htmlChild.style.maxHeight = 'none';
                htmlChild.style.overflow = 'visible';
                htmlChild.style.height = 'auto';
                htmlChild.style.width = '100%';
                htmlChild.style.maxWidth = 'none';
              });

              // E. Reset tables
              const tables = clonedTarget.querySelectorAll('table');
              tables.forEach(t => {
                const htmlT = t as HTMLElement;
                htmlT.style.width = '100%';
                htmlT.style.maxWidth = '100%';
                htmlT.style.tableLayout = 'auto';
                htmlT.style.borderCollapse = 'collapse';
              });

              // F. Set document viewport & isolated wrapper for A4
              clonedDoc.body.style.margin = '0';
              clonedDoc.body.style.padding = '0';
              clonedDoc.body.style.width = '800px';
              clonedDoc.body.style.minWidth = '800px';
              clonedDoc.body.style.backgroundColor = '#ffffff';
              clonedDoc.body.style.overflow = 'visible';

              const wrapper = clonedDoc.createElement('div');
              wrapper.id = 'pdf-export-wrapper';
              wrapper.style.width = '800px';
              wrapper.style.margin = '0 auto';
              wrapper.style.padding = '0';
              wrapper.style.boxSizing = 'border-box';
              wrapper.style.backgroundColor = '#ffffff';
              wrapper.style.color = '#0f172a';

              clonedDoc.body.innerHTML = '';
              wrapper.appendChild(clonedTarget);
              clonedDoc.body.appendChild(wrapper);

              // Preserve original display (grid/flex/block)
              const origDisplay = window.getComputedStyle(originalTarget).display;
              clonedTarget.style.position = 'relative';
              if (origDisplay === 'grid') {
                clonedTarget.style.display = 'grid';
              } else if (origDisplay === 'flex') {
                clonedTarget.style.display = 'flex';
              } else {
                clonedTarget.style.display = 'block';
              }
              clonedTarget.style.width = '100%';
              clonedTarget.style.maxWidth = '100%';
              clonedTarget.style.margin = '0';
              clonedTarget.style.padding = '8px';
              clonedTarget.style.boxSizing = 'border-box';
              clonedTarget.style.transform = 'none';
              clonedTarget.style.boxShadow = 'none';
              clonedTarget.style.border = 'none';
              clonedTarget.style.maxHeight = 'none';
              clonedTarget.style.overflow = 'visible';
              clonedTarget.style.height = 'auto';
              clonedTarget.style.left = '0';
              clonedTarget.style.top = '0';
            }

            // G. PURGE ALL TOXIC STYLESHEETS FROM CLONED DOCUMENT
            // Tailwind v4 generates modern CSS constructs like @property, @layer, and filter variables
            // with empty comment tokens (e.g., `--tw-blur: /*!*/ /*!*/;`) which crash html2canvas CSS tokenizer
            // with "SyntaxError: Error parsing CSS component value, unexpected EOF".
            clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
              el.remove();
            });

            // H. Inject a clean, pure CSS 2.1 reset stylesheet
            const safeStyle = clonedDoc.createElement('style');
            safeStyle.textContent = `
              * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                background-color: #ffffff !important;
                color: #0f172a !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
              }
              table {
                border-collapse: collapse !important;
                width: 100% !important;
              }
              th, td {
                border: 1px solid #cbd5e1 !important;
                padding: 6px 10px !important;
              }
              .page-sheet-container {
                page-break-after: always !important;
                break-after: page !important;
              }
              .card-item-avoid-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            `;
            clonedDoc.head.appendChild(safeStyle);

            // I. Sanitize any remaining comment tokens or invalid cssText
            const allCloned = Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[];
            allCloned.forEach((el) => {
              if (el.style && el.style.cssText) {
                let text = el.style.cssText;
                if (text.includes('--tw') || text.includes('/*')) {
                  text = text
                    .replace(/--tw-[^;]+;?/gi, '')
                    .replace(/\/\*.*?\*\//gi, '');
                  el.style.cssText = text;
                }
              }
            });
          } catch (e) {
            console.warn('Error processing cloned document for PDF generation:', e);
          }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await (window as any).html2pdf().set(opt).from(element).save();

    if (onStatusChange) onStatusChange(false, "PDF berhasil diunduh dan disimpan!");
  } catch (err) {
    console.error("Error generating PDF with html2pdf, invoking print fallback:", err);
    try {
      window.focus();
      window.print();
      if (onStatusChange) onStatusChange(false, "Membuka dialog cetak dokumen...");
    } catch (e) {
      console.error("Print fallback error:", e);
      if (onStatusChange) onStatusChange(false, "Gagal mengunduh PDF. Silakan coba lagi.");
    }
  } finally {
    if (onStatusChange) {
      setTimeout(() => {
        onStatusChange(false);
      }, 500);
    }
  }
};
