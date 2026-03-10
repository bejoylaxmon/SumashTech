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
const checkPermission = (permissions) => async (req, res, next) => {
    try {
        const email = req.headers['x-user-email'];
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: { include: { permissions: true } } }
        });

        if (!user || !user.role) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
        const hasPermission = user.role.permissions.some(p => requiredPermissions.includes(p.name));

        if (!hasPermission) {
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
// Update Product (Admin)
app.put('/api/products/:id', checkPermission(['edit_product_full', 'edit_product_stock', 'edit_product_content']), async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: { include: { permissions: true } } }
        });

        const perms = user.role.permissions.map(p => p.name);
        const isAdmin = perms.includes('edit_product_full');
        const isManager = perms.includes('edit_product_stock');
        const isEditor = perms.includes('edit_product_content');

        const allowedData = {};
        const { name, slug, description, price, discount, stock, images, categoryId, brandId, isFeatured, isNew } = req.body;

        if (isAdmin) {
            Object.assign(allowedData, { name, slug, description, price, discount, stock, images, categoryId, brandId, isFeatured, isNew });
        } else {
            if (isEditor) {
                // Editor can edit content and pricing (as per matrix)
                Object.assign(allowedData, { name, slug, description, price, discount, images, categoryId, brandId, isFeatured, isNew });
            }
            if (isManager) {
                // Manager can edit stock and coupons (in this route just stock)
                Object.assign(allowedData, { stock });
            }
        }

        const product = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: allowedData
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

