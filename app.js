let phraseData = {};
// Load user preferences and customizations from storage
let customPhrases = JSON.parse(localStorage.getItem('lingo_custom_phrases')) || {};
let hiddenCategories = JSON.parse(localStorage.getItem('lingo_hidden_categories')) || {};
let hiddenPhrases = JSON.parse(localStorage.getItem('lingo_hidden_phrases')) || {};
let customCategories = JSON.parse(localStorage.getItem('lingo_custom_categories')) || {};
let currentOpenCategory = null;

fetch('data/phrases.json')
  .then(response => response.json())
  .then(data => {
    phraseData = data.languages;
    initApp();
  })
  .catch(err => {
    document.getElementById('app-content').innerHTML = '<p>Error loading phrases. Are you offline?</p>';
  });

function initApp() {
  const selector = document.getElementById('language-selector');
  for (const [key, lang] of Object.entries(phraseData)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = lang.name;
    selector.appendChild(option);
  }
  selector.addEventListener('change', (e) => renderPhrases(e.target.value));
  renderPhrases(Object.keys(phraseData)[0]);
}

function getCategoryIcon(iconKey) {
  const iconMap = {
    'train': '🚆', 
    'hotel': '🏨', 
    'restaurant': '🍽️', 
    'restaurant_menu': '🍲', 
    'calendar_today': '📅',
    'pin': '🔢', 
    'museum': '🏛️', 
    'storefront': '🛍', 
    'chat': '💬', 
    'default': '📂'
  };
  return iconMap[iconKey] || iconMap['default'];
}

