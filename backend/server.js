const express = require("express")
const cors = require("cors")
const path = require("path")
const fs = require("fs")

// Import routes
const menuRoutes = require("./routes/menuRoutes")
const orderRoutes = require("./routes/orderRoutes")
const aiRoutes = require("./routes/aiRoutes")
const OrderFile = require("./models/OrderFile")

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
  process.env.RENDER_EXTERNAL_URL,
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.onrender\.com$/
].filter(Boolean)

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

// Serve frontend files (for both local and production)
const frontendPath = path.join(__dirname, "../frontend")
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath))
}

// File storage initialization (no MySQL needed)
function initializeFileStorage() {
  const storageInfo = OrderFile.getStorageInfo()
  // Silently initialize storage - no console output needed
}

// API Routes
app.use("/api/menu", menuRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/ai", aiRoutes)

// Storage info endpoint
app.get("/api/storage-info", (req, res) => {
  const storageInfo = OrderFile.getStorageInfo()

  res.json({
    success: true,
    storage: storageInfo.mode,
    ordersFile: storageInfo.ordersFile,
    orderItemsFile: storageInfo.orderItemsFile,
    memoryByDefault: storageInfo.memoryByDefault,
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

// Serve frontend index page
// This route must be defined before the 404 handler
app.get("/", (req, res) => {
  try {
    const indexPath = path.join(__dirname, "../frontend", "index.html")
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath)
    }
  } catch (error) {
    console.error("Error serving frontend:", error)
  }
  
  // Return API info if frontend not found
  res.json({
    message: "Restaurant API is running",
    status: "online",
    api: {
      health: "/api/health",
      menu: "/api/menu",
      orders: "/api/orders",
      storageInfo: "/api/storage-info"
    }
  })
})

// Serve admin page
app.get("/admin", (req, res) => {
  const adminPath = path.join(__dirname, "../frontend", "admin.html")
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath)
  } else {
    res.status(404).json({
      error: "Admin panel not found"
    })
  }
})

// Redirect admin.html to /admin
app.get("/admin.html", (req, res) => {
  res.redirect("/admin")
})

// Error handling middleware (must be before 404 handler)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  })
})

// Handle frontend routes (SPA) - serve index.html for non-API routes
app.get("*", (req, res, next) => {
  // Skip if it's an API route
  if (req.path.startsWith("/api")) {
    return next()
  }
  
  // Skip if it's admin route (already handled)
  if (req.path === "/admin" || req.path === "/admin.html") {
    return next()
  }
  
  // Serve index.html for all other routes (frontend SPA routing)
  const indexPath = path.join(__dirname, "../frontend", "index.html")
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath)
  }
  
  next()
})

// Handle 404 - must be last
app.use("*", (req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    message: "The requested route does not exist",
    availableRoutes: {
      root: "/",
      admin: "/admin",
      health: "/api/health",
      menu: "/api/menu",
      orders: "/api/orders",
      storageInfo: "/api/storage-info"
    }
  })
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
    console.log(`\n✅ Server running on port ${PORT}\n`)
    console.log(`👥 User: http://localhost:${PORT}`)
    console.log(`🔐 Admin: http://localhost:${PORT}/admin\n`)
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
