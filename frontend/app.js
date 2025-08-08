// API Configuration
const API_BASE_URL = "http://localhost:3000/api"

// Global variables
let menuItems = {}
let currentOrder = null
let currentSection = "welcome"
let allOrders = []
let orderItems = []
let currentTotal = 0

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
  showWelcomeAnimations()
})

// Initialize application
function initializeApp() {
  // Show welcome section by default
  showSection("welcome")
  loadMenuData()
  loadRecentOrders()
  loadSalesStats()
  animateStats()
}

// Setup event listeners
function setupEventListeners() {
  // Navigation toggle
  const navToggle = document.getElementById("nav-toggle")
  const navMenu = document.getElementById("nav-menu")

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active")
      navToggle.classList.toggle("active")
    })

    // Close nav menu when clicking on links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active")
        navToggle.classList.remove("active")
      })
    })
  }

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("receipt-modal")
    if (event.target === modal) {
      closeReceiptModal()
    }
  })

  // Keyboard shortcuts
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeReceiptModal()
    }
  })
}

// Show welcome animations
function showWelcomeAnimations() {
  const heroText = document.querySelector(".hero-text")
  const heroImage = document.querySelector(".hero-image")

  if (heroText) heroText.classList.add("animate-slide-left")
  if (heroImage) heroImage.classList.add("animate-slide-right")
}

// Animate statistics counters
function animateStats() {
  const statNumbers = document.querySelectorAll(".stat-number")

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = Number.parseInt(entry.target.getAttribute("data-target"))
        animateCounter(entry.target, target)
        observer.unobserve(entry.target)
      }
    })
  })

  statNumbers.forEach((stat) => observer.observe(stat))
}

// Counter animation
function animateCounter(element, target) {
  let current = 0
  const increment = target / 100
  const timer = setInterval(() => {
    current += increment
    element.textContent = Math.floor(current)

    if (current >= target) {
      element.textContent = target
      clearInterval(timer)
    }
  }, 20)
}

// Section navigation
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active")
  })

  // Show selected section
  const targetSection = document.getElementById(`${sectionName}-section`)
  if (targetSection) {
    targetSection.classList.add("active")
    currentSection = sectionName

    // Add animation
    targetSection.classList.add("animate-fade-in")
    setTimeout(() => {
      targetSection.classList.remove("animate-fade-in")
    }, 600)
  }

  // Update navigation
  updateNavigation(sectionName)

  // Load section-specific data
  if (sectionName === "menu") {
    loadMenuData()
  }
}

// Update navigation active state
function updateNavigation(activeSection) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active")
  })

  const activeLink = document.querySelector(`[onclick="showSection('${activeSection}')"]`)
  if (activeLink) {
    activeLink.classList.add("active")
  }
}