function renderPhrases(langKey) {
  const content = document.getElementById('app-content');
  const lang = phraseData[langKey];
  if (!lang) return;

  let html = '';
  const officialCategories = lang.categories || [];
  const userCats = (customCategories[langKey]) || [];
  const allCategories = [...officialCategories, ...userCats];

  allCategories.forEach(category => {
    if (hiddenCategories[langKey] && hiddenCategories[langKey].includes(category.id)) {
      return;
    }
    const isOpen = currentOpenCategory === category.id ? 'open' : '';
    const isCustomCat = category.isCustom ? true : false;
    const iconSymbol = getCategoryIcon(category.icon);
    const toggleSymbol = isOpen ? '-' : '+';

    html += `<details class="category" id="cat-${category.id}" ${isOpen} ontoggle="trackOpenCategory(this, '${category.id}')">
      <summary>
        <span style="display: flex; align-items: center; gap: 0.75rem;">
          <span>${iconSymbol}</span>
          <span>${category.title}</span>
        </span>
        <span style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="hide-cat-btn" onclick="toggleHideCategory(event, '${langKey}', '${category.id}')" title="Hide Category">👁️‍‍🗨️</button>
          <span style="font-size: 1.5rem; color: var(--primary); width: 1rem; text-align: center;" class="toggle-indicator">${toggleSymbol}</span>
        </span>
      </summary>
      <div class="phrases-container">`;

    const defaultPhrases = category.phrases || [];
    const userPhrases = (customPhrases[langKey] && customPhrases[langKey][category.id]) || [];

    defaultPhrases.forEach((phrase, pIndex) => {
      const phraseKey = `${category.id}-${pIndex}`;
      const isHidden = hiddenPhrases[langKey] && hiddenPhrases[langKey].includes(phraseKey);
      if (isHidden) return;

      const safeText = phrase.translated.replace(/'/g, "\\'");
      html += `<div class="phrase-card">
        <div class="phrase-en">${phrase.en}</div>
        <div class="phrase-translated">
          ${phrase.translated}
          <button class="speak-btn" onclick="speakText('${safeText}', '${langKey}')" title="Listen">🔊</button>
        </div>
        <div class="phrase-pronunciation">${phrase.pronunciation || ''}</div>
        <button class="hide-phrase-btn" onclick="toggleHidePhrase('${langKey}', '${category.id}', '${phraseKey}')">Hide Phrase</button>
      </div>`;
    });

    userPhrases.forEach((phrase, index) => {
      const safeText = phrase.translated.replace(/'/g, "\\'");
      html += `<div class="phrase-card custom-phrase">
        <div class="phrase-en">${phrase.en}</div>
        <div class="phrase-translated">
          ${phrase.translated}
          <button class="speak-btn" onclick="speakText('${safeText}', '${langKey}')" title="Listen">🔊</button>
        </div>
        <div class="phrase-pronunciation">${phrase.pronunciation || ''}</div>
        <button class="delete-btn" onclick="deleteCustomPhrase('${langKey}', '${category.id}', ${index})">Remove</button>
      </div>`;
    });

    html += `<button class="add-btn" onclick="openModal('${langKey}', '${category.id}', '${category.title}')">+ Add Phrase</button>`;

    if (isCustomCat) {
      html += `<button class="delete-cat-btn" onclick="deleteCustomCategory('${langKey}', '${category.id}')">Delete Category</button>`;
    }
    html += `</div></details>`;
  });

  html += `<button class="add-category-btn" onclick="openCategoryModal('${langKey}')">+ Add New Category</button>`;
  content.innerHTML = html;
}

// --- Category Management ---
function toggleHideCategory(event, langKey, catId) {
  event.stopPropagation();
  if (!hiddenCategories[langKey]) hiddenCategories[langKey] = [];
  if (!hiddenCategories[langKey].includes(catId)) {
    hiddenCategories[langKey].push(catId);
  }
  localStorage.setItem('lingo_hidden_categories', JSON.stringify(hiddenCategories));
  renderPhrases(document.getElementById('language-selector').value);
}

function openCategoryModal(langKey) {
  const title = prompt("Enter new category name:");
  if (!title || !title.trim()) return;
  const catId = 'custom_cat_' + Date.now();
  if (!customCategories[langKey]) customCategories[langKey] = [];
  customCategories[langKey].push({
    id: catId,
    title: title.trim(),
    isCustom: true,
    phrases: []
  });
  localStorage.setItem('lingo_custom_categories', JSON.stringify(customCategories));
  renderPhrases(langKey);
}

function deleteCustomCategory(langKey, catId) {
  if (confirm("Are you sure you want to delete this custom category and its contents?")) {
    customCategories[langKey] = customCategories[langKey].filter(c => c.id !== catId);
    localStorage.setItem('lingo_custom_categories', JSON.stringify(customCategories));
    renderPhrases(langKey);
  }
}

// --- Phrase Visibility Management ---
function toggleHidePhrase(langKey, catId, phraseKey) {
  if (!hiddenPhrases[langKey]) hiddenPhrases[langKey] = [];
  if (!hiddenPhrases[langKey].includes(phraseKey)) {
    hiddenPhrases[langKey].push(phraseKey);
  }
  localStorage.setItem('lingo_hidden_phrases', JSON.stringify(hiddenPhrases));
  currentOpenCategory = catId;
  renderPhrases(document.getElementById('language-selector').value);
}

// --- Manage Modal Logic ---
function openManageModal() {
  const langKey = document.getElementById('language-selector').value;
  const lang = phraseData[langKey];
  const container = document.getElementById('manage-modal-body');
  if (!lang) return;

  let html = '';

  // 1. Hidden Categories
  html += `<h4 style="margin-bottom: 0.5rem; color: var(--primary);">Hidden Categories</h4>`;
  const hiddenCats = hiddenCategories[langKey] || [];
  if (hiddenCats.length === 0) {
    html += `<p style="font-size: 0.85rem; color: #777; margin-top: 0;">No hidden categories.</p>`;
  } else {
    html += `<ul style="list-style: none; padding: 0; margin-top: 0;">`;
    hiddenCats.forEach(catId => {
      let catTitle = catId;
      const officialMatch = (lang.categories || []).find(c => c.id === catId);
      const customMatch = (customCategories[langKey] || []).find(c => c.id === catId);
      if (officialMatch) catTitle = officialMatch.title;
      else if (customMatch) catTitle = customMatch.title;

      html += `<li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.9rem; border-bottom: 1px solid #eee; padding-bottom: 0.25rem;">
        <span>${catTitle}</span>
        <button class="btn-save" style="font-size: 0.8rem; padding: 0.2rem 0.5rem;" onclick="unhideCategory('${langKey}', '${catId}')">Restore</button>
      </li>`;
    });
    html += `</ul>`;
  }

  // 2. Hidden Phrases
  html += `<h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);">Hidden Phrases</h4>`;
  const hiddenP = hiddenPhrases[langKey] || [];
  if (hiddenP.length === 0) {
    html += `<p style="font-size: 0.85rem; color: #777; margin-top: 0;">No hidden phrases.</p>`;
  } else {
    html += `<ul style="list-style: none; padding: 0; margin-top: 0;">`;
    hiddenP.forEach(phraseKey => {
      const lastHyphen = phraseKey.lastIndexOf('-');
      const catId = phraseKey.substring(0, lastHyphen);
      const pIndex = parseInt(phraseKey.substring(lastHyphen + 1));
      const categoryObj = (lang.categories || []).find(c => c.id === catId);
      const phraseObj = categoryObj && categoryObj.phrases && categoryObj.phrases[pIndex];
      const phraseText = phraseObj ? phraseObj.en : phraseKey;

      html += `<li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.9rem; border-bottom: 1px solid #eee; padding-bottom: 0.25rem;">
        <span style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${phraseText}">${phraseText}</span>
        <button class="btn-save" style="font-size: 0.8rem; padding: 0.2rem 0.5rem;" onclick="unhidePhrase('${langKey}', '${phraseKey}')">Restore</button>
      </li>`;
    });
    html += `</ul>`;
  }

  container.innerHTML = html;
  document.getElementById('manage-modal').style.display = 'flex';
}

function closeManageModal() {
  document.getElementById('manage-modal').style.display = 'none';
}

function unhideCategory(langKey, catId) {
  hiddenCategories[langKey] = hiddenCategories[langKey].filter(id => id !== catId);
  if (hiddenCategories[langKey].length === 0) delete hiddenCategories[langKey];
  localStorage.setItem('lingo_hidden_categories', JSON.stringify(hiddenCategories));
  openManageModal();
  renderPhrases(langKey);
}

function unhidePhrase(langKey, phraseKey) {
  hiddenPhrases[langKey] = hiddenPhrases[langKey].filter(pk => pk !== phraseKey);
  if (hiddenPhrases[langKey].length === 0) delete hiddenPhrases[langKey];
  localStorage.setItem('lingo_hidden_phrases', JSON.stringify(hiddenPhrases));
  openManageModal();
  renderPhrases(langKey);
}

function trackOpenCategory(element, catId) {
  if (element.open) {
    currentOpenCategory = catId;
  } else if (currentOpenCategory === catId) {
    currentOpenCategory = null;
  }
}

function speakText(text, langKey) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = {
      'it': 'it-IT',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'ja': 'ja-JP'
    };
    utterance.lang = langMap[langKey] || 'en-US';
    window.speechSynthesis.speak(utterance);
  }
}

