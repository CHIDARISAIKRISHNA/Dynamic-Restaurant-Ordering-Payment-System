const OrderFile = require("../models/OrderFile")

/**
 * AI-Powered Order Tracking Service
 * Analyzes order patterns and provides intelligent predictions
 */
class AIOrderTracking {
  constructor() {
    this.statusFlow = ["pending", "confirmed", "preparing", "ready", "delivered"]
    this.statusTimes = {
      pending: { min: 0, max: 5 }, // minutes
      confirmed: { min: 2, max: 10 },
      preparing: { min: 10, max: 30 },
      ready: { min: 5, max: 15 },
      delivered: { min: 0, max: 0 }
    }
  }

  /**
   * Analyze historical order data to predict average times
   */
  analyzeHistoricalData(orders) {
    const statusTransitions = {}
    const orderComplexity = {}

    orders.forEach(order => {
      if (!order.created_at || !order.updated_at) return

      const created = new Date(order.created_at)
      const updated = new Date(order.updated_at)
      const timeDiff = (updated - created) / (1000 * 60) // minutes

      // Track status transitions
      if (!statusTransitions[order.status]) {
        statusTransitions[order.status] = []
      }
      statusTransitions[order.status].push(timeDiff)

      // Calculate order complexity based on items
      if (order.items && order.items.length > 0) {
        const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        orderComplexity[order.id] = {
          itemCount: totalItems,
          uniqueItems: order.items.length,
          totalAmount: order.total_amount || 0
        }
      }
    })

    // Calculate averages
    const averages = {}
    Object.keys(statusTransitions).forEach(status => {
      const times = statusTransitions[status]
      if (times.length > 0) {
        averages[status] = {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length
        }
      }
    })

    return { averages, orderComplexity }
  }

  /**
   * Predict next status for an order based on current status and time elapsed
   */
  predictNextStatus(order) {
    if (!order) return null

    const currentStatus = order.status || "pending"
    const created = new Date(order.created_at)
    const now = new Date()
    const elapsedMinutes = (now - created) / (1000 * 60)

    // Get historical data
    const allOrders = OrderFile.getAll(1000)
    const { averages } = this.analyzeHistoricalData(allOrders)

    // Determine next status in flow
    const currentIndex = this.statusFlow.indexOf(currentStatus)
    if (currentIndex === -1 || currentIndex >= this.statusFlow.length - 1) {
      return null // Already at final status
    }

    const nextStatus = this.statusFlow[currentIndex + 1]
    const expectedTime = averages[nextStatus]?.avg || this.statusTimes[nextStatus]?.min || 10

    // Calculate confidence based on elapsed time
    let confidence = 0.5
    if (elapsedMinutes >= expectedTime * 0.8) {
      confidence = Math.min(0.95, 0.5 + (elapsedMinutes / expectedTime) * 0.3)
    }

    return {
      suggestedStatus: nextStatus,
      confidence: Math.round(confidence * 100),
      elapsedMinutes: Math.round(elapsedMinutes),
      expectedMinutes: Math.round(expectedTime),
      reason: this.generateReason(order, currentStatus, nextStatus, elapsedMinutes, expectedTime)
    }
  }

  /**
   * Generate human-readable reason for status suggestion
   */
  generateReason(order, currentStatus, nextStatus, elapsed, expected) {
    const reasons = {
      pending: {
        confirmed: elapsed >= 3 
          ? "Order has been pending for a while. Consider confirming it."
          : "Order is new. You can confirm it when ready."
      },
      confirmed: {
        preparing: elapsed >= 5
          ? "Order confirmed. Kitchen should start preparing now."
          : "Order confirmed. Ready to move to preparation."
      },
      preparing: {
        ready: elapsed >= 15
          ? "Order has been preparing for a while. Should be ready soon."
          : "Order is being prepared. Monitor progress."
      },
      ready: {
        delivered: elapsed >= 5
          ? "Order is ready and waiting. Should be delivered soon."
          : "Order is ready for delivery."
      }
    }

    return reasons[currentStatus]?.[nextStatus] || `Time to move from ${currentStatus} to ${nextStatus}`
  }

  /**
   * Get AI-powered order insights
   */
  getOrderInsights(orderId) {
    const order = OrderFile.getById(orderId)
    if (!order) return null

    const prediction = this.predictNextStatus(order)
    const allOrders = OrderFile.getAll(1000)
    const { averages, orderComplexity } = this.analyzeHistoricalData(allOrders)

    // Calculate estimated delivery time
    const created = new Date(order.created_at)
    const now = new Date()
    const elapsed = (now - created) / (1000 * 60)

    let estimatedDelivery = null
    if (order.status !== "delivered" && order.status !== "cancelled") {
      const remainingStatuses = this.statusFlow.slice(this.statusFlow.indexOf(order.status) + 1)
      let totalRemaining = 0

      remainingStatuses.forEach(status => {
        const avgTime = averages[status]?.avg || this.statusTimes[status]?.min || 10
        totalRemaining += avgTime
      })

      estimatedDelivery = new Date(now.getTime() + totalRemaining * 60 * 1000)
    }

    // Order complexity analysis
    const complexity = orderComplexity[order.id] || {}
    let complexityLevel = "normal"
    if (complexity.itemCount > 10 || complexity.uniqueItems > 5) {
      complexityLevel = "high"
    } else if (complexity.itemCount < 3 && complexity.uniqueItems < 2) {
      complexityLevel = "low"
    }

    return {
      orderId: order.id,
      currentStatus: order.status,
      elapsedMinutes: Math.round(elapsed),
      prediction,
      estimatedDelivery: estimatedDelivery ? estimatedDelivery.toISOString() : null,
      complexityLevel,
      itemCount: complexity.itemCount || 0,
      insights: this.generateInsights(order, elapsed, complexityLevel)
    }
  }

