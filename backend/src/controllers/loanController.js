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
        party: {
          select: {
            partyName: true,
          },
        },
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
      party: {
        select: {
          partyName: true,
        },
      },
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
    balanceAmount: z.number({ required_error: "balanceAmount is required" }).nonnegative(),
    interest: z.number({ required_error: "interest is required" }).nonnegative(),
    balanceInterest: z.number({ required_error: "balanceInterest is required" }).nonnegative(),
  });

  await schema.parseAsync(req.body);

  const loan = await prisma.loan.create({
    data: {
      ...req.body,
      loanDate: new Date(req.body.loanDate), // Ensure JS Date
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

module.exports = {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  deleteLoan,
};
