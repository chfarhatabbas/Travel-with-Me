/* travel_recommendation.js
   - Fetch travel_recommendation_api.json with fetch() and console.log result
   - If fetch fails, fallback to built-in data
   - Search triggered only by clicking Search button
   - Clear button clears results
   - Results include local time (based on timezone map)
*/

let travelData = null;

// Map of known countries/places to timezones (edit as needed)
const timezones = {
  "Solana Islands": "Pacific/Apia",
  "Highland Republic": "Asia/Kolkata",
  // fallback examples for temple/beach specific names (if you add real ones to JSON, map them here)
  "default": "UTC"
};

// Try to fetch external JSON file first
async function fetchTravelData() {
  try {
    const resp = await fetch('./travel_recommendation_api.json', {cache: "no-store"});
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    console.log('Fetched travel_recommendation_api.json:', json);
    // validate minimal structure (beaches/temples/countries) else fallback
    if (json && (json.beaches || json.temples || json.countries)) {
      travelData = json;
      return;
    } else {
      console.warn('JSON file did not contain expected keys; using fallback data.');
    }
  } catch (err) {
    console.warn('Could not fetch travel_recommendation_api.json — using fallback data. Error:', err.message);
  }
  useFallbackData();
  console.log('Fallback travel data:', travelData);
}

// Fallback data (used when JSON file not available)
function useFallbackData() {
  travelData = {
    beaches: [
      {
        id: 'b1',
        name: 'Turtle Bay Cove',
        country: 'Solana Islands',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80',
        description: 'Turquoise water, gentle coral gardens, and calm coves perfect for morning snorkeling.'
      },
      {
        id: 'b2',
        name: 'Hidden Lagoon',
        country: 'Solana Islands',
        imageUrl: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=900&q=80',
        description: 'A secret blue lagoon tucked behind cliffs — great for kayaking and cliff picnics.'
      }
    ],
    temples: [
      {
        id: 't1',
        name: 'Stone Dawn Sanctuary',
        country: 'Highland Republic',
        imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80',
        description: 'A carved sandstone complex where sunrise rituals illuminate ancient reliefs.'
      },
      {
        id: 't2',
        name: 'Riverside Shrine',
        country: 'Solana Islands',
        imageUrl: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=900&q=80',
        description: 'Waterside pavilion with floating lantern evenings and warm local ceremonies.'
      }
    ],
    countries: [
      {
        id: 'c1',
        name: 'Solana Islands',
        imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80',
        short: 'Island chain mixing reefs, spice markets and remote villages to explore.'
      },
      {
        id: 'c2',
        name: 'Highland Republic',
        imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80',
        short: 'High plateaus, tea terraces, and folk music — ideal for trekking and culture.'
      }
    ]
  };
}

// UI helpers
const resultsSectionEl = () => document.getElementById('resultsSection');
const resultsGridEl = () => document.getElementById('resultsGrid');
const searchInputEl = () => document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');

// Wire up mobile nav toggle
document.getElementById('mobileToggle').addEventListener('click', () => {
  const nav = document.getElementById('navLinks');
  nav.classList.toggle('show');
});

// Populate footer year
document.getElementById('year').textContent = new Date().getFullYear();

// On load, attempt fetch
document.addEventListener('DOMContentLoaded', async () => {
  await fetchTravelData();

  // Attach search button click (only click triggers search)
  searchBtn.addEventListener('click', () => {
    searchDestinations();
  });

  // Attach clear button click
  clearBtn.addEventListener('click', () => {
    clearResults();
  });
});

