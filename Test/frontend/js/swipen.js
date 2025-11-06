// js/swipen.js
import { supabase } from './supabaseClient.js'

const swipeContainer = document.getElementById('profile-swipe')
const acceptBtn = document.getElementById('accept-btn')
const rejectBtn = document.getElementById('reject-btn')

let profiles = []
let currentIndex = 0

// Aktuellen Nutzer laden
const currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html'
}

// Profile aus Supabase laden
async function loadProfiles() {
  try {
    // 🔧 Zeigt alle Profile, auch zum Testen
    const { data, error } = await supabase
      .from('profiles')
      .select('*')

    if (error) throw error

    if (!data || data.length === 0) {
      swipeContainer.innerHTML = '<p>Keine Profile verfügbar.</p>'
      acceptBtn.disabled = true
      rejectBtn.disabled = true
      return
    }

    profiles = data
    console.log('Geladene Profile:', profiles)
    showProfile()
  } catch (err) {
    console.error('Fehler beim Laden der Profile:', err.message)
    swipeContainer.innerHTML = '<p>Fehler beim Laden der Profile</p>'
  }
}

// Aktuelles Profil anzeigen
function showProfile() {
  if (currentIndex >= profiles.length) {
    swipeContainer.innerHTML = '<p>Keine weiteren Profile verfügbar.</p>'
    acceptBtn.disabled = true
    rejectBtn.disabled = true
    return
  }

  const p = profiles[currentIndex]
  swipeContainer.innerHTML = `
    <div class="profile-card">
      <!-- Dummy-Bild -->
      <div class="profile-avatar" style="width:100px;height:100px;background:#ccc;border-radius:50%;margin:0 auto 10px;"></div>
      <h2>${p.fullname || '-'}</h2>
      <p><strong>Alter:</strong> ${p.age || '-'}</p>
      <p><strong>Sprache:</strong> ${p.native_language || '-'} → ${p.learning_language || '-'}</p>
      <p><strong>Interessen:</strong> ${Array.isArray(p.interests) ? p.interests.join(', ') : '-'}</p>
    </div>
  `
}

// Swipe speichern
async function swipeProfile(liked) {
  const selected = profiles[currentIndex]

  try {
    const { error } = await supabase
      .from('matches')
      .insert([
        {
          user_id: currentUser.id,
          target_id: selected.user_id,
          liked: liked
        }
      ])

    if (error) throw error

    console.log(`${liked ? 'Akzeptiert' : 'Abgelehnt'}: ${selected.fullname}`)
  } catch (err) {
    console.error('Fehler beim Speichern des Swipes:', err.message)
  }

  nextProfile()
}

// Nächstes Profil
function nextProfile() {
  currentIndex++
  showProfile()
}

// Buttons aktivieren
acceptBtn.addEventListener('click', () => swipeProfile(true))
rejectBtn.addEventListener('click', () => swipeProfile(false))

// Start
document.addEventListener('DOMContentLoaded', loadProfiles)
