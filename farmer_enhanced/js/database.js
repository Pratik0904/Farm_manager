// ===================== DATABASE WRAPPER (FIREBASE) =====================

// TODO: Replace this config placeholder with your actual Firebase Configuration from the Firebase Console!
const firebaseConfig = {
  apiKey: "AIzaSyAdJ4_BuyF0d0wdxmVUT0O3Oy-ExTR9BWU",
  authDomain: "farmmanager-db3ce.firebaseapp.com",
  projectId: "farmmanager-db3ce",
  storageBucket: "farmmanager-db3ce.firebasestorage.app",
  messagingSenderId: "719186908387",
  appId: "1:719186908387:web:cf95e1ab37d66b01db61d6",
  measurementId: "G-EPSDL3ZP1E"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);

  // Enable offline persistence for performance and offline access
  firebase.firestore().enablePersistence().catch(err => {
    if (err.code == 'failed-precondition') {
      console.warn("Offline persistence failed (multiple tabs open)");
    } else if (err.code == 'unimplemented') {
      console.warn("Offline persistence is not supported by this browser");
    }
  });
}

const db = firebase.firestore();
const auth = firebase.auth();

// Helpers to get collection references dynamically
function getUserRef(userId) {
  return db.collection('users').doc(userId);
}

function getCropsRef(userId) {
  return getUserRef(userId).collection('crops');
}

function getExpensesRef(userId) {
  return getUserRef(userId).collection('expenses');
}

// Global sales collection reference
function getSalesRef(userId) {
  return getUserRef(userId).collection('sales');
}

// Udhari collection reference
function getUdhariRef(userId) {
  return getUserRef(userId).collection('udhari');
}

// Spray Logs collection reference
function getSprayLogsRef(userId) {
  return getUserRef(userId).collection('sprayLogs');
}

// ===================== DATABASE API METHODS =====================

/**
 * Loads all user data (profile, crops, expenses, sales) from Firestore.
 */
async function dbLoadUserData(userId) {
  const userDoc = await getUserRef(userId).get();
  if (!userDoc.exists) {
    // If it's the demo user and doc doesn't exist, seed it!
    const currentUserEmail = auth.currentUser ? auth.currentUser.email : '';
    if (currentUserEmail === 'demo@farm.com') {
      await dbSeedDemoUser(userId);
      return dbLoadUserData(userId); // Retry loading
    }
    throw new Error("User profile not found in database.");
  }

  const userData = userDoc.data();
  userData.id = userId;
  userData.crops = [];
  userData.expenses = [];
  userData.sales = [];

  // Fetch crops
  const cropsSnap = await getCropsRef(userId).get();
  cropsSnap.forEach(doc => {
    userData.crops.push({ id: doc.id, ...doc.data() });
  });

  // Fetch expenses
  const expensesSnap = await getExpensesRef(userId).get();
  expensesSnap.forEach(doc => {
    userData.expenses.push({ id: doc.id, ...doc.data() });
  });

  // Fetch sales
  const salesSnap = await getSalesRef(userId).get();
  salesSnap.forEach(doc => {
    userData.sales.push({ id: doc.id, ...doc.data() });
  });

  // Fetch Udhari
  userData.udhari = [];
  const udhariSnap = await getUdhariRef(userId).get();
  udhariSnap.forEach(doc => {
    userData.udhari.push({ id: doc.id, ...doc.data() });
  });

  // Fetch Spray Logs
  userData.sprayLogs = [];
  const sprayLogsSnap = await getSprayLogsRef(userId).get();
  sprayLogsSnap.forEach(doc => {
    userData.sprayLogs.push({ id: doc.id, ...doc.data() });
  });

  return userData;
}

