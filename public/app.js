// ============================================
// PRESTIGE MOTORS · Dashboard Logic
// ============================================

const state = { cars: [], customers: [], bookings: [], stats: {} };

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

function toast(msg, type = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast ' + type, 3000);
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}

// ===== صور السيارات حسب الماركة =====
const CAR_IMAGES = {
  'toyota': 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=800&q=80',
  'mercedes': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
  'bmw': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
  'audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
  'porsche': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
  'range rover': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
  'land rover': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
  'honda': 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80',
  'hyundai': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80',
  'kia': 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&q=80',
  'volkswagen': 'https://images.unsplash.com/photo-1471479917193-f00955256257?w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'
};

function getCarImage(car) {
  if (car.image && car.image.startsWith('http')) return car.image;
  const brand = (car.brand || '').toLowerCase().trim();
  for (const key in CAR_IMAGES) {
    if (brand.includes(key)) return CAR_IMAGES[key];
  }
  return CAR_IMAGES['default'];
}

// ===== التنقل =====
const titles = {
  dashboard: ['DASHBOARD', 'لوحة التحكم'],
  cars: ['FLEET', 'الأسطول'],
  customers: ['CLIENTS', 'العملاء'],
  bookings: ['RESERVATIONS', 'الحجوزات'],
  invoices: ['FINANCE', 'الفواتير'],
  reports: ['ANALYTICS', 'التقارير']
};

// ✅ معالج التنقل — يتجاهل زر المتجر
$$('.nav-item').forEach(item => {
  // استثنِ زر المتجر من معالج SPA
  if (item.classList.contains('nav-store')) return;

  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    if (!page) return;

    $$('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    $$('.page').forEach(p => p.classList.remove('active'));
    $('#page-' + page).classList.add('active');
    $('#pageEyebrow').textContent = titles[page][0];
    $('#pageTitle').textContent = titles[page][1];

    if (page === 'dashboard') loadDashboard();
    if (page === 'cars') loadCars();
    if (page === 'customers') loadCustomers();
    if (page === 'bookings') loadBookings();
    if (page === 'invoices') loadInvoices();
    if (page === 'reports') loadReports();
  });
});

// ✅ زر المتجر — يفتح في نافذة جديدة (حل احتياطي قوي)
const storeBtn = document.getElementById('storeBtn');
if (storeBtn) {
  storeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    window.open('/store.html', '_blank', 'noopener');
  }, true);
}

$$('[data-goto]').forEach(el => {
  el.addEventListener('click', () => {
    const target = document.querySelector(`[data-page="${el.dataset.goto}"]`);
    if (target) target.click();
  });
});

// ===== تحميل =====
async function loadAll() {
  [state.cars, state.customers, state.bookings, state.stats] = await Promise.all([
    api('/api/cars'),
    api('/api/customers'),
    api('/api/bookings'),
    api('/api/stats')
  ]);
}

// ===== Dashboard =====
async function loadDashboard() {
  await loadAll();
  $('#statCars').textContent = state.stats.totalCars;
  $('#statCustomers').textContent = state.stats.totalCustomers;
  $('#statBookings').textContent = state.stats.activeBookings;
  $('#statRevenue').innerHTML = `${fmt(state.stats.totalRevenue)} <small>MAD</small>`;

  const recent = state.bookings.slice(-5).reverse();
  $('#recentBookings').innerHTML = recent.length ? recent.map(b => `
    <div class="list-item">
      <div>
        <strong>${b.customer?.name || 'غير معروف'}</strong>
        <div class="sub">${b.car?.brand || ''} ${b.car?.model || ''} · ${b.days} أيام</div>
      </div>
      <span class="value">${fmt(b.totalPrice)} MAD</span>
    </div>
  `).join('') : '<div class="empty-state"><span class="emoji">◇</span>لا توجد حجوزات بعد</div>';

  $('#carsStatus').innerHTML = state.cars.length ? state.cars.slice(0, 5).map(c => {
    const badge = c.status === 'available' ? '● متاحة' :
                  c.status === 'rented' ? '● مؤجرة' : '● صيانة';
    const color = c.status === 'available' ? 'var(--success)' :
                  c.status === 'rented' ? 'var(--warning)' : 'var(--danger)';
    return `
      <div class="list-item">
        <div>
          <strong>${c.brand} ${c.model}</strong>
          <div class="sub">${c.plate} · ${c.year}</div>
        </div>
        <span style="color:${color};font-size:11px;font-weight:700;letter-spacing:1px">${badge}</span>
      </div>
    `;
  }).join('') : '<div class="empty-state"><span class="emoji">◇</span>لا توجد سيارات بعد</div>';
}

