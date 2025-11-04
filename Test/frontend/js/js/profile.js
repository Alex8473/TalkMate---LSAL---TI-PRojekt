import { supabase } from './supabaseClient.js'

const profileForm = document.getElementById('profile-form')
const fullnameInput = document.getElementById('fullname')
const usernameInput = document.getElementById('username')

// Sprachwahl
let nativeLanguage = 'Deutsch'
let learningLanguage = 'Englisch'

// Klickbare Sprachoptionen
document.querySelectorAll('#native-language .language-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('#native-language .language-option').forEach(o => o.classList.remove('selected'))
    opt.classList.add('selected')
    nativeLanguage = opt.textContent
  })
})
document.querySelectorAll('#learning-language .language-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('#learning-language .language-option').forEach(o => o.classList.remove('selected'))
    opt.classList.add('selected')
    learningLanguage = opt.textContent
  })
})

// Hobbys sammeln
function getSelectedHobbies() {
  return Array.from(document.querySelectorAll('.hobby-grid input:checked')).map(i => i.value)
}

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
    fullnameInput.value = data.fullname || ''
    usernameInput.value = data.username || ''
    nativeLanguage = data.native_language || 'Deutsch'
    learningLanguage = data.learning_language || 'Englisch'
    const interests = data.interests || []

    document.querySelectorAll('.hobby-grid input').forEach(i => {
      i.checked = interests.includes(i.value)
    })
  }
}

// Profil speichern / updaten
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const profileData = {
    user_id: currentUser.id,
    fullname: fullnameInput.value,
    username: usernameInput.value,
    native_language: nativeLanguage,
    learning_language: learningLanguage,
    interests: getSelectedHobbies()
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', currentUser.id)
    .maybeSingle()

  let result
  if (existing) {
    result = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', currentUser.id)
  } else {
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

loadProfile()
