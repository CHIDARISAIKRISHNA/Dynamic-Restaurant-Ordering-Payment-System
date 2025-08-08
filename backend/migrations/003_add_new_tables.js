const database = require("../config/database")

async function addNewTables() {
  try {
    console.log("Adding new tables for enhanced features...")

    // Create bookings table
    await database.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(255),
        guests INTEGER NOT NULL,
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        occasion VARCHAR(100),
        special_requests TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create reviews table
    await database.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name VARCHAR(255) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create contacts table
    await database.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create newsletter table
    await database.run(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Add indexes
    await database.run("CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date)")
    await database.run("CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)")
    await database.run("CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)")
    await database.run("CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)")

    console.log("New tables added successfully!")
  } catch (error) {
    console.error("Error adding new tables:", error)
    throw error
  }
}

module.exports = { addNewTables }