// ===== Cars =====
async function loadCars() {
  state.cars = await api('/api/cars');
  renderCars();
}

function renderCars(filter = '') {
  const q = filter.toLowerCase();
  const cars = state.cars.filter(c =>
    !q || `${c.brand} ${c.model} ${c.plate}`.toLowerCase().includes(q)
  );

  $('#carsGrid').innerHTML = cars.length ? cars.map(c => {
    const badgeClass = c.status === 'rented' ? 'rented' :
                       c.status === 'maintenance' ? 'maintenance' : '';
    const badgeText = c.status === 'available' ? 'AVAILABLE' :
                      c.status === 'rented' ? 'RENTED' : 'MAINTENANCE';
    return `
      <div class="car-card">
        <div class="car-img">
          <img src="${getCarImage(c)}" alt="${c.brand} ${c.model}" loading="lazy">
          <span class="car-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="car-body">
          <h4>${c.brand} ${c.model}</h4>
          <div class="meta">${c.year} · ${c.plate} · ${c.transmission || 'Automatic'}</div>
          <div class="car-price">
            <div>
              <strong>${fmt(c.pricePerDay)}</strong>
              <span class="per"> MAD / DAY</span>
            </div>
            <div class="car-actions">
              <button class="btn-sm" onclick="editCar('${c.id}')">تعديل</button>
              <button class="btn-sm danger" onclick="deleteCar('${c.id}')">حذف</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('') : '<div class="empty-state" style="grid-column:1/-1"><span class="emoji">◇</span>لا توجد سيارات. أضف أول سيارة.</div>';
}

document.getElementById('carSearch')?.addEventListener('input', (e) => renderCars(e.target.value));

// ===== Customers =====
async function loadCustomers() {
  state.customers = await api('/api/customers');
  renderCustomers();
}

function renderCustomers(filter = '') {
  const q = filter.toLowerCase();
  const list = state.customers.filter(c =>
    !q || `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q)
  );

  $('#customersTable').innerHTML = list.length ? list.map(c => {
    const count = state.bookings.filter(b => b.customerId === c.id).length;
    return `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.phone || '—'}</td>
        <td>${c.email || '—'}</td>
        <td>${c.license || '—'}</td>
        <td><span class="gold">${count}</span></td>
        <td><button class="btn-sm danger" onclick="deleteCustomer('${c.id}')">حذف</button></td>
      </tr>
    `;
  }).join('') : '<tr><td colspan="6" class="empty-state">لا يوجد عملاء</td></tr>';
}

document.getElementById('customerSearch')?.addEventListener('input', (e) => renderCustomers(e.target.value));

// ===== Bookings =====
async function loadBookings() {
  [state.bookings, state.cars, state.customers] = await Promise.all([
    api('/api/bookings'),
    api('/api/cars'),
    api('/api/customers')
  ]);
  renderBookings();
}

function renderBookings(filter = '') {
  const q = filter.toLowerCase();
  const list = state.bookings.filter(b =>
    !q || `${b.customer?.name} ${b.car?.brand} ${b.car?.model}`.toLowerCase().includes(q)
  ).reverse();

  $('#bookingsTable').innerHTML = list.length ? list.map(b => {
    const map = {
      active: ['status-active', 'ACTIVE'],
      completed: ['status-completed', 'COMPLETED'],
      cancelled: ['status-cancelled', 'CANCELLED']
    };
    const [cls, txt] = map[b.status] || ['status-active', b.status];
    return `
      <tr>
        <td><strong>${b.customer?.name || '—'}</strong></td>
        <td>${b.car?.brand || ''} ${b.car?.model || ''}</td>
        <td>${b.startDate || '—'}</td>
        <td>${b.endDate || '—'}</td>
        <td>${b.days || '—'}</td>
        <td><span class="gold">${fmt(b.totalPrice)} MAD</span></td>
        <td><span class="status-badge ${cls}">${txt}</span></td>
        <td>
          ${b.status === 'active' ? `<button class="btn-sm" onclick="completeBooking('${b.id}')">إنهاء</button>` : ''}
          <button class="btn-sm danger" onclick="deleteBooking('${b.id}')">حذف</button>
        </td>
      </tr>
    `;
  }).join('') : '<tr><td colspan="8" class="empty-state">لا توجد حجوزات</td></tr>';
}

