// API Configuration
// Use local API when running on localhost, otherwise use remote URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:3000/api`
  : "https://dynamic-restaurant-ordering-payment.onrender.com/api"

// Global variables
let menuItems = {}
let currentOrder = null
let currentSection = "welcome"
let orderItems = []
let currentTotal = 0
let itemQuantities = {} // Store quantities across category switches

// Admin panel removed from main page - use admin.html instead
// No admin access control needed on main page

// Admin panel functions removed - admin panel is now on separate page (admin.html)

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Initialize app (no admin panel on main page)
  initializeApp()
  setupEventListeners()
  showWelcomeAnimations()
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
