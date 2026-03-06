const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL.replace('localhost', '127.0.0.1')
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();

app.use(cors());
app.use(express.json());

// Routes
// Admin Middleware
const checkPermission = (permission) => async (req, res, next) => {
    try {
        const email = req.headers['x-user-email'];
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: { include: { permissions: true } } }
        });

        if (!user || !user.role || !user.role.permissions.some(p => p.name === permission)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    } catch (err) {
        console.error('Permission check error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Get default CUSTOMER role
        const role = await prisma.role.findFirst({ where: { name: 'CUSTOMER' } });

        const user = await prisma.user.create({
            data: {
                email,
                password, // Note: In production, use bcrypt to hash passwords
                name,
                roleId: role?.id
            },
            include: { role: true }
        });

        res.status(201).json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role?.name,
            permissions: [] // New customers have no special permissions
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create user', details: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: { include: { permissions: true } } }
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role?.name,
            permissions: user.role?.permissions.map(p => p.name) || []
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

// Update Product (Admin)
app.put('/api/products/:id', checkPermission('manage_products'), async (req, res) => {
    try {
        const { name, slug, description, price, discount, stock, images, categoryId, brandId, isFeatured, isNew } = req.body;
        const product = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: { name, slug, description, price, discount, stock, images, categoryId, brandId, isFeatured, isNew }
        });
        res.json(product);
    } catch (err) {
        console.error('Product update error:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.get('/api/users/:email', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: req.params.email },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user permissions', details: err.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// Categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Products
// Create Category (Admin)
app.post('/api/categories', checkPermission('manage_categories'), async (req, res) => {
    try {
        const category = await prisma.category.create({ data: req.body });
        res.status(201).json(category);
    } catch (err) {
        console.error('Category creation error:', err);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Get Single Category (Admin/Public)
app.get('/api/categories/:id', async (req, res) => {
    try {
        const category = await prisma.category.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.json(category);
    } catch (err) {
        console.error('Fetch category error:', err);
        res.status(500).json({ error: 'Failed to fetch category', details: err.message });
    }
});

// Update Category (Admin)
app.put('/api/categories/:id', checkPermission('manage_categories'), async (req, res) => {
    try {
        const category = await prisma.category.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json(category);
    } catch (err) {
        console.error('Category update error:', err);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Create Product (Admin)
app.post('/api/products', checkPermission('manage_products'), async (req, res) => {
    try {
        const { name, slug, description, price, discount, stock, images, categoryId, brandId, isFeatured, isNew } = req.body;
        const product = await prisma.product.create({
            data: { name, slug, description, price, discount, stock, images, categoryId, brandId, isFeatured, isNew }
        });
        res.status(201).json(product);
    } catch (err) {
        console.error('Product creation error:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const { category, isFeatured, isNew } = req.query;
        const filter = {};
        if (category) filter.category = { slug: category };
        if (isFeatured === 'true') filter.isFeatured = true;
        if (isNew === 'true') filter.isNew = true;

        const products = await prisma.product.findMany({
            where: filter,
            include: {
                category: true,
                brand: true,
            },
        });
        res.json(products);
    } catch (err) {
        console.error('Failed to fetch products:', err);
        res.status(500).json({ error: 'Failed to fetch products', details: err.message });
    }
});

// Get Single Product by Slug (Public)
app.get('/api/products/slug/:slug', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { slug: req.params.slug },
            include: {
                category: true,
                brand: true,
            },
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Get Single Product by ID (Internal/Admin)
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { category: true, brand: true }
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Popup Offer (Public)
app.get('/api/promotions/popup', async (req, res) => {
    try {
        const popup = await prisma.popupOffer.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(popup || {});
    } catch (err) {
        console.error('Popup fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch popup offer', details: err.message });
    }
});

// Update Popup Offer (Admin)
app.patch('/api/promotions/popup/:id', checkPermission('manage_products'), async (req, res) => {
    try {
        const popup = await prisma.popupOffer.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json(popup);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update popup offer' });
    }
});

// Toggle Featured Status (Admin)
app.patch('/api/products/:id/featured', checkPermission('manage_products'), async (req, res) => {
    try {
        const product = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: { isFeatured: req.body.isFeatured }
        });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update featured status' });
    }
});

// Admin: Get All Orders
app.get('/api/admin/orders', checkPermission('view_orders'), async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: { user: { select: { name: true, email: true } }, items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (err) {
        console.error('Admin orders fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch admin orders' });
    }
});

// Admin: Update Order Status
app.patch('/api/admin/orders/:id', checkPermission('manage_orders'), async (req, res) => {
    try {
        const order = await prisma.order.update({
            where: { id: parseInt(req.params.id) },
            data: { status: req.body.status }
        });
        res.json(order);
    } catch (err) {
        console.error('Order status update error:', err);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Admin: Get All Users
app.get('/api/admin/users', checkPermission('manage_users'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { role: true }
        });
        res.json(users);
    } catch (err) {
        console.error('Admin users fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Admin: Update User Role
app.patch('/api/admin/users/:id/role', checkPermission('manage_users'), async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: parseInt(req.params.id) },
            data: { roleId: req.body.roleId }
        });
        res.json(user);
    } catch (err) {
        console.error('User role update error:', err);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Admin: Get Roles
app.get('/api/admin/roles', checkPermission('manage_users'), async (req, res) => {
    try {
        const roles = await prisma.role.findMany();
        res.json(roles);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

// Admin: Reports
app.get('/api/admin/reports/sales', checkPermission('view_reports'), async (req, res) => {
    try {
        const allOrders = await prisma.order.findMany({
            select: { total: true, createdAt: true, status: true }
        });

        const deliveredOrders = allOrders.filter(o => o.status === 'DELIVERED');
        const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);

        const statusCounts = allOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        res.json({
            totalSales,
            orderCount: allOrders.length,
            deliveredCount: deliveredOrders.length,
            statusCounts,
            orders: deliveredOrders.slice(0, 5) // Show last 5 delivered
        });
    } catch (err) {
        console.error('Sales report error:', err);
        res.status(500).json({ error: 'Failed to fetch sales report' });
    }
});

// User: Get Own Orders
app.get('/api/orders/user/:email', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { email: req.params.email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const orders = await prisma.order.findMany({
            where: { userId: user.id },
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (err) {
        console.error('User orders fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch your orders' });
    }
});

// Create Order
app.post('/api/orders', async (req, res) => {
    try {
        const { userId, total, items, address, phone, paymentMethod } = req.body;
        const order = await prisma.order.create({
            data: {
                userId: parseInt(userId),
                total,
                address,
                phone,
                paymentMethod,
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        });
        res.json(order);
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to create order', details: err.message });
    }
});

// Track Order
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: true,
            },
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        console.error('Failed to fetch order:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

const PORT = process.env.PORT || 54321;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
    console.error('Server failed to start:', err);
});
