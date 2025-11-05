-- ============================================
-- RESTAURANT ORDERING SYSTEM - SQL QUERIES
-- Database: SQLite (restaurant.db)
-- ============================================

-- ============================================
-- 1. VIEW ALL ORDERS
-- ============================================
SELECT 
    id,
    customer_name,
    customer_phone,
    total_amount,
    tax_amount,
    status,
    payment_mode,
    created_at,
    updated_at
FROM orders
ORDER BY created_at DESC;

-- ============================================
-- 2. VIEW ORDERS WITH ITEMS (DETAILED)
-- ============================================
SELECT 
    o.id AS order_id,
    o.customer_name,
    o.customer_phone,
    o.total_amount,
    o.tax_amount,
    o.status,
    o.created_at AS order_date,
    oi.menu_item_id,
    mi.name AS item_name,
    oi.quantity,
    oi.price AS item_price,
    oi.total AS item_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
ORDER BY o.created_at DESC, oi.id;

-- ============================================
-- 3. VIEW ORDERS BY STATUS
-- ============================================
SELECT 
    id,
    customer_name,
    customer_phone,
    total_amount,
    status,
    created_at
FROM orders
WHERE status = 'pending'  -- Change to: pending, confirmed, preparing, ready, delivered, cancelled
ORDER BY created_at DESC;

-- ============================================
-- 4. VIEW TODAY'S ORDERS
-- ============================================
SELECT 
    id,
    customer_name,
    customer_phone,
    total_amount,
    status,
    created_at
FROM orders
WHERE DATE(created_at) = DATE('now')
ORDER BY created_at DESC;

-- ============================================
-- 5. VIEW ORDERS BY DATE RANGE
-- ============================================
SELECT 
    id,
    customer_name,
    customer_phone,
    total_amount,
    status,
    created_at
FROM orders
WHERE DATE(created_at) BETWEEN '2025-01-01' AND '2025-01-31'  -- Change dates as needed
ORDER BY created_at DESC;

-- ============================================
-- 6. SALES STATISTICS - TODAY
-- ============================================
SELECT 
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue,
    AVG(total_amount) AS average_order_value,
    MIN(total_amount) AS min_order,
    MAX(total_amount) AS max_order
FROM orders
WHERE DATE(created_at) = DATE('now');

-- ============================================
-- 7. SALES STATISTICS - THIS MONTH
-- ============================================
SELECT 
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue,
    AVG(total_amount) AS average_order_value
FROM orders
WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now');

-- ============================================
-- 8. ORDERS BY STATUS COUNT
-- ============================================
SELECT 
    status,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_revenue
FROM orders
GROUP BY status
ORDER BY order_count DESC;

-- ============================================
-- 9. TOP CUSTOMERS (BY ORDER COUNT)
-- ============================================
SELECT 
    customer_name,
    customer_phone,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_spent,
    AVG(total_amount) AS avg_order_value
FROM orders
GROUP BY customer_phone, customer_name
ORDER BY order_count DESC
LIMIT 10;

-- ============================================
-- 10. MOST ORDERED ITEMS
-- ============================================
SELECT 
    mi.name AS item_name,
    mi.category,
    SUM(oi.quantity) AS total_quantity_ordered,
    COUNT(DISTINCT oi.order_id) AS times_ordered,
    SUM(oi.total) AS total_revenue
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
GROUP BY oi.menu_item_id, mi.name, mi.category
ORDER BY total_quantity_ordered DESC;

-- ============================================
-- 11. ORDER DETAILS FOR SPECIFIC ORDER ID
-- ============================================
SELECT 
    o.id AS order_id,
    o.customer_name,
    o.customer_phone,
    o.total_amount,
    o.tax_amount,
    o.status,
    o.payment_mode,
    o.created_at,
    o.updated_at,
    mi.name AS item_name,
    oi.quantity,
    oi.price AS item_price,
    oi.total AS item_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE o.id = 1  -- Change order ID as needed
ORDER BY oi.id;

-- ============================================
-- 12. UPDATE ORDER STATUS (Example)
-- ============================================
-- UPDATE orders 
-- SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
-- WHERE id = 1;

-- ============================================
-- 13. VIEW ALL MENU ITEMS
-- ============================================
SELECT 
    id,
    name,
    description,
    price,
    category,
    is_available,
    created_at
FROM menu_items
ORDER BY category, name;

-- ============================================
-- 14. VIEW MENU ITEMS BY CATEGORY
-- ============================================
SELECT 
    id,
    name,
    description,
    price,
    is_available
FROM menu_items
WHERE category = 'breakfast'  -- Change to: breakfast, lunch, snacks, dinner, beverages, icecreams
ORDER BY name;

-- ============================================
-- 15. REVENUE BY CATEGORY
-- ============================================
SELECT 
    mi.category,
    COUNT(DISTINCT oi.order_id) AS orders_count,
    SUM(oi.quantity) AS items_sold,
    SUM(oi.total) AS revenue
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
GROUP BY mi.category
ORDER BY revenue DESC;

-- ============================================
-- 16. PENDING ORDERS COUNT
-- ============================================
SELECT COUNT(*) AS pending_orders_count
FROM orders
WHERE status = 'pending';

-- ============================================
-- 17. VIEW RECENT ORDERS (LAST 10)
-- ============================================
SELECT 
    id,
    customer_name,
    customer_phone,
    total_amount,
    status,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 18. DELETE TEST DATA (Use with caution!)
-- ============================================
-- DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE status = 'test');
-- DELETE FROM orders WHERE status = 'test';

-- ============================================
-- 19. VIEW ORDER ITEMS TABLE
-- ============================================
SELECT 
    oi.id,
    oi.order_id,
    oi.menu_item_id,
    mi.name AS item_name,
    oi.quantity,
    oi.price,
    oi.total,
    oi.created_at
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
ORDER BY oi.order_id DESC, oi.id;

-- ============================================
-- 20. CUSTOMER ORDER HISTORY
-- ============================================
SELECT 
    id,
    customer_name,
    customer_phone,
    total_amount,
    status,
    created_at
FROM orders
WHERE customer_phone = '1234567890'  -- Replace with actual phone number
ORDER BY created_at DESC;

-- ============================================
-- NOTES:
-- ============================================
-- 1. This database uses SQLite syntax
-- 2. To use in MySQL/PostgreSQL, modify DATE functions:
--    - SQLite: DATE('now') 
--    - MySQL: CURDATE()
--    - PostgreSQL: CURRENT_DATE
-- 3. Change status values: pending, confirmed, preparing, ready, delivered, cancelled
-- 4. Always backup database before running UPDATE or DELETE queries
-- ============================================

