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
    // Prisma known request errors (e.g., unique constraint)
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
    }
    // Fallback for unexpected errors
    console.error(err);
    return res
      .status(500)
      .json({ errors: { message: "Internal Server Error" } });
  });
};
 

const getParties = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const { search = "", sortBy = "partyName", sortOrder = "asc" } = req.query;

  // Map frontend sort field "name" to database column "partyName"
  const mappedSortBy = sortBy === "name" ? "partyName" : sortBy;

  const where = search
    ? {
        OR: [
          { partyName: { contains: search } },
          { accountNumber: { contains: search } },
          
        ],
      }
    : {};

  const [parties, total] = await Promise.all([
    prisma.party.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [mappedSortBy]: sortOrder },
    }),
    prisma.party.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    parties,
    page,
    totalPages,
    totalParties: total,
  });
});

const getParty = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid party ID");

  const party = await prisma.party.findUnique({ where: { id } });
  if (!party) throw createError(404, "Party not found");

  res.json(party);
});

const createParty = asyncHandler(async (req, res) => {
  const schema = z.object({
    partyName: z.string().min(1, "Party name is required").max(255),
    accountNumber: z.string().min(1, "Account number is required").max(255),
    address: z.string().min(1, "Address is required").max(500),
    mobile1: z.string().min(1, "Mobile1 is required").max(20),
    mobile2: z.string().max(20).optional().nullable(),
    reference: z.string().max(255).optional().nullable(),
    referenceMobile1: z.string().max(20).optional().nullable(),
    referenceMobile2: z.string().max(20).optional().nullable(),
  });

  // Will throw Zod errors caught by asyncHandler
  await schema.parseAsync(req.body);

  const party = await prisma.party.create({ data: req.body });
  res.status(201).json(party);
});

const updateParty = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid party ID");

  const schema = z
    .object({
      partyName: z.string().min(1).max(255).optional(),
      accountNumber: z.string().min(1).max(255).optional(),
      address: z.string().min(1).max(500).optional(),
      mobile1: z.string().min(1).max(20).optional(),
      mobile2: z.string().max(20).optional().nullable(),
      reference: z.string().max(255).optional().nullable(),
      referenceMobile1: z.string().max(20).optional().nullable(),
      referenceMobile2: z.string().max(20).optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    });

  await schema.parseAsync(req.body);

  const existing = await prisma.party.findUnique({ where: { id } });
  if (!existing) throw createError(404, "Party not found");

  const updated = await prisma.party.update({
    where: { id },
    data: req.body,
  });

  res.json(updated);
});

const deleteParty = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid party ID");

  const existing = await prisma.party.findUnique({ where: { id } });
  if (!existing) throw createError(404, "Party not found");

  await prisma.party.delete({ where: { id } });
  res.json({ message: "Party deleted successfully" });
});

module.exports = {
  getParties,
  createParty,
  getParty,
  updateParty,
  deleteParty,
};
