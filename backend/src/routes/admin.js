const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { sendAccountApprovedEmail, sendAccountRejectedEmail } = require('../services/email');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ─── DASHBOARD STATS ───────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalStudents,
      pendingApprovals,
      activeStudents,
      totalTests,
      totalAttempts,
      recentAttempts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'STUDENT', status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
      prisma.test.count(),
      prisma.attempt.count({ where: { status: 'SUBMITTED' } }),
      prisma.attempt.findMany({
        where: { status: 'SUBMITTED' },
        take: 10,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          test: { select: { title: true } },
        },
      }),
    ]);

    // Average score
    const avgResult = await prisma.attempt.aggregate({
      _avg: { score: true },
      where: { status: 'SUBMITTED', score: { not: null } },
    });

    res.json({
      totalStudents,
      pendingApprovals,
      activeStudents,
      totalTests,
      totalAttempts,
      averageScore: Math.round((avgResult._avg.score || 0) * 100) / 100,
      recentActivity: recentAttempts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

// ─── USER MANAGEMENT ───────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { status, role, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          status: true, college: true, targetExam: true,
          createdAt: true, lastLoginAt: true, profileImageUrl: true,
          _count: { select: { attempts: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'REJECTED', 'PENDING'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, email: true, status: true },
    });

    if (status === 'ACTIVE') {
      const loginUrl = `${process.env.FRONTEND_URL}/login`;
      await sendAccountApprovedEmail(user.email, user.name, loginUrl);
    } else if (status === 'REJECTED') {
      await sendAccountRejectedEmail(user.email, user.name);
    }

    await auditLog(req.user.id, `USER_STATUS_CHANGED_TO_${status}`, 'User', id, null, req);
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    await auditLog(req.user.id, 'USER_DELETED', 'User', req.params.id, null, req);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── CATEGORY MANAGEMENT ───────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        subcategories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            sections: { orderBy: { sortOrder: 'asc' } },
          },
        },
        _count: { select: { subcategories: true } },
      },
    });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description, iconUrl, sortOrder } = req.body;
    const category = await prisma.category.create({
      data: { name, description, iconUrl, sortOrder: sortOrder || 0 },
    });
    await auditLog(req.user.id, 'CATEGORY_CREATED', 'Category', category.id, { name }, req);
    res.status(201).json({ category });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Category already exists' });
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description, iconUrl, isActive, sortOrder } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, description, iconUrl, isActive, sortOrder },
    });
    await auditLog(req.user.id, 'CATEGORY_UPDATED', 'Category', category.id, null, req);
    res.json({ category });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    await auditLog(req.user.id, 'CATEGORY_DELETED', 'Category', req.params.id, null, req);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ─── SUBCATEGORY MANAGEMENT ────────────────────────────────────────────────────
