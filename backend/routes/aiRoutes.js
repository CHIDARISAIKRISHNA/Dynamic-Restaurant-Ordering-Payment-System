const express = require("express")
const aiOrderTracking = require("../services/aiOrderTracking")
const router = express.Router()

/**
 * Get AI-powered order insights
 * GET /api/ai/orders/:id/insights
 */
router.get("/orders/:id/insights", (req, res) => {
  try {
    const { id } = req.params
    const insights = aiOrderTracking.getOrderInsights(id)

    if (!insights) {
      return res.status(404).json({ error: "Order not found" })
    }

    res.json({
      success: true,
      insights
    })
  } catch (error) {
    console.error("Error getting AI insights:", error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get AI recommendations for order status updates
 * GET /api/ai/recommendations
 */
router.get("/recommendations", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const recommendations = aiOrderTracking.getRecommendations(limit)

    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    })
  } catch (error) {
    console.error("Error getting AI recommendations:", error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * AI Chatbot endpoint for order tracking
 * POST /api/ai/chatbot
 */
router.post("/chatbot", (req, res) => {
  try {
    const { query, orderId } = req.body

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query is required" })
    }

    const response = aiOrderTracking.handleChatbotQuery(query, orderId)

    res.json({
      success: true,
      ...response
    })
  } catch (error) {
    console.error("Error processing chatbot query:", error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Predict next status for an order
 * GET /api/ai/orders/:id/predict
 */
router.get("/orders/:id/predict", (req, res) => {
  try {
    const { id } = req.params
    const OrderFile = require("../models/OrderFile")
    const order = OrderFile.getById(id)

    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }

    const prediction = aiOrderTracking.predictNextStatus(order)

    if (!prediction) {
      return res.json({
        success: true,
        message: "Order is already at final status",
        currentStatus: order.status
      })
    }

    res.json({
      success: true,
      prediction
    })
  } catch (error) {
    console.error("Error predicting order status:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router

