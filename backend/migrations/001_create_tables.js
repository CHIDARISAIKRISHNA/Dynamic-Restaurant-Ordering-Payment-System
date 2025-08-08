const database = require("../config/database")

async function createTables() {
  try {
    console.log("Creating database tables...")

    // Create menu_items table
    await database.run(`
            CREATE TABLE IF NOT EXISTS menu_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(100) NOT NULL,
                image_url VARCHAR(500),
                is_available BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

    // Create orders table
    await database.run(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name VARCHAR(255) DEFAULT 'Guest',
                customer_phone VARCHAR(20),
                total_amount DECIMAL(10,2) NOT NULL,
                tax_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                payment_mode VARCHAR(50) DEFAULT 'cash',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

    // Create order_items table
    await database.run(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                menu_item_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
            )
        `)

    // Create indexes for better performance
    await database.run("CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category)")
    await database.run("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)")
    await database.run("CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)")
    await database.run("CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)")

    console.log("Database tables created successfully!")
  } catch (error) {
    console.error("Error creating tables:", error)
    throw error
  }
}

module.exports = { createTables }
