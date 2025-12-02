// API Configuration
// Use local API when running on localhost, otherwise use same origin (backend serves frontend)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:3000/api`
  : `${window.location.origin}/api`

// Global variables
let menuItems = {}
let currentOrder = null
let currentSection = "welcome"
let orderItems = []
let currentTotal = 0
let itemQuantities = {} // Store quantities across category switches
let currentOrderId = null // For order tracking

// Status configuration for tracking
const statusConfig = {
  pending: {
    icon: '⏳',
    label: 'Pending',
    description: 'Your order is pending confirmation',
    color: '#f39c12'
  },
  confirmed: {
    icon: '✅',
    label: 'Confirmed',
    description: 'Your order has been confirmed',
    color: '#27ae60'
  },
  preparing: {
    icon: '👨‍🍳',
    label: 'Preparing',
    description: 'Your order is being prepared',
    color: '#3498db'
  },
  ready: {
    icon: '🎉',
    label: 'Ready',
    description: 'Your order is ready for pickup/delivery',
    color: '#9b59b6'
  },
  delivered: {
    icon: '🚚',
    label: 'Delivered',
    description: 'Your order has been delivered',
    color: '#e67e22'
  },
  cancelled: {
    icon: '❌',
    label: 'Cancelled',
    description: 'This order has been cancelled',
    color: '#e74c3c'
  }
}

const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

// Admin panel removed from main page - use admin.html instead
// No admin access control needed on main page

// Admin panel functions removed - admin panel is now on separate page (admin.html)

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Initialize app (no admin panel on main page)
  initializeApp()
  setupEventListeners()
  showWelcomeAnimations()
  
  // Check for order ID in URL to auto-load tracking
  const urlParams = new URLSearchParams(window.location.search)
  const orderId = urlParams.get('orderId')
  
  if (orderId) {
    showSection('track')
    const orderInput = document.getElementById('order-search')
    if (orderInput) {
      orderInput.value = orderId
      currentOrderId = orderId
      loadOrderStatus(orderId)
    }
  }
})

