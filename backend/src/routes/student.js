const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireStudent } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireStudent);

// ─── STUDENT PROFILE ───────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, phone: true, college: true,
        targetExam: true, profileImageUrl: true, createdAt: true,
        _count: { select: { attempts: true } },
      },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, phone, college, targetExam, profileImageUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, college, targetExam, profileImageUrl },
      select: { id: true, name: true, email: true, phone: true, college: true, targetExam: true, profileImageUrl: true },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ─── BROWSE TESTS ──────────────────────────────────────────────────────────────
router.get('/tests', async (req, res) => {
  try {
    const { categoryId, subcategoryId, sectionId, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      status: 'PUBLISHED',
      OR: [
        { startDate: null },
        { startDate: { lte: new Date() } },
      ],
    };

    if (sectionId) where.sectionId = sectionId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    if (subcategoryId) {
      where.section = { subcategoryId };
    } else if (categoryId) {
      where.section = { subcategory: { categoryId } };
    }

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { publishedAt: 'desc' },
        include: {
          section: { include: { subcategory: { include: { category: true } } } },
          _count: { select: { questions: true, attempts: true, likes: true, comments: true } },
        },
      }),
      prisma.test.count({ where }),
    ]);

    // Add user-specific data (liked, attempt count)
    const testIds = tests.map(t => t.id);
    const [userLikes, userAttempts] = await Promise.all([
      prisma.like.findMany({ where: { userId: req.user.id, testId: { in: testIds } } }),
      prisma.attempt.groupBy({
        by: ['testId'],
        where: { userId: req.user.id, testId: { in: testIds } },
        _count: true,
      }),
    ]);

    const likedSet = new Set(userLikes.map(l => l.testId));
    const attemptsMap = Object.fromEntries(userAttempts.map(a => [a.testId, a._count]));

    const enriched = tests.map(t => ({
      ...t,
      isLiked: likedSet.has(t.id),
      userAttemptCount: attemptsMap[t.id] || 0,
    }));

    res.json({ tests: enriched, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

router.get('/tests/:id', async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id, status: 'PUBLISHED' },
      include: {
        section: { include: { subcategory: { include: { category: true } } } },
        _count: { select: { questions: true, attempts: true, likes: true } },
      },
    });
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const userAttempts = await prisma.attempt.count({
      where: { userId: req.user.id, testId: test.id },
    });

    const isLiked = await prisma.like.findUnique({
      where: { userId_testId: { userId: req.user.id, testId: test.id } },
    });

    res.json({
      test,
      userAttemptCount: userAttempts,
      canAttempt: test.allowRetake ? userAttempts < test.maxAttempts : userAttempts === 0,
      isLiked: !!isLiked,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch test' });
  }
});

// ─── ATTEMPT MANAGEMENT ────────────────────────────────────────────────────────
router.post('/tests/:testId/start', async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await prisma.test.findUnique({
      where: { id: testId, status: 'PUBLISHED' },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (test.expiryDate && new Date() > test.expiryDate) {
      return res.status(403).json({ error: 'This test has expired' });
    }
    if (test.startDate && new Date() < test.startDate) {
      return res.status(403).json({ error: 'This test has not started yet' });
    }

    // Check attempt count
    const existingAttempts = await prisma.attempt.count({
      where: { userId: req.user.id, testId },
    });

    if (!test.allowRetake && existingAttempts > 0) {
      return res.status(403).json({ error: 'You have already attempted this test' });
    }
    if (test.allowRetake && existingAttempts >= test.maxAttempts) {
      return res.status(403).json({ error: `Maximum ${test.maxAttempts} attempts allowed` });
    }

    const attempt = await prisma.attempt.create({
      data: {
        userId: req.user.id,
        testId,
        status: 'IN_PROGRESS',
      },
    });

    // Return test with questions (without correct answers)
    const questionsForStudent = test.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionImageUrl: q.questionImageUrl,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      isMultipleCorrect: q.isMultipleCorrect,
      sortOrder: q.sortOrder,
      options: q.options.map(o => ({
        id: o.id,
        optionText: o.optionText,
        imageUrl: o.imageUrl,
        sortOrder: o.sortOrder,
        // Do NOT expose isCorrect
      })),
    }));

    res.status(201).json({
      attemptId: attempt.id,
      test: {
        id: test.id,
        title: test.title,
        instructions: test.instructions,
        durationMinutes: test.durationMinutes,
        negativeMarking: test.negativeMarking,
        negativeMarkValue: test.negativeMarkValue,
        totalMarks: test.totalMarks,
        isFullScreen: test.isFullScreen,
        questions: questionsForStudent,
      },
      startedAt: attempt.startedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start test' });
  }
});