// Load menu data from backend
async function loadMenuData() {
  try {
    showLoading(true)
    const response = await fetch(`${API_BASE_URL}/menu`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    menuItems = await response.json()
    showLoading(false)

    // Show breakfast menu by default if available
    const categories = Object.keys(menuItems)
    if (categories.length > 0) {
      showMenu(categories[0])
    }
  } catch (error) {
    console.error("Error loading menu:", error)
    showLoading(false)
    showError("Failed to load menu. Please check if the server is running.")
  }
}

// Show/hide loading indicator
function showLoading(show) {
  const loadingElement = document.getElementById("loading")
  const menuButtons = document.getElementById("menu-buttons")
  const errorMessage = document.getElementById("error-message")

  if (show) {
    if (loadingElement) loadingElement.style.display = "block"
    if (menuButtons) menuButtons.style.display = "none"
    if (errorMessage) errorMessage.style.display = "none"
  } else {
    if (loadingElement) loadingElement.style.display = "none"
    if (menuButtons) menuButtons.style.display = "grid"
  }
}

// Show error message
function showError(message) {
  const errorElement = document.getElementById("error-message")
  const menuContent = document.getElementById("menu-content")

  if (errorElement) {
    errorElement.textContent = message
    errorElement.style.display = "block"
  }

  if (menuContent) {
    menuContent.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">${message}</div>`
  }
}

// Show menu items for a specific category
function showMenu(category) {
  const menuContent = document.getElementById("menu-content")
  if (!menuContent) return

  menuContent.innerHTML = ""

  // Update active button
  const buttons = document.querySelectorAll(".category-btn")
  buttons.forEach((btn) => btn.classList.remove("active"))

  const activeButton = document.querySelector(`[data-category="${category}"]`)
  if (activeButton) {
    activeButton.classList.add("active")
  }

  if (!menuItems[category]) {
    showError("Menu category not found")
    return
  }

  const items = menuItems[category]
  if (items.length === 0) {
    menuContent.innerHTML =
      '<div style="text-align: center; padding: 20px; color: #666;">No items available in this category.</div>'
    return
  }

  items.forEach((item) => {
    const itemElement = document.createElement("div")
    itemElement.className = "menu-item"
    itemElement.innerHTML = `
      <div class="item-info">
        <h4 class="item-name">${item.name}</h4>
        <p class="item-description">${item.description || ""}</p>
      </div>
      <div class="item-price">₹${Number.parseFloat(item.price).toFixed(2)}</div>
      <div class="item-quantity">
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
          <input type="number" 
                 id="quantity-${item.id}" 
                 class="quantity-input"
                 value="0" 
                 min="0" 
                 max="10"
                 onchange="updateItemQuantity(${item.id}, this.value)">
          <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
        </div>
      </div>
    `
    menuContent.appendChild(itemElement)
  })

  const calculateButton = document.getElementById("calculate-button")
  if (calculateButton) {
    calculateButton.style.display = "block"
  }

  updateOrderSummary()
}

// Update quantity with buttons
function updateQuantity(itemId, change) {
  const quantityInput = document.getElementById(`quantity-${itemId}`)
  if (quantityInput) {
    const currentValue = Number.parseInt(quantityInput.value) || 0
    const newValue = Math.max(0, Math.min(10, currentValue + change))
    quantityInput.value = newValue
    updateItemQuantity(itemId, newValue)
  }
}

// Update item quantity
function updateItemQuantity(itemId, quantity) {
  quantity = Math.max(0, Math.min(10, Number.parseInt(quantity) || 0))

  // Update the input field
  const quantityInput = document.getElementById(`quantity-${itemId}`)
  if (quantityInput) {
    quantityInput.value = quantity
  }

  updateOrderSummary()
}

// Update order summary in sidebar
function updateOrderSummary() {
  const orderSummary = document.getElementById("order-summary")
  const orderItemsContainer = document.getElementById("order-items")
  const subtotalElement = document.getElementById("subtotal")
  const taxAmountElement = document.getElementById("tax-amount")
  const finalTotalElement = document.getElementById("final-total")

  if (!orderSummary || !orderItemsContainer) return

  orderItems = []
  let subtotal = 0

  // Get all menu items from all categories
  const allItems = Object.values(menuItems).flat()

  allItems.forEach((item) => {
    const quantityInput = document.getElementById(`quantity-${item.id}`)
    if (quantityInput) {
      const quantity = Number.parseInt(quantityInput.value) || 0
      if (quantity > 0) {
        const total = Number.parseFloat(item.price) * quantity
        subtotal += total

        orderItems.push({
          id: item.id,
          name: item.name,
          price: Number.parseFloat(item.price),
          quantity: quantity,
          total: total,
        })
      }
    }
  })

  if (orderItems.length > 0) {
    const tax = subtotal * 0.15
    currentTotal = subtotal + tax

    // Show order summary
    orderSummary.style.display = "block"

    // Update order items display
    orderItemsContainer.innerHTML = orderItems
      .map(
        (item) => `
      <div class="order-item-summary">
        <div class="item-summary-info">
          <span class="item-summary-name">${item.name}</span>
          <span class="item-summary-qty">×${item.quantity}</span>
        </div>
        <span class="item-summary-price">₹${item.total.toFixed(2)}</span>
      </div>
    `,
      )
      .join("")

    // Update totals
    if (subtotalElement) subtotalElement.textContent = `₹${subtotal.toFixed(2)}`
    if (taxAmountElement) taxAmountElement.textContent = `₹${tax.toFixed(2)}`
    if (finalTotalElement) finalTotalElement.textContent = `₹${currentTotal.toFixed(2)}`
  } else {
    orderSummary.style.display = "none"
  }
}

// Calculate final cost and show receipt modal
function calculateFinalCost() {
  if (orderItems.length === 0) {
    alert("Please select at least one item to generate a bill.")
    return
  }

  const customerName = document.getElementById("customer-name")?.value || "Guest"
  const customerPhone = document.getElementById("customer-phone")?.value || ""

  // Store current order data
  currentOrder = {
    items: orderItems,
    subtotal: currentTotal - currentTotal * 0.15,
    tax: currentTotal * 0.15,
    total: currentTotal,
    customerInfo: {
      name: customerName,
      phone: customerPhone,
    },
  }

  // Generate receipt content
  generateReceiptContent()

  // Show receipt modal
  const modal = document.getElementById("receipt-modal")
  if (modal) {
    modal.style.display = "block"
  }
}

// Generate receipt content
function generateReceiptContent() {
  const customerDetails = document.getElementById("customer-details")
  const receiptContent = document.getElementById("receipt-content")

  if (!currentOrder) return

  // Customer details
  if (customerDetails) {
    customerDetails.innerHTML = `
      <div class="customer-info-receipt">
        <strong>Customer:</strong> ${currentOrder.customerInfo.name}<br>
        ${currentOrder.customerInfo.phone ? `<strong>Phone:</strong> ${currentOrder.customerInfo.phone}<br>` : ""}
        <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
        <strong>Time:</strong> ${new Date().toLocaleTimeString()}
      </div>
    `
  }

  // Receipt items
  if (receiptContent) {
    let receiptHTML = ""
    currentOrder.items.forEach((item) => {
      receiptHTML += `
        <div class="receipt-item">
          <span>${item.name} (${item.quantity}×)</span>
          <span>₹${item.total.toFixed(2)}</span>
        </div>
      `
    })

    receiptHTML += `
      <div class="receipt-item">
        <span>Subtotal:</span>
        <span>₹${currentOrder.subtotal.toFixed(2)}</span>
      </div>
      <div class="receipt-item">
        <span>Tax (15%):</span>
        <span>₹${currentOrder.tax.toFixed(2)}</span>
      </div>
      <div class="receipt-item receipt-total">
        <span>Total:</span>
        <span>₹${currentOrder.total.toFixed(2)}</span>
      </div>
    `

    receiptContent.innerHTML = receiptHTML
  }
}

// Close receipt modal
function closeReceiptModal() {
  const modal = document.getElementById("receipt-modal")
  if (modal) {
    modal.style.display = "none"
  }
}

// Print receipt
function printReceipt() {
  window.print()
}

// Place order to backend
async function placeOrder() {
  if (!currentOrder) {
    alert("Please generate a bill first.")
    return
  }

  const placeOrderBtn = document.querySelector(".btn-success")
  const orderStatus = document.getElementById("order-status")

  try {
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true
      placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...'
    }

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: currentOrder.items,
        customerInfo: currentOrder.customerInfo,
        totalAmount: currentOrder.total,
        tax: currentOrder.tax,
      }),
    })

    const result = await response.json()

    if (response.ok) {
      if (orderStatus) {
        orderStatus.innerHTML = `
          <div class="order-success">
            <i class="fas fa-check-circle"></i>
            Order placed successfully! Order ID: #${result.orderId}
          </div>
        `
      }

      // Clear the form after successful order
      setTimeout(() => {
        clearOrder()
        closeReceiptModal()
      }, 3000)

      // Refresh admin panel
      loadRecentOrders()
      loadSalesStats()

      // Show success notification
      showNotification("Order placed successfully!", "success")
    } else {
      throw new Error(result.error || "Failed to place order")
    }
  } catch (error) {
    console.error("Error placing order:", error)
    if (orderStatus) {
      orderStatus.innerHTML = `
        <div class="order-error">
          <i class="fas fa-exclamation-circle"></i>
          Error placing order: ${error.message}
        </div>
      `
    }
    showNotification("Failed to place order", "error")
  } finally {
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false
      placeOrderBtn.innerHTML = '<i class="fas fa-check"></i> Place Order'
    }
  }
}

