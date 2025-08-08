const sqlite3 = require("sqlite3").verbose()
const path = require("path")

// Database configuration
const DB_PATH = path.join(__dirname, "../data/restaurant.db")

class Database {
  constructor() {
    this.db = null
  }

  // Initialize database connection
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error("Error opening database:", err.message)
          reject(err)
        } else {
          // console.log("Connected to SQLite database")
          resolve()
        }
      })
    })
  }

  // Close database connection
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err)
          } else {
            console.log("Database connection closed")
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
  }

  // Execute query
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id: this.lastID, changes: this.changes })
        }
      })
    })
  }

  // Get single row
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
  }

  // Get multiple rows
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }
}

// Create singleton instance
const database = new Database()

module.exports = database
