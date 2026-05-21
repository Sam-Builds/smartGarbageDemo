const state = {
  activeRole: null,
  currentUserId: null, // Track logged-in user ID for resident portal
  broadcastCount: 0,
  cameraStream: null,
scanActive: false,
  shiftStarted: false,
  gpsStamped: false,
  currentHouseId: null,
  pendingScanHouseId: null,
  scannerTimer: null,
  collectorAction: null,
  collectorAmount: '',
  // Data containers are empty until fetched from mock API
  broadcastHistory: [],
  residents: [],
  inbox: [],
  receipts: []
};

/* ========== Mock API service (simulates network latency and server) ========== */
const apiService = {
  const STORAGE_KEY = 'sgcs_route_data';

const apiService = {
  async fetchResidents(wardId = 1) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          resolve(JSON.parse(stored)); // Load persistent route
        } else {
          const newRoute = generateDailyRoute(20);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newRoute));
          resolve(newRoute);
        }
      }, 600);
    });
  },

  async fetchBroadcasts() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { time: formatTime(), message: 'System initialized for monthly collection cycle.', actor: 'System' }
        ]);
      }, 400);
    });
  },

  async fetchInbox(userRole = 'resident') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const inbox = [
          'Collector is nearby for monthly collection.',
          'Monthly collection started for your ward.',
          'Please keep your QR pass ready for verification.'
        ];
        resolve(inbox);
      }, 400);
    });
  },

  async fetchReceipts(userId) {
    return new Promise((resolve) => {
      setTimeout(() => resolve([]), 300);
    });
  },

  async logPayment(payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = `RCPT-${String(payload.houseId).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
        resolve({ success: true, id });
      }, 450);
    });
  },

  async submitShiftSummary(summary = {}) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true, summaryId: `SHIFT-${Date.now()}` }), 700);
    });
  }
};

/* utility: generate a daily route of N pending houses */
function generateDailyRoute(count = 20) {
  const base = Math.floor(Date.now() / 1000) % 10000;
  const houses = [];
  for (let i = 1; i <= count; i++) {
    const id = base + i;
    houses.push({ id, houseNo: `H-${100 + i}`, address: `${100 + i} Demo Street`, status: 'pending' });
  }
  return houses;
}

function updateHouseStatus(id, status, extras = {}) {
  const house = getHouseById(id);
  if (!house) return;
  Object.assign(house, { status }, extras);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.residents)); // Persist changes
  renderAll();
}

const els = {};

function cacheElements() {
  // login / auth
  els.loginView = document.getElementById('loginView');
  els.loginUsername = document.getElementById('loginUsername');
  els.loginPassword = document.getElementById('loginPassword');
  els.loginBtn = document.getElementById('loginBtn');

  // topbar / app
  els.topbar = document.querySelector('.topbar');
  els.signOutBtn = document.getElementById('signOutBtn');

  els.views = {
    admin: document.getElementById('adminView'),
    collector: document.getElementById('collectorView'),
    resident: document.getElementById('residentView'),
    ward: document.getElementById('wardView')
  };
  els.alertArea = document.getElementById('alertArea');
  els.residentTotal = document.getElementById('residentTotal');
  els.activeRoleLabel = document.getElementById('activeRoleLabel');
  els.broadcastCount = document.getElementById('broadcastCount');
  els.notificationHistory = document.getElementById('notificationHistory');
  els.broadcastBtn = document.getElementById('broadcastBtn');
  els.startShiftBtn = document.getElementById('startShiftBtn');
  els.captureGpsBtn = document.getElementById('captureGpsBtn');
  els.cameraFeed = document.getElementById('cameraFeed');
  els.cameraStatus = document.getElementById('cameraStatus');
  els.gpsStamp = document.getElementById('gpsStamp');
  els.shiftState = document.getElementById('shiftState');
  els.houseList = document.getElementById('houseList');
  els.residentInbox = document.getElementById('residentInbox');
  els.receiptTable = document.getElementById('receiptTable');
  els.collectedCount = document.getElementById('collectedCount');
  els.pendingCount = document.getElementById('pendingCount');
  els.coverageRate = document.getElementById('coverageRate');
  els.collectedBar = document.getElementById('collectedBar');
  els.pendingBar = document.getElementById('pendingBar');
  els.pendingHouseTable = document.getElementById('pendingHouseTable');
  els.houseModal = document.getElementById('houseModal');
  els.paymentModal = document.getElementById('paymentModal');
  els.scannerModal = document.getElementById('scannerModal');
  els.houseModalTitle = document.getElementById('houseModalTitle');
  els.houseModalSubtitle = document.getElementById('houseModalSubtitle');
  els.houseModalBody = document.getElementById('houseModalBody');
  els.paymentModalBody = document.getElementById('paymentModalBody');
  els.scannerMessage = document.getElementById('scannerMessage');
  els.scannerSubtitle = document.getElementById('scannerModalSubtitle');
  els.closeHouseModal = document.getElementById('closeHouseModal');
  els.closePaymentModal = document.getElementById('closePaymentModal');
  els.closeScannerModal = document.getElementById('closeScannerModal');
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getHouseById(id) {
  return state.residents.find((house) => house.id === id);
}

function getStatusLabel(status) {
  if (status === 'done') return 'DONE';
  if (status === 'attempted') return 'ATTEMPTED';
  return 'PENDING';
}

function showAlert(message) {
  const alert = document.createElement('div');
  alert.className = 'alert';
  alert.textContent = message;
  els.alertArea.replaceChildren(alert);
  window.clearTimeout(showAlert.timer);
  showAlert.timer = window.setTimeout(() => {
    alert.remove();
  }, 3200);
}

function openModal(modal) {
  modal.classList.remove('hidden');
}

function switchView(viewName) {
  state.activeRole = viewName;
  Object.entries(els.views).forEach(([name, view]) => {
    view.classList.toggle('active', name === viewName);
  });
  els.activeRoleLabel.textContent = viewName ? viewName.charAt(0).toUpperCase() + viewName.slice(1) : '';
  renderAll();
}

function updateHouseStatus(id, status, extras = {}) {
  const house = getHouseById(id);
  if (!house) return;
  Object.assign(house, { status }, extras);
  renderAll();
}

function addBroadcast(message) {
  state.broadcastCount += 1;
  state.broadcastHistory.unshift({
    time: formatTime(),
    message,
    actor: 'Admin'
  });
  state.inbox.unshift('Monthly collection started for your ward.');
  renderAll();
}

function renderAdmin() {
  els.residentTotal.textContent = '509';
  els.broadcastCount.textContent = String(state.broadcastCount);
  els.notificationHistory.innerHTML = state.broadcastHistory.map((entry) => `
    <tr>
      <td>${entry.time}</td>
      <td>${entry.message}</td>
      <td>${entry.actor}</td>
    </tr>
  `).join('');
}

function renderCollector() {
  els.cameraStatus.textContent = state.shiftStarted ? 'Camera ready' : 'Camera idle';
  els.cameraStatus.className = state.shiftStarted ? 'badge badge-success' : 'badge badge-pending';
  els.gpsStamp.textContent = state.gpsStamped ? 'GPS stamped at 15m validation point' : 'GPS not stamped';
  els.shiftState.textContent = state.shiftStarted ? 'Shift in progress' : 'Shift not started';
  els.captureGpsBtn.disabled = !state.shiftStarted;

  els.houseList.innerHTML = state.residents.map((house) => `
    <button class="house-item" type="button" data-house-id="${house.id}">
      <span class="house-meta">
        <strong>${house.houseNo}</strong>
        <span>${house.address}</span>
      </span>
      <span class="badge status-tag status-${house.status}">${getStatusLabel(house.status)}</span>
    </button>
  `).join('');
}

function renderResident() {
  els.residentInbox.innerHTML = state.inbox.slice(0, 6).map((message, index) => `
    <li>
      <div class="feed-title">
        <span>Notification ${index + 1}</span>
        <span>${index === 0 ? 'Now' : 'Today'}</span>
      </div>
      <div>${message}</div>
    </li>
  `).join('');

  els.receiptTable.innerHTML = state.receipts.map((receipt) => `
    <tr>
      <td>${receipt.id}</td>
      <td>${receipt.house}</td>
      <td>${receipt.amount}</td>
      <td>${receipt.mode}</td>
      <td><span class="badge badge-success">${receipt.status}</span></td>
    </tr>
  `).join('');

  // Generate dynamic QR code for the resident's assigned house
  try {
    const qrHolder = document.querySelector('.qr-placeholder');
    if (qrHolder && window.QRCode) {
      qrHolder.innerHTML = ''; // clear previous QR
      // Get the resident's house: use first house from residents or user ID-based assignment
      let residentHouse = null;
      if (state.residents && state.residents.length > 0) {
        // Assign resident by modulo: resident ID maps to a house in the list
        const houseIndex = (state.currentUserId || 1) % state.residents.length;
        residentHouse = state.residents[houseIndex];
      }
      // Fallback: create a virtual house object if none available
      if (!residentHouse) {
        const houseNum = 100 + (state.currentUserId || 1);
        residentHouse = { houseNo: `H-${houseNum}`, address: `${houseNum} Demo Street` };
      }
      // Format QR data: simple text with house info
      const qrText = `${residentHouse.houseNo}`;
      const canvas = document.createElement('canvas');
      qrHolder.appendChild(canvas);
      // Use QRCode.toCanvas from the library
      try {
        QRCode.toCanvas(canvas, qrText, { width: 240, margin: 1, errorCorrectionLevel: 'H', color: { dark: '#023047', light: '#ffffff' } }, function(error) {
          if (error) console.error('QR generation error:', error);
        });
      } catch (genErr) {
        console.error('Failed to generate QR:', genErr);
      }
      // Update label to show actual house number
      const qrLabel = document.querySelector('.qr-label strong');
      if (qrLabel) qrLabel.textContent = `House ${residentHouse.houseNo}`;
    }
  } catch (e) {
    console.error('renderResident QR error:', e);
  }
}

function renderWard() {
  const collected = state.residents.filter((house) => house.status === 'done').length;
  const pending = state.residents.filter((house) => house.status !== 'done').length;
  const total = state.residents.length;
  const coverage = total === 0 ? 0 : Math.round((collected / total) * 100);

  els.collectedCount.textContent = String(collected);
  els.pendingCount.textContent = String(pending);
  els.coverageRate.textContent = `${coverage}%`;
  els.collectedBar.style.width = `${coverage}%`;
  els.pendingBar.style.width = `${100 - coverage}%`;

  els.pendingHouseTable.innerHTML = state.residents
    .filter((house) => house.status !== 'done')
    .map((house) => `
      <tr>
        <td>${house.houseNo}</td>
        <td>${house.address}</td>
        <td><span class="badge ${house.status === 'attempted' ? 'badge-pending' : 'badge'} status-tag status-${house.status}">${getStatusLabel(house.status)}</span></td>
      </tr>
    `).join('');
}

function renderAll() {
  renderAdmin();
  renderCollector();
  renderResident();
  renderWard();
}



// Persistent session helpers
function saveSession(username, role, userId) {
  localStorage.setItem('sgcs_username', username);
  localStorage.setItem('sgcs_role', role);
  localStorage.setItem('sgcs_userId', userId);
}

function clearSession() {
  localStorage.removeItem('sgcs_username');
  localStorage.removeItem('sgcs_role');
  localStorage.removeItem('sgcs_userId');
}

function getStoredSession() {
  return {
    username: localStorage.getItem('sgcs_username'),
    role: localStorage.getItem('sgcs_role'),
    userId: localStorage.getItem('sgcs_userId')
  };
}
function tickScan() {
  // Stop looping if shift ended or scanning is paused
  if (!state.shiftStarted || !state.scanActive) return;

  if (els.cameraFeed.readyState === els.cameraFeed.HAVE_ENOUGH_DATA) {
    const canvas = document.createElement("canvas");
    canvas.width = els.cameraFeed.videoWidth;
    canvas.height = els.cameraFeed.videoHeight;
    const ctx = canvas.getContext("2d");
    
    ctx.drawImage(els.cameraFeed, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      handleQRDetected(code.data);
    }
  }
  // Queue the next frame
  requestAnimationFrame(tickScan);
}

function handleQRDetected(qrText) {
  state.scanActive = false; // Pause scanning to prevent multiple popups

  const house = state.residents.find(h => h.houseNo === qrText);
  if (house) {
    if (house.status === 'done') {
      showAlert(`${house.houseNo} is already marked as DONE.`);
      setTimeout(() => { state.scanActive = true; }, 3000);
    } else {
      // Valid uncollected house found! Auto-trigger the flow.
      closeModal(els.houseModal); // Close manual selection if open
      state.pendingScanHouseId = house.id;
      
      els.scannerSubtitle.textContent = 'Live QR match detected. Running validation.';
      els.scannerMessage.textContent = `Successfully matched ${house.houseNo}`;
      openModal(els.scannerModal);

      window.clearTimeout(state.scannerTimer);
      state.scannerTimer = window.setTimeout(() => {
        closeModal(els.scannerModal);
        openPaymentModal(house.id);
      }, 1500);
    }
  } else {
    // If it scans something unrelated, ignore and resume
    setTimeout(() => { state.scanActive = true; }, 1500);
  }
}
// Authentication and data-loading helpers
async function handleLogin() {
  const username = (els.loginUsername.value || '').trim().toLowerCase();
  const role = mockRoleFromUsername(username);
  if (!role) {
    showAlert('Unrecognized username. Use admin, collector, resident, or ward.');
    return;
  }

  // Extract user ID from username (e.g., "resident42" -> 42)
  const userIdMatch = username.match(/\d+/);
  const userId = userIdMatch ? Number(userIdMatch[0]) : null;
  state.currentUserId = userId;

  // Save session to localStorage
  saveSession(username, role, userId);

  // reveal app shell and hide login
  els.loginView.classList.remove('active');
  els.loginView.classList.add('hidden');
  els.topbar.classList.remove('hidden');
  document.querySelector('main.app-shell').classList.remove('hidden');

  state.activeRole = role;
  showAlert(`Signed in as ${role}. Loading data...`);
  await loadDataForRole(role);
  switchView(role);
}

function mockRoleFromUsername(username) {
  if (!username) return null;
  if (username.startsWith('admin')) return 'admin';
  if (username.startsWith('collector')) return 'collector';
  if (username.startsWith('resident')) return 'resident';
  if (username.startsWith('ward')) return 'ward';
  return null;
}

async function loadDataForRole(role) {
  if (role === 'collector' || role === 'admin') renderLoadingSkeleton();
  const [residents, broadcasts, inbox, receipts] = await Promise.all([
    apiService.fetchResidents(1),
    apiService.fetchBroadcasts(),
    apiService.fetchInbox(role),
    apiService.fetchReceipts()
  ]);
  state.residents = residents || [];
  state.broadcastHistory = broadcasts || [];
  state.inbox = inbox || [];
  state.receipts = receipts || [];
  state.shiftStarted = false;
  state.cameraStream = null;
  state.gpsStamped = false;
  renderAll();
}

function renderLoadingSkeleton() {
  if (els.houseList) els.houseList.innerHTML = '<div class="card">Loading route&hellip;</div>';
  if (els.notificationHistory) els.notificationHistory.innerHTML = '<tr><td colspan="3">Loading&hellip;</td></tr>';
  els.alertArea.innerHTML = '<div class="alert">Fetching latest data...</div>';
  setTimeout(() => { els.alertArea.innerHTML = ''; }, 900);
}

async function startShift() {
  try {
    // Request environment facing camera for mobile devices
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    state.cameraStream = stream;
    els.cameraFeed.srcObject = stream;
    els.cameraFeed.setAttribute("playsinline", true); // Required for iOS Safari
    els.cameraFeed.play();
    
    state.shiftStarted = true;
    state.gpsStamped = false;
    state.scanActive = true; // Enable scanning
    requestAnimationFrame(tickScan); // Start the scanning loop

    showAlert('Camera opened successfully. Shift started.');
    if (els.captureGpsBtn) els.captureGpsBtn.disabled = false;
    if (els.endShiftBtn) els.endShiftBtn.disabled = false;
    if (els.startShiftBtn) els.startShiftBtn.disabled = true;
  } catch (error) {
    state.shiftStarted = false;
    showAlert('Camera permission blocked. Please allow access.');
  } finally {
    renderCollector();
  }
}

function stopCamera() {
  state.scanActive = false; // Stop scanning loop
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach((track) => track.stop());
    state.cameraStream = null;
  }
  if (els.cameraFeed) {
    els.cameraFeed.srcObject = null;
  }
}

function closeModal(modal) {
  modal.classList.add('hidden');
  // Resume scanning automatically when a payment or scanner modal is dismissed
  if (state.shiftStarted && (modal === els.paymentModal || modal === els.scannerModal || modal === els.houseModal)) {
    setTimeout(() => { state.scanActive = true; }, 1000);
  }
}

function stampGps() {
  if (!state.shiftStarted) return;
  state.gpsStamped = true;
  showAlert('Photo captured and GPS stamped.');
  switchView('collector');
}

function openHouseFlow(id) {
  const house = getHouseById(id);
  if (!house) return;
  state.currentHouseId = id;
  els.houseModalTitle.textContent = `${house.houseNo} Collection`;
  els.houseModalSubtitle.textContent = house.address;
  els.houseModalBody.innerHTML = `
    <p>Choose how to proceed with this household.</p>
    <div class="modal-actions">
      <button id="someoneHomeBtn" class="btn btn-primary" type="button">Someone Home</button>
      <button id="noOneHomeBtn" class="btn btn-secondary" type="button">No One Home</button>
    </div>
  `;
  openModal(els.houseModal);
  document.getElementById('someoneHomeBtn').addEventListener('click', () => scanQrForHouse(id));
  document.getElementById('noOneHomeBtn').addEventListener('click', () => takeDoorPhoto(id));
}

function scanQrForHouse(id) {
  closeModal(els.houseModal);
  state.pendingScanHouseId = id;
  els.scannerSubtitle.textContent = 'QR match detected. Running GPS validation within 15m radius.';
  els.scannerMessage.textContent = 'Scanning QR code...';
  openModal(els.scannerModal);

  window.clearTimeout(state.scannerTimer);
  state.scannerTimer = window.setTimeout(() => {
    els.scannerMessage.textContent = 'GPS validated within 15m radius.';
    window.setTimeout(() => {
      closeModal(els.scannerModal);
      openPaymentModal(id);
    }, 900);
  }, 1600);
}

function takeDoorPhoto(id) {
  closeModal(els.houseModal);
  state.pendingScanHouseId = id;
  if (!state.shiftStarted) {
    showAlert('Start the shift before taking a door photo.');
    return;
  }
  if (!state.cameraStream) {
    showAlert('Camera feed is unavailable. Start the shift again.');
    return;
  }
  els.scannerSubtitle.textContent = 'Door photo capture in progress.';
  els.scannerMessage.textContent = 'Capturing door photo...';
  openModal(els.scannerModal);

  window.clearTimeout(state.scannerTimer);
  state.scannerTimer = window.setTimeout(() => {
    els.scannerMessage.textContent = 'Attendance logged as attempted.';
    window.setTimeout(() => {
      closeModal(els.scannerModal);
      updateHouseStatus(id, 'attempted');
      showAlert('House marked as ATTEMPTED. Follow-up required.');
    }, 900);
  }, 1500);
}

function openPaymentModal(id) {
  const house = getHouseById(id);
  if (!house) return;
  els.paymentModalBody.innerHTML = `
    <p><strong>${house.houseNo}</strong> is validated. Choose a payment path to complete the visit.</p>
    <div class="modal-actions">
      <button id="cashBtn" class="btn btn-primary" type="button">Collect Cash</button>
      <button id="onlineBtn" class="btn btn-secondary" type="button">Online Paid</button>
    </div>
    <div id="cashForm" class="form-row hidden">
      <label for="cashAmount">Enter exact amount before logging</label>
      <input id="cashAmount" type="number" min="1" step="1" placeholder="15" />
      <button id="logCashBtn" class="btn btn-primary" type="button">Log Cash</button>
    </div>
  `;
  openModal(els.paymentModal);

  const cashBtn = document.getElementById('cashBtn');
  const onlineBtn = document.getElementById('onlineBtn');
  const cashForm = document.getElementById('cashForm');
  const cashAmount = document.getElementById('cashAmount');
  const logCashBtn = document.getElementById('logCashBtn');

  cashBtn.addEventListener('click', () => {
    state.collectorAction = 'cash';
    cashForm.classList.remove('hidden');
    cashAmount.focus();
  });

  onlineBtn.addEventListener('click', () => {
    state.collectorAction = 'online';
    finalizeVisit(id, 15, 'Online Paid');
  });

  logCashBtn.addEventListener('click', () => {
    const amount = Number.parseFloat(cashAmount.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      showAlert('Enter the exact cash amount before logging.');
      return;
    }
    finalizeVisit(id, amount, 'Cash');
  });
}

function finalizeVisit(id, amount, mode) {
  const house = getHouseById(id);
  if (!house) return;
  if (mode === 'Cash' && !amount) {
    showAlert('Cash must be logged with an exact amount before completion.');
    return;
  }

  const receiptId = `RCPT-${String(house.id).padStart(3, '0')}-${String(state.receipts.length + 1).padStart(3, '0')}`;
  updateHouseStatus(id, 'done', { paymentMode: mode, amount, receiptId });
  state.receipts.unshift({
    id: receiptId,
    house: house.houseNo,
    amount,
    mode,
    status: 'Settled'
  });
  showAlert(`${house.houseNo} marked DONE with ${mode.toLowerCase()} payment.`);
  closeModal(els.paymentModal);
}

function bindEvents() {
  // Authentication
  if (els.loginBtn) els.loginBtn.addEventListener('click', handleLogin);
  if (els.loginPassword) els.loginPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });

  // Sign out
  if (els.signOutBtn) els.signOutBtn.addEventListener('click', () => {
    stopCamera();
    clearSession(); // clear localStorage session
    state.activeRole = null;
    state.currentUserId = null;
    els.loginUsername.value = '';
    els.loginPassword.value = '';
    els.topbar.classList.add('hidden');
    document.querySelector('main.app-shell').classList.add('hidden');
    els.loginView.classList.add('active');
    els.loginView.classList.remove('hidden');
    state.residents = [];
    state.inbox = [];
    state.receipts = [];
    renderAll();
  });

  // Admin actions
  if (els.broadcastBtn) els.broadcastBtn.addEventListener('click', async () => {
    const msg = 'Monthly notification broadcast to all residents.';
    state.broadcastCount += 1;
    state.broadcastHistory.unshift({ time: formatTime(), message: msg, actor: 'Admin' });
    showAlert('Monthly notification broadcast successfully.');
    renderAdmin();
  });

  // Collector actions
  if (els.startShiftBtn) els.startShiftBtn.addEventListener('click', startShift);
  if (els.endShiftBtn) els.endShiftBtn.addEventListener('click', endShift);
  if (els.captureGpsBtn) els.captureGpsBtn.addEventListener('click', stampGps);

  // House list interaction (delegation)
  if (els.houseList) els.houseList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-house-id]');
    if (!button) return;
    openHouseFlow(Number(button.dataset.houseId));
  });

  // modals
  if (els.closeHouseModal) els.closeHouseModal.addEventListener('click', () => closeModal(els.houseModal));
  if (els.closePaymentModal) els.closePaymentModal.addEventListener('click', () => closeModal(els.paymentModal));
  if (els.closeScannerModal) els.closeScannerModal.addEventListener('click', () => { window.clearTimeout(state.scannerTimer); closeModal(els.scannerModal); });

  [els.houseModal, els.paymentModal, els.scannerModal].forEach((modal) => {
    if (!modal) return;
    modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal); });
  });

  window.addEventListener('beforeunload', stopCamera);
}

function init() {
  cacheElements();
  bindEvents();
  
  // Check for stored session and auto-restore if exists
  const stored = getStoredSession();
  if (stored.username && stored.role) {
    // Auto-login with stored credentials
    (async () => {
      state.activeRole = stored.role;
      state.currentUserId = stored.userId ? Number(stored.userId) : null;
      // reveal app shell and hide login
      els.loginView.classList.remove('active');
      els.loginView.classList.add('hidden');
      els.topbar.classList.remove('hidden');
      document.querySelector('main.app-shell').classList.remove('hidden');
      // load data
      await loadDataForRole(stored.role);
      switchView(stored.role);
    })();
  } else {
    // initial UI: login visible. app-shell and topbar remain hidden until sign in
    const appShell = document.querySelector('main.app-shell');
    if (appShell) appShell.classList.add('hidden');
    if (els.topbar) els.topbar.classList.add('hidden');
    if (els.loginView) els.loginView.classList.add('active');
    renderAll();
  }
}

document.addEventListener('DOMContentLoaded', init);

// small cloak: ensure login/app shell correct state until JS runs or session restores
(() => {
  const stored = localStorage.getItem('sgcs_role');
  const appShell = document.querySelector('main.app-shell');
  const topbar = document.querySelector('.topbar');
  const login = document.getElementById('loginView');
  if (stored) {
    // Session exists, show app shell
    if (appShell) appShell.classList.remove('hidden');
    if (topbar) topbar.classList.remove('hidden');
    if (login) login.classList.add('hidden');
  } else {
    // No session, show login
    if (appShell) appShell.classList.add('hidden');
    if (topbar) topbar.classList.add('hidden');
    if (login) { login.classList.add('active'); login.classList.remove('hidden'); }
  }
})();