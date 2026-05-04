const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ─── Multer config for image/PDF uploads ───────────────────────────────────────
const upload = multer({
  dest: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, WEBP) and PDFs are allowed'));
    }
  },
});

// ─── OCR: Upload and extract questions ─────────────────────────────────────────
router.post('/extract', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    let questions = [];
    let extractedText = '';

    // Use Gemini 2.5 Flash (Future-proof and highly accurate)
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using Gemini 2.5 Flash as confirmed from available models list
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1' });

        const fileData = fs.readFileSync(req.file.path);
        const base64Data = fileData.toString('base64');

        const prompt = `
          Extract all multiple-choice questions from this image/document.
          Return ONLY a valid JSON array of objects with this structure:
          [{
            "questionText": "string",
            "explanation": "string (brief explanation)",
            "marks": 4,
            "negativeMarks": 1,
            "isMultipleCorrect": false,
            "options": [
              { "optionText": "string", "isCorrect": boolean }
            ]
          }]
          Important: Return ONLY the JSON array.
        `;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: req.file.mimetype
            }
          }
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
          extractedText = "Extracted via Gemini 2.5 AI";
        }
      } catch (geminiErr) {
        console.error('Gemini 2.5 OCR Error:', geminiErr.message);
      }
    }

    // Fallback to Tesseract/Regex if Gemini didn't produce results
    if (questions.length === 0) {
      if (req.file.mimetype === 'application/pdf') {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text;
      } else {
        const Tesseract = require('tesseract.js');
        const { data } = await Tesseract.recognize(req.file.path, 'eng');
        extractedText = data.text;
      }
      questions = parseQuestionsFromText(extractedText);
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      rawText: extractedText,
      questions,
      message: `Extracted ${questions.length} question(s). Please review and edit before saving.`,
    });
  } catch (err) {
    console.error('OCR route error:', err);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// ─── Heuristic parser: text → structured questions ─────────────────────────────
function parseQuestionsFromText(text) {
  const questions = [];

  // Split by common question number patterns
  const qBlocks = text
    .split(/\n(?=\d+[\.\)]\s)/)
    .map(b => b.trim())
    .filter(b => b.length > 10);

  for (const block of qBlocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) continue;

    // First line is usually the question
    const questionText = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();

    // Find option lines (A/B/C/D or (A)/(B)/(C)/(D) or a)/b)/c)/d))
    const optionLines = lines.slice(1).filter(l =>
      /^[\(]?[A-Da-d][\)\.]\s/.test(l)
    );

    const options = optionLines.map((ol, i) => ({
      optionText: ol.replace(/^[\(]?[A-Da-d][\)\.]\s*/, '').trim(),
      isCorrect: false,
      sortOrder: i,
    }));

    // Pad to at least 4 options
    while (options.length < 4) {
      options.push({ optionText: `Option ${options.length + 1}`, isCorrect: false, sortOrder: options.length });
    }

    // Mark first option as correct by default (user can change)
    if (options.length > 0) options[0].isCorrect = true;

    questions.push({
      questionText,
      explanation: '',
      marks: 4,
      negativeMarks: 1,
      isMultipleCorrect: false,
      options: options.slice(0, Math.max(4, optionLines.length)),
    });
  }

  return questions;
}

module.exports = router;
