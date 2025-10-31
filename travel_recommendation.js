/* travel_recommendation.js
   - Fetch travel_recommendation_api.json and log result
   - If fetch fails, fallback to built-in data
   - Search only triggered by Search button
   - Clear button resets results
   - Includes timezone logic + UI fallback messages
*/

let travelData = null;

// ✅ Actual timezone mapping for your destinations
const timezones = {
  "Greece": "Europe/Athens",
  "Australia": "Australia/Brisbane",
  "India": "Asia/Kolkata",
  "Cambodia": "Asia/Phnom_Penh",
  "France": "Europe/Paris",
  "Spain": "Europe/Madrid",
  "default": "UTC"
};

// UI references
const resultsSectionEl = () => document.getElementById('resultsSection');
const resultsGridEl = () => document.getElementById('resultsGrid');
const searchInputEl = () => document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');

// Guard against missing mobile toggle
const mobileToggle = document.getElementById('mobileToggle');
if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    const nav = document.getElementById('navLinks');
    nav.classList.toggle('show');
  });
}

// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// ======== FETCH TRAVEL DATA ========
async function fetchTravelData() {
  try {
    const resp = await fetch('./travel_recommendation_api.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    console.log('Fetched travel_recommendation_api.json:', json);
    if (json && (json.beaches || json.temples || json.countries)) {
      travelData = json;
      return;
    }
    throw new Error('Invalid JSON structure');
  } catch (err) {
    console.warn('Failed to load travel_recommendation_api.json:', err.message);
    useFallbackData();
  }
  console.log('Using fallback data:', travelData);
}

// ======== FALLBACK DATA ========
function useFallbackData() {
  travelData = {
    beaches: [
      { name: "Elafonissi Beach", country: "Greece", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80", description: "Famous for its pink sand and calm turquoise lagoons on the southwest coast of Crete." },
      { name: "Whitehaven Beach", country: "Australia", imageUrl: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=900&q=80", description: "World-renowned for its 99% pure white silica sand and turquoise waters." }
    ],
    temples: [
      { name: "Sri Ranganathaswamy Temple", country: "India", imageUrl: "https://images.unsplash.com/photo-1561484930-2b7f2bba4b24?w=900&q=80", description: "A grand Hindu temple in Karnataka, India, dedicated to Lord Ranganatha." },
      { name: "Angkor Wat", country: "Cambodia", imageUrl: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=900&q=80", description: "A magnificent temple complex known for its architecture and carvings." }
    ],
    countries: [
      { name: "France", imageUrl: "https://images.unsplash.com/photo-1519121788458-1a43f54a26a7?w=900&q=80", short: "France is a global hub of culture, food, and art — from Paris to the Riviera." },
      { name: "Spain", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80", short: "Spain boasts golden beaches, festivals, and rich architectural heritage." }
    ]
  };
}

// ======== SEARCH LOGIC ========
function searchDestinations() {
  const q = (searchInputEl().value || '').trim().toLowerCase();
  resultsGridEl().innerHTML = '';

  if (!q) {
    alert('Type a keyword like "beach", "temple", or "country" and click Search.');
    return;
  }
  if (!travelData) {
    resultsGridEl().innerHTML = `<p style="color:#0e7a78;text-align:center;padding:2rem;">Travel data is loading. Please try again shortly.</p>`;
    resultsSectionEl().style.display = 'block';
    return;
  }

  const isBeachQuery = q.includes('beach');
  const isTempleQuery = q.includes('temple');
  const isCountryQuery = q.includes('country');
  const matches = [];

  const matchItems = (arr, type) => {
    arr.forEach(item => {
      const searchable = `${item.name} ${item.country || ''} ${item.description || item.short || ''}`.toLowerCase();
      if (searchable.includes(q) || (isBeachQuery && type === 'beach') || (isTempleQuery && type === 'temple') || (isCountryQuery && type === 'country')) {
        matches.push({ type, item });
      }
    });
  };

  matchItems(travelData.beaches || [], 'beach');
  matchItems(travelData.temples || [], 'temple');
  matchItems(travelData.countries || [], 'country');

  if (matches.length === 0) {
    resultsGridEl().innerHTML = `<p style="color:#0e7a78;text-align:center;padding:2rem;">No results found. Try "beach", "temple", "country", or a place name like "Elafonissi" or "Angkor".</p>`;
    resultsSectionEl().style.display = 'block';
    return;
  }

  matches.forEach(({ type, item }) => resultsGridEl().appendChild(buildCard(type, item)));
  resultsSectionEl().style.display = 'block';
  resultsSectionEl().scrollIntoView({ behavior: 'smooth' });
}

// ======== CLEAR RESULTS ========
function clearResults() {
  resultsGridEl().innerHTML = '';
  resultsSectionEl().style.display = 'none';
  searchInputEl().value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ======== BUILD CARD ========
function buildCard(type, item) {
  const card = document.createElement('div');
  card.className = 'result-card card';

  const title = escapeHtml(item.name || 'Unknown');
  const img = escapeHtml(item.imageUrl || 'https://via.placeholder.com/900x600?text=Image+Unavailable');
  const desc = escapeHtml(item.description || item.short || '');
  const tz = timezones[item.country] || timezones.default;
  const time = getCurrentTime(tz);

  card.innerHTML = `
    <img src="${img}" alt="${title}" onerror="this.src='https://via.placeholder.com/900x600?text=Image+Unavailable'">
    <h3>${title}</h3>
    <p>${desc}</p>
    <p><strong>Local Time:</strong> ${time}</p>
    <button class="visit-btn" onclick="alert('Ready to explore: ${title}! Contact us to plan your trip.')">View Trip</button>
  `;
  return card;
}

// ======== UTILITIES ========
function getCurrentTime(timeZone) {
  const opts = { timeZone, hour12: true, hour: 'numeric', minute: 'numeric', second: 'numeric' };
  return new Date().toLocaleTimeString('en-US', opts);
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ======== INIT ========
document.addEventListener('DOMContentLoaded', async () => {
  await fetchTravelData();
  searchBtn.addEventListener('click', searchDestinations);
  clearBtn.addEventListener('click', clearResults);
});
