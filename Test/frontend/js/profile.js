// js/profile.js
import { supabase } from './supabaseClient.js'

const profileForm = document.getElementById('profile-form')
const nameInput = document.getElementById('profile-name')
const usernameInput = document.getElementById('profile-username')
const ageInput = document.getElementById('profile-age')
const languageInput = document.getElementById('profile-language')

// Aktuellen Nutzer laden
const currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html'
}

// Profil laden
async function loadProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', currentUser.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Fehler beim Laden des Profils:', error)
    return
  }

  if (data) {
    nameInput.value = data.name || ''
    usernameInput.value = data.username || ''
    ageInput.value = data.age || ''
    languageInput.value = data.language || ''
  }
}

// Profil speichern / updaten
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const profileData = {
    user_id: currentUser.id,
    name: nameInput.value,
    username: usernameInput.value,
    age: ageInput.value,
    language: languageInput.value
  }

  // Prüfen, ob Profil schon existiert
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', currentUser.id)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Fehler beim Prüfen des Profils:', selectError)
    return
  }

  let result
  if (existing) {
    // Update
    result = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', currentUser.id)
  } else {
    // Insert
    result = await supabase
      .from('profiles')
      .insert([profileData])
  }

  if (result.error) {
    alert('Fehler beim Speichern des Profils: ' + result.error.message)
  } else {
    alert('Profil erfolgreich gespeichert!')
  }
})

// Profil direkt beim Laden anzeigen
loadProfile()
