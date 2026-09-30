const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(bodyParser.json());

// ===== خدمة الملفات الثابتة =====
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// ===== قراءة قاعدة البيانات =====
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify({
        cars: [], customers: [], bookings: []
      }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (e) {
    console.error('DB Error:', e);
    return { cars: [], customers: [], bookings: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ===== API: CARS =====
app.get('/api/cars', (req, res) => res.json(readDB().cars));

app.post('/api/cars', (req, res) => {
  const db = readDB();
  const car = { id: genId(), ...req.body, createdAt: new Date().toISOString() };
  db.cars.push(car);
  writeDB(db);
  res.json(car);
});

app.put('/api/cars/:id', (req, res) => {
  const db = readDB();
  const idx = db.cars.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.cars[idx] = { ...db.cars[idx], ...req.body };
  writeDB(db);
  res.json(db.cars[idx]);
});

app.delete('/api/cars/:id', (req, res) => {
  const db = readDB();
  db.cars = db.cars.filter(c => c.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ===== API: CUSTOMERS =====
app.get('/api/customers', (req, res) => res.json(readDB().customers));

app.post('/api/customers', (req, res) => {
  const db = readDB();
  const customer = { id: genId(), ...req.body, createdAt: new Date().toISOString() };
  db.customers.push(customer);
  writeDB(db);
  res.json(customer);
});

app.delete('/api/customers/:id', (req, res) => {
  const db = readDB();
  db.customers = db.customers.filter(c => c.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ===== API: BOOKINGS =====
app.get('/api/bookings', (req, res) => {
  const db = readDB();
  const bookings = db.bookings.map(b => ({
    ...b,
    car: db.cars.find(c => c.id === b.carId),
    customer: db.customers.find(c => c.id === b.customerId)
  }));
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const db = readDB();
  const booking = {
    id: genId(),
    ...req.body,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  const car = db.cars.find(c => c.id === booking.carId);
  if (car) {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    booking.days = days;
    booking.totalPrice = days * Number(car.pricePerDay);
  }
  db.bookings.push(booking);
  writeDB(db);
  res.json(booking);
});

app.put('/api/bookings/:id', (req, res) => {
  const db = readDB();
  const idx = db.bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.bookings[idx] = { ...db.bookings[idx], ...req.body };
  writeDB(db);
  res.json(db.bookings[idx]);
});

app.delete('/api/bookings/:id', (req, res) => {
  const db = readDB();
  db.bookings = db.bookings.filter(b => b.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ===== API: STATS =====
app.get('/api/stats', (req, res) => {
  const db = readDB();
  const totalRevenue = db.bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
  res.json({
    totalCars: db.cars.length,
    totalCustomers: db.customers.length,
    totalBookings: db.bookings.length,
    activeBookings: db.bookings.filter(b => b.status === 'active').length,
    availableCars: db.cars.filter(c => c.status === 'available').length,
    totalRevenue
  });
});

// ===== صفحة 404 للـ API =====
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ===== SPA fallback — فقط لغير الملفات الموجودة =====
// لا تلمس الملفات الثابتة، فقط أرسل index.html للمسارات العادية
app.get('*', (req, res, next) => {
  // إذا كان الطلب لملف بامتداد (.css, .js, .html, .png ...) لا تفعل شيئاً
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== 404 النهائي =====
app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏁 PRESTIGE MOTORS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   لوحة التحكم : http://localhost:${PORT}`);
  console.log(`   المتجر      : http://localhost:${PORT}/store.html`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});