// ============================================
// PRESTIGE MOTORS · Storefront Logic
// ============================================

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ⚠️ رقم واتساب المحل (بصيغة دولية بدون + أو مسافات)
const WHATSAPP_NUMBER = '212715072766';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

const state = {
  cars: [],
  filter: 'all',
  search: '',
  sort: 'default',
  selectedCar: null
};

// ===== تصنيف السيارات تلقائياً =====
function categorize(car) {
  const brand = (car.brand || '').toLowerCase();
  const price = Number(car.pricePerDay);

  if (['mercedes', 'bmw', 'audi', 'porsche', 'range rover', 'land rover'].some(b => brand.includes(b)))
    return 'luxury';
  if (['range rover', 'land rover', 'toyota', 'hyundai', 'kia'].some(b => brand.includes(b)) &&
      (car.model || '').toLowerCase().match(/suv|cruiser|tucson|sportage|sport/))
    return 'suv';
  if (['porsche', 'bmw', 'audi', 'volkswagen'].some(b => brand.includes(b)) &&
      (car.model || '').toLowerCase().match(/m5|rs7|carrera|gti|sport/))
    return 'sport';
  if (price <= 1000) return 'economy';
  return 'luxury';
}

function categoryLabel(cat) {
  return {
    luxury: 'LUXURY',
    suv: 'SUV',
    sport: 'SPORT',
    economy: 'ECONOMY'
  }[cat] || 'PREMIUM';
}

// ===== Toast =====
function toast(msg, type = '') {
  const t = $('#storeToast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast ' + type, 3000);
}

// ===== جلب البيانات =====
async function loadCars() {
  try {
    const res = await fetch('/api/cars');
    state.cars = await res.json();
    renderCars();
  } catch (e) {
    console.error(e);
    $('#storeGrid').innerHTML = '<div class="empty-state">تعذر تحميل الأسطول. حاول لاحقاً.</div>';
  }
}

