import { Router, Request, Response } from "express";
import { prisma } from "../../configs/db";

const router = Router();

// GET /api/users - list all users (id and name)
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true }
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
