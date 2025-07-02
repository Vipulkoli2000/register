const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const { z } = require("zod");
const createError = require("http-errors");

/**
 * Wrap async route handlers and funnel errors through Express error middleware.
 * Converts Prisma validation errors and known request errors into structured 400 responses.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Zod or manual user errors forwarded by validateRequest
    if (err.status === 400 && err.expose) {
      return res
        .status(400)
        .json({ errors: err.errors || { message: err.message } });
    }
    // Prisma validation errors
    if (err.name === "PrismaClientValidationError") {
      return res.status(400).json({ errors: { message: err.message } });
    }
    // Prisma known request errors (e.g., unique constraint or FK)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002" && err.meta?.target) {
        const field = Array.isArray(err.meta.target)
          ? err.meta.target[0]
          : err.meta.target;
        const message = `A record with that ${field} already exists.`;
        return res
          .status(400)
          .json({ errors: { [field]: { type: "unique", message } } });
      }
      if (err.code === "P2003") {
        // Foreign key constraint failed
        return res.status(400).json({
          errors: {
            message:
              "Invalid reference provided. Please ensure related records exist.",
          },
        });
      }
    }
    // Fallback for unexpected errors
    console.error(err);
    return res.status(500).json({ errors: { message: "Internal Server Error" } });
  });
};

// GET /api/loans
const getLoans = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  const { partyId, sortBy = "loanDate", sortOrder = "desc" } = req.query;

  const where = partyId ? { partyId: parseInt(partyId) } : {};

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        party: true,
      },
    }),
    prisma.loan.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({ loans, page, totalPages, totalLoans: total });
});

// GET /api/loans/:id
const getLoan = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid loan ID");

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      party: true,
    },
  });
  if (!loan) throw createError(404, "Loan not found");

  res.json(loan);
});

// POST /api/loans
const createLoan = asyncHandler(async (req, res) => {
  const schema = z.object({
    partyId: z.number({ required_error: "partyId is required" }).int().positive(),
    loanDate: z.coerce.date({ required_error: "loanDate is required" }),
    loanAmount: z.number({ required_error: "loanAmount is required" }).positive(),
    // balanceAmount is optional in request, will default to loanAmount
    balanceAmount: z.number().nonnegative().optional(),
    interest: z.number({ required_error: "interest is required" }).nonnegative(),
    balanceInterest: z.number({ required_error: "balanceInterest is required" }).nonnegative(),
  });

  const validatedData = await schema.parseAsync(req.body);

  const loan = await prisma.loan.create({
    data: {
      ...validatedData,
      // Set balance amount to loan amount if not provided or if they should be equal
      balanceAmount: validatedData.balanceAmount ?? validatedData.loanAmount,
      loanDate: new Date(validatedData.loanDate), // Ensure JS Date
    },
  });

  res.status(201).json(loan);
});

// PUT /api/loans/:id
const updateLoan = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid loan ID");

  const schema = z
    .object({
      partyId: z.number().int().positive().optional(),
      loanDate: z.coerce.date().optional(),
      loanAmount: z.number().positive().optional(),
      balanceAmount: z.number().nonnegative().optional(),
      interest: z.number().nonnegative().optional(),
      balanceInterest: z.number().nonnegative().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    });

  await schema.parseAsync(req.body);

  const existing = await prisma.loan.findUnique({ where: { id } });
  if (!existing) throw createError(404, "Loan not found");

  const updated = await prisma.loan.update({
    where: { id },
    data: {
      ...req.body,
      loanDate: req.body.loanDate ? new Date(req.body.loanDate) : undefined,
    },
  });

  res.json(updated);
});

// DELETE /api/loans/:id
const deleteLoan = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid loan ID");

  const existing = await prisma.loan.findUnique({ where: { id } });
  if (!existing) throw createError(404, "Loan not found");

  await prisma.loan.delete({ where: { id } });
  res.json({ message: "Loan deleted successfully" });
});

// GET /api/loans/monthly-summary
const getMonthlySummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Default to current year if no dates provided
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31);
  
  // Get all loans with their entries in the date range
  const loans = await prisma.loan.findMany({
    where: {
      OR: [
        {
          loanDate: {
            gte: start,
            lte: end,
          },
        },
        {
          entries: {
            some: {
              entryDate: {
                gte: start,
                lte: end,
              },
            },
          },
        },
      ],
    },
    include: {
      party: {
        select: {
          id: true,
          partyName: true,
          mobile1: true,
          address: true,
        },
      },
      entries: {
        where: {
          entryDate: {
            gte: start,
            lte: end,
          },
        },
        select: {
          entryDate: true,
          receivedAmount: true,
          receivedInterest: true,
          receivedDate: true,
        },
      },
    },
  });
  
  // Group data by individual loan and month
  const monthlyData = {};
  
  loans.forEach(loan => {
    // Use loan ID as unique key so each loan is a separate entry in the summary
    const loanKey = `${loan.id}`;
    
    if (!monthlyData[loanKey]) {
      monthlyData[loanKey] = {
        loanId: loan.id,
        loanDate: loan.loanDate,
        partyId: loan.party.id,
        partyName: loan.party.partyName,
        mobile1: loan.party.mobile1,
        address: loan.party.address,
        totalLoanAmount: loan.loanAmount,
        interest: loan.interest,
        monthlyData: {}, // Holds detailed monthly info
        totalReceivedAmount: 0,
        totalReceivedInterest: 0,
      };
    }
    
    // Process loan creation month
    const loanMonth = loan.loanDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!monthlyData[loanKey].monthlyData[loanMonth]) {
      monthlyData[loanKey].monthlyData[loanMonth] = {
        loanAmount: 0,
        receivedAmount: 0,
        receivedInterest: 0,
        receivedDate: null,
      };
    }
    monthlyData[loanKey].monthlyData[loanMonth].loanAmount += loan.loanAmount;
    
    // Process entries (payments received)
    loan.entries.forEach(entry => {
      const entryMonth = entry.entryDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[loanKey].monthlyData[entryMonth]) {
        monthlyData[loanKey].monthlyData[entryMonth] = {
          loanAmount: 0,
          receivedAmount: 0,
          receivedInterest: 0,
          receivedDate: null,
        };
      }
      
      const receivedAmount = entry.receivedAmount || 0;
      const receivedInterest = entry.receivedInterest || 0;
      
      // Update monthly data
      monthlyData[loanKey].monthlyData[entryMonth].receivedAmount += receivedAmount;
      monthlyData[loanKey].monthlyData[entryMonth].receivedInterest += receivedInterest;
      
      // Set received date (use the most recent one if multiple entries in same month)
      if (entry.receivedDate && (!monthlyData[loanKey].monthlyData[entryMonth].receivedDate || 
          new Date(entry.receivedDate) > new Date(monthlyData[loanKey].monthlyData[entryMonth].receivedDate))) {
        monthlyData[loanKey].monthlyData[entryMonth].receivedDate = entry.receivedDate;
      }
      
      // Update totals
      monthlyData[loanKey].totalReceivedAmount += receivedAmount;
      monthlyData[loanKey].totalReceivedInterest += receivedInterest;
    });
  });
  
  // Convert to array format
  const result = Object.values(monthlyData);
  
  res.json({
    summary: result,
    dateRange: {
      startDate: start,
      endDate: end,
    },
  });
});

module.exports = {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  deleteLoan,
  getMonthlySummary,
};