async function dbLogin(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (err) {
    // If the demo user fails to log in, automatically try to register it on this project!
    if (email === 'demo@farm.com') {
      console.log("Demo user login failed. Attempting to auto-create demo account...");
      try {
        await dbRegister('Ramesh Kumar', email, password, 'Nashik, Maharashtra', '+91 98765 43210', 12.5);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
      } catch (regErr) {
        console.error("Auto-registration of demo user failed:", regErr);
        if (regErr.code === 'auth/operation-not-allowed') {
          throw new Error("Email/Password provider is disabled. Please go to your Firebase Console -> Authentication -> Sign-in method, and enable 'Email/Password'.");
        }
        // If registration fails because user already exists (auth/email-already-in-use), throw the original wrong password error
        throw err;
      }
    }

    // Provide a helpful message if Email/Password sign-in is disabled in the Firebase project console
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error("Email/Password provider is disabled. Please go to your Firebase Console -> Authentication -> Sign-in method, and enable 'Email/Password'.");
    }

    // Parse JSON-formatted error messages from the REST backend if present
    let displayMessage = err.message;
    if (displayMessage && displayMessage.startsWith('{')) {
      try {
        const parsed = JSON.parse(displayMessage);
        if (parsed.error && parsed.error.message) {
          displayMessage = parsed.error.message.replace(/_/g, ' ');
        }
      } catch (e) {}
    }
    throw new Error(displayMessage || err.code || "Invalid email or password.");
  }
}

/**
 * Registers a new user and creates their profile document in Firestore.
 */
async function dbRegister(name, email, password, location, phone, totalLand) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const userId = userCredential.user.uid;

    const userProfile = {
      name,
      email,
      location,
      phone,
      totalLand: parseFloat(totalLand) || 0
    };

    // Create user document in Firestore
    await getUserRef(userId).set(userProfile);

    return { id: userId, ...userProfile, sprayLogs: [] };
  } catch (err) {
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error("Email/Password provider is disabled. Please go to your Firebase Console -> Authentication -> Sign-in method, and enable 'Email/Password'.");
    }
    throw err;
  }
}

/**
 * Logs out the current user.
 */
async function dbLogout() {
  await auth.signOut();
}

/**
 * Updates the current user's profile information.
 */
async function dbUpdateProfile(userId, profileData) {
  await getUserRef(userId).update(profileData);
}

/**
 * Adds a new crop.
 */
async function dbAddCrop(userId, crop) {
  const cropId = 'c_' + Date.now();
  const docData = { ...crop };
  delete docData.id; // Store without ID in fields
  await getCropsRef(userId).doc(cropId).set(docData);
  return { id: cropId, ...docData };
}

/**
 * Updates an existing crop.
 */
async function dbUpdateCrop(userId, cropId, cropData) {
  const docData = { ...cropData };
  delete docData.id;
  await getCropsRef(userId).doc(cropId).set(docData, { merge: true });
}

/**
 * Deletes a crop and all associated expenses and sales.
 */
async function dbDeleteCrop(userId, cropId) {
  const batch = db.batch();

  // Delete the crop document
  batch.delete(getCropsRef(userId).doc(cropId));

  // Delete associated expenses
  const expensesSnap = await getExpensesRef(userId).where('cropId', '==', cropId).get();
  expensesSnap.forEach(doc => {
    batch.delete(getExpensesRef(userId).doc(doc.id));
  });

  // Delete associated sales
  const salesSnap = await getSalesRef(userId).where('cropId', '==', cropId).get();
  salesSnap.forEach(doc => {
    batch.delete(getSalesRef(userId).doc(doc.id));
  });

  // Delete associated spray logs
  const sprayLogsSnap = await getSprayLogsRef(userId).where('cropId', '==', cropId).get();
  sprayLogsSnap.forEach(doc => {
    batch.delete(getSprayLogsRef(userId).doc(doc.id));
  });

  await batch.commit();
}

/**
 * Adds an expense.
 */
async function dbAddExpense(userId, expense) {
  const expenseId = 'e_' + Date.now();
  const docData = { ...expense };
  delete docData.id;
  await getExpensesRef(userId).doc(expenseId).set(docData);
  return { id: expenseId, ...docData };
}

/**
 * Updates an expense.
 */