// Initialize application
function initializeApp() {
  // Show welcome section by default
  showSection("welcome")
  loadMenuData()
  
  // No admin data loading on main page - admin panel is on separate page
  
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

  // Real-time validation for customer fields
  const customerName = document.getElementById("customer-name")
  const customerPhone = document.getElementById("customer-phone")

  if (customerName) {
    customerName.addEventListener("input", () => {
      const name = customerName.value.trim()
      const nameError = document.getElementById("name-error")
      if (name.length > 0 && name.length < 2) {
        if (nameError) {
          nameError.textContent = "Name must be at least 2 characters"
          nameError.style.display = "block"
        }
        customerName.classList.add("error")
      } else if (name.length >= 2) {
        if (nameError) nameError.style.display = "none"
        customerName.classList.remove("error")
      }
      checkGenerateBillButton()
    })

    customerName.addEventListener("blur", () => {
      validateCustomerInfo()
      checkGenerateBillButton()
    })
  }

  if (customerPhone) {
    customerPhone.addEventListener("input", () => {
      const phone = customerPhone.value.trim()
      const phoneError = document.getElementById("phone-error")
      const phoneRegex = /^[0-9]{10,15}$/
      
      if (phone.length > 0 && !phoneRegex.test(phone)) {
        if (phoneError) {
          phoneError.textContent = "Phone must be 10-15 digits"
          phoneError.style.display = "block"
        }
        customerPhone.classList.add("error")
      } else if (phoneRegex.test(phone)) {
        if (phoneError) phoneError.style.display = "none"
        customerPhone.classList.remove("error")
      }
      checkGenerateBillButton()
    })

    customerPhone.addEventListener("blur", () => {
      validateCustomerInfo()
      checkGenerateBillButton()
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
    // Get saved quantity or default to 0
    const savedQuantity = itemQuantities[item.id] || 0
    
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
                 value="${savedQuantity}" 
                 min="0"
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
    const newValue = Math.max(0, currentValue + change) // No max limit
    quantityInput.value = newValue
    updateItemQuantity(itemId, newValue)
  }
}

// Update item quantity
function updateItemQuantity(itemId, quantity) {
  quantity = Math.max(0, Number.parseInt(quantity) || 0) // No max limit

  // Store quantity in persistent storage
  itemQuantities[itemId] = quantity

  // Update the input field
  const quantityInput = document.getElementById(`quantity-${itemId}`)
  if (quantityInput) {
    quantityInput.value = quantity
  }

  updateOrderSummary()
  checkGenerateBillButton()
}

// Check if Generate Bill button should be enabled
function checkGenerateBillButton() {
  const calculateButton = document.getElementById("calculate-button")
  const customerName = document.getElementById("customer-name")?.value.trim()
  const customerPhone = document.getElementById("customer-phone")?.value.trim()
  const phoneRegex = /^[0-9]{10,15}$/

  if (calculateButton) {
    const hasItems = orderItems.length > 0
    const hasValidName = customerName && customerName.length >= 2
    const hasValidPhone = customerPhone && phoneRegex.test(customerPhone)

    if (hasItems && hasValidName && hasValidPhone) {
      calculateButton.disabled = false
      calculateButton.classList.remove("disabled")
    } else {
      calculateButton.disabled = true
      calculateButton.classList.add("disabled")
    }
  }
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
    // First check if input exists (current category), otherwise use stored quantity
    const quantityInput = document.getElementById(`quantity-${item.id}`)
    let quantity = 0
    
    if (quantityInput) {
      quantity = Number.parseInt(quantityInput.value) || 0
      // Update stored quantity
      itemQuantities[item.id] = quantity
    } else {
      // Use stored quantity if input doesn't exist (different category)
      quantity = itemQuantities[item.id] || 0
    }
    
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

  // Check if Generate Bill button should be enabled
  checkGenerateBillButton()
}

// Validate customer information
function validateCustomerInfo() {
  const customerName = document.getElementById("customer-name")?.value.trim()
  const customerPhone = document.getElementById("customer-phone")?.value.trim()
  const nameError = document.getElementById("name-error")
  const phoneError = document.getElementById("phone-error")
  let isValid = true

  // Clear previous errors
  if (nameError) nameError.textContent = ""
  if (phoneError) phoneError.textContent = ""

  // Validate name
  if (!customerName || customerName.length < 2) {
    if (nameError) {
      nameError.textContent = "Name must be at least 2 characters"
      nameError.style.display = "block"
    }
    document.getElementById("customer-name")?.classList.add("error")
    isValid = false
  } else {
    document.getElementById("customer-name")?.classList.remove("error")
  }

  // Validate phone number (10-15 digits)
  const phoneRegex = /^[0-9]{10,15}$/
  if (!customerPhone) {
    if (phoneError) {
      phoneError.textContent = "Phone number is required"
      phoneError.style.display = "block"
    }
    document.getElementById("customer-phone")?.classList.add("error")
    isValid = false
  } else if (!phoneRegex.test(customerPhone)) {
    if (phoneError) {
      phoneError.textContent = "Phone must be 10-15 digits"
      phoneError.style.display = "block"
    }
    document.getElementById("customer-phone")?.classList.add("error")
    isValid = false
  } else {
    document.getElementById("customer-phone")?.classList.remove("error")
  }

  return isValid
}

// Calculate final cost and show receipt modal
function calculateFinalCost() {
  // Validate order items
  if (orderItems.length === 0) {
    showNotification("Please select at least one item to generate a bill.", "error")
    return
  }

  // Validate customer information (mandatory)
  if (!validateCustomerInfo()) {
    showNotification("Please fill in all required customer information.", "error")
    // Scroll to customer info section
    document.querySelector(".customer-info-card")?.scrollIntoView({ behavior: "smooth", block: "center" })
    return
  }

  const customerName = document.getElementById("customer-name").value.trim()
  const customerPhone = document.getElementById("customer-phone").value.trim()

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
    showNotification("Please generate a bill first.", "error")
    return
  }

  // Validate customer info again before placing order
  if (!validateCustomerInfo()) {
    showNotification("Please ensure all customer information is valid.", "error")
    return
  }

  // Ensure customer name and phone are not empty
  if (!currentOrder.customerInfo.name || !currentOrder.customerInfo.phone) {
    showNotification("Customer name and phone number are required to place order.", "error")
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
        customerInfo: {
          name: currentOrder.customerInfo.name,
          phone: currentOrder.customerInfo.phone,
        },
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
            <div style="margin-top: 15px;">
              <button onclick="showSection('track'); document.getElementById('order-search').value = '${result.orderId}'; currentOrderId = '${result.orderId}'; loadOrderStatus('${result.orderId}');" style="display: inline-block; padding: 10px 20px; background: #27ae60; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px; border: none; cursor: pointer;">
                <i class="fas fa-shipping-fast"></i> Track Your Order
              </button>
            </div>
          </div>
        `
      }

      // Clear the form after successful order
      setTimeout(() => {
        clearOrder()
        closeReceiptModal()
      }, 3000)

      // Show success notification
      showNotification("Order placed successfully!", "success")
      
      // Auto-redirect to track section with order ID
      setTimeout(() => {
        showSection('track')
        document.getElementById('order-search').value = result.orderId
        currentOrderId = result.orderId
        loadOrderStatus(result.orderId)
      }, 2000)
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
  quantityInputs.forEach((input) => {
    const itemId = input.id.replace('quantity-', '')
    input.value = "0"
    itemQuantities[itemId] = 0 // Clear stored quantity
  })

  // Clear customer info
  const customerName = document.getElementById("customer-name")
  const customerPhone = document.getElementById("customer-phone")
  if (customerName) customerName.value = ""
  if (customerPhone) customerPhone.value = ""

  // Clear order data
  orderItems = []
  currentOrder = null
  currentTotal = 0
  itemQuantities = {} // Clear all stored quantities

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

// Handle offline functionality
window.addEventListener("online", () => {
  console.log("Connection restored")
  showNotification("Connection restored", "success")
  loadMenuData()
})

window.addEventListener("offline", () => {
  console.log("Connection lost")
  showNotification("Connection lost. Some features may not work.", "error")
})

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href")
    // Skip if href is just "#" or empty
    if (!href || href === "#" || href.length <= 1) {
      return
    }
    
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// ==================== ORDER TRACKING FUNCTIONS ====================

// Search for order
async function searchOrder(event) {
  event.preventDefault()
  const orderInput = document.getElementById('order-search')
  if (!orderInput) return
  
  const orderId = orderInput.value.trim()

  if (!orderId) {
    showNotification('Please enter an order number', 'error')
    return
  }

  currentOrderId = orderId
  await loadOrderStatus(orderId)
}

// Load order status
async function loadOrderStatus(orderId) {
  const container = document.getElementById('order-status-container')
  const detailsDiv = document.getElementById('order-details')
  const timelineDiv = document.getElementById('status-timeline')
  const insightsDiv = document.getElementById('ai-insights')

  if (!container || !detailsDiv || !timelineDiv || !insightsDiv) return

  try {
    // Load order
    const orderResponse = await fetch(`${API_BASE_URL}/orders/${orderId}`)
    if (!orderResponse.ok) {
      throw new Error('Order not found')
    }

    const order = await orderResponse.json()

    // Load AI insights
    let insights = null
    try {
      const insightsResponse = await fetch(`${API_BASE_URL}/ai/orders/${orderId}/insights`)
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json()
        insights = insightsData.insights
      }
    } catch (error) {
      console.error('Error loading AI insights:', error)
    }

    // Display order details
    const itemsList = order.items && order.items.length > 0
      ? order.items.map(item => `${item.name} (${item.quantity}×)`).join(', ')
      : 'No items'

    detailsDiv.innerHTML = `
      <h4 style="margin: 0 0 15px 0; color: #2c3e50;"><i class="fas fa-receipt"></i> Order Details</h4>
      <div class="detail-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
        <span><strong>Order ID:</strong></span>
        <span>#${order.id}</span>
      </div>
      <div class="detail-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
        <span><strong>Customer:</strong></span>
        <span>${order.customer_name || 'Guest'}</span>
      </div>
      <div class="detail-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
        <span><strong>Items:</strong></span>
        <span>${itemsList}</span>
      </div>
      <div class="detail-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
        <span><strong>Total Amount:</strong></span>
        <span>₹${parseFloat(order.total_amount || 0).toFixed(2)}</span>
      </div>
      <div class="detail-row" style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span><strong>Order Date:</strong></span>
        <span>${order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</span>
      </div>
    `

    // Display status timeline
    const currentStatus = order.status || 'pending'
    const currentIndex = statusFlow.indexOf(currentStatus)

    timelineDiv.innerHTML = statusFlow.map((status, index) => {
      const config = statusConfig[status]
      let stepClass = 'status-step'
      let iconStyle = `width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin-right: 20px; position: relative; z-index: 1;`
      
      if (index < currentIndex) {
        stepClass += ' completed'
        iconStyle += `background: ${config.color}; color: white;`
      } else if (index === currentIndex) {
        stepClass += ' active'
        iconStyle += `background: ${config.color}; color: white; animation: pulse 2s infinite;`
      } else {
        iconStyle += `background: #e0e0e0; color: #7f8c8d;`
      }

      return `
        <div class="${stepClass}" style="display: flex; align-items: center; margin-bottom: 30px; position: relative;">
          <div class="status-icon" style="${iconStyle}">
            ${config.icon}
          </div>
          <div class="status-info" style="flex: 1;">
            <h3 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 1.2rem;">${config.label}</h3>
            <p style="margin: 0; color: #7f8c8d; font-size: 0.9rem;">${config.description}</p>
          </div>
        </div>
      `
    }).join('')

    // Add CSS for pulse animation if not exists
    if (!document.querySelector('#track-styles')) {
      const styles = document.createElement('style')
      styles.id = 'track-styles'
      styles.textContent = `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .status-step::before {
          content: '';
          position: absolute;
          left: 20px;
          top: 50px;
          width: 2px;
          height: 40px;
          background: ${currentIndex > 0 ? '#27ae60' : '#e0e0e0'};
        }
        .status-step:last-child::before {
          display: none;
        }
      `
      document.head.appendChild(styles)
    }

    // Display AI insights
    if (insights) {
      let insightsHTML = `
        <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;"><i class="fas fa-brain"></i> AI-Powered Insights</h3>
      `

      if (insights.prediction) {
        insightsHTML += `
          <p style="margin: 10px 0; line-height: 1.6;"><strong>💡 Recommendation:</strong> ${insights.prediction.reason}</p>
          <p style="margin: 10px 0; line-height: 1.6;"><strong>⏱️ Elapsed Time:</strong> ${insights.elapsedMinutes} minutes</p>
        `
      }

      if (insights.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled') {
        const deliveryTime = new Date(insights.estimatedDelivery)
        insightsHTML += `
          <p style="margin: 10px 0; line-height: 1.6;"><strong>📅 Estimated Delivery:</strong> ${deliveryTime.toLocaleString()}</p>
        `
      }

      if (insights.insights && insights.insights.length > 0) {
        insightsHTML += '<div style="margin-top: 15px;">'
        insights.insights.forEach(insight => {
          insightsHTML += `<p style="margin: 10px 0; line-height: 1.6;"><strong>${insight.type === 'warning' ? '⚠️' : 'ℹ️'}</strong> ${insight.message}</p>`
        })
        insightsHTML += '</div>'
      }

      insightsDiv.innerHTML = insightsHTML
    } else {
      insightsDiv.innerHTML = `
        <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;"><i class="fas fa-brain"></i> AI-Powered Insights</h3>
        <p style="margin: 10px 0; line-height: 1.6;">AI insights are being calculated...</p>
      `
    }

    container.style.display = 'block'
    container.classList.add('active')
    
    // Show big success message
    showBigOrderMessage(order, currentStatus)

    // Auto-refresh every 30 seconds
    if (order.status !== 'delivered' && order.status !== 'cancelled') {
      setTimeout(() => loadOrderStatus(orderId), 30000)
    }

  } catch (error) {
    if (container) {
      container.style.display = 'none'
      container.classList.remove('active')
    }
    const messageDiv = document.getElementById('order-status-message')
    if (messageDiv) {
      messageDiv.style.display = 'none'
    }
    showNotification('Order not found. Please check your order number.', 'error')
    console.error('Error loading order:', error)
  }
}

