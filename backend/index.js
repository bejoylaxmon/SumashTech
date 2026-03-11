const express = require('express');
const cors = require('cors');
require('dotenv').config();
const xlsx = require('xlsx');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

const upload = multer({ dest: 'uploads/' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL.replace('localhost', '127.0.0.1')
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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
        const { name, slug, description, price, discount, stock, images, categoryId, brandId, isFeatured, isNew, sku, bookingMoney, purchasePoints, warranty, condition, peopleViewing, specifications, variants } = req.body;

        if (isAdmin) {
            Object.assign(allowedData, { 
                name, slug, description, price, discount, stock, images, categoryId, brandId, isFeatured, isNew,
                sku, bookingMoney, purchasePoints, warranty, condition, peopleViewing, specifications
            });
        } else {
            if (isEditor) {
                Object.assign(allowedData, { 
                    name, slug, description, price, discount, images, categoryId, brandId, isFeatured, isNew,
                    sku, bookingMoney, purchasePoints, warranty, condition, specifications
                });
            }
            if (isManager) {
                Object.assign(allowedData, { stock, peopleViewing });
            }
        }

        const product = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: allowedData
        });

        // Update variants if provided
        if (variants && isAdmin) {
            // Get existing variants
            const existingVariants = await prisma.productVariant.findMany({
                where: { productId: parseInt(req.params.id) }
            });

            // Delete variants not in the new list
            const newVariantIds = variants.filter((v) => v.id).map((v) => v.id);
            await prisma.productVariant.deleteMany({
                where: { 
                    productId: parseInt(req.params.id),
                    id: { notIn: newVariantIds }
                }
            });

            // Upsert variants
            for (const v of variants) {
                if (v.id) {
                    // Update existing
                    await prisma.productVariant.update({
                        where: { id: v.id },
                        data: {
                            value: v.value,
                            price: parseFloat(v.price) || 0,
                            stock: parseInt(v.stock) || 0,
                            images: v.images || []
                        }
                    });
                } else {
                    // Create new
                    await prisma.productVariant.create({
                        data: {
                            productId: parseInt(req.params.id),
                            type: v.type,
                            value: v.value,
                            price: parseFloat(v.price) || 0,
                            stock: parseInt(v.stock) || 0,
                            images: v.images || []
                        }
                    });
                }
            }
        }

        // Fetch updated product with variants
        const updatedProduct = await prisma.product.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { variants: true }
        });

        res.json(updatedProduct);
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
        const categories = await prisma.category.findMany({
            include: {
                parent: true,
                children: true
            }
        });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Products
