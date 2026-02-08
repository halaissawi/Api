const PDFParser = require("pdf2json");

/**
 * Extract text from PDF buffer
 * @param {Buffer} pdfSource - PDF buffer
 * @returns {Promise<string>} - Extracted text content
 */
exports.extractTextFromPDF = async (pdfSource) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("📄 [CV Parser] Starting PDF text extraction...");

      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", (errData) => {
        console.error("❌ [CV Parser] PDF parsing error:", errData.parserError);
        reject(new Error(`PDF parsing failed: ${errData.parserError}`));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        try {
          let extractedText = "";

          if (pdfData.Pages) {
            pdfData.Pages.forEach((page) => {
              if (page.Texts) {
                page.Texts.forEach((text) => {
                  if (text.R) {
                    text.R.forEach((r) => {
                      if (r.T) {
                        extractedText += decodeURIComponent(r.T) + " ";
                      }
                    });
                  }
                });
                extractedText += "\n";
              }
            });
          }

          const pageCount = pdfData.Pages ? pdfData.Pages.length : 0;

          console.log(`✅ [CV Parser] Extracted ${pageCount} pages`);
          console.log(
            `✅ [CV Parser] Text length: ${extractedText.length} characters`,
          );

          if (!extractedText || extractedText.trim().length < 50) {
            reject(
              new Error(
                "PDF appears to be empty or contains very little text.",
              ),
            );
            return;
          }

          resolve(extractedText.trim());
        } catch (err) {
          reject(new Error(`Error processing PDF: ${err.message}`));
        }
      });

      if (Buffer.isBuffer(pdfSource)) {
        pdfParser.parseBuffer(pdfSource);
      } else {
        reject(new Error("Invalid PDF source: must be Buffer"));
      }
    } catch (error) {
      reject(new Error(`PDF extraction failed: ${error.message}`));
    }
  });
};

exports.validateCVFile = (file) => {
  if (!file) throw new Error("No file uploaded");
  if (!["application/pdf"].includes(file.mimetype)) {
    throw new Error("Invalid file type. Only PDF files allowed.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size exceeds 5MB limit.");
  }
  console.log("✅ [CV Parser] CV file validated successfully");
  return true;
};

exports.cleanCVText = (text) => {
  let cleaned = text
    .replace(/\s+/g, " ")
    .replace(/Page \d+ of \d+/gi, "")
    .replace(/_{3,}/g, "")
    .replace(/-{3,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  console.log(
    `✅ [CV Parser] Text cleaned: ${text.length} → ${cleaned.length} chars`,
  );
  return cleaned;
};

exports.extractBasicInfo = (text) => {
  const info = {
    hasEmail: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text),
    hasPhone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(
      text,
    ),
    hasLinkedIn: /linkedin/i.test(text),
    hasGitHub: /github/i.test(text),
    wordCount: text.split(/\s+/).length,
    estimatedSections: [],
  };

  ["experience", "education", "skills", "summary"].forEach((section) => {
    if (new RegExp(section, "i").test(text)) {
      info.estimatedSections.push(section);
    }
  });

  console.log("✅ [CV Parser] Basic info extracted:", info);
  return info;
};
