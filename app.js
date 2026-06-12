// Configuration
const MAX_PROFILES = 100;
const STORAGE_KEY = 'lovingProfiles';
const DELETE_PASSWORD = '200611'; // Mot de passe pour suppression

const SUPABASE_URL = 'https://doovevgkmarozjululkr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_4GnPe_yN856H6ruK8FzGg_N17u7Tbo' // ta clé publishable
// State
let profiles = [];

// DOM Elements
const profileForm = document.getElementById('profileForm');
const formContainer = document.getElementById('formContainer');
const profilesContainer = document.getElementById('profilesContainer');
const errorMessage = document.getElementById('errorMessage');
const limitMessage = document.getElementById('limitMessage');
const addAnotherBtn = document.getElementById('addAnotherBtn');
const bioInput = document.getElementById('bio');
const charCount = document.getElementById('charCount');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProfiles();
    displayProfiles();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    profileForm.addEventListener('submit', handleFormSubmit);
    bioInput.addEventListener('input', updateCharCount);
    addAnotherBtn.addEventListener('click', showForm);
}

// Update character count
function updateCharCount() {
    charCount.textContent = bioInput.value.length;
}

// Handle Form Submit
async function handleFormSubmit(e) {
  e.preventDefault()
  errorMessage.textContent = ''
  
  if (!validateForm()) return
  if (profiles.length >= MAX_PROFILES) {
    errorMessage.textContent = '❌ Maximum ' + MAX_PROFILES + ' personnes'
    return
  }

  const newProfile = {
    firstName: document.getElementById('firstName').value.trim(),
    age: parseInt(document.getElementById('age').value),
    photoUrl: document.getElementById('photoUrl').value.trim(),
    bio: document.getElementById('bio').value.trim(),
    whatsapp: normalizeWhatsApp(document.getElementById('whatsapp').value.trim())
  }

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newProfile)
    })
    profileForm.reset()
    charCount.textContent = '0'
    loadProfiles() // recharge depuis Supabase
  } catch (err) {
    errorMessage.textContent = 'Erreur: ' + err.message
  }
}

// Validate Form
function validateForm() {
    const firstName = document.getElementById('firstName').value.trim();
    const age = document.getElementById('age').value.trim();
    const photoUrl = document.getElementById('photoUrl').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    
    if (!firstName || !age || !photoUrl || !bio || !whatsapp) {
        errorMessage.textContent = '⚠️ Remplis tous les champs';
        return false;
    }
    
    if (isNaN(age) || age < 18 || age > 120) {
        errorMessage.textContent = '⚠️ Âge invalide (18-120)';
        return false;
    }
    
    // Basic URL validation
    try {
        new URL(photoUrl);
    } catch {
        errorMessage.textContent = '⚠️ URL photo invalide';
        return false;
    }
    
    if (whatsapp.length < 9) {
        errorMessage.textContent = '⚠️ Numéro WhatsApp invalide';
        return false;
    }
    
    return true;
}

// Normalize WhatsApp Number
function normalizeWhatsApp(number) {
    // Remove spaces, dashes, parentheses
    let clean = number.replace(/[\s\-()]/g, '');
    
    // If starts with +33, replace with 33
    if (clean.startsWith('+33')) {
        clean = '33' + clean.slice(3);
    } else if (clean.startsWith('0033')) {
        clean = '33' + clean.slice(4);
    } else if (clean.startsWith('06')) {
        // French mobile: 06xxxx → 33 6xxxx
        clean = '33' + clean.slice(1);
    } else if (clean.startsWith('07')) {
        // French mobile: 07xxxx → 33 7xxxx
        clean = '33' + clean.slice(1);
    }
    
    // Ensure it starts with country code
    if (!clean.startsWith('+') && !clean.startsWith('33') && !clean.match(/^\d{10,15}$/)) {
        return clean;
    }
    
    return clean;
}

// Get WhatsApp Link
function getWhatsAppLink(number) {
    // Ensure no + prefix for wa.me
    const cleanNumber = number.replace(/^\+/, '');
    return `https://wa.me/${cleanNumber}`;
}

// Display Profiles
function displayProfiles() {
    profilesContainer.innerHTML = '';
    
    if (profiles.length === 0) {
        profilesContainer.innerHTML = '<p style="text-align: center; color: #d65d94; margin-top: 24px;">Aucun profil pour le moment. Sois la première! 💕</p>';
        formContainer.style.display = 'block';
        limitMessage.classList.remove('show');
        addAnotherBtn.style.display = 'none';
        return;
    }
    
    profiles.forEach(profile => {
        const card = createProfileCard(profile);
        profilesContainer.appendChild(card);
    });
    
    // Show/hide form and button based on limit
    if (profiles.length >= MAX_PROFILES) {
        formContainer.style.display = 'none';
        limitMessage.classList.add('show');
        addAnotherBtn.style.display = 'none';
    } else {
        formContainer.style.display = 'none';
        limitMessage.classList.remove('show');
        addAnotherBtn.style.display = 'block';
    }
}

// Create Profile Card
function createProfileCard(profile) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    
    const whatsappLink = getWhatsAppLink(profile.whatsapp);
    
    card.innerHTML = `
        <img src="${profile.photoUrl}" alt="${profile.firstName}" class="profile-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
        <div class="profile-content">
            <div class="profile-header">
                <div class="profile-header-info">
                    <span class="profile-name">${escapeHtml(profile.firstName)}</span>
                    <span class="profile-age">${profile.age}</span>
                </div>
                <button class="btn-delete" onclick="deleteProfileWithPassword(${profile.id})">Supprimer</button>
            </div>
            <p class="profile-bio">${escapeHtml(profile.bio)}</p>
            <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="profile-whatsapp">
              💬cliquez ici👉${profile.whatsapp}
            </a>         
        </div>
    `;
    
    return card;
}

// Delete Profile with Password Protection
function deleteProfileWithPassword(profileId) {
    const password = prompt('🔐 Entrez le mot de passe pour supprimer ce profil:');
    
    // If user cancelled the prompt
    if (password === null) {
        return;
    }
    
    // Check password
    if (password !== DELETE_PASSWORD) {
        alert('❌ Mot de passe incorrect!');
        return;
    }

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show Form
function showForm() {
    formContainer.style.display = 'block';
    addAnotherBtn.style.display = 'none';
    document.getElementById('firstName').focus();
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Load from Supabase
async function loadProfiles() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    profiles = await res.json()
    displayProfiles()
  } catch (err) {
    errorMessage.textContent = 'Erreur chargement: ' + err.message
  }
}

// Password correct, proceed with deletion
if (confirm('Etes-vous sûr de vouloir supprimer ce profil?')) {
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profileId}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  })
  loadProfiles()
  alert('✅ Profil supprimé avec succès!');
}
    }
}

// Expose utility in console
window.clearAllProfiles = clearAllProfiles;