// Clear current order
function clearOrder() {
  // Clear all quantity inputs
  const quantityInputs = document.querySelectorAll(".quantity-input")
  quantityInputs.forEach((input) => (input.value = "0"))

  // Clear customer info
  const customerName = document.getElementById("customer-name")
  const customerPhone = document.getElementById("customer-phone")
  if (customerName) customerName.value = ""
  if (customerPhone) customerPhone.value = ""

  // Clear order data
  orderItems = []
  currentOrder = null
  currentTotal = 0

  // Update order summary
  updateOrderSummary()
}

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <i class="fas fa-${type === "success" ? "check" : type === "error" ? "times" : "info"}-circle"></i>
    <span>${message}</span>
  `

  document.body.appendChild(notification)

  // Add styles if not already added
  if (!document.querySelector("#notification-styles")) {
    const styles = document.createElement("style")
    styles.id = "notification-styles"
    styles.textContent = `
      .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 2000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease-out;
      }
      .notification-success { background: #27ae60; }
      .notification-error { background: #e74c3c; }
      .notification-info { background: #3498db; }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(50px); }
        to { opacity: 1; transform: translateX(0); }
      }
    `
    document.head.appendChild(styles)
  }

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.remove()
  }, 3000)
}

// Admin Panel Functions
function toggleAdminPanel() {
  const adminContent = document.getElementById("admin-content")
  const toggleIcon = document.querySelector(".admin-toggle i")

  if (!adminContent || !toggleIcon) return

  if (adminContent.style.display === "none" || !adminContent.style.display) {
    adminContent.style.display = "block"
    toggleIcon.style.transform = "rotate(180deg)"
    loadRecentOrders()
    loadSalesStats()
  } else {
    adminContent.style.display = "none"
    toggleIcon.style.transform = "rotate(0deg)"
  }
}

// Show admin tab
function showAdminTab(tabName) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll(".admin-tab-content")
  tabContents.forEach((content) => (content.style.display = "none"))

  // Remove active class from all buttons
  const tabButtons = document.querySelectorAll(".admin-tab-btn")
  tabButtons.forEach((btn) => btn.classList.remove("active"))

  // Show selected tab and mark button as active
  const targetTab = document.getElementById(`admin-${tabName}`)
  if (targetTab) {
    targetTab.style.display = "block"
  }

  if (event && event.target) {
    event.target.classList.add("active")
  }

  // Load tab-specific data
  if (tabName === "orders") {
    loadRecentOrders()
  } else if (tabName === "stats") {
    loadSalesStats()
  }
}

// Load recent orders for admin panel
async function loadRecentOrders() {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`)

    if (!response.ok) {
      throw new Error("Failed to load orders")
    }

    allOrders = await response.json()
    displayOrders(allOrders)
  } catch (error) {
    console.error("Error loading orders:", error)
    const ordersList = document.getElementById("orders-list")
    if (ordersList) {
      ordersList.innerHTML = '<p style="color: red;">Failed to load orders</p>'
    }
  }
}

