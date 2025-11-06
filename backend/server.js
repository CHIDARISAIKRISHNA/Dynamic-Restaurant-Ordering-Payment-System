const express = require("express")
const cors = require("cors")
const path = require("path")
const fs = require("fs")

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
  process.env.FRONTEND_URL,
  /^https:\/\/.*\.netlify\.app$/ // All Netlify deployments
]

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list or matches pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin)
      }
      if (typeof allowed === 'string' && allowed.includes('*')) {
        return origin.includes(allowed.replace('*.', ''))
      }
      return origin === allowed
    })
    
    if (isAllowed) {
      callback(null, true)
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        console.log('CORS blocked origin:', origin)
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  credentials: true
}))
app.use(express.json())

// Serve frontend files if they exist (for local development)
// In production, frontend will be on Netlify
const frontendPath = path.join(__dirname, "../frontend")
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath))
}

// File storage initialization (no MySQL needed)
function initializeFileStorage() {
  console.log("📁 Using file storage (JSON files) - no MySQL needed")
  console.log("   Orders will be saved to: backend/data/orders.json")
  console.log("   Admin can update order status - all saved to files!")
}

// API Routes
app.use("/api/menu", menuRoutes)
app.use("/api/orders", orderRoutes)

// Storage info endpoint
app.get("/api/storage-info", (req, res) => {
  res.json({
    success: true,
    message: "📁 Using file storage (JSON files)",
    storage: "file",
    files: ["backend/data/orders.json", "backend/data/order_items.json"]
  })
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Restaurant API is running",
    timestamp: new Date().toISOString(),
  })
})

// Serve frontend (if exists - for local dev only)
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "../frontend", "index.html")
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.json({
      message: "Restaurant API is running",
      note: "Frontend is deployed separately on Netlify",
      api: {
        health: "/api/health",
        menu: "/api/menu",
        orders: "/api/orders",
        storageInfo: "/api/storage-info"
      }
    })
  }
})

// Serve admin page (if exists - for local dev only)
app.get("/admin", (req, res) => {
  const adminPath = path.join(__dirname, "../frontend", "admin.html")
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath)
  } else {
    res.json({
      message: "Admin panel not available on backend",
      note: "Admin panel is deployed on Netlify at /admin route"
    })
  }
})

// Redirect admin.html to /admin
app.get("/admin.html", (req, res) => {
  res.redirect("/admin")
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  })
})

// Redirect admin.html to /admin (before 404 handler)
app.get("/admin.html", (req, res) => {
  res.redirect("/admin")
})

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down server...")
  process.exit(0)
})

process.on("SIGTERM", () => {
  console.log("\nShutting down server...")
  process.exit(0)
})

// Start server
function startServer() {
  // Initialize file storage
  initializeFileStorage()

  const server = app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`)
    console.log(`✅ API endpoints available at http://localhost:${PORT}/api`)
    console.log(`✅ Frontend: http://localhost:${PORT}`)
    console.log(`✅ Admin: http://localhost:${PORT}/admin`)
    console.log(`\n💡 Using file storage - orders saved to JSON files (no MySQL needed!)\n`)
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

startServer()
