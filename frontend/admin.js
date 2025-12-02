const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:3000/api`
  : `${window.location.origin}/api`

let allOrders = []

async function loadRecentOrders() {
  const ordersList = document.getElementById("orders-list")
  
  if (!ordersList) {
    console.error('Orders list element not found!')
    return
  }
  
  ordersList.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</p>'
  
  try {
    console.log('Loading orders from:', `${API_BASE_URL}/orders`)
    const response = await fetch(`${API_BASE_URL}/orders`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    allOrders = await response.json()
    window.allOrders = allOrders
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
        <button onclick="loadRecentOrders()" class="refresh-btn" style="margin-top: 10px;">
          <i class="fas fa-sync"></i> Retry
        </button>
      </div>
    `
  }
}

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

  try {
    const ordersHTML = orders
      .map((order) => {
        let itemsList = "No items"
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
          itemsList = order.items.map((item) => {
            const itemName = item.name || 'Unknown Item'
            const itemQty = item.quantity || 0
            return `${itemName} (${itemQty}×)`
          }).join(", ")
        }

        const statusBadges = {
          pending: '🟡 Pending',
          confirmed: '🟢 Confirmed',
          preparing: '🔵 Preparing',
          ready: '🟣 Ready',
          delivered: '🟠 Delivered',
          cancelled: '🔴 Cancelled'
        }

        const orderStatus = order.status || 'pending'
        const customerName = order.customer_name || 'Guest'
        const totalAmount = Number.parseFloat(order.total_amount || 0).toFixed(2)
        const customerPhone = order.customer_phone || "N/A"
        const orderDate = order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'

        return `
          <div class="order-item status-${orderStatus}">
            <div class="order-header">
              <h5>Order #${order.id} - ${customerName}</h5>
              <span class="status-badge status-${orderStatus}">${statusBadges[orderStatus] || orderStatus}</span>
            </div>
            <p><strong>Items:</strong> ${itemsList}</p>
            <p><strong>Total:</strong> ₹${totalAmount} | 
               <strong>Phone:</strong> ${customerPhone}</p>
            <p><strong>Date:</strong> ${orderDate}</p>
            <div class="status-control">
              <label><strong>Update Status:</strong></label>
              <select id="status-select-${order.id}" class="status-select" data-order-id="${order.id}">
                <option value="pending" ${orderStatus === "pending" ? "selected" : ""}>🟡 Pending</option>
                <option value="confirmed" ${orderStatus === "confirmed" ? "selected" : ""}>🟢 Confirmed</option>
                <option value="preparing" ${orderStatus === "preparing" ? "selected" : ""}>🔵 Preparing</option>
                <option value="ready" ${orderStatus === "ready" ? "selected" : ""}>🟣 Ready</option>
                <option value="delivered" ${orderStatus === "delivered" ? "selected" : ""}>🟠 Delivered</option>
                <option value="cancelled" ${orderStatus === "cancelled" ? "selected" : ""}>🔴 Cancelled</option>
              </select>
            </div>
          </div>
        `
      })
      .join("")
    
    ordersList.innerHTML = ordersHTML
    
    orders.forEach((order) => {
      const statusSelect = document.getElementById(`status-select-${order.id}`)
      if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
          const newStatus = e.target.value
          const orderId = order.id
          console.log(`📝 Status changed for order #${orderId} to: ${newStatus}`)
          updateOrderStatus(orderId, newStatus)
        })
      }
    })
  } catch (error) {
    console.error('Error rendering orders:', error)
    ordersList.innerHTML = `<p style="color: red;">Error displaying orders: ${error.message}</p>`
  }
}

async function updateOrderStatus(orderId, newStatus) {
  console.log(`🔄 Updating order #${orderId} to status: ${newStatus}`)
  
  if (!orderId || !newStatus) {
    console.error('❌ Missing orderId or newStatus:', { orderId, newStatus })
    showNotification('Invalid order ID or status', 'error')
    return
  }

  const orderIdNum = Number.parseInt(orderId)
  if (isNaN(orderIdNum)) {
    console.error('❌ Invalid order ID:', orderId)
    showNotification('Invalid order ID', 'error')
    return
  }

  try {
    const url = `${API_BASE_URL}/orders/${orderIdNum}/status`
    console.log('📡 Updating order status:', url)
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    })

    console.log('📥 Response status:', response.status, response.statusText)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Order status updated successfully:', result)
      
      await loadRecentOrders()
      loadSalesStats()
      
      showNotification(`Order #${orderIdNum} status updated to ${newStatus}`, "success")
    } else {
      let errorMessage = `Failed to update order status (${response.status})`
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch (e) {
        errorMessage = await response.text() || errorMessage
      }
      
      console.error('❌ Error response:', errorMessage)
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error("❌ Error updating order status:", error)
    showNotification(`Failed to update order #${orderIdNum}: ${error.message}`, "error")
  }
}

