// API Configuration
// Use local API when running on localhost, otherwise use remote URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:3000/api`
  : "https://dynamic-restaurant-ordering-payment.onrender.com/api"

// Global variables
let menuItems = {}
let currentOrder = null
let currentSection = "welcome"
let allOrders = []
let orderItems = []
let currentTotal = 0

// Admin access control
let isAdmin = false

// Check for admin access via URL parameter
function checkAdminAccess() {
  const urlParams = new URLSearchParams(window.location.search)
  const adminKey = urlParams.get('admin')
  
  // Secret admin key (change this to your own secret)
  const ADMIN_SECRET = 'admin123' // ⚠️ CHANGE THIS TO YOUR OWN SECRET PASSWORD!
  
  if (adminKey === ADMIN_SECRET) {
    isAdmin = true
    showAdminPanel()
    // Store admin session in localStorage
    sessionStorage.setItem('isAdmin', 'true')
    showNotification('Admin access granted', 'success')
  } else {
    // Check if admin session exists
    const adminSession = sessionStorage.getItem('isAdmin')
    if (adminSession === 'true') {
      isAdmin = true
      showAdminPanel()
    } else {
      hideAdminPanel()
    }
  }
}

// Show admin panel
function showAdminPanel() {
  const adminPanel = document.getElementById('admin-panel')
  if (adminPanel) {
    adminPanel.style.display = 'block'
    console.log('Admin panel shown')
    
    // Auto-expand admin panel and show orders tab
    setTimeout(() => {
      const adminContent = document.getElementById('admin-content')
      const adminOrdersTab = document.getElementById('admin-orders')
      
      if (adminContent) {
        adminContent.style.display = 'block'
        console.log('Admin content expanded')
      }
      
      if (adminOrdersTab) {
        adminOrdersTab.style.display = 'block'
        console.log('Orders tab shown')
      }
      
      // Load orders immediately
      loadRecentOrders()
      
      // Rotate toggle icon
      const toggleIcon = document.querySelector(".admin-toggle i")
      if (toggleIcon) {
        toggleIcon.style.transform = "rotate(180deg)"
      }
    }, 100)
  } else {
    console.error('Admin panel element not found!')
  }
}

// Hide admin panel
function hideAdminPanel() {
  const adminPanel = document.getElementById('admin-panel')
  if (adminPanel) {
    adminPanel.style.display = 'none'
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  checkAdminAccess() // Check admin access first
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

  // Admin panel toggle - make entire header clickable
  const adminHeader = document.querySelector(".admin-header")
  const adminToggle = document.querySelector(".admin-toggle")
  
  console.log("Setting up admin panel listeners:", { 
    adminToggle: !!adminToggle, 
    adminHeader: !!adminHeader,
    toggleFunction: typeof window.toggleAdminPanel 
  })
  
  if (adminHeader) {
    // Make entire header clickable
    adminHeader.style.cursor = "pointer"
    adminHeader.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("Admin header/button clicked", e.target)
      if (window.toggleAdminPanel) {
        window.toggleAdminPanel()
      } else {
        console.error("toggleAdminPanel function not available!")
        // Try direct call
        toggleAdminPanel()
      }
    })
  } else {
    console.error("Admin header not found! Cannot set up admin panel.")
  }
  
  // Also attach to button specifically as backup
  if (adminToggle) {
    adminToggle.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("Admin toggle button clicked directly")
      if (window.toggleAdminPanel) {
        window.toggleAdminPanel()
      } else {
        toggleAdminPanel()
      }
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
  // Check if user has admin access
  if (!isAdmin && sessionStorage.getItem('isAdmin') !== 'true') {
    // Prompt for admin password
    const password = prompt('Enter admin password to access admin panel:')
    const ADMIN_SECRET = 'admin123' // ⚠️ CHANGE THIS TO YOUR OWN SECRET PASSWORD!
    if (password === ADMIN_SECRET) {
      isAdmin = true
      sessionStorage.setItem('isAdmin', 'true')
      showAdminPanel()
      showNotification('Admin access granted', 'success')
    } else {
      showNotification('Invalid admin password', 'error')
      return
    }
  }

  const adminContent = document.getElementById("admin-content")
  const toggleIcon = document.querySelector(".admin-toggle i")

  if (!adminContent || !toggleIcon) {
    console.error("Admin panel elements not found")
    return
  }

  const isHidden = adminContent.style.display === "none" || !adminContent.style.display
  
  if (isHidden) {
    adminContent.style.display = "block"
    toggleIcon.style.transform = "rotate(180deg)"
    
    // Make sure Orders tab is visible
    const adminOrdersTab = document.getElementById('admin-orders')
    if (adminOrdersTab) {
      adminOrdersTab.style.display = 'block'
    }
    
    // Hide stats tab
    const adminStatsTab = document.getElementById('admin-stats')
    if (adminStatsTab) {
      adminStatsTab.style.display = 'none'
    }
    
    // Make Orders tab button active
    const ordersTabBtn = document.querySelector('[onclick*="showAdminTab(\'orders\'"]')
    const statsTabBtn = document.querySelector('[onclick*="showAdminTab(\'stats\'"]')
    if (ordersTabBtn) ordersTabBtn.classList.add('active')
    if (statsTabBtn) statsTabBtn.classList.remove('active')
    
    loadRecentOrders()
    loadSalesStats()
  } else {
    adminContent.style.display = "none"
    toggleIcon.style.transform = "rotate(0deg)"
  }
}