// ===== Render =====
function renderCars() {
  let list = [...state.cars];

  // فلترة حسب التصنيف
  if (state.filter !== 'all') {
    list = list.filter(c => categorize(c) === state.filter);
  }

  // بحث
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(c =>
      `${c.brand} ${c.model} ${c.plate}`.toLowerCase().includes(q)
    );
  }

  // ترتيب
  if (state.sort === 'price-asc') list.sort((a, b) => a.pricePerDay - b.pricePerDay);
  if (state.sort === 'price-desc') list.sort((a, b) => b.pricePerDay - a.pricePerDay);
  if (state.sort === 'year') list.sort((a, b) => (b.year || 0) - (a.year || 0));

  const grid = $('#storeGrid');

  if (!list.length) {
    grid.innerHTML = '<div class="empty-state">لا توجد سيارات مطابقة لبحثك</div>';
    return;
  }

  grid.innerHTML = list.map(car => {
    const available = car.status === 'available';
    const cat = categorize(car);

    return `
      <div class="store-card ${available ? '' : 'unavailable'}" data-id="${car.id}">
        <div class="store-card-image">
          <img src="${car.image}" alt="${car.brand} ${car.model}" loading="lazy">
          <span class="store-badge ${available ? '' : 'unavailable'}">
            ${available ? 'متاحة' : 'غير متاحة'}
          </span>
        </div>
        <div class="store-card-body">
          <div class="category">${categoryLabel(cat)}</div>
          <h3>${car.brand} ${car.model}</h3>
          <div class="specs">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              ${car.year}
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
              ${car.transmission || 'Automatic'}
            </span>
          </div>
          <div class="store-card-footer">
            <div class="store-price">
              ${fmt(car.pricePerDay)} <small>MAD / DAY</small>
            </div>
            <button class="btn-book" ${available ? '' : 'disabled'}>
              ${available ? 'احجز الآن' : 'غير متاحة'}
              ${available ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' : ''}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // ربط الأحداث
  $$('.store-card').forEach(card => {
    card.addEventListener('click', () => {
      const car = state.cars.find(c => c.id === card.dataset.id);
      if (car) openCarDetail(car);
    });
  });
}

// ===== فلاتر =====
$('#storeSearch').addEventListener('input', (e) => {
  state.search = e.target.value;
  renderCars();
});

$$('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.filter = chip.dataset.filter;
    renderCars();
  });
});

$('#sortSelect').addEventListener('change', (e) => {
  state.sort = e.target.value;
  renderCars();
});

// ===== مودال تفاصيل السيارة =====
function openCarDetail(car) {
  state.selectedCar = car;
  const available = car.status === 'available';

  $('#carModalContent').innerHTML = `
    <button class="modal-close" id="closeCarModal">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <div class="car-detail-image">
      <img src="${car.image}" alt="${car.brand} ${car.model}">
      <span class="car-detail-badge ${available ? '' : 'unavailable'}">
        ${available ? 'متاحة للحجز' : 'غير متاحة حالياً'}
      </span>
    </div>
    <div class="car-detail-body">
      <div class="eyebrow">${categoryLabel(categorize(car))} · ${car.year}</div>
      <h2>${car.brand} ${car.model}</h2>

      <div class="specs-grid">
        <div class="spec-item">
          <span class="label">السنة</span>
          <span class="value">${car.year}</span>
        </div>
        <div class="spec-item">
          <span class="label">القير</span>
          <span class="value">${car.transmission || 'Automatic'}</span>
        </div>
        <div class="spec-item">
          <span class="label">اللوحة</span>
          <span class="value">${car.plate}</span>
        </div>
        <div class="spec-item">
          <span class="label">الحالة</span>
          <span class="value" style="color:${available ? 'var(--success)' : '#ef4444'}">
            ${available ? 'متاحة' : 'مؤجرة'}
          </span>
        </div>
      </div>

      <p class="car-detail-description">
        استمتع بتجربة قيادة استثنائية مع ${car.brand} ${car.model} موديل ${car.year}.
        سيارة مصانة بالكامل، مؤمّنة، ومجهزة بجميع وسائل الراحة الحديثة لرحلة لا تُنسى.
      </p>

      <div class="car-detail-footer">
        <div class="car-detail-price">
          <span class="amount">${fmt(car.pricePerDay)}</span>
          <span class="per">MAD / PER DAY</span>
        </div>
        <button class="btn-book-lg" id="startBooking" ${available ? '' : 'disabled'}>
          ${available ? 'احجز هذه السيارة' : 'غير متاحة للحجز'}
        </button>
      </div>
    </div>
  `;

  $('#carModal').classList.add('active');

  $('#closeCarModal').addEventListener('click', closeCarModal);

  if (available) {
    $('#startBooking').addEventListener('click', () => {
      closeCarModal();
      setTimeout(() => openBookingForm(car), 200);
    });
  }
}

function closeCarModal() {
  $('#carModal').classList.remove('active');
}

$('#carModal').addEventListener('click', (e) => {
  if (e.target.id === 'carModal') closeCarModal();
});

// ===== مودال الحجز =====
function openBookingForm(car) {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const afterThreeDays = new Date(today.getTime() + 86400000 * 3);

  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const afterThreeDaysStr = afterThreeDays.toISOString().split('T')[0];

  $('#bookingModalContent').innerHTML = `
    <button class="modal-close" id="closeBookingModal">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>

    <div class="booking-head">
      <div class="eyebrow">BOOKING REQUEST</div>
      <h2>أكمل بيانات حجزك</h2>
    </div>

    <div class="booking-summary">
      <img src="${car.image}" alt="${car.brand}">
      <div class="booking-summary-info">
        <h4>${car.brand} ${car.model}</h4>
        <div class="price">${fmt(car.pricePerDay)} MAD / يوم</div>
      </div>
    </div>

    <form class="booking-form" id="customerBookingForm">
      <div class="form-group">
        <label>الاسم الكامل <span class="req">*</span></label>
        <input type="text" name="name" required placeholder="مثال: محمد العلمي">
      </div>

      <div class="form-group">
        <label>رقم الهاتف <span class="req">*</span></label>
        <input type="tel" name="phone" required placeholder="+212 6XX XXX XXX" pattern="[+0-9\s\-]+">
      </div>

      <div class="form-group">
        <label>البريد الإلكتروني (اختياري)</label>
        <input type="email" name="email" placeholder="client@example.com">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>تاريخ الاستلام <span class="req">*</span></label>
          <input type="date" name="startDate" id="startDate" required value="${tomorrowStr}" min="${todayStr}">
        </div>
        <div class="form-group">
          <label>تاريخ الإرجاع <span class="req">*</span></label>
          <input type="date" name="endDate" id="endDate" required value="${afterThreeDaysStr}" min="${tomorrowStr}">
        </div>
      </div>

      <div class="form-group">
        <label>مكان الاستلام (اختياري)</label>
        <input type="text" name="pickupLocation" placeholder="مثال: مطار محمد الخامس">
      </div>

      <div class="form-group">
        <label>ملاحظات إضافية</label>
        <textarea name="notes" rows="2" placeholder="أي طلبات خاصة..."></textarea>
      </div>

      <div class="price-calc" id="priceCalc">
        <div class="price-calc-row">
          <span>السعر اليومي</span>
          <span class="value">${fmt(car.pricePerDay)} MAD</span>
        </div>
        <div class="price-calc-row">
          <span>عدد الأيام</span>
          <span class="value" id="calcDays">—</span>
        </div>
        <div class="price-calc-row total">
          <span>المجموع الإجمالي</span>
          <span class="value" id="calcTotal">—</span>
        </div>
      </div>

      <button type="submit" class="btn-complete-order">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        إكمال الطلب وإرساله عبر واتساب
      </button>
    </form>
  `;

  $('#bookingModal').classList.add('active');

  $('#closeBookingModal').addEventListener('click', closeBookingModal);

  // حساب السعر تلقائياً
  const startInput = $('#startDate');
  const endInput = $('#endDate');

  const updatePrice = () => {
    const start = new Date(startInput.value);
    const end = new Date(endInput.value);

    if (isNaN(start) || isNaN(end) || end < start) {
      $('#calcDays').textContent = '—';
      $('#calcTotal').textContent = '—';
      return;
    }

    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const total = days * Number(car.pricePerDay);

    $('#calcDays').textContent = `${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    $('#calcTotal').textContent = `${fmt(total)} MAD`;
  };

  startInput.addEventListener('change', () => {
    // منع تاريخ النهاية أن يكون قبل البداية
    endInput.min = startInput.value;
    if (endInput.value < startInput.value) endInput.value = startInput.value;
    updatePrice();
  });

  endInput.addEventListener('change', updatePrice);
  updatePrice();

  // إرسال الطلب
  $('#customerBookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    sendToWhatsApp(car);
  });
}

