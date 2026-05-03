const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ─── Multer config for image/PDF uploads ───────────────────────────────────────
const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
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
    let extractedText = '';

    if (req.file.mimetype === 'application/pdf') {
      // Extract text from PDF
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text;
      } catch (pdfErr) {
        console.error('PDF parse error:', pdfErr.message);
        extractedText = '';
      }
    } else {
      // Use Tesseract.js for image OCR
      try {
        const Tesseract = require('tesseract.js');
        const { data } = await Tesseract.recognize(req.file.path, 'eng', {
          logger: () => {}, // suppress logs
        });
        extractedText = data.text;
      } catch (ocrErr) {
        console.error('OCR error:', ocrErr.message);
        extractedText = '';
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (!extractedText.trim()) {
      return res.status(422).json({
        error: 'Could not extract text from file. Please ensure the image/PDF is clear and readable.',
        rawText: '',
        questions: [],
      });
    }

    // Parse extracted text into questions
    const questions = parseQuestionsFromText(extractedText);

    res.json({
      rawText: extractedText,
      questions,
      message: `Extracted ${questions.length} question(s). Please review and edit before saving.`,
    });
  } catch (err) {
    console.error('OCR route error:', err);
    // Clean up file if still exists
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