// Temporary Seed Route
app.get('/api/seed', async (req, res) => {
    try {
        // 1. Permissions
        const permissionsData = ['manage_products', 'manage_categories', 'manage_brands', 'view_orders', 'manage_orders', 'manage_users', 'view_reports', 'buy_products', 'view_own_orders'];
        const permissions = {};
        for (const p of permissionsData) {
            permissions[p] = await prisma.permission.upsert({ where: { name: p }, update: {}, create: { name: p } });
        }

        // 2. Roles
        const rolesData = [
            { name: 'SUPER_ADMIN', permissions: permissionsData },
            { name: 'CUSTOMER', permissions: ['buy_products', 'view_own_orders'] }
        ];
        const roles = {};
        for (const r of rolesData) {
            roles[r.name] = await prisma.role.upsert({
                where: { name: r.name },
                update: { permissions: { set: r.permissions.map(p => ({ id: permissions[p].id })) } },
                create: { name: r.name, permissions: { connect: r.permissions.map(p => ({ id: permissions[p].id })) } }
            });
        }

        // 3. Admin User
        await prisma.user.upsert({
            where: { email: 'admin@sumashtech.com' },
            update: { roleId: roles['SUPER_ADMIN'].id },
            create: { email: 'admin@sumashtech.com', name: 'Admin User', password: 'admin123', roleId: roles['SUPER_ADMIN'].id }
        });

        // 4. Categories & Brands
        const cat = await prisma.category.upsert({ where: { slug: 'smartphone' }, update: {}, create: { name: 'Smartphone', slug: 'smartphone' } });
        const brand = await prisma.brand.upsert({ where: { slug: 'apple' }, update: {}, create: { name: 'Apple', slug: 'apple' } });

        // 5. Products (including out of stock)
        const products = [
            { name: 'iPhone 15 Pro', slug: 'iphone-15-pro', price: 120000, stock: 10, isFeatured: true, isNew: true },
            { name: 'iPhone 14', slug: 'iphone-14', price: 90000, stock: 0, isFeatured: false, isNew: false }, // OUT OF STOCK
            { name: 'iPhone 13', slug: 'iphone-13', price: 75000, stock: 2, isFeatured: true, isNew: false }  // LOW STOCK
        ];

        for (const p of products) {
            await prisma.product.upsert({
                where: { slug: p.slug },
                update: { stock: p.stock },
                create: { ...p, categoryId: cat.id, brandId: brand.id, images: ['https://placehold.co/600x400?text=' + p.name] }
            });
        }

        res.json({ message: 'Seeding successful' });
    } catch (err) {
        console.error('Seed error:', err);
        res.status(500).json({ error: 'Seeding failed', details: err.message });
    }
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
app.post('/api/categories', checkPermission(['edit_product_full', 'manage_inventory', 'edit_product_content']), async (req, res) => {
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
app.put('/api/categories/:id', checkPermission(['edit_product_full', 'manage_inventory', 'edit_product_content']), async (req, res) => {
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
app.post('/api/products', checkPermission(['edit_product_full', 'manage_inventory']), async (req, res) => {
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
        const { category, isFeatured, isNew, search } = req.query;
        const filter = {};
        if (category) filter.category = { slug: category };
        if (isFeatured === 'true') filter.isFeatured = true;
        if (isNew === 'true') filter.isNew = true;
        if (search) {
            filter.name = {
                contains: search,
                mode: 'insensitive'
            };
        }

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
app.patch('/api/products/:id/featured', checkPermission(['edit_product_full', 'edit_product_content']), async (req, res) => {
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

// Delete Product (Admin)
app.delete('/api/products/:id', checkPermission(['edit_product_full', 'manage_inventory']), async (req, res) => {
    try {
        await prisma.product.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(404).json({ error: 'Product not found' });
    }
});

// Admin: Get All Orders
app.get('/api/admin/orders', checkPermission('view_orders_all'), async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: { select: { name: true, email: true } },
                items: { include: { product: true } },
                verifiedBy: { select: { name: true } },
                shippedBy: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (err) {
        console.error('Admin orders fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch admin orders' });
    }
});

// Admin: Update Order Status
app.patch('/api/admin/orders/:id', checkPermission(['assign_courier', 'generate_invoice', 'verify_order_status', 'delete_refund_order']), async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: { include: { permissions: true } } }
        });

        const perms = user.role.permissions.map(p => p.name);
        const isAdmin = perms.includes('delete_refund_order');
        const isManager = perms.includes('assign_courier') || perms.includes('generate_invoice');
        const isSales = perms.includes('verify_order_status');

        const allowedData = {};
        const { status, courierName, trackingNumber, invoiceUrl } = req.body;

        if (isAdmin) {
            Object.assign(allowedData, { status, courierName, trackingNumber, invoiceUrl });
        } else {
            if (isSales) {
                if (status === 'VERIFIED') {
                    allowedData.status = 'VERIFIED';
                    allowedData.verifiedById = user.id;
                }
                if (status === 'DELIVERED') {
                    allowedData.status = 'DELIVERED';
                }
            }
            if (isManager) {
                if (status) {
                    allowedData.status = status;
                    if (status === 'SHIPPED') allowedData.shippedById = user.id;
                    if (status === 'DELIVERED') allowedData.status = 'DELIVERED';
                }
                if (courierName) allowedData.courierName = courierName;
                if (trackingNumber) allowedData.trackingNumber = trackingNumber;
                if (invoiceUrl) allowedData.invoiceUrl = invoiceUrl;
            }
        }

        if (isAdmin && status === 'CANCELLED') {
            allowedData.refundedById = user.id;
        }

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(req.params.id) },
            data: allowedData
        });

        if (status === 'DELIVERED') {
            console.log(`[SMS] To ${updatedOrder.phone}: Thank you for shopping with Sumash Tech! Your warranty for the products in order #${updatedOrder.id} starts today.`);
        }

        res.json(updatedOrder);
    } catch (err) {
        console.error('Order status update error:', err);
        res.status(500).json({ error: 'Failed to update order' });
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
app.get('/api/admin/reports/sales', checkPermission('view_financial_reports'), async (req, res) => {
    try {
        const allOrders = await prisma.order.findMany({
            include: {
                user: { select: { name: true, email: true } },
                items: { include: { product: true } },
                verifiedBy: { select: { name: true } },
                shippedBy: { select: { name: true } },
                refundedBy: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const deliveredOrders = allOrders.filter(o => o.status === 'DELIVERED');
        const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);

        const statusCounts = allOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        // Add Audit details to the last 10 orders for step 5 monitoring
        const recentOrdersWithAudit = allOrders.slice(0, 10).map(o => ({
            id: o.id,
            customer: o.user.name,
            total: o.total,
            status: o.status,
            verifiedBy: o.verifiedBy?.name || 'Pending',
            shippedBy: o.shippedBy?.name || 'Pending',
            refundedBy: o.refundedBy?.name || 'N/A',
            createdAt: o.createdAt
        }));

        res.json({
            totalSales,
            orderCount: allOrders.length,
            deliveredCount: deliveredOrders.length,
            statusCounts,
            recentOrders: recentOrdersWithAudit
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

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Check if user exists before attempting to create order
        const userExists = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!userExists) {
            return res.status(404).json({ error: 'User not found. Please log in again.' });
        }

        // Transaction to ensure both order creation and stock reduction succeed
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the order
            const order = await tx.order.create({
                data: {
                    userId: parseInt(userId),
                    total: parseFloat(total),
                    address,
                    phone,
                    paymentMethod,
                    items: {
                        create: items.map(item => ({
                            productId: parseInt(item.productId),
                            quantity: parseInt(item.quantity),
                            price: parseFloat(item.price)
                        }))
                    }
                },
                include: { items: true }
            });

            // 2. Reduce stock for each product
            for (const item of items) {
                const product = await tx.product.findUnique({ where: { id: parseInt(item.productId) } });
                if (!product || product.stock < parseInt(item.quantity)) {
                    throw new Error(`Insufficient stock for product: ${product?.name || item.productId}`);
                }

                await tx.product.update({
                    where: { id: parseInt(item.productId) },
                    data: { stock: { decrement: parseInt(item.quantity) } }
                });
            }

            return order;
        });

        // 3. Simulated Notification (Step 1)
        console.log(`[step 1] NOTIFICATION: Order #${result.id} placed by user ${result.userId}. Sending confirmation Email/SMS to customer...`);

        res.json(result);
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({
            error: 'Failed to create order',
            details: err.message,
            code: err.code // Prisma error codes
        });
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
