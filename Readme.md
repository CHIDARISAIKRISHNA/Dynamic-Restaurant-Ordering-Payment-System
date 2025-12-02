# Delicious Bites Restaurant Website

A modern, full-stack restaurant ordering system with AI-powered order tracking, built with Node.js, Express, and JavaScript.

## Features

### Core Features
- **Interactive Menu System** - Browse menu items by categories (Breakfast, Lunch, Snacks, Dinner, Beverages, Ice Creams)
- **Order Management** - Place orders with customer information and real-time order tracking
- **Admin Panel** - Complete admin dashboard for managing orders and viewing statistics
- **AI-Powered Order Tracking** - Intelligent order status predictions and recommendations

### AI Features
- **Smart Order Tracking** - AI analyzes order patterns and predicts optimal status transitions
- **AI Chatbot Assistant** - Interactive chatbot to help customers track orders and get answers
- **Intelligent Recommendations** - AI suggests when orders should move to the next status
- **Delivery Time Estimation** - Predicts estimated delivery times based on historical data
- **Order Insights** - Provides actionable insights for order management

### Order Status Flow
Orders progress through 6 statuses:
1.  **Pending** - Order received, awaiting confirmation
2.  **Confirmed** - Order confirmed, ready for preparation
3.  **Preparing** - Order being prepared in kitchen
4.  **Ready** - Order ready for pickup/delivery
5.  **Delivered** - Order successfully delivered
6.  **Cancelled** - Order cancelled

###  User Experience
- **Beautiful Modern UI** - Responsive design with smooth animations
- **Real-time Updates** - Order status updates automatically every 30 seconds
- **Visual Status Timeline** - See your order progress at a glance
- **Big Status Messages** - Clear, prominent status notifications
- **Mobile Friendly** - Works seamlessly on all devices

## Live Demo

- **User Site**: [https://saikrishna-restaurant.onrender.com](https://saikrishna-restaurant.onrender.com)
- **Admin Panel**: [https://saikrishna-restaurant.onrender.com/admin](https://saikrishna-restaurant.onrender.com/admin)

##  Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: JavaScript, HTML5, CSS3
- **Storage**: JSON file-based storage
- **AI**: Custom AI service for order tracking and predictions
- **Deployment**: Render.com

## Installation

### Prerequisites
- Make sure Node.js and npm installed on your system, then proceed accordingly.

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/CHIDARISAIKRISHNA/saikrishna-restaurant.git
   cd saikrishna-restaurant
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the server**
   ```bash
   node server.js
   ```
   
4. **Access the application**
   - User site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

5. **For Frontend Access (Optional)**
   ```bash
   cd frontend
   npm install
   npm start
   ```

##  Usage

### For Customers
1. Browse the menu and add items to your cart
2. Enter your name and phone number
3. Generate bill and place order
4. Track your order using the order number
5. Use the AI chatbot for order inquiries

### For Admins (Private)
1. Access admin panel at `/admin`
2. Login with admin password
3. View all orders and update status
4. Check AI recommendations for optimal order management
5. View sales statistics

## AI Order Tracking

The AI system provides:
- **Status Predictions** - Suggests when orders should move to next status
- **Confidence Scores** - Shows how confident the AI is in its recommendations
- **Delivery Estimates** - Calculates estimated delivery times
- **Order Insights** - Identifies orders that need attention
- **Chatbot Support** - Answers customer questions about orders



## 🔒 Admin Access

The admin panel is password-protected. Only authorized personnel can access order management features.


