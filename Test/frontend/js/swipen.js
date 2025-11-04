// js/swipen.js
import { supabase } from './supabaseClient.js'

// Eingeloggten Benutzer laden
const currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html'
}

// HTML-Elemente
const profileContainer = document.getElementById('profile-swipe')
const acceptBtn = document.getElementById('accept-btn')
const rejectBtn = document.getElementById('reject-btn')

let profiles = []
let currentIndex = 0

// Profile aus der Datenbank laden (außer eigenes)
async function loadProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('user_id', currentUser.id)

  if (error) {
    console.error('Fehler beim Laden der Profile:', error)
    alert('Profile konnten nicht geladen werden.')
    return
  }

  profiles = data.sort(() => 0.5 - Math.random()) // Zufällige Reihenfolge
  currentIndex = 0
  showNextProfile()
}

// Ein Profil anzeigen
function showNextProfile() {
  if (currentIndex >= profiles.length) {
    profileContainer.innerHTML = '<p>🎉 Keine weiteren Profile verfügbar.</p>'
    return
  }

  const profile = profiles[currentIndex]
  profileContainer.innerHTML = `
    <div class="profile-card">
      <h2>${profile.name || 'Unbekannt'}</h2>
      <p><strong>Username:</strong> ${profile.username || '-'}</p>
      <p><strong>Muttersprache:</strong> ${profile.native_lang || '-'}</p>
      <p><strong>Lernt:</strong> ${profile.learning_lang || '-'}</p>
      <p><strong>Interessen:</strong> ${
        Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests || '-'
      }</p>
    </div>
  `
}

// Profil annehmen
acceptBtn.addEventListener('click', async () => {
  const likedProfile = profiles[currentIndex]
  console.log('Angenommen:', likedProfile.username)

  // Optional: In Matches-Tabelle speichern
  await supabase.from('matches').insert([
    { liker_id: currentUser.id, liked_id: likedProfile.user_id }
  ])

  currentIndex++
  showNextProfile()
})

// Profil ablehnen
rejectBtn.addEventListener('click', () => {
  console.log('Abgelehnt:', profiles[currentIndex].username)
  currentIndex++
  showNextProfile()
})

// Beim Laden starten
loadProfiles()