function closeBookingModal() {
  $('#bookingModal').classList.remove('active');
}

$('#bookingModal').addEventListener('click', (e) => {
  if (e.target.id === 'bookingModal') closeBookingModal();
});

// ===== إرسال لواتساب =====
function sendToWhatsApp(car) {
  const form = $('#customerBookingForm');
  const data = Object.fromEntries(new FormData(form));

  // التحقق
  if (!data.name.trim() || !data.phone.trim() || !data.startDate || !data.endDate) {
    toast('يرجى ملء جميع الحقول المطلوبة', 'error');
    return;
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (end < start) {
    toast('تاريخ الإرجاع يجب أن يكون بعد تاريخ الاستلام', 'error');
    return;
  }

  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const total = days * Number(car.pricePerDay);

  // تنسيق رسالة واتساب
  const message = `*طلب حجز جديد — PRESTIGE MOTORS* 🚗
━━━━━━━━━━━━━━━━━━━

*🚙 السيارة المطلوبة:*
${car.brand} ${car.model} (${car.year})
رقم اللوحة: ${car.plate}
السعر اليومي: ${fmt(car.pricePerDay)} MAD

*👤 معلومات العميل:*
الاسم: ${data.name}
الهاتف: ${data.phone}${data.email ? `\nالبريد: ${data.email}` : ''}

*📅 تفاصيل الحجز:*
من: ${data.startDate}
إلى: ${data.endDate}
عدد الأيام: ${days} ${days === 1 ? 'يوم' : 'أيام'}

*💰 المجموع الإجمالي:* ${fmt(total)} MAD
${data.pickupLocation ? `\n*📍 مكان الاستلام:* ${data.pickupLocation}` : ''}${data.notes ? `\n\n*📝 ملاحظات:*\n${data.notes}` : ''}

━━━━━━━━━━━━━━━━━━━
_تم إرسال هذا الطلب من موقع PRESTIGE MOTORS_`;

  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

  toast('جاري فتح واتساب لإكمال الحجز...', 'success');

  setTimeout(() => {
    window.open(url, '_blank');
    closeBookingModal();
  }, 400);
}

// ===== ESC لإغلاق المودالات =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCarModal();
    closeBookingModal();
  }
});

// ===== Init =====
loadCars();