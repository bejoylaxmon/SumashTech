require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const pool = new Pool({ connectionString: process.env.DATABASE_URL.replace('localhost', '127.0.0.1') });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding database...");

    // 1. Permissions
    const permissionsData = [
        'view_shop', 'edit_shop',
        'view_product_detail', 'edit_product_full', 'edit_product_stock', 'edit_product_content',
        'manage_users',
        'view_orders_all', 'create_orders_manual',
        'view_financial_reports',
        'manage_inventory',
        'manage_coupons',
        'manage_settings',
        'buy_products', 'view_own_orders',
        'verify_order_phone', 'verify_order_status',
        'assign_courier', 'generate_invoice',
        'delete_refund_order'
    ];

    const permissions = {};
    for (const p of permissionsData) {
        permissions[p] = await prisma.permission.upsert({
            where: { name: p },
            update: {},
            create: { name: p },
        });
    }

    // 2. Roles
    const rolesData = [
        {
            name: 'SUPER_ADMIN',
            permissions: permissionsData,
        },
        {
            name: 'MANAGER',
            permissions: [
                'view_shop', 'edit_shop',
                'view_product_detail', 'edit_product_stock',
                'view_orders_all', 'create_orders_manual',
                'manage_inventory', 'manage_coupons',
                'assign_courier', 'generate_invoice'
            ],
        },
        {
            name: 'EDITOR',
            permissions: [
                'view_shop', 'edit_shop',
                'view_product_detail', 'edit_product_content',
                'manage_inventory', 'manage_coupons'
            ],
        },
        {
            name: 'SALES',
            permissions: [
                'view_shop',
                'view_product_detail',
                'view_orders_all', 'create_orders_manual',
                'verify_order_phone', 'verify_order_status'
            ],
        },
        {
            name: 'CUSTOMER',
            permissions: ['view_shop', 'view_product_detail', 'buy_products', 'view_own_orders'],
        },
    ];

    const roles = {};
    for (const r of rolesData) {
        roles[r.name] = await prisma.role.upsert({
            where: { name: r.name },
            update: {
                permissions: {
                    set: r.permissions.map(p => ({ id: permissions[p].id }))
                }
            },
            create: {
                name: r.name,
                permissions: {
                    connect: r.permissions.map(p => ({ id: permissions[p].id }))
                }
            },
        });
    }

    // 3. Sample Users
    const usersData = [
        { email: 'admin@sumashtech.com', name: 'Admin User', role: 'SUPER_ADMIN', password: 'admin123' },
        { email: 'manager@sumashtech.com', name: 'Manager User', role: 'MANAGER', password: 'manager123' },
        { email: 'editor@sumashtech.com', name: 'Editor User', role: 'EDITOR', password: 'editor123' },
        { email: 'sales@sumashtech.com', name: 'Sales User', role: 'SALES', password: 'sales123' },
        { email: 'customer@example.com', name: 'Test Customer', role: 'CUSTOMER', password: 'user123' },
    ];

    for (const u of usersData) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                roleId: roles[u.role].id
            },
            create: {
                email: u.email,
                name: u.name,
                password: u.password,
                roleId: roles[u.role].id
            }
        });
    }


    // Categories
    const categories = [
        { name: 'iPhone', slug: 'smartphone-iphone' },
        { name: 'Android Smartphone', slug: 'smartphone-android' },
        { name: 'Laptop', slug: 'laptop' },
        { name: 'MacBook', slug: 'mac' },
        { name: 'Tablet', slug: 'tablet' },
        { name: 'Smart Watch', slug: 'smart-watch' },
        { name: 'Audio', slug: 'audio' },
        { name: 'Gaming', slug: 'gaming' },
        { name: 'Gadgets', slug: 'gadgets' },
    ];

    const createdCategories = {};
    for (const cat of categories) {
        createdCategories[cat.slug] = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
    }

    // Brands
    const brands = [
        { name: 'Apple', slug: 'apple' },
        { name: 'Samsung', slug: 'samsung' },
        { name: 'Xiaomi', slug: 'xiaomi' },
        { name: 'Dell', slug: 'dell' },
        { name: 'HP', slug: 'hp' },
        { name: 'Asus', slug: 'asus' },
        { name: 'Sony', slug: 'sony' },
    ];

    const createdBrands = {};
    for (const brand of brands) {
        createdBrands[brand.slug] = await prisma.brand.upsert({
            where: { slug: brand.slug },
            update: {},
            create: brand,
        });
    }

    // Products
    const products = [
        {
            name: 'iPhone 15 Pro Max',
            slug: 'iphone-15-pro-max',
            description: 'iPhone 15 Pro Max. Forged in titanium and so powerful.',
            price: 155000,
            discount: 0,
            stock: 15,
            images: ['https://placehold.co/600x400/111/fff?text=iPhone+15+Pro+Max'],
            isFeatured: true,
            isNew: false,
            rating: 5,
            category: createdCategories['smartphone-iphone'],
            brand: createdBrands['apple']
        },
        {
            name: 'iPhone 15',
            slug: 'iphone-15',
            description: 'iPhone 15. New camera. New design. Newphoria.',
            price: 115000,
            discount: 5,
            stock: 20,
            images: ['https://placehold.co/600x400/111/fff?text=iPhone+15'],
            isFeatured: false,
            isNew: true,
            rating: 4.5,
            category: createdCategories['smartphone-iphone'],
            brand: createdBrands['apple']
        },
        {
            name: 'Samsung Galaxy S24 Ultra',
            slug: 'samsung-galaxy-s24-ultra',
            description: 'The ultimate Galaxy experience with AI features.',
            price: 145000,
            discount: 10,
            stock: 10,
            images: ['https://placehold.co/600x400/111/fff?text=Galaxy+S24+Ultra'],
            isFeatured: true,
            isNew: true,
            rating: 4.8,
            category: createdCategories['smartphone-android'],
            brand: createdBrands['samsung']
        },
        {
            name: 'MacBook Air M3',
            slug: 'macbook-air-m3',
            description: 'Impressively big. Impossibly thin.',
            price: 135000,
            discount: 0,
            stock: 8,
            images: ['https://placehold.co/600x400/111/fff?text=MacBook+Air+M3'],
            isFeatured: true,
            isNew: true,
            rating: 5,
            category: createdCategories['mac'],
            brand: createdBrands['apple']
        },
        {
            name: 'Dell XPS 15',
            slug: 'dell-xps-15',
            description: 'Premium performance in a thin and light design.',
            price: 180000,
            discount: 15,
            stock: 5,
            images: ['https://placehold.co/600x400/111/fff?text=Dell+XPS+15'],
            isFeatured: false,
            isNew: false,
            rating: 4.5,
            category: createdCategories['laptop'],
            brand: createdBrands['dell']
        },
        {
            name: 'Xiaomi Redmi Note 13 Pro',
            slug: 'xiaomi-redmi-note-13-pro',
            description: '200MP camera, Snapdragon processor.',
            price: 35000,
            discount: 0,
            stock: 25,
            images: ['https://placehold.co/600x400/111/fff?text=Redmi+Note+13+Pro'],
            isFeatured: false,
            isNew: true,
            rating: 4.2,
            category: createdCategories['smartphone-android'],
            brand: createdBrands['xiaomi']
        },
        {
            name: 'Sony WH-1000XM5',
            slug: 'sony-wh-1000xm5',
            description: 'Industry-leading noise cancellation.',
            price: 32000,
            discount: 20,
            stock: 12,
            images: ['https://placehold.co/600x400/111/fff?text=Sony+XM5'],
            isFeatured: true,
            isNew: false,
            rating: 4.9,
            category: createdCategories['audio'],
            brand: createdBrands['sony']
        },
        {
            name: 'Apple Watch Series 9',
            slug: 'apple-watch-series-9',
            description: 'Smarter. Brighter. Mightier.',
            price: 45000,
            discount: 0,
            stock: 18,
            images: ['https://placehold.co/600x400/111/fff?text=Apple+Watch+S9'],
            isFeatured: true,
            isNew: true,
            rating: 4.7,
            category: createdCategories['smart-watch'],
            brand: createdBrands['apple']
        },
        {
            name: 'Asus ROG Laptop',
            slug: 'asus-rog-laptop',
            description: 'Ultimate gaming performance.',
            price: 250000,
            discount: 5,
            stock: 4,
            images: ['https://placehold.co/600x400/111/fff?text=Asus+ROG'],
            isFeatured: true,
            isNew: true,
            rating: 4.8,
            category: createdCategories['gaming'],
            brand: createdBrands['asus']
        },
        {
            name: 'iPad Pro 11 inch',
            slug: 'ipad-pro-11',
            description: 'Supercharged by M2.',
            price: 85000,
            discount: 0,
            stock: 10,
            images: ['https://placehold.co/600x400/111/fff?text=iPad+Pro'],
            isFeatured: false,
            isNew: false,
            rating: 4.6,
            category: createdCategories['tablet'],
            brand: createdBrands['apple']
        },
        {
            name: 'Samsung Galaxy Watch 6',
            slug: 'galaxy-watch-6',
            description: 'Your wellness partner.',
            price: 28000,
            discount: 0,
            stock: 15,
            images: ['https://placehold.co/600x400/111/fff?text=Galaxy+Watch+6'],
            isFeatured: false,
            isNew: true,
            rating: 4.5,
            category: createdCategories['smart-watch'],
            brand: createdBrands['samsung']
        },
        {
            name: 'Xiaomi Pad 6',
            slug: 'xiaomi-pad-6',
            description: 'The work-from-anywhere king.',
            price: 42000,
            discount: 5,
            stock: 12,
            images: ['https://placehold.co/600x400/111/fff?text=Xiaomi+Pad+6'],
            isFeatured: false,
            isNew: true,
            rating: 4.4,
            category: createdCategories['tablet'],
            brand: createdBrands['xiaomi']
        },
        {
            name: 'Sony PS5 Console',
            slug: 'sony-ps5',
            description: 'Play has no limits.',
            price: 65000,
            discount: 0,
            stock: 6,
            images: ['https://placehold.co/600x400/111/fff?text=PS5'],
            isFeatured: true,
            isNew: false,
            rating: 4.9,
            category: createdCategories['gaming'],
            brand: createdBrands['sony']
        },
        {
            name: 'AirPods Pro 2',
            slug: 'airpods-pro-2',
            description: 'Magic like you\'ve never heard.',
            price: 26000,
            discount: 0,
            stock: 30,
            images: ['https://placehold.co/600x400/111/fff?text=AirPods+Pro+2'],
            isFeatured: false,
            isNew: false,
            rating: 4.8,
            category: createdCategories['audio'],
            brand: createdBrands['apple']
        },
        {
            name: 'Dell UltraSharp 27 Monitor',
            slug: 'dell-monitor-27',
            description: 'See every detail in 4K.',
            price: 55000,
            discount: 10,
            stock: 8,
            images: ['https://placehold.co/600x400/111/fff?text=Dell+Monitor'],
            isFeatured: false,
            isNew: true,
            rating: 4.7,
            category: createdCategories['gadgets'],
            brand: createdBrands['dell']
        },
        {
            name: 'Logitech G Pro Mouse',
            slug: 'logitech-g-pro',
            description: 'The choice of pros.',
            price: 9500,
            discount: 0,
            stock: 25,
            images: ['https://placehold.co/600x400/111/fff?text=G+Pro+Mouse'],
            isFeatured: false,
            isNew: false,
            rating: 4.9,
            category: createdCategories['gaming'],
            brand: null
        },
        {
            name: 'GoPro HERO 12',
            slug: 'gopro-hero-12',
            description: 'Capture everything.',
            price: 48000,
            discount: 0,
            stock: 10,
            images: ['https://placehold.co/600x400/111/fff?text=GoPro+12'],
            isFeatured: true,
            isNew: true,
            rating: 4.6,
            category: createdCategories['gadgets'],
            brand: null
        }
    ];

    for (const p of products) {
        await prisma.product.upsert({
            where: { slug: p.slug },
            update: {},
            create: {
                name: p.name,
                slug: p.slug,
                description: p.description,
                price: p.price,
                discount: p.discount,
                stock: p.stock,
                images: p.images,
                isFeatured: p.isFeatured,
                isNew: p.isNew,
                rating: p.rating,
                categoryId: p.category.id,
                brandId: p?.brand?.id || null,
            }
        });
    }

    // 4. Popup Offer
    await prisma.popupOffer.upsert({
        where: { id: 1 },
        update: {},
        create: {
            title: 'Welcome to Sumash Tech!',
            description: 'Get 10% OFF on your first purchase. Use code: WELCOME10',
            image: 'https://placehold.co/600x400/orange/white?text=Special+Offer',
            link: '/offers',
            isActive: true
        }
    });

    // 5. CMS Pages
    const cmsPages = [
        {
            slug: 'about',
            title: 'About Us',
            content: '<h2>Welcome to SumashTech</h2><p>SumashTech is your one-stop shop for the latest electronics and gadgets in Bangladesh. We specialize in providing authentic Apple products, smartphones, laptops, and accessories at competitive prices.</p><h3>Our Mission</h3><p>To bring the latest technology to Bangladesh with genuine products and excellent customer service.</p><h3>Why Choose Us?</h3><ul><li>100% authentic products</li><li>Warranty support</li><li>Fast delivery across Bangladesh</li><li>24/7 customer support</li></ul>'
        },
        {
            slug: 'contact',
            title: 'Contact Us',
            content: '<h2>Get in Touch</h2><p>We are here to help! Reach out to us through any of the following channels:</p><h3>Phone</h3><p>+88 01234 567890</p><h3>Email</h3><p>support@sumashtech.com</p><h3>Address</h3><p>Dhaka, Bangladesh</p><h3>Working Hours</h3><p>Sat - Thu: 9:00 AM - 9:00 PM</p>'
        },
        {
            slug: 'terms',
            title: 'Terms & Conditions',
            content: '<h2>Terms and Conditions</h2><p>Welcome to SumashTech. By using our website, you agree to these terms.</p><h3>Orders</h3><p>All orders are subject to availability and confirmation. Prices are subject to change without notice.</p><h3>Payment</h3><p>We accept Cash on Delivery (COD) and bKash payments.</p><h3>Returns</h3><p>Products can be returned within 7 days if they are defective or not as described.</p><h3>Warranty</h3><p>All Apple products come with manufacturer warranty. Other products have warranty as specified.</p>'
        },
        {
            slug: 'privacy',
            title: 'Privacy Policy',
            content: '<h2>Privacy Policy</h2><p>At SumashTech, we value your privacy and are committed to protecting your personal information.</p><h3>Information We Collect</h3><p>We collect information you provide during registration, ordering, and when you contact us.</p><h3>How We Use Your Information</h3><p>Your information is used to process orders, improve our services, and communicate with you.</p><h3>Data Security</h3><p>We implement security measures to protect your personal information.</p><h3>Contact</h3><p>If you have questions about our privacy policy, please contact us.</p>'
        }
    ];

    for (const page of cmsPages) {
        await prisma.pageContent.upsert({
            where: { slug: page.slug },
            update: {},
            create: page
        });
    }

    console.log("Database seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