// Create Category (Admin)
app.post('/api/categories', checkPermission(['edit_product_full', 'manage_inventory', 'edit_product_content']), async (req, res) => {
    try {
        const { name, parentId } = req.body;
        const slug = req.body.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const category = await prisma.category.create({ 
            data: { name, slug, parentId: parentId || null } 
        });
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

// Get All Brands
app.get('/api/brands', async (req, res) => {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(brands);
    } catch (err) {
        console.error('Brands fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});

// Create Product (Admin)
app.post('/api/products', checkPermission(['edit_product_full', 'manage_inventory']), async (req, res) => {
    try {
        const { 
            name, description, price, discount, stock, images, categoryId, brandId, 
            isFeatured, isNew, sku, bookingMoney, purchasePoints, warranty, 
            specifications, condition, peopleViewing, variants 
        } = req.body;
        const slug = req.body.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        const product = await prisma.product.create({
            data: { 
                name, 
                slug, 
                description, 
                price: parseFloat(price) || 0, 
                discount: parseFloat(discount) || 0, 
                stock: parseInt(stock) || 0, 
                images: images || [], 
                categoryId: parseInt(categoryId), 
                brandId: brandId ? parseInt(brandId) : null,
                isFeatured: isFeatured || false,
                isNew: isNew || false,
                sku: sku || null,
                bookingMoney: parseFloat(bookingMoney) || 0,
                purchasePoints: parseInt(purchasePoints) || 0,
                warranty: warranty || null,
                specifications: specifications || null,
                condition: condition || null,
                peopleViewing: parseInt(peopleViewing) || 0,
                variants: variants ? {
                    create: variants.map((v) => ({
                        type: v.type,
                        value: v.value,
                        price: parseFloat(v.price) || 0,
                        stock: parseInt(v.stock) || 0,
                        sku: v.sku || null,
                        images: v.images || []
                    }))
                } : undefined
            },
            include: { variants: true }
        });
        res.status(201).json(product);
    } catch (err) {
        console.error('Product creation error:', err);
        res.status(500).json({ error: 'Failed to create product', details: err.message });
    }
});

// Upload Product Image
app.post('/api/upload/image', uploadImage.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ url: imageUrl });
    } catch (err) {
        console.error('Image upload error:', err);
        res.status(500).json({ error: 'Failed to upload image' });
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
                variants: true,
            },
        });
        
        // Get ratings for all products (with error handling)
        const productsWithRatings = await Promise.all(products.map(async (product) => {
            try {
                const reviews = await prisma.review.findMany({
                    where: { productId: product.id }
                });
                const rating = reviews.length > 0
                    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
                    : 0;
                return { ...product, rating };
            } catch (e) {
                return { ...product, rating: 0 };
            }
        }));
        
        res.json(productsWithRatings);
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
                variants: true,
            },
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        
        // Get actual rating from reviews (with error handling)
        let rating = 0;
        try {
            const reviews = await prisma.review.findMany({
                where: { productId: product.id }
            });
            rating = reviews.length > 0
                ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
                : 0;
        } catch (e) {
            // Review table might not exist yet
            rating = 0;
        }
        
        res.json({ ...product, rating });
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Download Sample XLSX Template
app.get('/api/products/sample-template', (req, res) => {
    try {
        const sampleData = [
            {
                name: "iPhone 17 Pro Max",
                slug: "iphone-17-pro-max",
                description: "Latest iPhone with advanced features",
                price: 171999,
                discount: 0,
                stock: 50,
                category: "Smartphone",
                brand: "Apple",
                sku: "IP17PM256",
                bookingMoney: 10000,
                purchasePoints: 500,
                warranty: "2 Years Service Warranty",
                condition: "Brand New",
                isFeatured: true,
                isNew: true,
                storage_1: "256GB",
                storage_price_1: 171999,
                storage_stock_1: 20,
                storage_2: "512GB",
                storage_price_2: 190000,
                storage_stock_2: 15,
                storage_3: "1TB",
                storage_price_3: 210000,
                storage_stock_3: 10,
                color_1: "Cosmic Orange",
                color_price_1: 0,
                color_stock_1: 20,
                color_images_1: "https://example.com/orange1.jpg,https://example.com/orange2.jpg",
                color_2: "Titanium",
                color_price_2: 0,
                color_stock_2: 15,
                color_images_2: "https://example.com/titanium1.jpg,https://example.com/titanium2.jpg",
                color_3: "Black",
                color_price_3: 0,
                color_stock_3: 15,
                color_images_3: "https://example.com/black1.jpg,https://example.com/black2.jpg",
                region_1: "Japan",
                region_price_1: 0,
                region_stock_1: 20,
                region_2: "USA",
                region_price_2: 0,
                region_stock_2: 15,
                region_3: "India",
                region_price_3: 0,
                region_stock_3: 15,
                specifications: '{"display":"6.9″ LTPO Super Retina XDR OLED 120Hz","processor":"Apple A19 Pro","camera":"Triple 48MP Fusion","battery":"4832 mAh"}'
            }
        ];

        const ws = xlsx.utils.json_to_sheet(sampleData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Products");
        
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename=product_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error('Template error:', err);
        res.status(500).json({ error: 'Failed to generate template' });
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
app.patch('/api/promotions/popup/:id', checkPermission(['manage_products', 'edit_shop', 'manage_inventory']), async (req, res) => {
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

// Create Popup Offer (Admin)
app.post('/api/promotions/popup', checkPermission(['manage_products', 'edit_shop', 'manage_inventory']), async (req, res) => {
    try {
        const { title, description, image, link, isActive } = req.body;
        const popup = await prisma.popupOffer.create({
            data: { title, description, image, link, isActive: isActive ?? true }
        });
        res.status(201).json(popup);
    } catch (err) {
        console.error('Popup creation error:', err);
        res.status(500).json({ error: 'Failed to create popup offer' });
    }
});

// Delete Popup Offer (Admin)
app.delete('/api/promotions/popup/:id', checkPermission(['manage_products', 'edit_shop', 'manage_inventory']), async (req, res) => {
    try {
        await prisma.popupOffer.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete popup offer' });
    }
});

// Get All Popup Offers (Admin)
app.get('/api/admin/promotions/popup', checkPermission(['manage_products', 'edit_shop', 'manage_inventory']), async (req, res) => {
    try {
        const popups = await prisma.popupOffer.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(popups);
    } catch (err) {
        console.error('Popup fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch popup offers' });
    }
});

// Home Settings (Public - for reading)
app.get('/api/home-settings', async (req, res) => {
    try {
        let settings = await prisma.homeSettings.findFirst();
        if (!settings) {
            settings = await prisma.homeSettings.create({
                data: {}
            });
        }
        res.json(settings);
    } catch (err) {
        console.error('Home settings fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch home settings' });
    }
});

// Update Home Settings (Admin)
app.put('/api/home-settings', checkPermission(['manage_products', 'edit_shop', 'manage_inventory']), async (req, res) => {
    try {
        console.log('PUT /api/home-settings body:', req.body);
        const { phone, address, heroSlides } = req.body;
        
        let settings = await prisma.homeSettings.findFirst();
        if (!settings) {
            settings = await prisma.homeSettings.create({
                data: { phone, address, heroSlides }
            });
        } else {
            settings = await prisma.homeSettings.update({
                where: { id: settings.id },
                data: { phone, address, heroSlides }
            });
        }
        res.json(settings);
    } catch (err) {
        console.error('Home settings update error:', err);
        res.status(500).json({ error: 'Failed to update home settings', details: err.message });
    }
});

// Get all CMS pages (Admin)
app.get('/api/admin/pages', checkPermission(['manage_products', 'edit_shop', 'manage_inventory']), async (req, res) => {
    try {
        const pages = await prisma.pageContent.findMany({
            orderBy: { slug: 'asc' }
        });
        res.json(pages);
    } catch (err) {
        console.error('Pages fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch pages' });
    }
});

// Get single CMS page (Public)
app.get('/api/pages/:slug', async (req, res) => {
    try {
        const page = await prisma.pageContent.findUnique({
            where: { slug: req.params.slug }
        });
        if (!page) return res.status(404).json({ error: 'Page not found' });
        res.json(page);
    } catch (err) {
        console.error('Page fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch page' });
    }
});

// Update CMS page (Admin)
app.put('/api/pages/:slug', checkPermission(['manage_products', 'edit_shop', 'manage_inventory']), async (req, res) => {
    try {
        const { title, content, isActive } = req.body;
        const page = await prisma.pageContent.upsert({
            where: { slug: req.params.slug },
            update: { title, content, isActive },
            create: { slug: req.params.slug, title, content, isActive: isActive ?? true }
        });
        res.json(page);
    } catch (err) {
        console.error('Page update error:', err);
        res.status(500).json({ error: 'Failed to update page' });
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

// Admin: Low Stock Products
app.get('/api/admin/reports/low-stock', checkPermission(['view_financial_reports', 'manage_inventory']), async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 10;
        const lowStockProducts = await prisma.product.findMany({
            where: {
                stock: {
                    lte: threshold
                }
            },
            include: {
                category: { select: { name: true } }
            },
            orderBy: { stock: 'asc' }
        });
        res.json({ products: lowStockProducts, threshold });
    } catch (err) {
        console.error('Low stock report error:', err);
        res.status(500).json({ error: 'Failed to fetch low stock report' });
    }
});

// User: Get Own Orders
app.get('/api/orders/user/:email', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { email: req.params.email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const orders = await prisma.order.findMany({
            where: { userId: user.id },
            include: { 
                items: { 
                    include: { 
                        product: true,
                        review: true
                    } 
                } 
            },
            orderBy: { createdAt: 'desc' }
        });
        
        const ordersWithRating = orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                rating: item.review?.rating || null
            }))
        }));
        
        res.json(ordersWithRating);
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

