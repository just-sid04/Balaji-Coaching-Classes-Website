const prisma = require('../lib/prisma');

const auditLog = async (userId, action, entity = null, entityId = null, details = null, req = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
        ipAddress: req?.ip || null,
        userAgent: req?.headers?.['user-agent'] || null,
      },
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { auditLog };