// Auto-save answers
router.post('/attempts/:attemptId/save', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { responses } = req.body; // [{questionId, selectedOptionIds, isMarkedForReview}]

    const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Attempt already submitted' });

    // Upsert each response
    await Promise.all(responses.map(r =>
      prisma.response.upsert({
        where: { attemptId_questionId: { attemptId, questionId: r.questionId } },
        create: {
          attemptId,
          questionId: r.questionId,
          selectedOptionIds: r.selectedOptionIds || [],
          isMarkedForReview: r.isMarkedForReview || false,
          answeredAt: r.selectedOptionIds?.length > 0 ? new Date() : null,
        },
        update: {
          selectedOptionIds: r.selectedOptionIds || [],
          isMarkedForReview: r.isMarkedForReview || false,
          answeredAt: r.selectedOptionIds?.length > 0 ? new Date() : null,
        },
      })
    ));

    res.json({ message: 'Saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save answers' });
  }
});

// Submit test
router.post('/attempts/:attemptId/submit', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { responses, timeTakenSecs } = req.body;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: { include: { options: true } },
          },
        },
      },
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Already submitted' });

    const test = attempt.test;

    // Save all responses if provided
    if (responses && responses.length > 0) {
      await Promise.all(responses.map(r =>
        prisma.response.upsert({
          where: { attemptId_questionId: { attemptId, questionId: r.questionId } },
          create: {
            attemptId, questionId: r.questionId,
            selectedOptionIds: r.selectedOptionIds || [],
            isMarkedForReview: r.isMarkedForReview || false,
            answeredAt: r.selectedOptionIds?.length > 0 ? new Date() : null,
          },
          update: {
            selectedOptionIds: r.selectedOptionIds || [],
            isMarkedForReview: r.isMarkedForReview || false,
          },
        })
      ));
    }

    // Calculate score
    const allResponses = await prisma.response.findMany({
      where: { attemptId },
      include: { question: { include: { options: true } } },
    });

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const updatedResponses = [];
    for (const response of allResponses) {
      const question = response.question;
      const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
      const selected = response.selectedOptionIds;

      if (!selected || selected.length === 0) {
        unattemptedCount++;
        updatedResponses.push({ id: response.id, isCorrect: false, marksAwarded: 0 });
        continue;
      }

      let isCorrect = false;
      if (question.isMultipleCorrect) {
        isCorrect = JSON.stringify([...selected].sort()) === JSON.stringify([...correctOptionIds].sort());
      } else {
        isCorrect = selected.length === 1 && correctOptionIds.includes(selected[0]);
      }

      let marksAwarded = 0;
      if (isCorrect) {
        marksAwarded = question.marks;
        score += marksAwarded;
        correctCount++;
      } else {
        incorrectCount++;
        if (test.negativeMarking) {
          marksAwarded = -(test.negativeMarkValue || question.negativeMarks);
          score += marksAwarded;
        }
      }

      updatedResponses.push({ id: response.id, isCorrect, marksAwarded });
    }

    // Unattempted questions
    const answeredCount = allResponses.length;
    const totalQ = test.questions.length;
    unattemptedCount = totalQ - answeredCount + unattemptedCount;

    // Update all responses with scores
    await Promise.all(updatedResponses.map(r =>
      prisma.response.update({
        where: { id: r.id },
        data: { isCorrect: r.isCorrect, marksAwarded: r.marksAwarded },
      })
    ));

    // Calculate rank and percentile
    const allAttempts = await prisma.attempt.findMany({
      where: { testId: test.id, status: 'SUBMITTED', score: { not: null } },
    });

    const rank = allAttempts.filter(a => (a.score || 0) > score).length + 1;
    const percentile = allAttempts.length > 0
      ? Math.round((1 - (rank - 1) / allAttempts.length) * 100)
      : 100;

    // Update attempt
    const updatedAttempt = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        timeTakenSecs: timeTakenSecs || null,
        score: Math.max(0, score),
        totalMarks: test.totalMarks,
        correctCount,
        incorrectCount,
        unattemptedCount,
        rank,
        percentile,
      },
    });

    // Update ranks for all attempts
    await updateRanks(test.id);

    res.json({
      message: 'Test submitted successfully',
      result: {
        attemptId,
        score: Math.max(0, score),
        totalMarks: test.totalMarks,
        correctCount,
        incorrectCount,
        unattemptedCount,
        accuracy: totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0,
        timeTakenSecs,
        rank,
        percentile,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit test' });
  }
});

// Update ranks across all attempts for a test
async function updateRanks(testId) {
  try {
    const attempts = await prisma.attempt.findMany({
      where: { testId, status: 'SUBMITTED', score: { not: null } },
      orderBy: { score: 'desc' },
    });

    await Promise.all(attempts.map((a, idx) =>
      prisma.attempt.update({
        where: { id: a.id },
        data: {
          rank: idx + 1,
          percentile: Math.round((1 - idx / attempts.length) * 100),
        },
      })
    ));
  } catch (err) {
    console.error('Error updating ranks:', err);
  }
}