/* Search logic: accepts variations (case-insensitive) and returns at least two results per category */
function searchDestinations() {
  const raw = (searchInputEl().value || '').trim();
  const q = raw.toLowerCase();
  resultsGridEl().innerHTML = '';

  if (!q) {
    alert('Type a keyword like "beach", "temple", or "country" (or a place name) and click Search.');
    return;
  }

  if (!travelData) {
    alert('Travel data unavailable. Please try again later.');
    return;
  }

  let matches = [];

  // Normalize search variants: allow "beach", "beaches", etc.
  const isBeachQuery = q.includes('beach');
  const isTempleQuery = q.includes('temple');
  const isCountryQuery = q.includes('country');

  // If user typed an explicit location name, we'll match names/descriptions too
  // Search beaches
  travelData.beaches.forEach(b => {
    const searchable = `${b.name} ${b.country} ${b.description}`.toLowerCase();
    if (isBeachQuery || searchable.includes(q)) {
      matches.push({ type: 'beach', item: b });
    }
  });

  // Search temples
  travelData.temples.forEach(t => {
    const searchable = `${t.name} ${t.country} ${t.description}`.toLowerCase();
    if (isTempleQuery || searchable.includes(q)) {
      matches.push({ type: 'temple', item: t });
    }
  });

  // Search countries
  travelData.countries.forEach(c => {
    const searchable = `${c.name} ${c.short || ''}`.toLowerCase();
    if (isCountryQuery || searchable.includes(q)) {
      matches.push({ type: 'country', item: c });
    }
  });

  // If query was a general category word (beach/temple/country) but we found zero,
  // attempt to show the top two items from that category
  if (matches.length === 0) {
    if (isBeachQuery && (travelData.beaches && travelData.beaches.length > 0)) {
      matches = travelData.beaches.slice(0,2).map(b=>({type:'beach',item:b}));
    } else if (isTempleQuery && travelData.temples && travelData.temples.length > 0) {
      matches = travelData.temples.slice(0,2).map(t=>({type:'temple',item:t}));
    } else if (isCountryQuery && travelData.countries && travelData.countries.length > 0) {
      matches = travelData.countries.slice(0,2).map(c=>({type:'country',item:c}));
    }
  }

  if (matches.length === 0) {
    resultsGridEl().innerHTML = `<div style="grid-column:1/-1;padding:2rem;text-align:center;color:#0e7a78;font-weight:700;">
      No results found. Try: "beach", "temple", "country", or a place name such as "Turtle" or "Solana".
    </div>`;
    resultsSectionEl().style.display = 'block';
    resultsSectionEl().scrollIntoView({behavior:'smooth'});
    return;
  }

  // Ensure at least two per category if the user requested category
  if (isBeachQuery) {
    // if less than 2 beach matches, append from data to make at least 2
    const beachMatches = matches.filter(m=>m.type==='beach');
    if (beachMatches.length < 2 && travelData.beaches) {
      travelData.beaches.slice(0,2).forEach(b=>{
        if (!matches.some(m=>m.item.id===b.id)) matches.push({type:'beach',item:b});
      });
    }
  }
  if (isTempleQuery) {
    const templeMatches = matches.filter(m=>m.type==='temple');
    if (templeMatches.length < 2 && travelData.temples) {
      travelData.temples.slice(0,2).forEach(t=>{
        if (!matches.some(m=>m.item.id===t.id)) matches.push({type:'temple',item:t});
      });
    }
  }
  if (isCountryQuery) {
    const countryMatches = matches.filter(m=>m.type==='country');
    if (countryMatches.length < 2 && travelData.countries) {
      travelData.countries.slice(0,2).forEach(c=>{
        if (!matches.some(m=>m.item.id===c.id)) matches.push({type:'country',item:c});
      });
    }
  }

  // Build and show cards
  matches.forEach(m => {
    resultsGridEl().appendChild(buildCard(m));
  });

  resultsSectionEl().style.display = 'block';
  resultsSectionEl().scrollIntoView({behavior:'smooth'});
}

/* Build a result card element that includes local time */
function buildCard(match) {
  const el = document.createElement('div');
  el.className = 'result-card card';

  const { type, item } = match;
  const title = item.name || item.id || 'Unknown';
  const img = item.imageUrl || '';
  const desc = item.description || item.short || '';
  const subtype = type.charAt(0).toUpperCase() + type.slice(1);

  // Determine timezone: prefer explicit map by country, else fallback to default
  let tz = 'UTC';
  if (item.country && timezones[item.country]) tz = timezones[item.country];
  else if (timezones[title]) tz = timezones[title];
  else if (timezones.default) tz = timezones.default;

  const localTime = getCurrentTime(tz);

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem;">
      <div style="background:var(--sand);padding:.4rem .6rem;border-radius:8px;font-weight:700;color:var(--deep-teal)">${subtype}</div>
      <div style="font-weight:700;color:var(--deep-teal)">${escapeHtml(title)}</div>
    </div>
    ${img ? `<img src="${img}" alt="${escapeHtml(title)}">` : ''}
    <p>${escapeHtml(desc)}</p>
    <div style="margin-top:.6rem;font-weight:600;color:#0e7a78">Local Time: ${escapeHtml(localTime)}</div>
    <button class="visit-btn" onclick="visitDestination('${escapeHtml(title)}')">View Trip</button>
  `;
  return el;
}

/* Return formatted current time string for a timezone */
function getCurrentTime(timeZone) {
  try {
    const options = {
      timeZone: timeZone,
      hour12: true,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date().toLocaleString('en-US', options);
  } catch (e) {
    // If timezone invalid, fallback to local time string
    return new Date().toLocaleString();
  }
}

/* Clear results / reset UI */
function clearResults(){
  resultsGridEl().innerHTML = '';
  resultsSectionEl().style.display = 'none';
  searchInputEl().value = '';
  window.scrollTo({top:0,behavior:'smooth'});
}

/* Contact form handling (client-side simulation) */
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!name || !email || !message) {
    alert('Please fill all fields before sending.');
    return;
  }

  // Simulate sending — in a real deployment you'd POST to a backend endpoint
  console.log('Contact form submitted:', { name, email, message });
  alert(`Thanks, ${name}! Your message has been received. We will reply to ${email} within 24 hours.`);

  document.getElementById('contactForm').reset();
}

/* Visit destination action */
function visitDestination(name) {
  alert(`Ready to explore: ${name} — contact us for full trip details.`);
}

/* small util to escape html when injecting into innerHTML */
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,"&#039;");
}