// Submit a review (only for delivered orders)
app.post('/api/reviews', async (req, res) => {
    try {
        const { orderItemId, rating, comment } = req.body;
        const email = req.headers['x-user-email'];

        if (!email) return res.status(401).json({ error: 'Unauthorized' });
        if (!orderItemId || !rating) {
            return res.status(400).json({ error: 'orderItemId and rating are required' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const orderItem = await prisma.orderItem.findUnique({
            where: { id: orderItemId },
            include: { order: true, product: true }
        });

        if (!orderItem) return res.status(404).json({ error: 'Order item not found' });
        if (orderItem.order.userId !== user.id) {
            return res.status(403).json({ error: 'Not authorized to review this item' });
        }
        if (orderItem.order.status !== 'DELIVERED') {
            return res.status(400).json({ error: 'Can only review delivered orders' });
        }

        const existingReview = await prisma.review.findUnique({
            where: { orderItemId }
        });
        if (existingReview) {
            return res.status(400).json({ error: 'Already reviewed this item' });
        }

        const review = await prisma.review.create({
            data: {
                orderItemId,
                productId: orderItem.productId,
                userId: user.id,
                rating,
                comment
            }
        });

        // Update product rating (average of all reviews)
        const reviews = await prisma.review.findMany({
            where: { productId: orderItem.productId }
        });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await prisma.product.update({
            where: { id: orderItem.productId },
            data: { rating: Math.round(avgRating * 10) / 10 }
        });

        res.status(201).json(review);
    } catch (err) {
        console.error('Review error:', err);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// Get reviews for a product
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });

        let reviews = [];
        try {
            reviews = await prisma.review.findMany({
                where: { productId },
                include: {
                    orderItem: {
                        include: {
                            order: {
                                include: { user: { select: { name: true } } }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (e) {
            // Review table might not exist yet
            reviews = [];
        }

        const reviewsWithUser = reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            userName: r.orderItem?.order?.user?.name || 'Anonymous',
            createdAt: r.createdAt
        }));

        res.json(reviewsWithUser);
    } catch (err) {
        console.error('Fetch reviews error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Get average rating for a product
app.get('/api/products/:id/rating', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });

        const reviews = await prisma.review.findMany({
            where: { productId }
        });

        if (reviews.length === 0) {
            return res.json({ averageRating: 0, totalReviews: 0 });
        }

        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        res.json({
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length
        });
    } catch (err) {
        console.error('Fetch rating error:', err);
        res.status(500).json({ error: 'Failed to fetch rating' });
    }
});

// Check if user can review an order item
app.get('/api/orders/:orderId/items/:itemId/can-review', async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const email = req.headers['x-user-email'];

        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) },
            include: {
                items: {
                    where: { id: parseInt(itemId) },
                    include: { product: true }
                }
            }
        });

        if (!order || order.items.length === 0) {
            return res.status(404).json({ error: 'Order item not found' });
        }
        if (order.userId !== user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        if (order.status !== 'DELIVERED') {
            return res.json({ canReview: false, reason: 'Order not delivered yet' });
        }

        const existingReview = await prisma.review.findUnique({
            where: { orderItemId: parseInt(itemId) }
        });

        res.json({ canReview: !existingReview, hasReviewed: !!existingReview });
    } catch (err) {
        console.error('Check review status error:', err);
        res.status(500).json({ error: 'Failed to check review status' });
    }
});

