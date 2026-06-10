// ===================== STATE =====================
const state = {
  currentUser: null,
  users: {},
  currentTab: 'dashboard',
  selectedExpenseCropId: null,
  compareMode: 'both'
};

// ===================== DEMO DATA =====================
const DEMO_USER = {
  id: 'demo',
  name: 'Ramesh Kumar',
  email: 'demo@farm.com',
  password: 'Demo@1234',
  location: 'Nashik, Maharashtra',
  phone: '+91 98765 43210',
  totalLand: 12.5,
  crops: [
    // ---- This Year (2025) ----
    { id: 'c1', name: 'Wheat (Gehu)',   land: 3.5, season: 'Rabi',   startDate: '2024-11-01', status: 'Harvested', year: 2025 },
    { id: 'c2', name: 'Cotton (Kapas)', land: 4.0, season: 'Kharif', startDate: '2024-06-15', status: 'Harvested', year: 2025 },
    { id: 'c3', name: 'Onion (Pyaaz)', land: 2.0, season: 'Rabi',   startDate: '2025-01-10', status: 'Growing',   year: 2025 },
    { id: 'c4', name: 'Soybean',       land: 3.0, season: 'Kharif', startDate: '2024-07-01', status: 'Harvested', year: 2025 },
    // ---- Last Year (2024) ----
    { id: 'c5', name: 'Wheat (Gehu)',   land: 3.0, season: 'Rabi',   startDate: '2023-11-05', status: 'Harvested', year: 2024 },
    { id: 'c6', name: 'Cotton (Kapas)', land: 3.5, season: 'Kharif', startDate: '2023-06-10', status: 'Harvested', year: 2024 },
    { id: 'c7', name: 'Soybean',        land: 2.5, season: 'Kharif', startDate: '2023-07-01', status: 'Harvested', year: 2024 },
    { id: 'c8', name: 'Tomato',         land: 1.5, season: 'Rabi',   startDate: '2023-12-01', status: 'Harvested', year: 2024 },
  ],
  expenses: [
    // This Year
    { id:'e1',  cropId:'c1', category:'Seeds',      amount:12000, date:'2024-11-05', notes:'Certified seed' },
    { id:'e2',  cropId:'c1', category:'Fertilizer', amount:18000, date:'2024-11-20', notes:'Urea + DAP' },
    { id:'e3',  cropId:'c1', category:'Labor',      amount:22000, date:'2024-12-10', notes:'Weeding & spray' },
    { id:'e4',  cropId:'c1', category:'Irrigation', amount: 9500, date:'2024-12-15', notes:'Drip x3' },
    { id:'e5',  cropId:'c1', category:'Machinery',  amount:15000, date:'2025-03-10', notes:'Harvester rent' },
    { id:'e6',  cropId:'c2', category:'Seeds',      amount: 8500, date:'2024-06-18', notes:'BT Cotton' },
    { id:'e7',  cropId:'c2', category:'Fertilizer', amount:24000, date:'2024-07-10', notes:'Mixed nutrients' },
    { id:'e8',  cropId:'c2', category:'Labor',      amount:32000, date:'2024-08-01', notes:'Picking labor' },
    { id:'e9',  cropId:'c2', category:'Irrigation', amount:11000, date:'2024-08-20', notes:'Sprinkler system' },
    { id:'e10', cropId:'c3', category:'Seeds',      amount: 6000, date:'2025-01-12', notes:'Local variety' },
    { id:'e11', cropId:'c3', category:'Labor',      amount:14000, date:'2025-02-01', notes:'Planting' },
    { id:'e12', cropId:'c3', category:'Fertilizer', amount:10000, date:'2025-02-15', notes:'Compost' },
    { id:'e13', cropId:'c4', category:'Seeds',      amount: 9000, date:'2024-07-03', notes:'Improved variety' },
    { id:'e14', cropId:'c4', category:'Fertilizer', amount:16000, date:'2024-07-25', notes:'Phosphate' },
    { id:'e15', cropId:'c4', category:'Labor',      amount:20000, date:'2024-09-15', notes:'Harvest' },
    // Last Year
    { id:'e16', cropId:'c5', category:'Seeds',      amount:10000, date:'2023-11-08', notes:'Local seed' },
    { id:'e17', cropId:'c5', category:'Fertilizer', amount:14000, date:'2023-11-25', notes:'Urea' },
    { id:'e18', cropId:'c5', category:'Labor',      amount:18000, date:'2023-12-15', notes:'Weeding' },
    { id:'e19', cropId:'c5', category:'Machinery',  amount:12000, date:'2024-03-05', notes:'Harvester' },
    { id:'e20', cropId:'c6', category:'Seeds',      amount: 7500, date:'2023-06-12', notes:'BT Cotton' },
    { id:'e21', cropId:'c6', category:'Fertilizer', amount:20000, date:'2023-07-05', notes:'Mixed' },
    { id:'e22', cropId:'c6', category:'Labor',      amount:28000, date:'2023-08-10', notes:'Picking' },
    { id:'e23', cropId:'c6', category:'Irrigation', amount: 9500, date:'2023-08-25', notes:'Sprinkler' },
    { id:'e24', cropId:'c7', category:'Seeds',      amount: 7500, date:'2023-07-05', notes:'Soybean seed' },
    { id:'e25', cropId:'c7', category:'Fertilizer', amount:13000, date:'2023-07-28', notes:'DAP' },
    { id:'e26', cropId:'c7', category:'Labor',      amount:16000, date:'2023-09-20', notes:'Harvest labor' },
    { id:'e27', cropId:'c8', category:'Seeds',      amount: 4500, date:'2023-12-03', notes:'Hybrid seeds' },
    { id:'e28', cropId:'c8', category:'Fertilizer', amount: 8000, date:'2023-12-20', notes:'Compost' },
    { id:'e29', cropId:'c8', category:'Labor',      amount:10000, date:'2024-01-15', notes:'Picking' },
    { id:'e30', cropId:'c8', category:'Irrigation', amount: 5000, date:'2024-01-20', notes:'Drip' },
  ],
  sales: [
    // This Year
    { id:'s1', cropId:'c1', qty:42, unit:'Quintal', pricePerUnit:2200, date:'2025-03-20' },
    { id:'s2', cropId:'c2', qty:28, unit:'Quintal', pricePerUnit:5800, date:'2024-11-15' },
    { id:'s4', cropId:'c4', qty:55, unit:'Quintal', pricePerUnit:3600, date:'2024-11-20' },
    // Last Year
    { id:'s5', cropId:'c5', qty:36, unit:'Quintal', pricePerUnit:1900, date:'2024-03-18' },
    { id:'s6', cropId:'c6', qty:24, unit:'Quintal', pricePerUnit:5200, date:'2023-11-10' },
    { id:'s7', cropId:'c7', qty:44, unit:'Quintal', pricePerUnit:3200, date:'2023-11-25' },
    { id:'s8', cropId:'c8', qty:80, unit:'Quintal', pricePerUnit:1800, date:'2024-02-20' },
  ],
  udhari: [
    { id: 'u1', type: 'take', name: 'Suresh Patil', phone: '+91 99887 76655', amount: 15000, date: '2025-05-10', notes: 'Seed purchase share' },
    { id: 'u2', type: 'take', name: 'Mahendra Singh', phone: '+91 88776 65544', amount: 8000, date: '2025-05-28', notes: 'Tractor rent share' },
    { id: 'u3', type: 'give', name: 'Amit Sharma (Fertilizer)', phone: '+91 77665 54433', amount: 12000, date: '2025-06-01', notes: 'Fertilizer purchase credit' },
    { id: 'u4', type: 'give', name: 'Rajesh Kirana Store', phone: '+91 66554 43322', amount: 3500, date: '2025-06-05', notes: 'Daily farm supplies' }
  ]
};