// Chatbot functions
async function sendChatMessage() {
  const input = document.getElementById('chatbot-input')
  if (!input) return
  
  const query = input.value.trim()

  if (!query) return

  // Add user message to chat
  addChatMessage(query, 'user')
  input.value = ''

  // Show typing indicator
  const typingId = addChatMessage('Thinking...', 'bot', true)

  try {
    const response = await fetch(`${API_BASE_URL}/ai/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        orderId: currentOrderId
      })
    })

    const data = await response.json()

    // Remove typing indicator
    removeChatMessage(typingId)

    // Add bot response
    if (data.needsOrderId && !currentOrderId) {
      // Try to extract order ID from query
      const idMatch = query.match(/(\d+)/)
      if (idMatch) {
        currentOrderId = idMatch[1]
        const orderInput = document.getElementById('order-search')
        if (orderInput) orderInput.value = currentOrderId
        await loadOrderStatus(currentOrderId)
        addChatMessage(`I found order #${currentOrderId}. Let me track it for you!`, 'bot')
      } else {
        addChatMessage(data.response, 'bot')
      }
    } else {
      addChatMessage(data.response, 'bot')
      
      // If order data is returned, show it
      const container = document.getElementById('order-status-container')
      if (data.orderData && container && !container.classList.contains('active')) {
        currentOrderId = data.orderData.id
        const orderInput = document.getElementById('order-search')
        if (orderInput) orderInput.value = currentOrderId
        await loadOrderStatus(currentOrderId)
      }
    }
  } catch (error) {
    removeChatMessage(typingId)
    addChatMessage('Sorry, I encountered an error. Please try again.', 'bot')
    console.error('Chatbot error:', error)
  }
}

