const database = require("../config/database")

class Order {
  constructor(data) {
    this.id = data.id
    this.customer_name = data.customer_name
    this.customer_phone = data.customer_phone
    this.total_amount = data.total_amount
    this.tax_amount = data.tax_amount
    this.status = data.status
    this.payment_mode = data.payment_mode
    this.created_at = data.created_at
    this.updated_at = data.updated_at
    this.items = data.items || []
  }

  // Get all orders with items
  static async getAll(limit = 50) {
    try {
      const orders = await database.all("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?", [limit])

      // Get items for each order
      for (const order of orders) {
        order.items = await OrderItem.getByOrderId(order.id)
      }

      return orders.map((order) => new Order(order))
    } catch (error) {
      throw new Error(`Error fetching orders: ${error.message}`)
    }
  }

  // Get order by ID with items
  static async getById(id) {
    try {
      const order = await database.get("SELECT * FROM orders WHERE id = ?", [id])

      if (!order) return null

      // Get order items
      order.items = await OrderItem.getByOrderId(id)

      return new Order(order)
    } catch (error) {
      throw new Error(`Error fetching order: ${error.message}`)
    }
  }

  // Create new order with items
  static async create(orderData) {
    try {
      // Start transaction
      await database.run("BEGIN TRANSACTION")

      // Create order
      const orderResult = await database.run(
        `INSERT INTO orders (customer_name, customer_phone, total_amount, tax_amount, status, payment_mode)
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderData.customer_name || "Guest",
          orderData.customer_phone || "",
          orderData.total_amount,
          orderData.tax_amount,
          orderData.status || "pending",
          orderData.payment_mode || "cash",
        ],
      )

      const orderId = orderResult.id

      // Create order items
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          await database.run(
            `INSERT INTO order_items (order_id, menu_item_id, quantity, price, total)
                         VALUES (?, ?, ?, ?, ?)`,
            [orderId, item.menu_item_id, item.quantity, item.price, item.total],
          )
        }
      }

      // Commit transaction
      await database.run("COMMIT")

      return await Order.getById(orderId)
    } catch (error) {
      // Rollback transaction
      await database.run("ROLLBACK")
      throw new Error(`Error creating order: ${error.message}`)
    }
  }

  // Update order status
  static async updateStatus(id, status) {
    try {
      await database.run("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, id])
      return await Order.getById(id)
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`)
    }
  }

  // Get orders by status
  static async getByStatus(status) {
    try {
      const orders = await database.all("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC", [status])

      for (const order of orders) {
        order.items = await OrderItem.getByOrderId(order.id)
      }

      return orders.map((order) => new Order(order))
    } catch (error) {
      throw new Error(`Error fetching orders by status: ${error.message}`)
    }
  }

  // Get today's orders
  static async getTodaysOrders() {
    try {
      const orders = await database.all(
        `SELECT * FROM orders 
                 WHERE DATE(created_at) = DATE('now') 
                 ORDER BY created_at DESC`,
      )

      for (const order of orders) {
        order.items = await OrderItem.getByOrderId(order.id)
      }

      return orders.map((order) => new Order(order))
    } catch (error) {
      throw new Error(`Error fetching today's orders: ${error.message}`)
    }
  }

  // Get sales statistics
  static async getSalesStats() {
    try {
      const todayStats = await database.get(
        `SELECT 
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_revenue,
                    AVG(total_amount) as average_order_value
                 FROM orders 
                 WHERE DATE(created_at) = DATE('now')`,
      )

      const monthStats = await database.get(
        `SELECT 
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_revenue
                 FROM orders 
                 WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
      )

      return {
        today: todayStats,
        month: monthStats,
      }
    } catch (error) {
      throw new Error(`Error fetching sales stats: ${error.message}`)
    }
  }
}

// Order Items helper class
class OrderItem {
  static async getByOrderId(orderId) {
    try {
      const items = await database.all(
        `SELECT oi.*, mi.name, mi.description 
                 FROM order_items oi
                 JOIN menu_items mi ON oi.menu_item_id = mi.id
                 WHERE oi.order_id = ?`,
        [orderId],
      )
      return items
    } catch (error) {
      throw new Error(`Error fetching order items: ${error.message}`)
    }
  }
}

module.exports = Order
