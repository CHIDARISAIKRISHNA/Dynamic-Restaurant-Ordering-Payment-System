const express = require("express")
const OrderFile = require("../models/OrderFile")
const fs = require("fs")
const path = require("path")
const router = express.Router()

const MENU_FILE = path.join(__dirname, "../data/menu.json")

// Helper to load menu items from JSON
function loadMenuItems() {
  try {
    const menuData = JSON.parse(fs.readFileSync(MENU_FILE, "utf8"))
    return Object.values(menuData).flat()
  } catch (error) {
    console.error("Error loading menu:", error)
    return []
  }
}

// Get all orders
router.get("/", (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 50
    console.log(`📋 Fetching orders with limit: ${limit}`)
    const orders = OrderFile.getAll(limit)
    console.log(`✅ Fetched ${orders.length} orders from JSON file`)
    res.json(orders)
  } catch (error) {
    console.error("❌ Error fetching orders:", error)
    res.json([])
  }
})

// Get order by ID
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params
    const order = OrderFile.getById(id)

    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }

    res.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({ error: error.message })
  }
})

// Create new order
router.post("/", (req, res) => {
  try {
    const { items, customerInfo, totalAmount, tax } = req.body

    console.log("📦 Received order request:", {
      customerName: customerInfo?.name,
      customerPhone: customerInfo?.phone,
      itemsCount: items?.length,
      totalAmount
    })

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Order must contain at least one item" })
    }

    if (!totalAmount) {
      return res.status(400).json({ error: "Total amount is required" })
    }

    // Validate customer info
    if (!customerInfo?.name || !customerInfo?.phone) {
      return res.status(400).json({ error: "Customer name and phone are required" })
    }

    // Get menu items from JSON file
    const allMenuItems = loadMenuItems()

    // Validate and prepare order items
    const orderItems = []
    for (const item of items) {
      const menuItem = allMenuItems.find(m => m.id === item.id)
      if (!menuItem) {
        return res.status(400).json({
          error: `Menu item with ID ${item.id} not found`,
        })
      }

      orderItems.push({
        menu_item_id: item.id,
        quantity: item.quantity,
        price: menuItem.price,
        total: menuItem.price * item.quantity,
        name: menuItem.name || "Unknown"
      })
    }

    console.log("💾 Saving order...")

    const newOrder = OrderFile.create({
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      total_amount: Number.parseFloat(totalAmount),
      tax_amount: Number.parseFloat(tax) || 0,
      items: orderItems,
    })

    console.log(`✅ Order #${newOrder.id} saved to JSON file!`)

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: newOrder.id,
      order: newOrder,
    })
  } catch (error) {
    console.error("❌ Error creating order:", error)
    res.status(500).json({ error: error.message })
  }
})

// Update order status
router.put("/:id/status", (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    console.log(`📝 Received status update request: Order #${id} → ${status}`)

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Valid statuses: " + validStatuses.join(", "),
      })
    }

    const updatedOrder = OrderFile.updateStatus(id, status)

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" })
    }

    console.log(`✅ Order #${id} status saved to JSON file as "${status}"`)

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    })
  } catch (error) {
    console.error("❌ Error updating order status:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get orders by status
router.get("/status/:status", (req, res) => {
  try {
    const { status } = req.params
    const orders = OrderFile.getByStatus(status)
    res.json(orders)
  } catch (error) {
    console.error("Error fetching orders by status:", error)
    res.json([])
  }
})

// Get sales statistics
router.get("/stats/sales", (req, res) => {
  try {
    const stats = OrderFile.getSalesStats()
    res.json(stats)
  } catch (error) {
    console.error("Error fetching sales stats:", error)
    res.json({
      today: { total_orders: 0, total_revenue: 0, average_order_value: 0 },
      month: { total_orders: 0, total_revenue: 0 },
    })
  }
})

module.exports = router