function addChatMessage(message, type, isTyping = false) {
  const messagesDiv = document.getElementById('chatbot-messages')
  if (!messagesDiv) return
  
  const messageId = 'msg-' + Date.now()
  
  const messageDiv = document.createElement('div')
  messageDiv.className = `chat-message ${type}`
  messageDiv.id = messageId
  messageDiv.style.cssText = 'margin-bottom: 15px; display: flex; gap: 10px;'
  if (type === 'user') messageDiv.style.flexDirection = 'row-reverse'
  
  const bubbleStyle = type === 'user' 
    ? 'max-width: 70%; padding: 12px 16px; border-radius: 15px; background: #e74c3c; color: white;'
    : 'max-width: 70%; padding: 12px 16px; border-radius: 15px; background: #f0f0f0; color: #2c3e50;'
  
  messageDiv.innerHTML = `
    <div class="message-bubble" style="${bubbleStyle}">
      ${message.replace(/\n/g, '<br>')}
    </div>
  `

  messagesDiv.appendChild(messageDiv)
  messagesDiv.scrollTop = messagesDiv.scrollHeight

  return messageId
}

function removeChatMessage(messageId) {
  const message = document.getElementById(messageId)
  if (message) {
    message.remove()
  }
}

function handleChatEnter(event) {
  if (event.key === 'Enter') {
    sendChatMessage()
  }
}