// Bulk Upload Products from XLSX
app.post('/api/products/bulk-upload', checkPermission(['edit_product_full', 'manage_inventory']), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const products = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!products || products.length === 0) {
            return res.status(400).json({ error: 'No data found in Excel file' });
        }

        const results = [];
        const errors = [];

        for (const row of products) {
            try {
                // Find category
                let categoryId = null;
                if (row.category) {
                    const category = await prisma.category.findFirst({
                        where: { 
                            OR: [
                                { name: { equals: row.category, mode: 'insensitive' } },
                                { slug: { equals: row.category.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } }
                            ]
                        }
                    });
                    categoryId = category?.id;
                }

                // Find brand
                let brandId = null;
                if (row.brand) {
                    const brand = await prisma.brand.findFirst({
                        where: { 
                            OR: [
                                { name: { equals: row.brand, mode: 'insensitive' } },
                                { slug: { equals: row.brand.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } }
                            ]
                        }
                    });
                    brandId = brand?.id;
                }

                // Parse specifications
                let specifications = null;
                if (row.specifications) {
                    try {
                        specifications = typeof row.specifications === 'string' 
                            ? JSON.parse(row.specifications) 
                            : row.specifications;
                    } catch (e) {
                        specifications = null;
                    }
                }

                // Create product
                const product = await prisma.product.create({
                    data: {
                        name: row.name,
                        slug: row.slug || row.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                        description: row.description || null,
                        price: parseFloat(row.price) || 0,
                        discount: parseFloat(row.discount) || 0,
                        stock: parseInt(row.stock) || 0,
                        categoryId: categoryId || 1,
                        brandId: brandId,
                        sku: row.sku || null,
                        bookingMoney: parseFloat(row.bookingMoney) || 0,
                        purchasePoints: parseInt(row.purchasePoints) || 0,
                        warranty: row.warranty || null,
                        condition: row.condition || null,
                        isFeatured: row.isFeatured === true || row.isFeatured === 'true' || row.isFeatured === 1,
                        isNew: row.isNew === true || row.isNew === 'true' || row.isNew === 1,
                        specifications: specifications,
                        images: []
                    }
                });

                // Create storage variants
                for (let i = 1; i <= 4; i++) {
                    const storageKey = `storage_${i}`;
                    const priceKey = `storage_price_${i}`;
                    const stockKey = `storage_stock_${i}`;
                    
                    if (row[storageKey]) {
                        await prisma.productVariant.create({
                            data: {
                                productId: product.id,
                                type: 'storage',
                                value: row[storageKey],
                                price: parseFloat(row[priceKey]) || 0,
                                stock: parseInt(row[stockKey]) || 0
                            }
                        });
                    }
                }

                // Create color variants
                for (let i = 1; i <= 5; i++) {
                    const colorKey = `color_${i}`;
                    const priceKey = `color_price_${i}`;
                    const stockKey = `color_stock_${i}`;
                    const imagesKey = `color_images_${i}`;
                    
                    if (row[colorKey]) {
                        let colorImages = [];
                        if (row[imagesKey]) {
                            colorImages = row[imagesKey].split(',').map((url) => url.trim()).filter((url) => url);
                        }
                        await prisma.productVariant.create({
                            data: {
                                productId: product.id,
                                type: 'color',
                                value: row[colorKey],
                                price: parseFloat(row[priceKey]) || 0,
                                stock: parseInt(row[stockKey]) || 0,
                                images: colorImages
                            }
                        });
                    }
                }

                // Create region variants
                for (let i = 1; i <= 5; i++) {
                    const regionKey = `region_${i}`;
                    const priceKey = `region_price_${i}`;
                    const stockKey = `region_stock_${i}`;
                    
                    if (row[regionKey]) {
                        await prisma.productVariant.create({
                            data: {
                                productId: product.id,
                                type: 'region',
                                value: row[regionKey],
                                price: parseFloat(row[priceKey]) || 0,
                                stock: parseInt(row[stockKey]) || 0
                            }
                        });
                    }
                }

                results.push({ name: product.name, status: 'success' });
            } catch (err) {
                errors.push({ name: row.name, error: err.message });
            }
        }

        res.json({
            success: results.length,
            failed: errors.length,
            results,
            errors
        });
    } catch (err) {
        console.error('Bulk upload error:', err);
        res.status(500).json({ error: 'Failed to upload products', details: err.message });
    }
});

const PORT = process.env.PORT || 54321;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
    console.error('Server failed to start:', err);
});
