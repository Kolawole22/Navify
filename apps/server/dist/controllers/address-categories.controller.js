"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCategoriesController = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class AddressCategoriesController {
    // GET /api/address/categories
    async getAll(_req, res) {
        try {
            const categories = await db_1.db.select().from(schema_1.addressCategories);
            res.status(200).json(categories);
        }
        catch (error) {
            console.error("Error fetching address categories:", error);
            res.status(500).json({ error: "Failed to fetch address categories" });
        }
    }
    // GET /api/address/categories/:id
    async getById(req, res) {
        const { id } = req.params;
        try {
            const category = await db_1.db
                .select()
                .from(schema_1.addressCategories)
                .where((0, drizzle_orm_1.eq)(schema_1.addressCategories.id, id))
                .limit(1);
            if (category.length === 0) {
                res.status(404).json({ error: "Address category not found" });
                return;
            }
            res.status(200).json(category[0]);
        }
        catch (error) {
            console.error("Error fetching address category:", error);
            res.status(500).json({ error: "Failed to fetch address category" });
        }
    }
    // POST /api/address/categories
    async create(req, res) {
        const { label, description } = req.body;
        if (!label) {
            res.status(400).json({ error: "Label is required" });
            return;
        }
        try {
            const newCategory = await db_1.db
                .insert(schema_1.addressCategories)
                .values({
                label,
                description,
            })
                .returning();
            res.status(201).json(newCategory[0]);
        }
        catch (error) {
            console.error("Error creating address category:", error);
            res.status(500).json({ error: "Failed to create address category" });
        }
    }
    // PUT /api/address/categories/:id
    async update(req, res) {
        const { id } = req.params;
        const { label, description } = req.body;
        if (!label) {
            res.status(400).json({ error: "Label is required" });
            return;
        }
        try {
            const updatedCategory = await db_1.db
                .update(schema_1.addressCategories)
                .set({
                label,
                description,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.addressCategories.id, id))
                .returning();
            if (updatedCategory.length === 0) {
                res.status(404).json({ error: "Address category not found" });
                return;
            }
            res.status(200).json(updatedCategory[0]);
        }
        catch (error) {
            console.error("Error updating address category:", error);
            res.status(500).json({ error: "Failed to update address category" });
        }
    }
    // DELETE /api/address/categories/:id
    async delete(req, res) {
        const { id } = req.params;
        try {
            const deleted = await db_1.db
                .delete(schema_1.addressCategories)
                .where((0, drizzle_orm_1.eq)(schema_1.addressCategories.id, id))
                .returning();
            if (deleted.length === 0) {
                res.status(404).json({ error: "Address category not found" });
                return;
            }
            res.status(200).json({ message: "Address category deleted successfully" });
        }
        catch (error) {
            console.error("Error deleting address category:", error);
            res.status(500).json({ error: "Failed to delete address category" });
        }
    }
}
exports.AddressCategoriesController = AddressCategoriesController;
//# sourceMappingURL=address-categories.controller.js.map