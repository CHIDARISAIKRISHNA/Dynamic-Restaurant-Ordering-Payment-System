const express = require("express")
const cors = require("cors")
const path = require("path")
const database = require("./config/database")
const { createTables } = require("./migrations/001_create_tables")
const { seedData } = require("./migrations/002_seed_data")

// Import routes
const menuRoutes = require("./routes/menuRoutes")
const orderRoutes = require("./routes/orderRoutes")

const app = express()
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "../frontend")))

// Initialize database
async function initializeDatabase() {
  try {
    await database.connect()
    await createTables()
    await seedData()
    console.log("Database initialized successfully!")
  } catch (error) {
    console.error("Failed to initialize database:", error)
    process.exit(1)
  }
}

// API Routes
app.use("/api/menu", menuRoutes)
app.use("/api/orders", orderRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Restaurant API is running",
    timestamp: new Date().toISOString(),
  })
})

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"))
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  })
})

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down server...")
  await database.close()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log("\nShutting down server...")
  await database.close()
  process.exit(0)
})

// Start server
async function startServer() {
  await initializeDatabase()

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`API endpoints available at http://localhost:${PORT}/api`)
  })
}

startServer().catch((error) => {
  console.error("Failed to start server:", error)
  process.exit(1)
})