// Make function globally accessible immediately
window.toggleAdminPanel = toggleAdminPanel

// Also attach it when DOM is ready as a fallback
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.toggleAdminPanel = toggleAdminPanel
    console.log("toggleAdminPanel attached to window on DOMContentLoaded")
  })
} else {
  // DOM already loaded
  window.toggleAdminPanel = toggleAdminPanel
  console.log("toggleAdminPanel attached to window immediately")
}

// Show admin tab
function showAdminTab(tabName, clickedElement) {
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

  // Mark clicked button as active
  if (clickedElement) {
    clickedElement.classList.add("active")
  } else {
    // Fallback: find button by tab name
    const button = document.querySelector(`[onclick*="showAdminTab('${tabName}')"]`)
    if (button) {
      button.classList.add("active")
    }
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
  const ordersList = document.getElementById("orders-list")
  
  if (!ordersList) {
    console.error('Orders list element not found!')
    return
  }
  
  // Show loading state
  ordersList.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</p>'
  
  try {
    console.log('Loading orders from:', `${API_BASE_URL}/orders`)
    const response = await fetch(`${API_BASE_URL}/orders`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    allOrders = await response.json()
    console.log('Orders loaded:', allOrders.length, 'orders')
    
    if (allOrders.length === 0) {
      ordersList.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">No orders yet. Orders will appear here when customers place orders.</p>'
    } else {
      displayOrders(allOrders)
    }
  } catch (error) {
    console.error("Error loading orders:", error)
    ordersList.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <p><strong>Failed to load orders</strong></p>
        <p style="font-size: 0.9rem; margin-top: 10px;">${error.message}</p>
        <p style="font-size: 0.85rem; margin-top: 10px; color: #666;">
          Make sure the backend server is running on port 3000
        </p>
        <button onclick="loadRecentOrders()" class="btn btn-small" style="margin-top: 10px;">
          <i class="fas fa-sync"></i> Retry
        </button>
      </div>
    `
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
  if (!ordersList) {
    console.error('Orders list element not found in displayOrders!')
    return
  }

  if (orders.length === 0) {
    ordersList.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">No orders found.</p>'
    return
  }
  
  console.log('Displaying', orders.length, 'orders')

  ordersList.innerHTML = orders
    .map((order) => {
      const itemsList = order.items.map((item) => `${item.name} (${item.quantity}×)`).join(", ")

      // Status badge with emoji
      const statusBadges = {
        pending: '🟡 Pending',
        confirmed: '🟢 Confirmed',
        preparing: '🔵 Preparing',
        ready: '🟣 Ready',
        delivered: '🟠 Delivered',
        cancelled: '🔴 Cancelled'
      }

      return `
        <div class="order-item status-${order.status}">
          <div class="order-header">
            <h5>Order #${order.id} - ${order.customer_name}</h5>
            <span class="status-badge status-${order.status}">${statusBadges[order.status] || order.status}</span>
          </div>
          <p><strong>Items:</strong> ${itemsList}</p>
          <p><strong>Total:</strong> ₹${Number.parseFloat(order.total_amount).toFixed(2)} | 
             <strong>Phone:</strong> ${order.customer_phone || "N/A"}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
          <div class="status-control">
            <label><strong>Update Status:</strong></label>
            <select onchange="updateOrderStatus(${order.id}, this.value)" value="${order.status}" class="status-select">
              <option value="pending" ${order.status === "pending" ? "selected" : ""}>🟡 Pending</option>
              <option value="confirmed" ${order.status === "confirmed" ? "selected" : ""}>🟢 Confirmed</option>
              <option value="preparing" ${order.status === "preparing" ? "selected" : ""}>🔵 Preparing</option>
              <option value="ready" ${order.status === "ready" ? "selected" : ""}>🟣 Ready</option>
              <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>🟠 Delivered</option>
              <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>🔴 Cancelled</option>
            </select>
          </div>
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

  // Handle null/undefined stats
  if (!stats || !stats.today || !stats.month) {
    statsContent.innerHTML = '<p style="color: #666; text-align: center;">No statistics available yet.</p>'
    return
  }

  const todayStats = stats.today || {}
  const monthStats = stats.month || {}

  statsContent.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h4><i class="fas fa-calendar-day"></i> Today's Sales</h4>
        <p><strong>Orders:</strong> ${todayStats.total_orders || 0}</p>
        <p><strong>Revenue:</strong> ₹${Number.parseFloat(todayStats.total_revenue || 0).toFixed(2)}</p>
        <p><strong>Avg Order:</strong> ₹${Number.parseFloat(todayStats.average_order_value || 0).toFixed(2)}</p>
      </div>
      <div class="stat-card">
        <h4><i class="fas fa-calendar-alt"></i> This Month</h4>
        <p><strong>Orders:</strong> ${monthStats.total_orders || 0}</p>
        <p><strong>Revenue:</strong> ₹${Number.parseFloat(monthStats.total_revenue || 0).toFixed(2)}</p>
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
