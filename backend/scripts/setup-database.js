const database = require("../config/database")
const { createTables } = require("../migrations/001_create_tables")
const { seedData } = require("../migrations/002_seed_data")

async function setupDatabase() {
  try {
    console.log("Setting up database...")

    await database.connect()
    await createTables()
    await seedData()

    console.log("Database setup completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Database setup failed:", error)
    process.exit(1)
  }
}

setupDatabase()