// Filter orders by status
function filterOrdersByStatus() {
  const statusFilter = document.getElementById("status-filter")
  if (!statusFilter) return

  const filterValue = statusFilter.value

  if (filterValue === "") {
    displayOrders(allOrders)
  } else {
    const filteredOrders = allOrders.filter((order) => order.status === filterValue)
    displayOrders(filteredOrders)
  }
}

// Display orders in admin panel
function displayOrders(orders) {
  const ordersList = document.getElementById("orders-list")
  if (!ordersList) return

  if (orders.length === 0) {
    ordersList.innerHTML = "<p>No orders found.</p>"
    return
  }

  ordersList.innerHTML = orders
    .map((order) => {
      const itemsList = order.items.map((item) => `${item.name} (${item.quantity}×)`).join(", ")

      return `
        <div class="order-item status-${order.status}">
          <h5>Order #${order.id} - ${order.customer_name}</h5>
          <p><strong>Items:</strong> ${itemsList}</p>
          <p><strong>Total:</strong> ₹${Number.parseFloat(order.total_amount).toFixed(2)} | 
             <strong>Phone:</strong> ${order.customer_phone || "N/A"}</p>
          <p><strong>Status:</strong> ${order.status} | 
             <strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
          <select onchange="updateOrderStatus(${order.id}, this.value)" value="${order.status}">
            <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="confirmed" ${order.status === "confirmed" ? "selected" : ""}>Confirmed</option>
            <option value="preparing" ${order.status === "preparing" ? "selected" : ""}>Preparing</option>
            <option value="ready" ${order.status === "ready" ? "selected" : ""}>Ready</option>
            <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Delivered</option>
            <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelled</option>
          </select>
        </div>
      `
    })
    .join("")
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    })

    if (response.ok) {
      loadRecentOrders() // Refresh the orders list
      loadSalesStats() // Refresh stats
      showNotification(`Order #${orderId} status updated to ${newStatus}`, "success")
    } else {
      const error = await response.json()
      throw new Error(error.error || "Failed to update order status")
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    showNotification("Failed to update order status", "error")
  }
}