  /**
   * Generate actionable insights for an order
   */
  generateInsights(order, elapsedMinutes, complexity) {
    const insights = []

    if (order.status === "pending" && elapsedMinutes > 10) {
      insights.push({
        type: "warning",
        message: "Order has been pending for over 10 minutes. Consider confirming soon.",
        priority: "high"
      })
    }

    if (order.status === "preparing" && elapsedMinutes > 30) {
      insights.push({
        type: "warning",
        message: "Order has been preparing for over 30 minutes. Check kitchen status.",
        priority: "high"
      })
    }

    if (complexity === "high") {
      insights.push({
        type: "info",
        message: "This is a complex order with multiple items. May take longer to prepare.",
        priority: "medium"
      })
    }

    if (order.status === "ready" && elapsedMinutes > 15) {
      insights.push({
        type: "warning",
        message: "Order is ready but not yet delivered. Expedite delivery.",
        priority: "high"
      })
    }

    return insights
  }

  /**
   * AI Chatbot response for order tracking queries
   */
  handleChatbotQuery(query, orderId = null) {
    const lowerQuery = query.toLowerCase()

    // Extract order ID from query if not provided
    if (!orderId) {
      const idMatch = query.match(/order\s*(?:#|number)?\s*(\d+)/i)
      if (idMatch) {
        orderId = parseInt(idMatch[1])
      }
    }

    // Handle different query types
    if (lowerQuery.includes("status") || lowerQuery.includes("where") || lowerQuery.includes("track")) {
      if (!orderId) {
        return {
          response: "I can help you track your order! Please provide your order number. For example: 'Track order #123' or 'What's the status of order 123?'",
          needsOrderId: true
        }
      }

      const order = OrderFile.getById(orderId)
      if (!order) {
        return {
          response: `I couldn't find order #${orderId}. Please check your order number and try again.`,
          needsOrderId: false
        }
      }

      const insights = this.getOrderInsights(orderId)
      const statusMessages = {
        pending: "Your order is pending confirmation.",
        confirmed: "Your order has been confirmed and will be prepared soon!",
        preparing: "Your order is currently being prepared in our kitchen.",
        ready: "Great news! Your order is ready for pickup/delivery.",
        delivered: "Your order has been delivered! Enjoy your meal!",
        cancelled: "This order has been cancelled."
      }

      let response = `Order #${orderId} is currently: **${order.status.toUpperCase()}**\n\n`
      response += statusMessages[order.status] || "Your order status is being updated."

      if (insights?.estimatedDelivery && order.status !== "delivered" && order.status !== "cancelled") {
        const deliveryTime = new Date(insights.estimatedDelivery)
        response += `\n\nEstimated delivery time: ${deliveryTime.toLocaleTimeString()}`
      }

      if (insights?.prediction) {
        response += `\n\n💡 AI Insight: ${insights.prediction.reason}`
      }

      return { response, needsOrderId: false, orderData: order }
    }

    if (lowerQuery.includes("time") || lowerQuery.includes("when") || lowerQuery.includes("how long")) {
      if (!orderId) {
        return {
          response: "To check delivery time, please provide your order number.",
          needsOrderId: true
        }
      }

      const insights = this.getOrderInsights(orderId)
      if (!insights) {
        return {
          response: `I couldn't find order #${orderId}. Please check your order number.`,
          needsOrderId: false
        }
      }

      if (insights.estimatedDelivery) {
        const deliveryTime = new Date(insights.estimatedDelivery)
        const now = new Date()
        const minutesLeft = Math.round((deliveryTime - now) / (1000 * 60))

        if (minutesLeft > 0) {
          return {
            response: `Based on current status, your order should be ready in approximately ${minutesLeft} minutes (around ${deliveryTime.toLocaleTimeString()}).`,
            needsOrderId: false
          }
        } else {
          return {
            response: "Your order should be ready very soon! Please check with the restaurant for exact timing.",
            needsOrderId: false
          }
        }
      }

      return {
        response: "I'm calculating the estimated delivery time based on your order status. Please wait a moment.",
        needsOrderId: false
      }
    }

    if (lowerQuery.includes("help") || lowerQuery.includes("what can")) {
      return {
        response: "I can help you with:\n\n" +
          "• Track your order status\n" +
          "• Check estimated delivery time\n" +
          "• Get order updates\n\n" +
          "Just ask me like:\n" +
          "- 'Track order #123'\n" +
          "- 'What's the status of order 123?'\n" +
          "- 'When will order 123 be ready?'",
        needsOrderId: false
      }
    }

    // Default response
    return {
      response: "I'm here to help you track your order! You can ask me:\n\n" +
        "• 'Track order #123' - to check order status\n" +
        "• 'When will order 123 be ready?' - for delivery time\n" +
        "• 'Help' - for more options",
      needsOrderId: false
    }
  }

  /**
   * Get AI recommendations for all active orders
   */
  getRecommendations(limit = 10) {
    const allOrders = OrderFile.getAll(1000)
    const activeOrders = allOrders.filter(
      o => o.status !== "delivered" && o.status !== "cancelled"
    )

    const recommendations = activeOrders
      .map(order => {
        const prediction = this.predictNextStatus(order)
        if (!prediction || prediction.confidence < 50) return null

        return {
          orderId: order.id,
          customerName: order.customer_name,
          currentStatus: order.status,
          recommendedAction: `Move to ${prediction.suggestedStatus}`,
          confidence: prediction.confidence,
          reason: prediction.reason,
          elapsedMinutes: prediction.elapsedMinutes
        }
      })
      .filter(r => r !== null)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)

    return recommendations
  }
}

module.exports = new AIOrderTracking()

