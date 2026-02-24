import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Extract text while preserving line breaks reasonably well.
// This improves section detection ("SKILLS", "EXPERIENCE", etc.) on the backend.
export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    let pageText = "";
    let lastY = null;

    for (const item of content.items || []) {
      const str = (item && item.str) ? String(item.str) : "";
      if (!str.trim()) continue;

      const y = item?.transform?.[5];

      if (lastY === null) {
        lastY = y;
      } else if (typeof y === "number" && typeof lastY === "number") {
        // New line if vertical position changes significantly
        if (Math.abs(y - lastY) > 2) {
          pageText += "\n";
          lastY = y;
        } else {
          pageText += " ";
        }
      } else {
        pageText += " ";
      }

      pageText += str;
    }

    fullText += pageText.trim() + "\n\n";
  }

  // Normalize whitespace a bit (but keep newlines)
  return fullText
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
