const createError = require("http-errors");
const prisma = require("../config/db");
const dayjs = require("dayjs");
const { z } = require("zod");
const domainEventEmitter = require("../utils/domainEventEmitter");

/**
 * Wrap async route handlers and funnel errors through Express error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Service functions consolidated into controller

/**
 * Get the most recent day close record
 * @returns {Promise<Object|null>} The most recent day close record or null if none exists
 */
const getLastCloseData = async () => {
  try {
    const lastClose = await prisma.dayClose.findFirst({
      orderBy: {
        closedAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return lastClose;
  } catch (error) {
    console.error("Error getting last close:", error);
    throw error;
  }
};

/**
 * Create a new day close record
 * @param {number} userId - The ID of the user creating the close
 * @param {Date} closedAt - The actual close time (optional, defaults to now)
 * @returns {Promise<Object>} The created day close record with next working day
 */
const createDayCloseData = async (userId, closedAt = new Date()) => {
  try {
    const dayClose = await prisma.dayClose.create({
      data: {
        closedAt: closedAt,
        createdBy: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Emit the domain event
    domainEventEmitter.emitDomainEvent('dayclose.created', { dayClose });

    // Calculate next working day (basic method by adding 1 day)
    const nextWorkingDay = dayjs(dayClose.closedAt).add(1, 'day').toDate();

    return {
      dayClose,
      nextWorkingDay,
    };
  } catch (error) {
    console.error("Error creating day close:", error);
    throw error;
  }
};

/**
 * Get day closes within a date range
 * @param {Date} startDate - Start date for the range
 * @param {Date} endDate - End date for the range
 * @param {number} page - Page number (optional, defaults to 1)
 * @param {number} limit - Number of records per page (optional, defaults to 10)
 * @returns {Promise<Object>} Object containing day closes and pagination info
 */
const getDayClosesData = async (startDate, endDate, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const where = {};
    if (startDate || endDate) {
      where.closedAt = {};
      if (startDate) where.closedAt.gte = startDate;
      if (endDate) where.closedAt.lte = endDate;
    }
    
    const [dayCloses, total] = await Promise.all([
      prisma.dayClose.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          closedAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.dayClose.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      dayCloses,
      page,
      totalPages,
      total
    };
  } catch (error) {
    console.error("Error getting day closes:", error);
    throw error;
  }
};

/**
 * Get day closes for a specific date (multiple closes per day allowed)
 * @param {Date} date - The date to get closes for
 * @returns {Promise<Array>} Array of day close records for the specified date
 */
const getDayClosesByDateData = async (date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const dayCloses = await prisma.dayClose.findMany({
      where: {
        closedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        closedAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return dayCloses;
  } catch (error) {
    console.error("Error getting day closes by date:", error);
    throw error;
  }
};

/**
 * Legacy function for backward compatibility (original performDayClose)
 * Creates a DayClose entry based on earliest loan in current month
 * Note: This function is deprecated and kept for backward compatibility only
 */
const performDayCloseData = async (userId = 1) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Find the earliest loan in the current month
  const earliestLoan = await prisma.loan.findFirst({
    where: {
      loanDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    orderBy: {
      loanDate: 'asc',
    },
  });

  if (!earliestLoan) {
    const error = new Error('No loans found in the current month to perform day close.');
    error.statusCode = 404;
    throw error;
  }

  // Create the DayClose entry using current schema
  const dayCloseEntry = await prisma.dayClose.create({
    data: {
      closedAt: now,
      createdBy: userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return dayCloseEntry;
};

// Controller endpoints

/**
 * GET /api/day-closes
 * Get paginated list of day closes with optional date filtering
 */
const getDayCloses = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  
  const { startDate, endDate } = req.query;
  
  const parsedStartDate = startDate ? new Date(startDate) : null;
  const parsedEndDate = endDate ? new Date(endDate) : null;
  
  // Validate dates if provided
  if (startDate && isNaN(parsedStartDate.getTime())) {
    throw createError(400, "Invalid startDate format");
  }
  if (endDate && isNaN(parsedEndDate.getTime())) {
    throw createError(400, "Invalid endDate format");
  }
  
  const result = await getDayClosesData(
    parsedStartDate,
    parsedEndDate,
    page,
    limit
  );
  
  res.json(result);
});

/**
 * GET /api/day-closes/last
 * Get the most recent day close record
 */
const getLastClose = asyncHandler(async (req, res) => {
  const lastClose = await getLastCloseData();
  
  if (!lastClose) {
    return res.json({ message: "No day closes found", lastClose: null });
  }
  
  res.json({ lastClose });
});

/**
 * GET /api/day-closes/date/:date
 * Get all day closes for a specific date
 */
const getDayClosesByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw createError(400, "Invalid date format");
  }
  
  const dayCloses = await getDayClosesByDateData(parsedDate);
  
  res.json({ dayCloses, date: parsedDate.toISOString().split('T')[0] });
});

/**
 * POST /api/dayclose
 * Create a new day close record
 */
const createDayClose = asyncHandler(async (req, res) => {
  const schema = z.object({
    date: z.coerce.date().optional(),
    note: z.string().optional()
  });
  
  const data = await schema.parseAsync(req.body);
  
  // Get user ID from authenticated user (assumes auth middleware sets req.user)
  const userId = req.user?.id;
  if (!userId) {
    throw createError(401, "Authentication required");
  }

  const result = await createDayCloseData(userId, data.date || new Date());
  
  res.status(201).json({ 
    closedAt: result.dayClose.closedAt.toISOString(),
    nextDay: dayjs(result.dayClose.closedAt).add(1, 'day').format('YYYY-MM-DD')
  });
});

/**
 * Legacy endpoint for backward compatibility
 * @deprecated Use createDayClose instead
 */
const handleDayClose = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 1; // Default to user ID 1 if not authenticated
  
  try {
    const result = await performDayCloseData(userId);
    res.status(201).json({
      message: 'Day close performed successfully.',
      data: result,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    throw error;
  }
});

module.exports = {
  getDayCloses,
  getLastClose,
  getDayClosesByDate,
  createDayClose,
  handleDayClose // Legacy endpoint for backward compatibility
};