window.updateOrderStatus = updateOrderStatus

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

function displaySalesStats(stats) {
  const statsContent = document.getElementById("stats-content")
  if (!statsContent) return

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

function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <i class="fas fa-${type === "success" ? "check" : type === "error" ? "times" : "info"}-circle"></i>
    <span>${message}</span>
  `

  document.body.appendChild(notification)

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

  setTimeout(() => {
    notification.remove()
  }, 3000)
}

async function loadAIRecommendations() {
  const recommendationsDiv = document.getElementById("ai-recommendations")
  if (!recommendationsDiv) return

  recommendationsDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;"><i class="fas fa-spinner fa-spin"></i> Loading AI recommendations...</p>'

  try {
    const response = await fetch(`${API_BASE_URL}/ai/recommendations?limit=20`)

    if (!response.ok) {
      throw new Error("Failed to load AI recommendations")
    }

    const data = await response.json()
    displayAIRecommendations(data.recommendations || [])
  } catch (error) {
    console.error("Error loading AI recommendations:", error)
    recommendationsDiv.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <p><strong>Failed to load AI recommendations</strong></p>
        <p style="font-size: 0.9rem; margin-top: 10px;">${error.message}</p>
        <button onclick="loadAIRecommendations()" class="refresh-btn" style="margin-top: 10px;">
          <i class="fas fa-sync"></i> Retry
        </button>
      </div>
    `
  }
}

function displayAIRecommendations(recommendations) {
  const recommendationsDiv = document.getElementById("ai-recommendations")
  if (!recommendationsDiv) return

  if (recommendations.length === 0) {
    recommendationsDiv.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <i class="fas fa-brain" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
        <p><strong>No AI Recommendations</strong></p>
        <p style="font-size: 0.9rem; margin-top: 10px;">All orders are up to date, or there are no active orders to analyze.</p>
      </div>
    `
    return
  }

  const recommendationsHTML = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-brain"></i> AI-Powered Recommendations
      </h3>
      <p style="margin: 0; opacity: 0.9;">Based on historical data and order patterns, here are ${recommendations.length} recommendations:</p>
    </div>
    ${recommendations.map(rec => `
      <div class="order-item" style="border-left-color: #667eea; position: relative;">
        <div style="position: absolute; top: 10px; right: 10px; background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem; font-weight: 600;">
          ${rec.confidence}% Confidence
        </div>
        <div class="order-header">
          <h5>Order #${rec.orderId} - ${rec.customerName}</h5>
          <span class="status-badge status-${rec.currentStatus}">
            ${rec.currentStatus.charAt(0).toUpperCase() + rec.currentStatus.slice(1)}
          </span>
        </div>
        <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <p style="margin: 0 0 10px 0; color: #667eea; font-weight: 600;">
            <i class="fas fa-lightbulb"></i> AI Recommendation:
          </p>
          <p style="margin: 0 0 10px 0; font-size: 1.05rem;">
            <strong>${rec.recommendedAction}</strong>
          </p>
          <p style="margin: 0; color: #666; font-size: 0.9rem;">
            ${rec.reason}
          </p>
          <p style="margin: 10px 0 0 0; color: #999; font-size: 0.85rem;">
            <i class="fas fa-clock"></i> Elapsed: ${rec.elapsedMinutes} minutes
          </p>
        </div>
        <div style="margin-top: 15px;">
          <button 
            onclick="applyAIRecommendation(${rec.orderId}, '${rec.recommendedAction.split(' ').pop()}')" 
            class="refresh-btn" 
            style="background: #667eea; width: 100%;"
          >
            <i class="fas fa-check"></i> Apply Recommendation
          </button>
        </div>
      </div>
    `).join('')}
  `

  recommendationsDiv.innerHTML = recommendationsHTML
}

async function applyAIRecommendation(orderId, newStatus) {
  if (!confirm(`Apply AI recommendation: Update Order #${orderId} to "${newStatus}"?`)) {
    return
  }

  try {
    await updateOrderStatus(orderId, newStatus)
    showNotification(`AI recommendation applied! Order #${orderId} updated to ${newStatus}`, "success")
    loadAIRecommendations() // Refresh recommendations
  } catch (error) {
    showNotification(`Failed to apply recommendation: ${error.message}`, "error")
  }
}

window.loadAIRecommendations = loadAIRecommendations
window.applyAIRecommendation = applyAIRecommendation

setInterval(() => {
  const adminContent = document.getElementById("admin-content")
  if (adminContent && adminContent.classList.contains('active')) {
    loadRecentOrders()
    loadSalesStats()
    
    // Only refresh AI recommendations if on AI tab
    const aiTab = document.getElementById("admin-ai")
    if (aiTab && aiTab.classList.contains('active')) {
      loadAIRecommendations()
    }
  }
}, 30000)

