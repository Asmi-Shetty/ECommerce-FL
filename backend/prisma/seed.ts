import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning existing database data...');
  
  // Delete in reverse order of foreign key constraints
  await prisma.notification.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.certification.deleteMany({});
  await prisma.farmer.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding organic database...');

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      phone: '9999999999',
      email: 'admin@nashikorganic.com',
      passwordHash,
      name: 'Nashik Organic Admin',
      role: 'ADMIN',
      isVerified: true
    }
  });

  // 2. Farmers (Vendors)
  const farmer1User = await prisma.user.create({
    data: {
      phone: '9823000001',
      email: 'patil.farm@gmail.com',
      passwordHash,
      name: 'Ramesh Patil',
      role: 'VENDOR',
      isVerified: true
    }
  });

  const farmer2User = await prisma.user.create({
    data: {
      phone: '9823000002',
      email: 'deshmukh.organic@gmail.com',
      passwordHash,
      name: 'Suresh Deshmukh',
      role: 'VENDOR',
      isVerified: true
    }
  });

  // Create Farmer details
  const farmer1 = await prisma.farmer.create({
    data: {
      userId: farmer1User.id,
      farmName: 'Patil Bio-Farms, Niphad',
      location: 'Niphad, Nashik',
      kycStatus: 'APPROVED',
      bio: 'Pioneers in pesticide-free vermicompost cultivation since 2015.'
    }
  });

  const farmer2 = await prisma.farmer.create({
    data: {
      userId: farmer2User.id,
      farmName: 'Deshmukh Natural Gardens, Sinnar',
      location: 'Sinnar, Nashik',
      kycStatus: 'APPROVED',
      bio: 'Sourced directly from rain-fed highlands utilizing natural spring irrigation and multi-cropping techniques.'
    }
  });

  // Certifications
  await prisma.certification.create({
    data: {
      farmerId: farmer1.id,
      name: 'NPOP Certified Organic',
      agency: 'OneCert Asia',
      certUrl: 'https://example.com/certs/patil-npop.pdf',
      expiryDate: new Date('2027-12-31')
    }
  });

  await prisma.certification.create({
    data: {
      farmerId: farmer2.id,
      name: 'PGS-India Organic Green',
      agency: 'Regional Council, Nashik',
      certUrl: 'https://example.com/certs/deshmukh-pgs.pdf',
      expiryDate: new Date('2028-06-30')
    }
  });

  // 3. Categories
  const catLeafy = await prisma.category.create({
    data: {
      name: 'Leafy Greens',
      slug: 'leafy-greens',
      description: 'Fresh spinach, fenugreek, coriander, and native greens.',
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300&auto=format&fit=crop'
    }
  });

  const catRoot = await prisma.category.create({
    data: {
      name: 'Root Vegetables',
      slug: 'root-vegetables',
      description: 'Pesticide-free potatoes, carrots, onions, and beetroots.',
      imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80&w=300&auto=format&fit=crop'
    }
  });

  const catExotic = await prisma.category.create({
    data: {
      name: 'Exotic Vegetables',
      slug: 'exotic-veggies',
      description: 'Zucchini, colored bell peppers, cherry tomatoes, and broccoli.',
      imageUrl: 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?q=80&w=300&auto=format&fit=crop'
    }
  });

  const catDaily = await prisma.category.create({
    data: {
      name: 'Daily Essentials',
      slug: 'daily-essentials',
      description: 'Tomatoes, ladies finger, green chillies, and garlic.',
      imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=300&auto=format&fit=crop'
    }
  });

  // 4. Products
  const products = [
    {
      name: 'Organic Palak (Spinach)',
      slug: 'organic-palak',
      description: 'Iron-rich farm-fresh baby spinach bunches grown in mineral-rich soil of Niphad, Nashik. Triple-washed and ready to cook.',
      price: 45.00,
      discountPrice: 35.00,
      unit: 'bunch',
      categoryId: catLeafy.id,
      farmerId: farmer1.id,
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=600&auto=format&fit=crop',
      stock: 120.0,
      isFeatured: true
    },
    {
      name: 'Orange Carrots (Gajar)',
      slug: 'orange-carrots',
      description: 'Sweet, crunchy, and vitamin-A packed organic carrots grown without synthetic pesticides. Sourced from the Sinnar highland fields.',
      price: 60.00,
      discountPrice: 48.00,
      unit: 'kg',
      categoryId: catRoot.id,
      farmerId: farmer2.id,
      imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600&auto=format&fit=crop',
      stock: 80.0,
      isFeatured: true
    },
    {
      name: 'Broccoli Premium',
      slug: 'broccoli-premium',
      description: 'Fresh dense heads of organic broccoli, loaded with antioxidants. Excellent for salads, stir-fries, and healthy side dishes.',
      price: 180.00,
      discountPrice: 140.00,
      unit: 'kg',
      categoryId: catExotic.id,
      farmerId: farmer2.id,
      imageUrl: 'https://images.unsplash.com/photo-1452967712862-0cca1839ff27?q=80&w=600&auto=format&fit=crop',
      stock: 45.0,
      isFeatured: true
    },
    {
      name: 'Nashik Desi Tomatoes',
      slug: 'nashik-desi-tomatoes',
      description: 'Vibrant, juicy, and sour heirloom tomatoes harvested at peak ripeness. Perfect for curries, soups, and raw salads.',
      price: 40.00,
      discountPrice: 28.00,
      unit: 'kg',
      categoryId: catDaily.id,
      farmerId: farmer1.id,
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=600&auto=format&fit=crop',
      stock: 300.0,
      isFeatured: true
    },
    {
      name: 'Yellow Bell Pepper (Capsicum)',
      slug: 'yellow-bell-pepper',
      description: 'Crispy, vibrant yellow bell pepper cultivated in protected shadehouses. Sweet flavor with heavy nutritional value.',
      price: 220.00,
      discountPrice: 190.00,
      unit: 'kg',
      categoryId: catExotic.id,
      farmerId: farmer1.id,
      imageUrl: 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?q=80&w=600&auto=format&fit=crop',
      stock: 60.0,
      isFeatured: false
    }
  ];

  for (const prod of products) {
    await prisma.product.create({
      data: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        price: prod.price,
        discountPrice: prod.discountPrice,
        unit: prod.unit,
        categoryId: prod.categoryId,
        farmerId: prod.farmerId,
        isFeatured: prod.isFeatured,
        images: {
          create: [
            {
              url: prod.imageUrl,
              isPrimary: true
            }
          ]
        },
        inventory: {
          create: {
            stockLevel: prod.stock,
            lowStockThresh: 15.0
          }
        }
      }
    });
    console.log(`Seeded product: ${prod.name}`);
  }

  // Seeding Coupons
  await prisma.coupon.create({
    data: {
      code: 'NASHIKGREEN',
      discount: 50.00,
      isPercentage: false,
      minOrderVal: 299.00,
      expiryDate: new Date('2027-12-31'),
      isActive: true
    }
  });

  await prisma.coupon.create({
    data: {
      code: 'ORGANIC10',
      discount: 10.00,
      isPercentage: true,
      minOrderVal: 199.00,
      expiryDate: new Date('2027-12-31'),
      isActive: true
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
