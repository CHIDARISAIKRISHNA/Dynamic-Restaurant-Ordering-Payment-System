const database = require("../config/database")

async function seedData() {
  try {
    console.log("Seeding database with initial data...")

    // Check if data already exists
    const existingItems = await database.get("SELECT COUNT(*) as count FROM menu_items")
    if (existingItems.count > 0) {
      console.log("Data already exists, skipping seed...")
      return
    }

    // Seed menu items
    const menuItems = [
      // Breakfast
      {
        name: "Idli",
        description: "Steamed rice cakes served with sambar and chutney",
        price: 30,
        category: "breakfast",
      },
      {
        name: "Dosa",
        description: "Crispy rice pancake served with sambar and chutney",
        price: 25,
        category: "breakfast",
      },
      { name: "Poha", description: "Flattened rice dish with vegetables and spices", price: 40, category: "breakfast" },
      { name: "Upma", description: "Semolina breakfast dish with vegetables", price: 30, category: "breakfast" },
      { name: "Vada", description: "Deep fried lentil donuts served with chutney", price: 20, category: "breakfast" },
      { name: "Puri", description: "Deep fried bread served with curry", price: 40, category: "breakfast" },

      // Lunch
      {
        name: "Meals",
        description: "Traditional South Indian meals with rice, curry, and sides",
        price: 100,
        category: "lunch",
      },
      {
        name: "Egg Biryani",
        description: "Fragrant basmati rice cooked with eggs and spices",
        price: 125,
        category: "lunch",
      },
      {
        name: "Chicken Biryani",
        description: "Aromatic chicken biryani with basmati rice",
        price: 150,
        category: "lunch",
      },
      {
        name: "Egg Fried Rice",
        description: "Stir-fried rice with eggs and vegetables",
        price: 110,
        category: "lunch",
      },
      {
        name: "Chicken Fried Rice",
        description: "Stir-fried rice with chicken and vegetables",
        price: 120,
        category: "lunch",
      },
      {
        name: "Mushroom Biryani",
        description: "Vegetarian biryani with fresh mushrooms",
        price: 170,
        category: "lunch",
      },

      // Snacks
      {
        name: "Bhel Puri",
        description: "Puffed rice snack with chutneys and vegetables",
        price: 30,
        category: "snacks",
      },
      { name: "Samosa", description: "Deep fried pastry filled with spiced potatoes", price: 25, category: "snacks" },
      { name: "Pani Puri", description: "Water filled crispy shells with spiced water", price: 40, category: "snacks" },

      // Dinner
      {
        name: "Gobi Manchurian",
        description: "Indo-Chinese cauliflower dish in spicy sauce",
        price: 60,
        category: "dinner",
      },
      {
        name: "Mattar Paneer",
        description: "Peas and cottage cheese curry with spices",
        price: 75,
        category: "dinner",
      },
      { name: "Roti+Curry", description: "Flatbread served with vegetable curry", price: 85, category: "dinner" },
      { name: "Butter Naan+Curry", description: "Butter naan bread with rich curry", price: 95, category: "dinner" },

      // Beverages
      { name: "Lemonade", description: "Fresh lemon drink with mint and sugar", price: 15, category: "beverages" },
      { name: "Apple Juice", description: "Fresh apple juice without preservatives", price: 40, category: "beverages" },
      {
        name: "Grape Juice",
        description: "Fresh grape juice with natural sweetness",
        price: 50,
        category: "beverages",
      },
      { name: "Sprite", description: "Lemon-lime flavored carbonated soft drink", price: 20, category: "beverages" },
      {
        name: "Chocolate Milkshake",
        description: "Rich chocolate milkshake with ice cream",
        price: 70,
        category: "beverages",
      },

      // Ice Creams
      {
        name: "Vanilla",
        description: "Classic vanilla ice cream with natural flavor",
        price: 20,
        category: "icecreams",
      },
      {
        name: "Strawberry",
        description: "Fresh strawberry ice cream with fruit pieces",
        price: 40,
        category: "icecreams",
      },
      {
        name: "Butter Scotch",
        description: "Butterscotch flavored ice cream with caramel",
        price: 30,
        category: "icecreams",
      },
      {
        name: "Mint Chocolate Chip",
        description: "Mint ice cream with chocolate chips",
        price: 45,
        category: "icecreams",
      },
    ]

    // Insert menu items
    for (const item of menuItems) {
      await database.run("INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)", [
        item.name,
        item.description,
        item.price,
        item.category,
      ])
    }

    console.log(`Seeded ${menuItems.length} menu items successfully!`)
  } catch (error) {
    console.error("Error seeding data:", error)
    throw error
  }
}

module.exports = { seedData }