// Show big order found message inline on the page
function showBigOrderMessage(order, status) {
  const messageDiv = document.getElementById('order-status-message')
  if (!messageDiv) return

  const statusMessages = {
    pending: {
      icon: '⏳',
      title: 'Order Found!',
      message: `Your order #${order.id} is pending confirmation. We'll notify you once it's confirmed!`,
      color: '#f39c12'
    },
    confirmed: {
      icon: '✅',
      title: 'Order Confirmed!',
      message: `Great news! Your order #${order.id} has been confirmed and will be prepared soon.`,
      color: '#27ae60'
    },
    preparing: {
      icon: '👨‍🍳',
      title: 'Order Being Prepared!',
      message: `Your order #${order.id} is currently being prepared in our kitchen. It won't be long!`,
      color: '#3498db'
    },
    ready: {
      icon: '🎉',
      title: 'Order Ready!',
      message: `Excellent! Your order #${order.id} is ready for pickup/delivery. Enjoy your meal!`,
      color: '#9b59b6'
    },
    delivered: {
      icon: '🚚',
      title: 'Order Delivered!',
      message: `Your order #${order.id} has been successfully delivered. Thank you for choosing us!`,
      color: '#e67e22'
    },
    cancelled: {
      icon: '❌',
      title: 'Order Cancelled',
      message: `Order #${order.id} has been cancelled. Please contact us if you have any questions.`,
      color: '#e74c3c'
    }
  }

  const statusInfo = statusMessages[status] || statusMessages.pending

  messageDiv.innerHTML = `
    <div class="status-message-icon" style="font-size: 3rem; margin-bottom: 15px; text-align: center;">${statusInfo.icon}</div>
    <h2 class="status-message-title" style="margin: 0 0 15px 0; color: ${statusInfo.color}; font-size: 2rem; font-weight: 700; text-align: center;">${statusInfo.title}</h2>
    <p class="status-message-text" style="margin: 0; color: #2c3e50; font-size: 1.1rem; line-height: 1.6; text-align: center;">${statusInfo.message}</p>
  `

  messageDiv.style.display = 'block'
  messageDiv.style.background = `linear-gradient(135deg, ${statusInfo.color}15 0%, ${statusInfo.color}05 100%)`
  messageDiv.style.borderLeft = `5px solid ${statusInfo.color}`
}

// Make functions globally available
window.searchOrder = searchOrder
window.sendChatMessage = sendChatMessage
window.handleChatEnter = handleChatEnter
