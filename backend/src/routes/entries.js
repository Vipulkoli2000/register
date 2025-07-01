const express = require("express");
const entriesController = require("../controllers/entriesController");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Entries
 *   description: Ledger entry management endpoints
 */

/**
 * @swagger
 * /entries:
 *   get:
 *     summary: Get all entries
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: loanId
 *         schema:
 *           type: integer
 *         description: Filter entries by loan ID
 *     responses:
 *       200:
 *         description: List of entries
 */
router.get("/", auth, entriesController.getEntries);

/**
 * @swagger
 * /entries/loan/{loanId}/details:
 *   get:
 *     summary: Get loan details for interest calculation
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan details with calculated interest amount
 *       404:
 *         description: Loan not found
 */
router.get("/loan/:loanId/details", auth, entriesController.getLoanDetailsForEntry);

/**
 * @swagger
 * /entries/{id}:
 *   get:
 *     summary: Get an entry by ID
 *     tags: [Entries]
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
 *         description: Entry data
 *       404:
 *         description: Entry not found
 */
router.get("/:id", auth, entriesController.getEntry);

/**
 * @swagger
 * /entries:
 *   post:
 *     summary: Create a new entry
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Entry'
 *     responses:
 *       201:
 *         description: Entry created
 */
router.post("/", auth, entriesController.createEntry);

/**
 * @swagger
 * /entries/{id}:
 *   put:
 *     summary: Update an entry by ID
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Entry'
 *     responses:
 *       200:
 *         description: Entry updated
 *       404:
 *         description: Entry not found
 */
// router.put removed – entries are immutable

/**
 * @swagger
 * /entries/{id}:
 *   delete:
 *     summary: Delete an entry by ID
 *     tags: [Entries]
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
 *         description: Entry deleted
 *       404:
 *         description: Entry not found
 */
// router.delete removed – entries are immutable

module.exports = router;