// ─── RESULTS ───────────────────────────────────────────────────────────────────
router.get('/attempts/:attemptId/result', async (req, res) => {
  try {
    const attempt = await prisma.attempt.findUnique({
      where: { id: req.params.attemptId },
      include: {
        test: {
          select: {
            id: true, title: true, totalMarks: true, negativeMarking: true,
            showAnswersAfter: true,
            section: { include: { subcategory: { include: { category: true } } } },
          },
        },
        responses: {
          include: {
            question: {
              include: {
                options: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!attempt) return res.status(404).json({ error: 'Result not found' });
    if (attempt.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    // Hide correct answers if admin has disabled it
    const showAnswers = attempt.test.showAnswersAfter;

    const responses = attempt.responses.map(r => ({
      questionId: r.questionId,
      questionText: r.question.questionText,
      questionImageUrl: r.question.questionImageUrl,
      explanation: showAnswers ? r.question.explanation : null,
      selectedOptionIds: r.selectedOptionIds,
      isCorrect: r.isCorrect,
      marksAwarded: r.marksAwarded,
      isMarkedForReview: r.isMarkedForReview,
      options: r.question.options.map(o => ({
        id: o.id,
        optionText: o.optionText,
        imageUrl: o.imageUrl,
        isCorrect: showAnswers ? o.isCorrect : undefined,
      })),
    }));

    res.json({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unattemptedCount: attempt.unattemptedCount,
        timeTakenSecs: attempt.timeTakenSecs,
        rank: attempt.rank,
        percentile: attempt.percentile,
        submittedAt: attempt.submittedAt,
        test: attempt.test,
        responses,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

// ─── ATTEMPT HISTORY ───────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [attempts, total] = await Promise.all([
      prisma.attempt.findMany({
        where: { userId: req.user.id, status: 'SUBMITTED' },
        skip,
        take: parseInt(limit),
        orderBy: { submittedAt: 'desc' },
        include: {
          test: {
            select: {
              id: true, title: true, totalMarks: true,
              section: { include: { subcategory: { include: { category: true } } } },
            },
          },
        },
      }),
      prisma.attempt.count({ where: { userId: req.user.id, status: 'SUBMITTED' } }),
    ]);

    res.json({ attempts, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ─── COMMENTS ──────────────────────────────────────────────────────────────────
router.get('/tests/:testId/comments', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { testId: req.params.testId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, profileImageUrl: true } } },
    });
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/tests/:testId/comments', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

    const comment = await prisma.comment.create({
      data: { content: content.trim(), userId: req.user.id, testId: req.params.testId },
      include: { user: { select: { name: true, profileImageUrl: true } } },
    });
    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// ─── LIKES ─────────────────────────────────────────────────────────────────────
router.post('/tests/:testId/like', async (req, res) => {
  try {
    const existing = await prisma.like.findUnique({
      where: { userId_testId: { userId: req.user.id, testId: req.params.testId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.like.create({ data: { userId: req.user.id, testId: req.params.testId } });
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// ─── FEEDBACK ──────────────────────────────────────────────────────────────────
router.post('/feedback', async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message required' });

    const feedback = await prisma.feedback.create({
      data: { subject, message, userId: req.user.id },
    });
    res.status(201).json({ feedback, message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// ─── PERFORMANCE ANALYTICS ─────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const attempts = await prisma.attempt.findMany({
      where: { userId: req.user.id, status: 'SUBMITTED' },
      orderBy: { submittedAt: 'asc' },
      include: {
        test: {
          select: {
            title: true, totalMarks: true,
            section: { include: { subcategory: { include: { category: true } } } },
          },
        },
      },
    });

    const totalTests = attempts.length;
    const avgScore = totalTests > 0
      ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalTests
      : 0;
    const avgAccuracy = totalTests > 0
      ? attempts.reduce((sum, a) => {
          const total = (a.correctCount || 0) + (a.incorrectCount || 0);
          return sum + (total > 0 ? (a.correctCount / total) * 100 : 0);
        }, 0) / totalTests
      : 0;

    // Performance trend
    const trend = attempts.slice(-10).map(a => ({
      testTitle: a.test.title,
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
      submittedAt: a.submittedAt,
    }));

    // Category breakdown
    const categoryBreakdown = {};
    for (const a of attempts) {
      const catName = a.test?.section?.subcategory?.category?.name || 'Other';
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { total: 0, correct: 0, attempted: 0 };
      }
      categoryBreakdown[catName].total += (a.correctCount || 0) + (a.incorrectCount || 0) + (a.unattemptedCount || 0);
      categoryBreakdown[catName].correct += a.correctCount || 0;
      categoryBreakdown[catName].attempted++;
    }

    res.json({
      totalTests,
      avgScore: Math.round(avgScore * 100) / 100,
      avgAccuracy: Math.round(avgAccuracy * 100) / 100,
      trend,
      categoryBreakdown,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
