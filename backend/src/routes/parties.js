const express = require("express");
const partyController = require("../controllers/partyController");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parties
 *   description: Party management endpoints
 */

/**
 * @swagger
 * /parties:
 *   get:
 *     summary: Get all parties
 *     tags: [Parties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all parties
 */
router.get("/", auth, partyController.getParties);

/**
 * @swagger
 * /parties/{id}:
 *   get:
 *     summary: Get a party by ID
 *     tags: [Parties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Party ID
 *     responses:
 *       200:
 *         description: Party data
 *       404:
 *         description: Party not found
 */
router.get("/:id", auth, partyController.getParty);

/**
 * @swagger
 * /parties:
 *   post:
 *     summary: Create a new party
 *     tags: [Parties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Party'
 *     responses:
 *       201:
 *         description: Party created
 */
router.post("/", auth, partyController.createParty);

/**
 * @swagger
 * /parties/{id}:
 *   put:
 *     summary: Update a party by ID
 *     tags: [Parties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Party ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Party'
 *     responses:
 *       200:
 *         description: Party updated
 *       404:
 *         description: Party not found
 */
router.put("/:id", auth, partyController.updateParty);

/**
 * @swagger
 * /parties/{id}:
 *   delete:
 *     summary: Delete a party by ID
 *     tags: [Parties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Party ID
 *     responses:
 *       200:
 *         description: Party deleted
 *       404:
 *         description: Party not found
 */
router.delete("/:id", auth, partyController.deleteParty);

module.exports = router;