document.getElementById('bookingSearch')?.addEventListener('input', (e) => renderBookings(e.target.value));

// ===== Invoices =====
async function loadInvoices() {
  await loadBookings();
  $('#invoicesTable').innerHTML = state.bookings.length ? state.bookings.map((b, i) => `
    <tr>
      <td><strong>INV-${String(i + 1).padStart(4, '0')}</strong></td>
      <td>${b.customer?.name || '—'}</td>
      <td>${b.car?.brand || ''} ${b.car?.model || ''}</td>
      <td><span class="gold">${fmt(b.totalPrice)} MAD</span></td>
      <td>${new Date(b.createdAt).toLocaleDateString('en-GB')}</td>
      <td><button class="btn-sm" onclick="printInvoice('${b.id}')">طباعة</button></td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="empty-state">لا توجد فواتير</td></tr>';
}

// ===== Reports =====
async function loadReports() {
  await loadAll();

  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const monthly = {};
  state.bookings.forEach(b => {
    const m = new Date(b.createdAt).getMonth();
    monthly[m] = (monthly[m] || 0) + Number(b.totalPrice || 0);
  });

  const max = Math.max(...Object.values(monthly), 1);
  const currentMonth = new Date().getMonth();

  $('#revenueChart').innerHTML = months.slice(0, currentMonth + 1).map((name, i) => {
    const val = monthly[i] || 0;
    const h = (val / max) * 100;
    return `<div class="chart-bar" style="height:${h}%" data-label="${name}" data-value="${fmt(val)}"></div>`;
  }).join('');

  const carCount = {};
  state.bookings.forEach(b => {
    if (b.car) {
      const key = `${b.car.brand} ${b.car.model}`;
      carCount[key] = (carCount[key] || 0) + 1;
    }
  });
  const top = Object.entries(carCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  $('#topCars').innerHTML = top.length ? top.map(([name, count], i) => `
    <div class="list-item">
      <div>
        <strong>${String(i + 1).padStart(2, '0')} · ${name}</strong>
        <div class="sub">${count} حجز</div>
      </div>
      <span class="value">${count}</span>
    </div>
  `).join('') : '<div class="empty-state"><span class="emoji">◇</span>لا توجد بيانات كافية</div>';
}

// ===== Modals =====
function openModal(html) {
  $('#modalContent').innerHTML = html;
  $('#modalOverlay').classList.add('active');
}

function closeModal() { $('#modalOverlay').classList.remove('active'); }

$('#modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});

// ===== Car Modal =====
function openCarModal(car = null) {
  const isEdit = !!car;
  openModal(`
    <h3>${isEdit ? 'تعديل سيارة' : 'إضافة سيارة جديدة'}</h3>
    <form id="carForm">
      <div class="form-row">
        <div class="form-group">
          <label>الماركة *</label>
          <input name="brand" required value="${car?.brand || ''}" placeholder="Toyota / Mercedes / BMW">
        </div>
        <div class="form-group">
          <label>الموديل *</label>
          <input name="model" required value="${car?.model || ''}" placeholder="Corolla / S-Class">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>سنة الصنع</label>
          <input name="year" type="number" value="${car?.year || 2023}" min="1990" max="2030">
        </div>
        <div class="form-group">
          <label>رقم اللوحة *</label>
          <input name="plate" required value="${car?.plate || ''}" placeholder="12345-A-1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>السعر اليومي (MAD) *</label>
          <input name="pricePerDay" type="number" required value="${car?.pricePerDay || 500}" min="0">
        </div>
        <div class="form-group">
          <label>نوع القير</label>
          <select name="transmission">
            <option value="Automatic" ${car?.transmission === 'Automatic' ? 'selected' : ''}>Automatic</option>
            <option value="Manual" ${car?.transmission === 'Manual' ? 'selected' : ''}>Manual</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>الحالة</label>
        <select name="status">
          <option value="available" ${car?.status === 'available' ? 'selected' : ''}>متاحة</option>
          <option value="rented" ${car?.status === 'rented' ? 'selected' : ''}>مؤجرة</option>
          <option value="maintenance" ${car?.status === 'maintenance' ? 'selected' : ''}>صيانة</option>
        </select>
      </div>
      <div class="form-group">
        <label>رابط صورة (اختياري)</label>
        <input name="image" value="${car?.image || ''}" placeholder="https://...">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">إلغاء</button>
        <button type="submit" class="btn-gold">${isEdit ? 'حفظ' : 'إضافة'}</button>
      </div>
    </form>
  `);

  $('#carForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (isEdit) {
      await api('/api/cars/' + car.id, { method: 'PUT', body: JSON.stringify(data) });
      toast('تم تحديث السيارة', 'success');
    } else {
      await api('/api/cars', { method: 'POST', body: JSON.stringify(data) });
      toast('تمت إضافة السيارة', 'success');
    }
    closeModal();
    loadCars();
  });
}

function editCar(id) {
  const car = state.cars.find(c => c.id === id);
  if (car) openCarModal(car);
}

async function deleteCar(id) {
  if (!confirm('حذف هذه السيارة؟')) return;
  await api('/api/cars/' + id, { method: 'DELETE' });
  toast('تم الحذف');
  loadCars();
}

// ===== Customer Modal =====
function openCustomerModal() {
  openModal(`
    <h3>إضافة عميل جديد</h3>
    <form id="customerForm">
      <div class="form-group">
        <label>الاسم الكامل *</label>
        <input name="name" required placeholder="محمد أحمد">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>الهاتف *</label>
          <input name="phone" required placeholder="+212 6XX XXX XXX">
        </div>
        <div class="form-group">
          <label>البريد الإلكتروني</label>
          <input name="email" type="email" placeholder="client@example.com">
        </div>
      </div>
      <div class="form-group">
        <label>رقم رخصة القيادة</label>
        <input name="license" placeholder="A123456">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">إلغاء</button>
        <button type="submit" class="btn-gold">إضافة</button>
      </div>
    </form>
  `);

  $('#customerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    await api('/api/customers', { method: 'POST', body: JSON.stringify(data) });
    toast('تمت إضافة العميل', 'success');
    closeModal();
    loadCustomers();
  });
}

async function deleteCustomer(id) {
  if (!confirm('حذف هذا العميل؟')) return;
  await api('/api/customers/' + id, { method: 'DELETE' });
  toast('تم الحذف');
  loadCustomers();
}

// ===== Booking Modal =====
async function openBookingModal() {
  await loadAll();

  if (!state.cars.length || !state.customers.length) {
    toast('أضف سيارة وعميلاً أولاً', 'error');
    return;
  }

  openModal(`
    <h3>حجز جديد</h3>
    <form id="bookingForm">
      <div class="form-group">
        <label>العميل *</label>
        <select name="customerId" required>
          <option value="">— اختر عميل —</option>
          ${state.customers.map(c => `<option value="${c.id}">${c.name} · ${c.phone}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>السيارة *</label>
        <select name="carId" required>
          <option value="">— اختر سيارة —</option>
          ${state.cars.filter(c => c.status === 'available').map(c =>
            `<option value="${c.id}">${c.brand} ${c.model} · ${c.plate} · ${fmt(c.pricePerDay)} MAD/day</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>تاريخ البداية *</label>
          <input name="startDate" type="date" required value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label>تاريخ النهاية *</label>
          <input name="endDate" type="date" required value="${new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="form-group">
        <label>ملاحظات</label>
        <textarea name="notes" rows="2" placeholder="ملاحظات إضافية..."></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">إلغاء</button>
        <button type="submit" class="btn-gold">تأكيد الحجز</button>
      </div>
    </form>
  `);

  $('#bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const booking = await api('/api/bookings', { method: 'POST', body: JSON.stringify(data) });
    await api('/api/cars/' + data.carId, {
      method: 'PUT',
      body: JSON.stringify({ status: 'rented' })
    });
    toast(`تم الحجز · ${fmt(booking.totalPrice)} MAD`, 'success');
    closeModal();
    loadBookings();
  });
}

async function completeBooking(id) {
  const booking = state.bookings.find(b => b.id === id);
  await api('/api/bookings/' + id, { method: 'PUT', body: JSON.stringify({ status: 'completed' }) });
  if (booking?.carId) {
    await api('/api/cars/' + booking.carId, {
      method: 'PUT',
      body: JSON.stringify({ status: 'available' })
    });
  }
  toast('تم إنهاء الحجز', 'success');
  loadBookings();
}

async function deleteBooking(id) {
  if (!confirm('حذف هذا الحجز؟')) return;
  await api('/api/bookings/' + id, { method: 'DELETE' });
  toast('تم الحذف');
  loadBookings();
}

// ===== Print =====
function printInvoice(id) {
  const b = state.bookings.find(b => b.id === id);
  if (!b) return;
  const w = window.open('', '', 'width=850,height=650');
  w.document.write(`
    <html dir="rtl"><head><title>Invoice · PRESTIGE MOTORS</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; padding: 60px; color: #111; background: #fff; }
      .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #c9a961; padding-bottom: 24px; margin-bottom: 32px; }
      .brand { font-family: 'Playfair Display', serif; font-size: 32px; letter-spacing: 4px; color: #0a0a0b; }
      .brand-sub { color: #c9a961; font-size: 11px; letter-spacing: 4px; font-weight: 700; margin-top: 4px; }
      .inv-meta { text-align: left; font-size: 12px; color: #666; }
      .inv-meta strong { display: block; color: #111; font-size: 20px; font-family: 'Playfair Display', serif; letter-spacing: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 28px; font-size: 13px; }
      th, td { padding: 14px 12px; text-align: right; border-bottom: 1px solid #eee; }
      th { background: #fafafa; color: #888; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; }
      .total-box { margin-top: 40px; background: linear-gradient(135deg, #0a0a0b, #1d1d22); color: #fff; padding: 28px 32px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
      .total-box .label { font-size: 11px; letter-spacing: 3px; color: #c9a961; font-weight: 700; }
      .total-box .amount { font-family: 'Playfair Display', serif; font-size: 34px; color: #c9a961; }
      .footer { text-align: center; margin-top: 60px; color: #aaa; font-size: 11px; letter-spacing: 2px; }
    </style></head><body>
    <div class="head">
      <div>
        <div class="brand">PRESTIGE MOTORS</div>
        <div class="brand-sub">FLEET MANAGEMENT</div>
      </div>
      <div class="inv-meta">
        <strong>INVOICE</strong>
        INV-${id.slice(-6).toUpperCase()}<br>
        ${new Date().toLocaleDateString('en-GB')}
      </div>
    </div>
    <table>
      <tr><th>CLIENT</th><td>${b.customer?.name || '—'}</td><th>PHONE</th><td>${b.customer?.phone || '—'}</td></tr>
      <tr><th>VEHICLE</th><td>${b.car?.brand || ''} ${b.car?.model || ''}</td><th>PLATE</th><td>${b.car?.plate || '—'}</td></tr>
      <tr><th>FROM</th><td>${b.startDate}</td><th>TO</th><td>${b.endDate}</td></tr>
      <tr><th>DAYS</th><td>${b.days}</td><th>DAILY RATE</th><td>${fmt(b.car?.pricePerDay)} MAD</td></tr>
    </table>
    <div class="total-box">
      <span class="label">TOTAL AMOUNT</span>
      <span class="amount">${fmt(b.totalPrice)} MAD</span>
    </div>
    <div class="footer">THANK YOU FOR CHOOSING PRESTIGE MOTORS</div>
    </body></html>
  `);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

document.getElementById('quickAdd')?.addEventListener('click', () => openBookingModal());

// ===== Init =====
loadDashboard();