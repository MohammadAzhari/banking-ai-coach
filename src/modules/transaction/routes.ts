import { Router, Request, Response } from "express";
import transactionService from "./service";
import {
  CreateTransactionRequest,
  isValidCategory,
  TRANSACTION_CATEGORIES,
  isValidTransactionType,
  TRANSACTION_TYPES,
} from "./types";

const router = Router();

// POST /transactions
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      amount,
      category,
      type,
      storeName,
      date,
    }: CreateTransactionRequest = req.body;

    // Validate input
    if (!amount || !category || !type) {
      return res.status(400).json({
        error: "Amount, category and type are required",
      });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        error: "Amount must be a positive number",
      });
    }

    if (!isValidCategory(category)) {
      return res.status(400).json({
        error: "Invalid category",
        availableCategories: TRANSACTION_CATEGORIES,
      });
    }

    if (!isValidTransactionType(type)) {
      return res.status(400).json({
        error: "Invalid transaction type",
        availableTypes: TRANSACTION_TYPES,
      });
    }

    const userId = res.locals.userId;

    const transaction = await transactionService.createTransaction(userId, {
      amount,
      category,
      type,
      storeName,
      date,
    });

    res.status(201).json({
      transaction,
      message:
        "Transaction created successfully. Context request initiated in background.",
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;
