const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const { z } = require("zod");
const createError = require("http-errors");

/**
 * Calculate and update loan balances based on received payments
 * This function handles the complex logic of updating balance amounts and interest
 */
const calculateUpdatedLoanBalances = (loan, receivedAmount = 0, receivedInterest = 0) => {
  const currentBalanceAmount = loan.balanceAmount;
  const currentBalanceInterest = loan.balanceInterest;
  const interestRate = loan.interest;
  
  // Calculate interest on current balance amount
  const interestOnBalance = (currentBalanceAmount * interestRate) / 100;
  
  // Interest accrued for this period (does not include previously pending interest)
  const newInterestAmount = interestOnBalance;
  
  // Total interest due before applying the received payment
  const totalInterestBeforePayment = currentBalanceInterest + newInterestAmount;
  
  // Apply received interest payment against the total interest due
  const remainingBalanceInterest = Math.max(0, totalInterestBeforePayment - receivedInterest);
  
  // Apply received amount payment to principal
  const newBalanceAmount = Math.max(0, currentBalanceAmount - receivedAmount);
  
  return {
    newBalanceAmount,
    newBalanceInterest: remainingBalanceInterest,
    interestAmount: newInterestAmount,
    totalInterestBeforePayment,
    interestOnBalance
  };
};

/**
 * Wrap async route handlers and funnel errors through Express error middleware.
 * Converts Prisma validation errors and known request errors into structured JSON responses.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Validation errors (Zod / manual)
    if (err.status === 400 && err.expose) {
      return res
        .status(400)
        .json({ errors: err.errors || { message: err.message } });
    }
    // Prisma validation errors
    if (err.name === "PrismaClientValidationError") {
      return res.status(400).json({ errors: { message: err.message } });
    }
    // Prisma known request errors (e.g., unique, FK)
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
    console.error(err);
    return res.status(500).json({ errors: { message: "Internal Server Error" } });
  });
};

// GET /api/entries
const getEntries = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const {
    loanId,
    sortBy = "entryDate",
    sortOrder = "desc", // "asc" | "desc"
  } = req.query;

  const where = {
    AND: [
      { deletedAt: null }, // Exclude soft-deleted entries
      loanId ? { loanId: parseInt(loanId) } : {},
    ].filter(condition => Object.keys(condition).length > 0),
  };

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        loan: {
          select: {
            id: true,
            partyId: true,
          },
        },
      },
    }),
    prisma.entry.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({ entries, page, totalPages, totalEntries: total });
});

// GET /api/entries/:id
const getEntry = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid entry ID");

  const entry = await prisma.entry.findUnique({
    where: { id },
    include: {
      loan: {
        select: {
          id: true,
          partyId: true,
        },
      },
    },
  });

  if (!entry) throw createError(404, "Entry not found");
  res.json(entry);
});

// POST /api/entries
const createEntry = asyncHandler(async (req, res) => {
  const schema = z.object({
    loanId: z
      .number({ required_error: "loanId is required" })
      .int()
      .positive(),
    entryDate: z.coerce.date({ required_error: "entryDate is required" }),
    // balanceAmount and interestAmount will be derived from the related loan
    receivedDate: z.coerce.date().optional().nullable(),
    receivedAmount: z.number().nonnegative().optional().nullable(),
    receivedInterest: z.number().nonnegative().optional().nullable(),
  });

  const data = await schema.parseAsync(req.body);
  const receivedAmount = data.receivedAmount || 0;
  const receivedInterest = data.receivedInterest || 0;

  // Fetch the complete loan details including current balance interest
  const loan = await prisma.loan.findUnique({
    where: { id: data.loanId },
    select: { 
      balanceAmount: true, 
      interest: true, 
      balanceInterest: true 
    },
  });
  if (!loan) throw createError(404, "Loan not found");

  // Calculate updated balances using the received payment logic
  const calculations = calculateUpdatedLoanBalances(loan, receivedAmount, receivedInterest);

  // Use transaction to ensure data consistency
  const result = await prisma.$transaction(async (prisma) => {
    // Create the entry with calculated values
    const entry = await prisma.entry.create({
      data: {
        ...data,
        balanceAmount: loan.balanceAmount, // Current balance before this entry
        interestAmount: calculations.interestAmount, // New interest for this period
        entryDate: new Date(data.entryDate),
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
      },
    });

    // Update the loan with new balance amounts
    await prisma.loan.update({
      where: { id: data.loanId },
      data: {
        balanceAmount: calculations.newBalanceAmount,
        balanceInterest: calculations.newBalanceInterest,
        totalInterestAmount: { increment: receivedInterest },
      },
    });

    return entry;
  });

  res.status(201).json(result);
});
 
// GET /api/entries/loan/:loanId/details - Get loan details for interest calculation
const getLoanDetailsForEntry = asyncHandler(async (req, res) => {
  const loanId = parseInt(req.params.loanId);
  if (!loanId) throw createError(400, "Invalid loan ID");

  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: {
      id: true,
      balanceAmount: true,
      interest: true,
      balanceInterest: true,
      loanDate: true,
    },
  });

  if (!loan) throw createError(404, "Loan not found");

  // Calculate interest on current balance amount
  const interestOnBalance = (loan.balanceAmount * loan.interest) / 100;
  
  // Interest accrued for this period
  const newInterestAmount = interestOnBalance;
  
  // Pending interest after adding this period's interest
  const totalInterestAfterNewPeriod = loan.balanceInterest + newInterestAmount;

  // Determine next suggested entry date: 30 days after the most recent entry (or loan date if no entries)
  const latestEntry = await prisma.entry.findFirst({
    where: { loanId },
    orderBy: { entryDate: "desc" },
    select: { entryDate: true },
  });

  const baseDate = latestEntry?.entryDate ?? loan.loanDate;
  const nextEntryDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  res.json({
    ...loan,
    calculatedInterestAmount: newInterestAmount,
    totalPendingInterest: totalInterestAfterNewPeriod,
    nextEntryDate,
  });
});

module.exports = {
  getEntries,
  getEntry,
  createEntry,
  getLoanDetailsForEntry,
};
