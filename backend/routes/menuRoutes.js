const express = require("express")
const MenuItem = require("../models/MenuItem")
const router = express.Router()

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.getAll()

    // Group items by category
    const groupedItems = {}
    items.forEach((item) => {
      if (!groupedItems[item.category]) {
        groupedItems[item.category] = []
      }
      groupedItems[item.category].push(item)
    })

    res.json(groupedItems)
  } catch (error) {
    console.error("Error fetching menu items:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get menu items by category
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params
    const items = await MenuItem.getByCategory(category)
    res.json(items)
  } catch (error) {
    console.error("Error fetching menu items by category:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get single menu item
router.get("/item/:id", async (req, res) => {
  try {
    const { id } = req.params
    const item = await MenuItem.getById(id)

    if (!item) {
      return res.status(404).json({ error: "Menu item not found" })
    }

    res.json(item)
  } catch (error) {
    console.error("Error fetching menu item:", error)
    res.status(500).json({ error: error.message })
  }
})

// Create new menu item (Admin only)
router.post("/", async (req, res) => {
  try {
    const { name, description, price, category, image_url, is_available } = req.body

    if (!name || !price || !category) {
      return res.status(400).json({
        error: "Name, price, and category are required",
      })
    }

    const newItem = await MenuItem.create({
      name,
      description,
      price: Number.parseFloat(price),
      category,
      image_url,
      is_available,
    })

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      item: newItem,
    })
  } catch (error) {
    console.error("Error creating menu item:", error)
    res.status(500).json({ error: error.message })
  }
})

// Update menu item (Admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, category, image_url, is_available } = req.body

    const updatedItem = await MenuItem.update(id, {
      name,
      description,
      price: Number.parseFloat(price),
      category,
      image_url,
      is_available,
    })

    if (!updatedItem) {
      return res.status(404).json({ error: "Menu item not found" })
    }

    res.json({
      success: true,
      message: "Menu item updated successfully",
      item: updatedItem,
    })
  } catch (error) {
    console.error("Error updating menu item:", error)
    res.status(500).json({ error: error.message })
  }
})

// Delete menu item (Admin only)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params
    await MenuItem.delete(id)

    res.json({
      success: true,
      message: "Menu item deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting menu item:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get all categories
router.get("/categories/list", async (req, res) => {
  try {
    const categories = await MenuItem.getCategories()
    res.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
