const express = require("express")
const fs = require("fs")
const path = require("path")
const router = express.Router()

const MENU_FILE = path.join(__dirname, "../data/menu.json")

// Helper function to load menu from JSON
function loadMenuFromFile() {
  try {
    const menuData = JSON.parse(fs.readFileSync(MENU_FILE, "utf8"))
    return menuData
  } catch (error) {
    console.error("Error loading menu.json:", error)
    return {}
  }
}

// Helper function to flatten menu items
function getAllMenuItems() {
  const menuData = loadMenuFromFile()
  const allItems = []
  for (const category in menuData) {
    if (Array.isArray(menuData[category])) {
      menuData[category].forEach(item => {
        allItems.push(item)
      })
    }
  }
  return allItems
}

// Get all menu items
router.get("/", (req, res) => {
  try {
    const menuData = loadMenuFromFile()
    res.json(menuData)
  } catch (error) {
    console.error("Error fetching menu items:", error)
    res.status(500).json({ error: "Failed to load menu" })
  }
})

// Get menu items by category
router.get("/:category", (req, res) => {
  try {
    const { category } = req.params
    const menuData = loadMenuFromFile()
    const items = menuData[category] || []
    res.json(items)
  } catch (error) {
    console.error("Error fetching menu items by category:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get single menu item
router.get("/item/:id", (req, res) => {
  try {
    const { id } = req.params
    const allItems = getAllMenuItems()
    const item = allItems.find(i => i.id === Number.parseInt(id))

    if (!item) {
      return res.status(404).json({ error: "Menu item not found" })
    }

    res.json(item)
  } catch (error) {
    console.error("Error fetching menu item:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get all categories
router.get("/categories/list", (req, res) => {
  try {
    const menuData = loadMenuFromFile()
    const categories = Object.keys(menuData).filter(cat => Array.isArray(menuData[cat]) && menuData[cat].length > 0)
    res.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
