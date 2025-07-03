const express = require('express');
const router = express.Router();
const dayCloseController = require("../controllers/dayCloseController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     DayClose:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the day close
 *         closedAt:
 *           type: string
 *           format: date-time
 *           description: The actual close time
 *         createdBy:
 *           type: integer
 *           description: The ID of the user who created the close
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the record was last updated
 *       example:
 *         id: 1
 *         closedAt: "2024-01-15T23:59:59.000Z"
 *         createdBy: 1
 *         user:
 *           id: 1
 *           name: "John Doe"
 *           email: "john@example.com"
 *         createdAt: "2024-01-15T23:59:59.000Z"
 *         updatedAt: "2024-01-15T23:59:59.000Z"
 */

/**
 * @swagger
 * /api/day-closes:
 *   get:
 *     summary: Get paginated list of day closes
 *     tags: [DayCloses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: List of day closes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dayCloses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DayClose'
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 total:
 *                   type: integer
 */
router.get("/", auth, dayCloseController.getDayCloses);

/**
 * @swagger
 * /api/day-closes/last:
 *   get:
 *     summary: Get the most recent day close
 *     tags: [DayCloses]
 *     responses:
 *       200:
 *         description: The most recent day close
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 lastClose:
 *                   $ref: '#/components/schemas/DayClose'
 */
router.get("/last", auth, dayCloseController.getLastClose);

/**
 * @swagger
 * /api/day-closes/date/{date}:
 *   get:
 *     summary: Get all day closes for a specific date
 *     tags: [DayCloses]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: The date to get closes for (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Day closes for the specified date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dayCloses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DayClose'
 *                 date:
 *                   type: string
 *                   format: date
 */
router.get("/date/:date", auth, dayCloseController.getDayClosesByDate);

/**
 * @swagger
 * /api/day-closes:
 *   post:
 *     summary: Create a new day close
 *     tags: [DayCloses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               closedAt:
 *                 type: string
 *                 format: date-time
 *                 description: The close time (optional, defaults to now)
 *     responses:
 *       201:
 *         description: Day close created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 dayClose:
 *                   $ref: '#/components/schemas/DayClose'
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Invalid input data
 */
router.post("/", auth, dayCloseController.createDayClose);

module.exports = router;
