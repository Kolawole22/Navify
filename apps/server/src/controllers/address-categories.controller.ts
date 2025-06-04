import { Request, Response } from "express";
import { db } from "../db";
import { addressCategories } from "../db/schema";
import { eq } from "drizzle-orm";

export class AddressCategoriesController {
  // GET /api/address/categories
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await db.select().from(addressCategories);
      res.status(200).json(categories);
    } catch (error) {
      console.error("Error fetching address categories:", error);
      res.status(500).json({ error: "Failed to fetch address categories" });
    }
  }

  // GET /api/address/categories/:id
  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const category = await db
        .select()
        .from(addressCategories)
        .where(eq(addressCategories.id, id))
        .limit(1);

      if (category.length === 0) {
        res.status(404).json({ error: "Address category not found" });
        return;
      }

      res.status(200).json(category[0]);
    } catch (error) {
      console.error("Error fetching address category:", error);
      res.status(500).json({ error: "Failed to fetch address category" });
    }
  }

  // POST /api/address/categories
  async create(req: Request, res: Response): Promise<void> {
    const { label, description } = req.body;

    if (!label) {
      res.status(400).json({ error: "Label is required" });
      return;
    }

    try {
      const newCategory = await db
        .insert(addressCategories)
        .values({
          label,
          description,
        })
        .returning();

      res.status(201).json(newCategory[0]);
    } catch (error) {
      console.error("Error creating address category:", error);
      res.status(500).json({ error: "Failed to create address category" });
    }
  }

  // PUT /api/address/categories/:id
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { label, description } = req.body;

    if (!label) {
      res.status(400).json({ error: "Label is required" });
      return;
    }

    try {
      const updatedCategory = await db
        .update(addressCategories)
        .set({
          label,
          description,
          updatedAt: new Date(),
        })
        .where(eq(addressCategories.id, id))
        .returning();

      if (updatedCategory.length === 0) {
        res.status(404).json({ error: "Address category not found" });
        return;
      }

      res.status(200).json(updatedCategory[0]);
    } catch (error) {
      console.error("Error updating address category:", error);
      res.status(500).json({ error: "Failed to update address category" });
    }
  }

  // DELETE /api/address/categories/:id
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const deleted = await db
        .delete(addressCategories)
        .where(eq(addressCategories.id, id))
        .returning();

      if (deleted.length === 0) {
        res.status(404).json({ error: "Address category not found" });
        return;
      }

      res.status(200).json({ message: "Address category deleted successfully" });
    } catch (error) {
      console.error("Error deleting address category:", error);
      res.status(500).json({ error: "Failed to delete address category" });
    }
  }
}
