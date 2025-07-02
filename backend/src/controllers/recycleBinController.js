const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const createError = require("http-errors");

/**
 * Wrap async route handlers and funnel errors through Express error middleware.
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
    // Prisma known request errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return res.status(404).json({ errors: { message: "Record not found" } });
      }
    }
    console.error(err);
    return res.status(500).json({ errors: { message: "Internal Server Error" } });
  });
};

// GET /api/recycle-bin/loans - Get soft-deleted loans
const getDeletedLoans = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      skip,
      take: limit,
      orderBy: { deletedAt: "desc" },
      include: {
        party: {
          select: {
            id: true,
            partyName: true,
            mobile1: true,
            address: true,
          },
        },
      },
    }),
    prisma.loan.count({
      where: {
        deletedAt: {
          not: null,
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({ loans, page, totalPages, totalLoans: total });
});

// GET /api/recycle-bin/entries - Get soft-deleted entries
const getDeletedEntries = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      skip,
      take: limit,
      orderBy: { deletedAt: "desc" },
      include: {
        loan: {
          select: {
            id: true,
            partyId: true,
            party: {
              select: {
                partyName: true,
              },
            },
          },
        },
      },
    }),
    prisma.entry.count({
      where: {
        deletedAt: {
          not: null,
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({ entries, page, totalPages, totalEntries: total });
});

// POST /api/recycle-bin/loans/:id/restore - Restore a soft-deleted loan and its related entries
const restoreLoan = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid loan ID");

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      entries: {
        where: {
          deletedAt: {
            not: null,
          },
        },
      },
    },
  });

  if (!loan) throw createError(404, "Loan not found");
  if (!loan.deletedAt) throw createError(400, "Loan is not deleted");

  // Use transaction to restore loan and all its related entries
  const restoredLoan = await prisma.$transaction(async (prisma) => {
    // Restore all entries that were soft-deleted along with this loan
    if (loan.entries.length > 0) {
      await prisma.entry.updateMany({
        where: {
          loanId: id,
          deletedAt: {
            not: null,
          },
        },
        data: {
          deletedAt: null,
        },
      });
    }

    // Restore the loan
    const restored = await prisma.loan.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        party: true,
        entries: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    return restored;
  });

  res.json({ 
    message: "Loan and related entries restored successfully", 
    loan: restoredLoan,
    restoredEntriesCount: loan.entries.length 
  });
});

// POST /api/recycle-bin/entries/:id/restore - Restore a soft-deleted entry
const restoreEntry = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid entry ID");

  const entry = await prisma.entry.findUnique({
    where: { id },
    include: {
      loan: true,
    },
  });

  if (!entry) throw createError(404, "Entry not found");
  if (!entry.deletedAt) throw createError(400, "Entry is not deleted");

  const restoredEntry = await prisma.entry.update({
    where: { id },
    data: {
      deletedAt: null,
    },
    include: {
      loan: {
        include: {
          party: true,
        },
      },
    },
  });

  res.json({ message: "Entry restored successfully", entry: restoredEntry });
});

// DELETE /api/recycle-bin/loans/:id - Permanently delete a loan and its related entries
const permanentlyDeleteLoan = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid loan ID");

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      entries: {
        where: {
          deletedAt: {
            not: null,
          },
        },
      },
    },
  });

  if (!loan) throw createError(404, "Loan not found");
  if (!loan.deletedAt) throw createError(400, "Loan is not in recycle bin");

  // Use transaction to permanently delete loan and all its related entries
  await prisma.$transaction(async (prisma) => {
    // Permanently delete all soft-deleted entries belonging to this loan
    if (loan.entries.length > 0) {
      await prisma.entry.deleteMany({
        where: {
          loanId: id,
          deletedAt: {
            not: null,
          },
        },
      });
    }

    // Permanently delete the loan
    await prisma.loan.delete({
      where: { id },
    });
  });

  res.json({ 
    message: "Loan and related entries permanently deleted",
    deletedEntriesCount: loan.entries.length 
  });
});

// DELETE /api/recycle-bin/entries/:id - Permanently delete an entry
const permanentlyDeleteEntry = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid entry ID");

  const entry = await prisma.entry.findUnique({
    where: { id },
  });

  if (!entry) throw createError(404, "Entry not found");
  if (!entry.deletedAt) throw createError(400, "Entry is not in recycle bin");

  await prisma.entry.delete({
    where: { id },
  });

  res.json({ message: "Entry permanently deleted" });
});

// DELETE /api/recycle-bin/empty - Empty the entire recycle bin
const emptyRecycleBin = asyncHandler(async (req, res) => {
  const { type } = req.query; // 'loans', 'entries', or 'all'

  let deletedLoansCount = 0;
  let deletedEntriesCount = 0;

  await prisma.$transaction(async (prisma) => {
    if (type === "loans" || type === "all") {
      // First, delete all soft-deleted entries
      const deletedEntries = await prisma.entry.deleteMany({
        where: {
          deletedAt: {
            not: null,
          },
        },
      });
      deletedEntriesCount += deletedEntries.count;

      // Then, delete all soft-deleted loans
      const deletedLoans = await prisma.loan.deleteMany({
        where: {
          deletedAt: {
            not: null,
          },
        },
      });
      deletedLoansCount = deletedLoans.count;
    } else if (type === "entries") {
      // Only delete entries that are not related to soft-deleted loans
      const deletedEntries = await prisma.entry.deleteMany({
        where: {
          AND: [
            {
              deletedAt: {
                not: null,
              },
            },
            {
              loan: {
                deletedAt: null, // Only delete entries whose loans are not soft-deleted
              },
            },
          ],
        },
      });
      deletedEntriesCount = deletedEntries.count;
    }
  });

  res.json({ 
    message: "Recycle bin emptied successfully",
    deletedLoansCount,
    deletedEntriesCount,
  });
});

module.exports = {
  getDeletedLoans,
  getDeletedEntries,
  restoreLoan,
  restoreEntry,
  permanentlyDeleteLoan,
  permanentlyDeleteEntry,
  emptyRecycleBin,
};