// Crop image map (key = keyword in crop name)
const CROP_IMAGES = {
  'Wheat':     'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Vehn%C3%A4pelto_6.jpg/500px-Vehn%C3%A4pelto_6.jpg',
  'Rice':      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg/500px-20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg',
  'Cotton':    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/CottonPlant.JPG/500px-CottonPlant.JPG',
  'Sugarcane': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Sugarcane_field_in_Alagoas_state%2C_Brazil_-_November_2008.jpg/500px-Sugarcane_field_in_Alagoas_state%2C_Brazil_-_November_2008.jpg',
  'Soybean':   'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Soybean.USDA.jpg/500px-Soybean.USDA.jpg',
  'Maize':     'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Zea_mays_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-283.jpg/500px-Zea_mays_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-283.jpg',
  'Groundnut': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Arachis_hypogaea_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-163.jpg/500px-Arachis_hypogaea_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-163.jpg',
  'Onion':     'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Mixed_onions.jpg/500px-Mixed_onions.jpg',
  'Tomato':    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/500px-Tomato_je.jpg',
  'Potato':    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/500px-Patates.jpg',
  'Turmeric':  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Turmeric_inflorescence.jpg/500px-Turmeric_inflorescence.jpg',
  'Jowar':     'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Sorghum_bicolor03.jpg/500px-Sorghum_bicolor03.jpg',
  'Bajra':     'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Grain_millet%2C_early_grain_fill%2C_Tifton%2C_7-3-02.jpg/500px-Grain_millet%2C_early_grain_fill%2C_Tifton%2C_7-3-02.jpg',
  'Chilli':    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Madame_Jeanette_and_other_chillies.jpg/500px-Madame_Jeanette_and_other_chillies.jpg',
  'Gram':      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Chickpea_BNC.jpg/500px-Chickpea_BNC.jpg',
  'default':   'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/2060_Farming_in_Banbasa_Uttarakhand_India.jpg/500px-2060_Farming_in_Banbasa_Uttarakhand_India.jpg',
};

const CAT_ICONS  = { Seeds:'🌱', Fertilizer:'🌿', Labor:'👷', Irrigation:'💧', Machinery:'🚜' };
const CAT_COLORS = { Seeds:'cat-seeds', Fertilizer:'cat-fertilizer', Labor:'cat-labor', Irrigation:'cat-irrigation', Machinery:'cat-machinery' };
const CAT_CLRS   = { Seeds:'#7AAB5A', Fertilizer:'#5A7A4A', Labor:'#C8A45A', Irrigation:'#4A64A0', Machinery:'#7B4A2D' };
const CATEGORIES = ['Seeds', 'Fertilizer', 'Labor', 'Irrigation', 'Machinery'];

function saveState() {
  // Cloud Firestore handles persistence asynchronously!
}

function loadState() {
  // Firebase Auth and dbLoadUserData handles data loading asynchronously!
}

loadState();
