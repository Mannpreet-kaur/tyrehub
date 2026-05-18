const bcrypt = require('bcryptjs');
const { getSqlJs, saveDb, initializeDatabase, DB_PATH } = require('./schema');
const fs = require('fs');

async function seed() {
  console.log('Initializing database...');
  await initializeDatabase();

  const SQL = await getSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  // Clear existing data
  db.run('DELETE FROM order_items');
  db.run('DELETE FROM orders');
  db.run('DELETE FROM customers');
  db.run('DELETE FROM products');
  db.run('DELETE FROM categories');
  db.run('DELETE FROM admins');

  // Seed admin
  const passwordHash = bcrypt.hashSync('admin123', 10);
  db.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [
    'admin',
    passwordHash,
  ]);
  console.log('Admin seeded: username=admin, password=admin123');

  // Seed categories
  const categories = ['Activa', 'Car', 'Tractor', 'Truck', 'Tempo'];
  for (const cat of categories) {
    db.run('INSERT INTO categories (name) VALUES (?)', [cat]);
  }
  console.log('Categories seeded:', categories.join(', '));

  // Seed products
  const products = [
    {
      name: 'MRF ZAPPER FS',
      brand: 'MRF',
      size: '90/100-10',
      vehicle_type: 'Activa',
      position: 'Front',
      type: 'Tubeless',
      price: 1150,
      stock: 25,
      description:
        'Premium front tyre for Honda Activa and similar scooters. Excellent grip on wet and dry roads with superior mileage.',
    },
    {
      name: 'CEAT ZOOM RAD X1',
      brand: 'CEAT',
      size: '90/90-12',
      vehicle_type: 'Activa',
      position: 'Rear',
      type: 'Tubeless',
      price: 1350,
      stock: 18,
      description:
        'High-performance rear tyre for scooters. Designed for enhanced cornering stability and long life.',
    },
    {
      name: 'Apollo Amazer 4G Life',
      brand: 'Apollo',
      size: '155/65 R14',
      vehicle_type: 'Car',
      position: 'Both',
      type: 'Tubeless',
      price: 3200,
      stock: 30,
      description:
        'All-season car tyre with fuel-efficient design. Perfect for hatchbacks like Swift, i20, and WagonR.',
    },
    {
      name: 'MRF WANDERER Sport',
      brand: 'MRF',
      size: '195/55 R16',
      vehicle_type: 'Car',
      position: 'Both',
      type: 'Tubeless',
      price: 5800,
      stock: 15,
      description:
        'Premium sport tyre for sedans. Offers exceptional handling and braking performance at high speeds.',
    },
    {
      name: 'CEAT MILAZE X3',
      brand: 'CEAT',
      size: '185/65 R15',
      vehicle_type: 'Car',
      position: 'Both',
      type: 'Tubeless',
      price: 4500,
      stock: 22,
      description:
        'Budget-friendly car tyre with excellent mileage. Ideal for daily city driving and highway comfort.',
    },
    {
      name: 'Apollo AMAR Deluxe',
      brand: 'Apollo',
      size: '7.50-16',
      vehicle_type: 'Tractor',
      position: 'Front',
      type: 'Tube',
      price: 4800,
      stock: 8,
      description:
        'Heavy-duty front tractor tyre with deep treads for superior traction in agricultural fields.',
    },
    {
      name: 'MRF SHAAN Plus',
      brand: 'MRF',
      size: '13.6-28',
      vehicle_type: 'Tractor',
      position: 'Rear',
      type: 'Tube',
      price: 14500,
      stock: 5,
      description:
        'Premium rear tractor tyre designed for maximum grip in paddy fields and soft soil conditions.',
    },
    {
      name: 'CEAT WINMILES',
      brand: 'CEAT',
      size: '10.00-20',
      vehicle_type: 'Truck',
      position: 'Both',
      type: 'Tube',
      price: 12800,
      stock: 10,
      description:
        'Long-haul truck tyre with reinforced sidewalls. Built for heavy loads and highway endurance.',
    },
    {
      name: 'Apollo EnduRace RT',
      brand: 'Apollo',
      size: '8.25-16',
      vehicle_type: 'Tempo',
      position: 'Rear',
      type: 'Tube',
      price: 5200,
      stock: 12,
      description:
        'Durable rear tyre for tempo vehicles. Optimized for load-carrying efficiency and fuel economy.',
    },
    {
      name: 'MRF SUPER LUG 505',
      brand: 'MRF',
      size: '9.00-20',
      vehicle_type: 'Truck',
      position: 'Both',
      type: 'Tube',
      price: 11500,
      stock: 3,
      description:
        'Heavy-duty lug pattern truck tyre for mining and construction terrain. Exceptional cut resistance.',
    },
  ];

  for (const p of products) {
    db.run(
      `INSERT INTO products (name, brand, size, vehicle_type, position, type, price, stock, description, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.brand, p.size, p.vehicle_type, p.position, p.type, p.price, p.stock, p.description, null]
    );
  }
  console.log(`${products.length} products seeded.`);

  saveDb(db);
  db.close();
  console.log('Database seeded successfully!');
}

seed().catch(console.error);
