const express = require("express");
const recycleBinController = require("../controllers/recycleBinController");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: RecycleBin
 *   description: Recycle bin management endpoints for soft-deleted items
 */

/**
 * @swagger
 * /recycle-bin/loans:
 *   get:
 *     summary: Get all soft-deleted loans
 *     tags: [RecycleBin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of soft-deleted loans
 */
router.get("/loans", auth, recycleBinController.getDeletedLoans);

/**
 * @swagger
 * /recycle-bin/entries:
 *   get:
 *     summary: Get all soft-deleted entries
 *     tags: [RecycleBin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of soft-deleted entries
 */
router.get("/entries", auth, recycleBinController.getDeletedEntries);

/**
 * @swagger
 * /recycle-bin/loans/{id}/restore:
 *   post:
 *     summary: Restore a soft-deleted loan
 *     tags: [RecycleBin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan restored successfully
 *       404:
 *         description: Loan not found
 */
router.post("/loans/:id/restore", auth, recycleBinController.restoreLoan);

/**
 * @swagger
 * /recycle-bin/entries/{id}/restore:
 *   post:
 *     summary: Restore a soft-deleted entry
 *     tags: [RecycleBin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Entry ID
 *     responses:
 *       200:
 *         description: Entry restored successfully
 *       404:
 *         description: Entry not found
 */
router.post("/entries/:id/restore", auth, recycleBinController.restoreEntry);

/**
 * @swagger
 * /recycle-bin/loans/{id}:
 *   delete:
 *     summary: Permanently delete a loan from recycle bin
 *     tags: [RecycleBin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan permanently deleted
 *       404:
 *         description: Loan not found
 */
router.delete("/loans/:id", auth, recycleBinController.permanentlyDeleteLoan);

/**
 * @swagger
 * /recycle-bin/entries/{id}:
 *   delete:
 *     summary: Permanently delete an entry from recycle bin
 *     tags: [RecycleBin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Entry ID
 *     responses:
 *       200:
 *         description: Entry permanently deleted
 *       404:
 *         description: Entry not found
 */
router.delete("/entries/:id", auth, recycleBinController.permanentlyDeleteEntry);

/**
 * @swagger
 * /recycle-bin/empty:
 *   delete:
 *     summary: Empty the recycle bin
 *     tags: [RecycleBin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [loans, entries, all]
 *         description: Type of items to empty (loans, entries, or all)
 *     responses:
 *       200:
 *         description: Recycle bin emptied successfully
 */
router.delete("/empty", auth, recycleBinController.emptyRecycleBin);

module.exports = router;