async function dbUpdateExpense(userId, expenseId, expenseData) {
  const docData = { ...expenseData };
  delete docData.id;
  await getExpensesRef(userId).doc(expenseId).set(docData, { merge: true });
}

/**
 * Deletes an expense.
 */
async function dbDeleteExpense(userId, expenseId) {
  await getExpensesRef(userId).doc(expenseId).delete();
}

/**
 * Adds a sale.
 */
async function dbAddSale(userId, sale) {
  const saleId = 's_' + Date.now();
  const docData = { ...sale };
  delete docData.id;
  await getSalesRef(userId).doc(saleId).set(docData);
  return { id: saleId, ...docData };
}

/**
 * Updates a sale.
 */
async function dbUpdateSale(userId, saleId, saleData) {
  const docData = { ...saleData };
  delete docData.id;
  await getSalesRef(userId).doc(saleId).set(docData, { merge: true });
}

/**
 * Deletes a sale.
 */
async function dbDeleteSale(userId, saleId) {
  await getSalesRef(userId).doc(saleId).delete();
}

/**
 * Adds an Udhari entry.
 */
async function dbAddUdhari(userId, udhari) {
  const udhariId = 'u_' + Date.now();
  const docData = { ...udhari };
  delete docData.id;
  await getUdhariRef(userId).doc(udhariId).set(docData);
  return { id: udhariId, ...docData };
}

/**
 * Updates an Udhari entry.
 */
async function dbUpdateUdhari(userId, udhariId, udhariData) {
  const docData = { ...udhariData };
  delete docData.id;
  await getUdhariRef(userId).doc(udhariId).set(docData, { merge: true });
}

/**
 * Deletes an Udhari entry.
 */
async function dbDeleteUdhari(userId, udhariId) {
  await getUdhariRef(userId).doc(udhariId).delete();
}

/**
 * Seeds the Firestore database with demo data for Ramesh Kumar (demo@farm.com).
 */
