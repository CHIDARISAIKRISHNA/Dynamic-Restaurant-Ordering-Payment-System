const database = require("../config/database")

class MenuItem {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.description = data.description
    this.price = data.price
    this.category = data.category
    this.image_url = data.image_url
    this.is_available = data.is_available
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  // Get all menu items
  static async getAll() {
    try {
      const rows = await database.all("SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, name")
      return rows.map((row) => new MenuItem(row))
    } catch (error) {
      throw new Error(`Error fetching menu items: ${error.message}`)
    }
  }

  // Get menu items by category
  static async getByCategory(category) {
    try {
      const rows = await database.all(
        "SELECT * FROM menu_items WHERE category = ? AND is_available = 1 ORDER BY name",
        [category],
      )
      return rows.map((row) => new MenuItem(row))
    } catch (error) {
      throw new Error(`Error fetching menu items by category: ${error.message}`)
    }
  }

  // Get menu item by ID
  static async getById(id) {
    try {
      const row = await database.get("SELECT * FROM menu_items WHERE id = ?", [id])
      return row ? new MenuItem(row) : null
    } catch (error) {
      throw new Error(`Error fetching menu item: ${error.message}`)
    }
  }

  // Create new menu item
  static async create(itemData) {
    try {
      const result = await database.run(
        `INSERT INTO menu_items (name, description, price, category, image_url, is_available)
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [
          itemData.name,
          itemData.description,
          itemData.price,
          itemData.category,
          itemData.image_url || null,
          itemData.is_available !== undefined ? itemData.is_available : 1,
        ],
      )
      return await MenuItem.getById(result.id)
    } catch (error) {
      throw new Error(`Error creating menu item: ${error.message}`)
    }
  }

  // Update menu item
  static async update(id, itemData) {
    try {
      await database.run(
        `UPDATE menu_items 
                 SET name = ?, description = ?, price = ?, category = ?, 
                     image_url = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
        [
          itemData.name,
          itemData.description,
          itemData.price,
          itemData.category,
          itemData.image_url,
          itemData.is_available,
          id,
        ],
      )
      return await MenuItem.getById(id)
    } catch (error) {
      throw new Error(`Error updating menu item: ${error.message}`)
    }
  }

  // Delete menu item (soft delete)
  static async delete(id) {
    try {
      await database.run("UPDATE menu_items SET is_available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id])
      return true
    } catch (error) {
      throw new Error(`Error deleting menu item: ${error.message}`)
    }
  }

  // Get all categories
  static async getCategories() {
    try {
      const rows = await database.all(
        "SELECT DISTINCT category FROM menu_items WHERE is_available = 1 ORDER BY category",
      )
      return rows.map((row) => row.category)
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`)
    }
  }
}

module.exports = MenuItem