// --- Modal Add / Delete Actions ---
function openModal(langKey, catId, catTitle) {
  document.getElementById('modal-lang').value = langKey;
  document.getElementById('modal-cat').value = catId;
  document.getElementById('modal-title').textContent = `Add to ${catTitle}`;
  document.getElementById('input-en').value = '';
  document.getElementById('input-translated').value = '';
  document.getElementById('input-pronunciation').value = '';
  document.getElementById('add-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('add-modal').style.display = 'none';
}

function savePhrase() {
  const langKey = document.getElementById('modal-lang').value;
  const catId = document.getElementById('modal-cat').value;
  const en = document.getElementById('input-en').value.trim();
  const translated = document.getElementById('input-translated').value.trim();
  const pronunciation = document.getElementById('input-pronunciation').value.trim();

  if (!en || !translated) {
    alert('Please provide both English and translated phrases.');
    return;
  }

  if (!customPhrases[langKey]) customPhrases[langKey] = {};
  if (!customPhrases[langKey][catId]) customPhrases[langKey][catId] = [];

  customPhrases[langKey][catId].push({ en, translated, pronunciation });
  localStorage.setItem('lingo_custom_phrases', JSON.stringify(customPhrases));

  closeModal();
  currentOpenCategory = catId;
  renderPhrases(langKey);
}

function deleteCustomPhrase(langKey, catId, index) {
  if (customPhrases[langKey] && customPhrases[langKey][catId]) {
    customPhrases[langKey][catId].splice(index, 1);
    localStorage.setItem('lingo_custom_phrases', JSON.stringify(customPhrases));
    currentOpenCategory = catId;
    renderPhrases(langKey);
  }
}