async function dbSeedDemoUser(userId) {
  // Save user profile
  await getUserRef(userId).set({
    name: 'Ramesh Kumar',
    email: 'demo@farm.com',
    location: 'Nashik, Maharashtra',
    phone: '+91 98765 43210',
    totalLand: 12.5
  });

  const batch = db.batch();

  // Seed Crops
  const crops = [
    { id: 'c1', name: 'Wheat (Gehu)', land: 3.5, season: 'Rabi', startDate: '2024-11-01', status: 'Harvested', year: 2025 },
    { id: 'c2', name: 'Cotton (Kapas)', land: 4.0, season: 'Kharif', startDate: '2024-06-15', status: 'Harvested', year: 2025 },
    { id: 'c3', name: 'Onion (Pyaaz)', land: 2.0, season: 'Rabi', startDate: '2025-01-10', status: 'Growing', year: 2025 },
    { id: 'c4', name: 'Soybean', land: 3.0, season: 'Kharif', startDate: '2024-07-01', status: 'Harvested', year: 2025 },
    { id: 'c5', name: 'Wheat (Gehu)', land: 3.0, season: 'Rabi', startDate: '2023-11-05', status: 'Harvested', year: 2024 },
    { id: 'c6', name: 'Cotton (Kapas)', land: 3.5, season: 'Kharif', startDate: '2023-06-10', status: 'Harvested', year: 2024 },
    { id: 'c7', name: 'Soybean', land: 2.5, season: 'Kharif', startDate: '2023-07-01', status: 'Harvested', year: 2024 },
    { id: 'c8', name: 'Tomato', land: 1.5, season: 'Rabi', startDate: '2023-12-01', status: 'Harvested', year: 2024 }
  ];
  crops.forEach(c => {
    const data = { ...c };
    delete data.id;
    batch.set(getCropsRef(userId).doc(c.id), data);
  });

  // Seed Expenses
  const expenses = [
    { id: 'e1', cropId: 'c1', category: 'Seeds', amount: 12000, date: '2024-11-05', notes: 'Certified seed' },
    { id: 'e2', cropId: 'c1', category: 'Fertilizer', amount: 18000, date: '2024-11-20', notes: 'Urea + DAP' },
    { id: 'e3', cropId: 'c1', category: 'Labor', amount: 22000, date: '2024-12-10', notes: 'Weeding & spray' },
    { id: 'e4', cropId: 'c1', category: 'Irrigation', amount: 9500, date: '2024-12-15', notes: 'Drip x3' },
    { id: 'e5', cropId: 'c1', category: 'Machinery', amount: 15000, date: '2025-03-10', notes: 'Harvester rent' },
    { id: 'e6', cropId: 'c2', category: 'Seeds', amount: 8500, date: '2024-06-18', notes: 'BT Cotton' },
    { id: 'e7', cropId: 'c2', category: 'Fertilizer', amount: 24000, date: '2024-07-10', notes: 'Mixed nutrients' },
    { id: 'e8', cropId: 'c2', category: 'Labor', amount: 32000, date: '2024-08-01', notes: 'Picking labor' },
    { id: 'e9', cropId: 'c2', category: 'Irrigation', amount: 11000, date: '2024-08-20', notes: 'Sprinkler system' },
    { id: 'e10', cropId: 'c3', category: 'Seeds', amount: 6000, date: '2025-01-12', notes: 'Local variety' },
    { id: 'e11', cropId: 'c3', category: 'Labor', amount: 14000, date: '2025-02-01', notes: 'Planting' },
    { id: 'e12', cropId: 'c3', category: 'Fertilizer', amount: 10000, date: '2025-02-15', notes: 'Compost' },
    { id: 'e13', cropId: 'c4', category: 'Seeds', amount: 9000, date: '2024-07-03', notes: 'Improved variety' },
    { id: 'e14', cropId: 'c4', category: 'Fertilizer', amount: 16000, date: '2024-07-25', notes: 'Phosphate' },
    { id: 'e15', cropId: 'c4', category: 'Labor', amount: 20000, date: '2024-09-15', notes: 'Harvest' },
    { id: 'e16', cropId: 'c5', category: 'Seeds', amount: 10000, date: '2023-11-08', notes: 'Local seed' },
    { id: 'e17', cropId: 'c5', category: 'Fertilizer', amount: 14000, date: '2023-11-25', notes: 'Urea' },
    { id: 'e18', cropId: 'c5', category: 'Labor', amount: 18000, date: '2023-12-15', notes: 'Weeding' },
    { id: 'e19', cropId: 'c5', category: 'Machinery', amount: 12000, date: '2024-03-05', notes: 'Harvester' },
    { id: 'e20', cropId: 'c6', category: 'Seeds', amount: 7500, date: '2023-06-12', notes: 'BT Cotton' },
    { id: 'e21', cropId: 'c6', category: 'Fertilizer', amount: 20000, date: '2023-07-05', notes: 'Mixed' },
    { id: 'e22', cropId: 'c6', category: 'Labor', amount: 28000, date: '2023-08-10', notes: 'Picking' },
    { id: 'e23', cropId: 'c6', category: 'Irrigation', amount: 9500, date: '2023-08-25', notes: 'Sprinkler' },
    { id: 'e24', cropId: 'c7', category: 'Seeds', amount: 7500, date: '2023-07-05', notes: 'Soybean seed' },
    { id: 'e25', cropId: 'c7', category: 'Fertilizer', amount: 13000, date: '2023-07-28', notes: 'DAP' },
    { id: 'e26', cropId: 'c7', category: 'Labor', amount: 16000, date: '2023-09-20', notes: 'Harvest labor' },
    { id: 'e27', cropId: 'c8', category: 'Seeds', amount: 4500, date: '2023-12-03', notes: 'Hybrid seeds' },
    { id: 'e28', cropId: 'c8', category: 'Fertilizer', amount: 8000, date: '2023-12-20', notes: 'Compost' },
    { id: 'e29', cropId: 'c8', category: 'Labor', amount: 10000, date: '2024-01-15', notes: 'Picking' },
    { id: 'e30', cropId: 'c8', category: 'Irrigation', amount: 5000, date: '2024-01-20', notes: 'Drip' }
  ];
  expenses.forEach(e => {
    const data = { ...e };
    delete data.id;
    batch.set(getExpensesRef(userId).doc(e.id), data);
  });

  // Seed Sales
  const sales = [
    { id: 's1', cropId: 'c1', qty: 42, unit: 'Quintal', pricePerUnit: 2200, date: '2025-03-20' },
    { id: 's2', cropId: 'c2', qty: 28, unit: 'Quintal', pricePerUnit: 5800, date: '2024-11-15' },
    { id: 's4', cropId: 'c4', qty: 55, unit: 'Quintal', pricePerUnit: 3600, date: '2024-11-20' },
    { id: 's5', cropId: 'c5', qty: 36, unit: 'Quintal', pricePerUnit: 1900, date: '2024-03-18' },
    { id: 's6', cropId: 'c6', qty: 24, unit: 'Quintal', pricePerUnit: 5200, date: '2023-11-10' },
    { id: 's7', cropId: 'c7', qty: 44, unit: 'Quintal', pricePerUnit: 3200, date: '2023-11-25' },
    { id: 's8', cropId: 'c8', qty: 80, unit: 'Quintal', pricePerUnit: 1800, date: '2024-02-20' }
  ];
  sales.forEach(s => {
    const data = { ...s };
    delete data.id;
    batch.set(getSalesRef(userId).doc(s.id), data);
  });

  // Seed Udhari Ledger
  const udhari = [
    { id: 'u1', type: 'take', name: 'Suresh Patil', phone: '+91 99887 76655', amount: 15000, date: '2025-05-10', notes: 'Seed purchase share' },
    { id: 'u2', type: 'take', name: 'Mahendra Singh', phone: '+91 88776 65544', amount: 8000, date: '2025-05-28', notes: 'Tractor rent share' },
    { id: 'u3', type: 'give', name: 'Amit Sharma (Fertilizer)', phone: '+91 77665 54433', amount: 12000, date: '2025-06-01', notes: 'Fertilizer purchase credit' },
    { id: 'u4', type: 'give', name: 'Rajesh Kirana Store', phone: '+91 66554 43322', amount: 3500, date: '2025-06-05', notes: 'Daily farm supplies' }
  ];
  udhari.forEach(u => {
    const data = { ...u };
    delete data.id;
    batch.set(getUdhariRef(userId).doc(u.id), data);
  });

  await batch.commit();
}

