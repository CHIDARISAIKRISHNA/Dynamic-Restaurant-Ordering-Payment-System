const express = require("express")
const Order = require("../models/Order")
const MenuItem = require("../models/MenuItem")
const router = express.Router()

// Get all orders
router.get("/", async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 50
    const orders = await Order.getAll(limit)
    res.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get order by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.getById(id)

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
router.post("/", async (req, res) => {
  try {
    const { items, customerInfo, totalAmount, tax } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Order must contain at least one item" })
    }

    if (!totalAmount) {
      return res.status(400).json({ error: "Total amount is required" })
    }

    // Validate and prepare order items
    const orderItems = []
    for (const item of items) {
      // Verify menu item exists
      const menuItem = await MenuItem.getById(item.id)
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
      })
    }

    // Create order
    const newOrder = await Order.create({
      customer_name: customerInfo?.name || "Guest",
      customer_phone: customerInfo?.phone || "",
      total_amount: Number.parseFloat(totalAmount),
      tax_amount: Number.parseFloat(tax) || 0,
      items: orderItems,
    })

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: newOrder.id,
      order: newOrder,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ error: error.message })
  }
})

// Update order status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Valid statuses: " + validStatuses.join(", "),
      })
    }

    const updatedOrder = await Order.updateStatus(id, status)

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" })
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get orders by status
router.get("/status/:status", async (req, res) => {
  try {
    const { status } = req.params
    const orders = await Order.getByStatus(status)
    res.json(orders)
  } catch (error) {
    console.error("Error fetching orders by status:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get today's orders
router.get("/today/list", async (req, res) => {
  try {
    const orders = await Order.getTodaysOrders()
    res.json(orders)
  } catch (error) {
    console.error("Error fetching today's orders:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get sales statistics
router.get("/stats/sales", async (req, res) => {
  try {
    const stats = await Order.getSalesStats()
    res.json(stats)
  } catch (error) {
    console.error("Error fetching sales stats:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