router.post('/subcategories', async (req, res) => {
  try {
    const { name, description, categoryId, sortOrder } = req.body;
    const sub = await prisma.subcategory.create({
      data: { name, description, categoryId, sortOrder: sortOrder || 0 },
    });
    res.status(201).json({ subcategory: sub });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Subcategory already exists in this category' });
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

router.put('/subcategories/:id', async (req, res) => {
  try {
    const { name, description, isActive, sortOrder } = req.body;
    const sub = await prisma.subcategory.update({
      where: { id: req.params.id },
      data: { name, description, isActive, sortOrder },
    });
    res.json({ subcategory: sub });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subcategory' });
  }
});

router.delete('/subcategories/:id', async (req, res) => {
  try {
    await prisma.subcategory.delete({ where: { id: req.params.id } });
    res.json({ message: 'Subcategory deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
});

// ─── SECTION MANAGEMENT ────────────────────────────────────────────────────────
router.post('/sections', async (req, res) => {
  try {
    const { name, description, subcategoryId, sortOrder } = req.body;
    const section = await prisma.section.create({
      data: { name, description, subcategoryId, sortOrder: sortOrder || 0 },
    });
    res.status(201).json({ section });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Section already exists in this subcategory' });
    res.status(500).json({ error: 'Failed to create section' });
  }
});

router.put('/sections/:id', async (req, res) => {
  try {
    const { name, description, isActive, sortOrder } = req.body;
    const section = await prisma.section.update({
      where: { id: req.params.id },
      data: { name, description, isActive, sortOrder },
    });
    res.json({ section });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update section' });
  }
});

router.delete('/sections/:id', async (req, res) => {
  try {
    await prisma.section.delete({ where: { id: req.params.id } });
    res.json({ message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

// ─── TEST MANAGEMENT ───────────────────────────────────────────────────────────
router.get('/tests', async (req, res) => {
  try {
    const { status, sectionId, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (sectionId) where.sectionId = sectionId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          section: {
            include: {
              subcategory: { include: { category: true } },
            },
          },
          _count: { select: { questions: true, attempts: true, comments: true, likes: true } },
        },
      }),
      prisma.test.count({ where }),
    ]);

    res.json({ tests, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

router.get('/tests/:id', async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: {
        section: { include: { subcategory: { include: { category: true } } } },
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
        _count: { select: { attempts: true, comments: true, likes: true } },
      },
    });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json({ test });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch test' });
  }
});

router.post('/tests', async (req, res) => {
  try {
    const {
      title, description, instructions, sectionId, durationMinutes,
      negativeMarking, negativeMarkValue, allowRetake, maxAttempts,
      showAnswersAfter, isFullScreen, startDate, expiryDate, status,
    } = req.body;

    const test = await prisma.test.create({
      data: {
        title, description, instructions, sectionId,
        durationMinutes: durationMinutes || 60,
        negativeMarking: negativeMarking || false,
        negativeMarkValue: negativeMarkValue || 0.25,
        allowRetake: allowRetake || false,
        maxAttempts: maxAttempts || 1,
        showAnswersAfter: showAnswersAfter !== undefined ? showAnswersAfter : true,
        isFullScreen: isFullScreen !== undefined ? isFullScreen : true,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: status || 'DRAFT',
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    await auditLog(req.user.id, 'TEST_CREATED', 'Test', test.id, { title }, req);
    res.status(201).json({ test });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

router.put('/tests/:id', async (req, res) => {
  try {
    const {
      title, description, instructions, sectionId, durationMinutes,
      negativeMarking, negativeMarkValue, allowRetake, maxAttempts,
      showAnswersAfter, isFullScreen, startDate, expiryDate, status, thumbnailUrl,
    } = req.body;

    const existing = await prisma.test.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Test not found' });

    const publishedAt = (status === 'PUBLISHED' && existing.status !== 'PUBLISHED')
      ? new Date()
      : existing.publishedAt;

    const test = await prisma.test.update({
      where: { id: req.params.id },
      data: {
        title, description, instructions, sectionId,
        durationMinutes, negativeMarking, negativeMarkValue,
        allowRetake, maxAttempts, showAnswersAfter, isFullScreen,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status, publishedAt, thumbnailUrl,
      },
    });

    await auditLog(req.user.id, 'TEST_UPDATED', 'Test', test.id, null, req);
    res.json({ test });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update test' });
  }
});

router.delete('/tests/:id', async (req, res) => {
  try {
    await prisma.test.delete({ where: { id: req.params.id } });
    await auditLog(req.user.id, 'TEST_DELETED', 'Test', req.params.id, null, req);
    res.json({ message: 'Test deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

// Duplicate test
router.post('/tests/:id/duplicate', async (req, res) => {
  try {
    const original = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: { questions: { include: { options: true } } },
    });
    if (!original) return res.status(404).json({ error: 'Test not found' });

    const { questions, id, createdAt, updatedAt, publishedAt, ...testData } = original;

    const newTest = await prisma.test.create({
      data: {
        ...testData,
        title: `${original.title} (Copy)`,
        status: 'DRAFT',
        publishedAt: null,
        questions: {
          create: questions.map(q => ({
            questionText: q.questionText,
            questionImageUrl: q.questionImageUrl,
            explanation: q.explanation,
            explanationImageUrl: q.explanationImageUrl,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            isMultipleCorrect: q.isMultipleCorrect,
            sortOrder: q.sortOrder,
            options: {
              create: q.options.map(o => ({
                optionText: o.optionText,
                imageUrl: o.imageUrl,
                isCorrect: o.isCorrect,
                sortOrder: o.sortOrder,
              })),
            },
          })),
        },
      },
    });

    await auditLog(req.user.id, 'TEST_DUPLICATED', 'Test', newTest.id, { from: req.params.id }, req);
    res.status(201).json({ test: newTest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to duplicate test' });
  }
});

// ─── QUESTION MANAGEMENT ───────────────────────────────────────────────────────
router.post('/tests/:testId/questions', async (req, res) => {
  try {
    const { questions } = req.body; // array of questions
    const testId = req.params.testId;

    const created = await prisma.$transaction(
      questions.map((q, idx) =>
        prisma.question.create({
          data: {
            testId,
            questionText: q.questionText,
            questionImageUrl: q.questionImageUrl || null,
            explanation: q.explanation || null,
            explanationImageUrl: q.explanationImageUrl || null,
            marks: q.marks || 4,
            negativeMarks: q.negativeMarks || 1,
            isMultipleCorrect: q.isMultipleCorrect || false,
            sortOrder: q.sortOrder || idx,
            options: {
              create: (q.options || []).map((o, oi) => ({
                optionText: o.optionText,
                imageUrl: o.imageUrl || null,
                isCorrect: o.isCorrect || false,
                sortOrder: oi,
              })),
            },
          },
          include: { options: true },
        })
      )
    );

    // Update totalMarks
    const totalMarksResult = await prisma.question.aggregate({
      _sum: { marks: true },
      where: { testId },
    });
    await prisma.test.update({
      where: { id: testId },
      data: { totalMarks: totalMarksResult._sum.marks || 0 },
    });

    res.status(201).json({ questions: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add questions' });
  }
});

router.put('/questions/:id', async (req, res) => {
  try {
    const { questionText, questionImageUrl, explanation, explanationImageUrl,
      marks, negativeMarks, isMultipleCorrect, sortOrder, options } = req.body;

    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        questionText, questionImageUrl, explanation, explanationImageUrl,
        marks, negativeMarks, isMultipleCorrect, sortOrder,
      },
    });

    if (options) {
      await prisma.option.deleteMany({ where: { questionId: req.params.id } });
      await prisma.option.createMany({
        data: options.map((o, i) => ({
          questionId: req.params.id,
          optionText: o.optionText,
          imageUrl: o.imageUrl || null,
          isCorrect: o.isCorrect || false,
          sortOrder: i,
        })),
      });
    }

    const full = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });

    res.json({ question: full });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    const q = await prisma.question.findUnique({ where: { id: req.params.id } });
    if (!q) return res.status(404).json({ error: 'Question not found' });

    await prisma.question.delete({ where: { id: req.params.id } });

    // Recalculate totalMarks
    const totalMarksResult = await prisma.question.aggregate({
      _sum: { marks: true },
      where: { testId: q.testId },
    });
    await prisma.test.update({
      where: { id: q.testId },
      data: { totalMarks: totalMarksResult._sum.marks || 0 },
    });

    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// ─── ANALYTICS ─────────────────────────────────────────────────────────────────
router.get('/analytics/tests/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    const [test, attempts] = await Promise.all([
      prisma.test.findUnique({
        where: { id: testId },
        include: { questions: { include: { options: true, responses: true } } },
      }),
      prisma.attempt.findMany({
        where: { testId, status: 'SUBMITTED' },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    if (!test) return res.status(404).json({ error: 'Test not found' });

    const totalAttempts = attempts.length;
    const scores = attempts.map(a => a.score || 0);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = Math.max(...scores, 0);
    const lowestScore = scores.length ? Math.min(...scores) : 0;

    // Question-wise analytics
    const questionAnalytics = await Promise.all(
      test.questions.map(async q => {
        const responses = await prisma.response.findMany({
          where: { questionId: q.id },
        });
        const attempted = responses.filter(r => r.selectedOptionIds.length > 0).length;
        const correct = responses.filter(r => r.isCorrect).length;
        return {
          questionId: q.id,
          questionText: q.questionText.substring(0, 100),
          attempted,
          correct,
          incorrect: attempted - correct,
          accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
        };
      })
    );

    res.json({
      testId,
      totalAttempts,
      avgScore: Math.round(avgScore * 100) / 100,
      highestScore,
      lowestScore,
      studentAttempts: attempts.map(a => ({
        studentName: a.user.name,
        score: a.score,
        timeTaken: a.timeTakenSecs,
        submittedAt: a.submittedAt,
      })),
      questionAnalytics,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// ─── GLOBAL ANALYTICS ────────────────────────────────────────────────────────
router.get('/analytics/global', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, activeTests, attemptsLast30Days, allAttempts, topStudents] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.test.count({ where: { status: 'PUBLISHED' } }),
      prisma.attempt.findMany({
        where: { submittedAt: { gte: thirtyDaysAgo }, status: 'SUBMITTED' },
        select: { submittedAt: true, score: true, totalMarks: true },
        orderBy: { submittedAt: 'asc' },
      }),
      prisma.attempt.findMany({
        where: { status: 'SUBMITTED' },
        include: { test: { include: { section: { include: { subcategory: { include: { category: true } } } } } } },
      }),
      prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
          id: true, name: true,
          attempts: { where: { status: 'SUBMITTED' }, select: { score: true, totalMarks: true } }
        },
      }),
    ]);

    // Attempts per day
    const attemptsByDate = attemptsLast30Days.reduce((acc, attempt) => {
      if (!attempt.submittedAt) return acc;
      const date = attempt.submittedAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, count: 0, avgScorePct: 0, totalPct: 0 };
      acc[date].count += 1;
      const pct = attempt.totalMarks ? (attempt.score / attempt.totalMarks) * 100 : 0;
      acc[date].totalPct += pct;
      acc[date].avgScorePct = Math.round(acc[date].totalPct / acc[date].count);
      return acc;
    }, {});
    const dailyTrend = Object.values(attemptsByDate);

    // Category Distribution
    const categoryDist = allAttempts.reduce((acc, a) => {
      const catName = a.test?.section?.subcategory?.category?.name || 'Other';
      if (!acc[catName]) acc[catName] = 0;
      acc[catName] += 1;
      return acc;
    }, {});
    const categoryDistribution = Object.entries(categoryDist).map(([name, count]) => ({ name, count }));

    // Top students calculation
    const studentStats = topStudents.map(student => {
      const attemptCount = student.attempts.length;
      if (attemptCount === 0) return { id: student.id, name: student.name, testsTaken: 0, avgScorePct: 0 };
      const totalPct = student.attempts.reduce((sum, a) => sum + (a.totalMarks ? (a.score / a.totalMarks) * 100 : 0), 0);
      return {
        id: student.id,
        name: student.name,
        testsTaken: attemptCount,
        avgScorePct: Math.round(totalPct / attemptCount)
      };
    }).filter(s => s.testsTaken > 0)
      .sort((a, b) => b.avgScorePct - a.avgScorePct)
      .slice(0, 10);

    res.json({
      overview: { totalUsers, activeTests, totalAttemptsLast30Days: attemptsLast30Days.length },
      dailyTrend,
      categoryDistribution,
      topStudents: studentStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch global analytics' });
  }
});

// ─── COMMENT MODERATION ────────────────────────────────────────────────────────
router.get('/comments', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true, email: true } },
        test: { select: { title: true } },
      },
    });
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.delete('/comments/:id', async (req, res) => {
  try {
    await prisma.comment.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });
    await auditLog(req.user.id, 'COMMENT_DELETED', 'Comment', req.params.id, null, req);
    res.json({ message: 'Comment removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ─── FEEDBACK MANAGEMENT ───────────────────────────────────────────────────────
router.get('/feedback', async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json({ feedbacks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

router.patch('/feedback/:id/read', async (req, res) => {
  try {
    const feedback = await prisma.feedback.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ─── AUDIT LOGS ────────────────────────────────────────────────────────────────
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true, email: true } } },
    });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