/**
 * Deletes all crops, expenses, and sales records for the given user in Firestore.
 */
async function dbResetUserData(userId) {
  const batch = db.batch();

  // 1. Fetch and delete all crops
  const cropsSnap = await getCropsRef(userId).get();
  cropsSnap.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 2. Fetch and delete all expenses
  const expensesSnap = await getExpensesRef(userId).get();
  expensesSnap.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 3. Fetch and delete all sales
  const salesSnap = await getSalesRef(userId).get();
  salesSnap.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 4. Fetch and delete all udhari
  const udhariSnap = await getUdhariRef(userId).get();
  udhariSnap.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 5. Fetch and delete all spray logs
  const sprayLogsSnap = await getSprayLogsRef(userId).get();
  sprayLogsSnap.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Commit the batch deletion atomically
  await batch.commit();
}

/**
 * Adds a spray log entry.
 */
async function dbAddSpray(userId, spray) {
  const sprayId = 'sp_' + Date.now();
  const docData = { ...spray };
  delete docData.id;
  await getSprayLogsRef(userId).doc(sprayId).set(docData);
  return { id: sprayId, ...docData };
}

/**
 * Updates a spray log entry.
 */
async function dbUpdateSpray(userId, sprayId, sprayData) {
  const docData = { ...sprayData };
  delete docData.id;
  await getSprayLogsRef(userId).doc(sprayId).set(docData, { merge: true });
}

/**
 * Deletes a spray log entry.
 */
async function dbDeleteSpray(userId, sprayId) {
  await getSprayLogsRef(userId).doc(sprayId).delete();
}


