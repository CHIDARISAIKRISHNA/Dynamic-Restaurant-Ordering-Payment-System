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
// CORS configuration - Update with your Netlify URL after deployment
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL, // Set this in Render environment variables
  'https://*.netlify.app' // Allows all Netlify deployments
]

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list or matches Netlify pattern
    if (allowedOrigins.some(allowed => {
      if (allowed && allowed.includes('*')) {
        return origin.includes(allowed.replace('*.', ''))
      }
      return origin === allowed
    })) {
      callback(null, true)
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  credentials: true
}))
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

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`API endpoints available at http://localhost:${PORT}/api`)
  })

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use!`)
      console.error(`\nTo fix this, you can:`)
      console.error(`  1. Stop the process using port ${PORT}`)
      console.error(`  2. Use a different port: PORT=3001 npm start`)
      console.error(`  3. On Windows, find and kill the process:`)
      console.error(`     Get-NetTCPConnection -LocalPort ${PORT} | Select-Object OwningProcess`)
      console.error(`     Stop-Process -Id <PID> -Force\n`)
      process.exit(1)
    } else {
      throw error
    }
  })
}

startServer().catch((error) => {
  console.error("Failed to start server:", error)
  process.exit(1)
})