// Load sales statistics
async function loadSalesStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/stats/sales`)

    if (!response.ok) {
      throw new Error("Failed to load sales stats")
    }

    const stats = await response.json()
    displaySalesStats(stats)
  } catch (error) {
    console.error("Error loading sales stats:", error)
    const statsContent = document.getElementById("stats-content")
    if (statsContent) {
      statsContent.innerHTML = '<p style="color: red;">Failed to load statistics</p>'
    }
  }
}

// Display sales statistics
function displaySalesStats(stats) {
  const statsContent = document.getElementById("stats-content")
  if (!statsContent) return

  statsContent.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h4><i class="fas fa-calendar-day"></i> Today's Sales</h4>
        <p><strong>Orders:</strong> ${stats.today.total_orders || 0}</p>
        <p><strong>Revenue:</strong> ₹${Number.parseFloat(stats.today.total_revenue || 0).toFixed(2)}</p>
        <p><strong>Avg Order:</strong> ₹${Number.parseFloat(stats.today.average_order_value || 0).toFixed(2)}</p>
      </div>
      <div class="stat-card">
        <h4><i class="fas fa-calendar-alt"></i> This Month</h4>
        <p><strong>Orders:</strong> ${stats.month.total_orders || 0}</p>
        <p><strong>Revenue:</strong> ₹${Number.parseFloat(stats.month.total_revenue || 0).toFixed(2)}</p>
      </div>
    </div>
  `
}

// Handle offline functionality
window.addEventListener("online", () => {
  console.log("Connection restored")
  showNotification("Connection restored", "success")
  loadMenuData()
  loadRecentOrders()
})

window.addEventListener("offline", () => {
  console.log("Connection lost")
  showNotification("Connection lost. Some features may not work.", "error")
})

// Auto-refresh orders every 30 seconds when admin panel is open
setInterval(() => {
  const adminContent = document.getElementById("admin-content")
  if (adminContent && adminContent.style.display === "block") {
    loadRecentOrders()
    loadSalesStats()
  }
}, 30000)

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})
