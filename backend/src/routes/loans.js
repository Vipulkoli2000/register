const express = require("express");
const loanController = require("../controllers/loanController");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Loan management endpoints
 */

/**
 * @swagger
 * /loans/monthly-summary:
 *   get:
 *     summary: Get monthly summary of loans and payments
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for summary (defaults to current year start)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for summary (defaults to current year end)
 *     responses:
 *       200:
 *         description: Monthly summary data
 */
router.get("/monthly-summary", auth, loanController.getMonthlySummary);

/**
 * @swagger
 * /loans:
 *   get:
 *     summary: Get all loans
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: partyId
 *         schema:
 *           type: integer
 *         description: Filter loans by party ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Page size
 *     responses:
 *       200:
 *         description: List of loans
 */
router.get("/", auth, loanController.getLoans);

/**
 * @swagger
 * /loans/{id}:
 *   get:
 *     summary: Get a loan by ID
 *     tags: [Loans]
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
 *         description: Loan data
 *       404:
 *         description: Loan not found
 */
router.get("/:id", auth, loanController.getLoan);

/**
 * @swagger
 * /loans:
 *   post:
 *     summary: Create a new loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Loan'
 *     responses:
 *       201:
 *         description: Loan created
 */
router.post("/", auth, loanController.createLoan);

/**
 * @swagger
 * /loans/{id}:
 *   put:
 *     summary: Update a loan by ID
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Loan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Loan'
 *     responses:
 *       200:
 *         description: Loan updated
 *       404:
 *         description: Loan not found
 */
router.put("/:id", auth, loanController.updateLoan);

/**
 * @swagger
 * /loans/{id}:
 *   delete:
 *     summary: Delete a loan by ID
 *     tags: [Loans]
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
 *         description: Loan deleted
 *       404:
 *         description: Loan not found
 */
router.delete("/:id", auth, loanController.deleteLoan);

module.exports = router;
