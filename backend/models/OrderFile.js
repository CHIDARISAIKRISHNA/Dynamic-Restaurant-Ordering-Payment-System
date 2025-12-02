const fs = require("fs")
const path = require("path")

const ORDERS_FILE = path.join(__dirname, "../data/orders.json")
const ORDER_ITEMS_FILE = path.join(__dirname, "../data/order_items.json")

const memoryByDefault =
  process.env.USE_MEMORY_STORAGE === "true" || process.env.NODE_ENV === "production"

let useMemoryOnly = memoryByDefault
let memoryOrders = []
let memoryOrderItems = []

function switchToMemoryStorage(reason) {
  if (!useMemoryOnly) {
    console.warn("⚠️ Falling back to in-memory order storage:", reason)
    console.warn("   Orders will NOT persist after server restarts.")
  }
  useMemoryOnly = true
}

class OrderFile {
  constructor(data) {
    this.id = data.id
    this.customer_name = data.customer_name
    this.customer_phone = data.customer_phone
    this.total_amount = data.total_amount
    this.tax_amount = data.tax_amount
    this.status = data.status || "pending"
    this.payment_mode = data.payment_mode || "cash"
    this.created_at = data.created_at || new Date().toISOString()
    this.updated_at = data.updated_at || new Date().toISOString()
    this.items = data.items || []
  }

  static ensureFilesExist() {
    if (useMemoryOnly) return

    const dir = path.dirname(ORDERS_FILE)
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      if (!fs.existsSync(ORDERS_FILE)) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2))
      }
      if (!fs.existsSync(ORDER_ITEMS_FILE)) {
        fs.writeFileSync(ORDER_ITEMS_FILE, JSON.stringify([], null, 2))
      }
    } catch (error) {
      switchToMemoryStorage(error.message)
    }
  }

  static readOrdersData() {
    if (useMemoryOnly) {
      return memoryOrders
    }

    try {
      memoryOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"))
      return memoryOrders
    } catch (error) {
      switchToMemoryStorage(error.message)
      return memoryOrders
    }
  }

  static readOrderItemsData() {
    if (useMemoryOnly) {
      return memoryOrderItems
    }

    try {
      memoryOrderItems = JSON.parse(fs.readFileSync(ORDER_ITEMS_FILE, "utf8"))
      return memoryOrderItems
    } catch (error) {
      switchToMemoryStorage(error.message)
      return memoryOrderItems
    }
  }

  static writeOrdersData(data) {
    if (useMemoryOnly) {
      memoryOrders = data
      return
    }

    try {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      switchToMemoryStorage(error.message)
      memoryOrders = data
    }
  }

  static writeOrderItemsData(data) {
    if (useMemoryOnly) {
      memoryOrderItems = data
      return
    }

    try {
      fs.writeFileSync(ORDER_ITEMS_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      switchToMemoryStorage(error.message)
      memoryOrderItems = data
    }
  }

  static getAll(limit = 50) {
    try {
      OrderFile.ensureFilesExist()
      const ordersData = OrderFile.readOrdersData()
      const itemsData = OrderFile.readOrderItemsData()

      const orders = ordersData
        .slice(0, limit)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((order) => {
          order.items = itemsData.filter((item) => item.order_id === order.id)
          return new OrderFile(order)
        })

      return orders
    } catch (error) {
      console.error("Error reading orders file:", error)
      return []
    }
  }

  static getById(id) {
    try {
      OrderFile.ensureFilesExist()
      const ordersData = OrderFile.readOrdersData()
      const itemsData = OrderFile.readOrderItemsData()

      const orderData = ordersData.find((o) => o.id === Number.parseInt(id))
      if (!orderData) return null

      orderData.items = itemsData.filter((item) => item.order_id === Number.parseInt(id))
      return new OrderFile(orderData)
    } catch (error) {
      console.error("Error reading order file:", error)
      return null
    }
  }

  static create(orderData) {
    try {
      OrderFile.ensureFilesExist()
      
      const ordersData = OrderFile.readOrdersData()
      const itemsData = OrderFile.readOrderItemsData()

      const newId = ordersData.length > 0 ? Math.max(...ordersData.map((o) => o.id)) + 1 : 1

      const newOrder = {
        id: newId,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        total_amount: Number.parseFloat(orderData.total_amount),
        tax_amount: Number.parseFloat(orderData.tax_amount || 0),
        status: orderData.status || "pending",
        payment_mode: orderData.payment_mode || "cash",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      ordersData.push(newOrder)
      OrderFile.writeOrdersData(ordersData)

      if (orderData.items && orderData.items.length > 0) {
        let nextItemId = itemsData.length > 0 ? Math.max(...itemsData.map((i) => (i.id || 0))) + 1 : 1
        orderData.items.forEach((item) => {
          itemsData.push({
            id: nextItemId++,
            order_id: newId,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            name: item.name || "Unknown",
            created_at: new Date().toISOString(),
          })
        })
        OrderFile.writeOrderItemsData(itemsData)
      }

      const savedOrder = OrderFile.getById(newId)
      return savedOrder
    } catch (error) {
      console.error("Error creating order:", error)
      throw error
    }
  }

  static updateStatus(id, status) {
    try {
      OrderFile.ensureFilesExist()
      const ordersData = OrderFile.readOrdersData()

      const orderIndex = ordersData.findIndex((o) => o.id === Number.parseInt(id))
      if (orderIndex === -1) return null

      ordersData[orderIndex].status = status
      ordersData[orderIndex].updated_at = new Date().toISOString()

      OrderFile.writeOrdersData(ordersData)

      return OrderFile.getById(id)
    } catch (error) {
      console.error("Error updating order status:", error)
      throw error
    }
  }

  static getByStatus(status) {
    try {
      OrderFile.ensureFilesExist()
      const ordersData = OrderFile.readOrdersData()
      const itemsData = OrderFile.readOrderItemsData()

      const filtered = ordersData
        .filter((o) => o.status === status)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((order) => {
          order.items = itemsData.filter((item) => item.order_id === order.id)
          return new OrderFile(order)
        })

      return filtered
    } catch (error) {
      console.error("Error reading orders by status:", error)
      return []
    }
  }

  static getSalesStats() {
    try {
      OrderFile.ensureFilesExist()
      const ordersData = OrderFile.readOrdersData()

      const today = new Date().toISOString().split("T")[0]
      const thisMonth = new Date().toISOString().substring(0, 7)

      const todayOrders = ordersData.filter(
        (o) => o.created_at && o.created_at.startsWith(today)
      )
      const monthOrders = ordersData.filter(
        (o) => o.created_at && o.created_at.startsWith(thisMonth)
      )

      const todayStats = {
        total_orders: todayOrders.length,
        total_revenue: todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        average_order_value:
          todayOrders.length > 0
            ? todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / todayOrders.length
            : 0,
      }

      const monthStats = {
        total_orders: monthOrders.length,
        total_revenue: monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      }

      return {
        today: todayStats,
        month: monthStats,
      }
    } catch (error) {
      console.error("Error getting sales stats:", error)
      return {
        today: { total_orders: 0, total_revenue: 0, average_order_value: 0 },
        month: { total_orders: 0, total_revenue: 0 },
      }
    }
  }

  static isMemoryOnly() {
    return useMemoryOnly
  }

  static getStorageInfo() {
    return {
      mode: useMemoryOnly ? "memory" : "file",
      ordersFile: ORDERS_FILE,
      orderItemsFile: ORDER_ITEMS_FILE,
      memoryByDefault,
    }
  }
}

module.exports = OrderFile

