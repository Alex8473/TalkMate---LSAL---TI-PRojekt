import { supabase } from './supabaseClient.js'

const profileForm = document.getElementById('profile-form')
const fullnameInput = document.getElementById('fullname')
const usernameInput = document.getElementById('username')

// Sprachwahl
let nativeLanguage = 'Deutsch'
let learningLanguage = 'Englisch'

// Sprachoptionen klickbar machen
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

// Aktuellen User laden
const currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html'
}

// Profil laden
async function loadProfile() {
  try {
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
      console.log('Profil geladen:', data)
      fullnameInput.value = data.fullname || ''
      usernameInput.value = data.username || ''
      nativeLanguage = data.native_language || 'Deutsch'
      learningLanguage = data.learning_language || 'Englisch'

      const interests = data.interests || []
      document.querySelectorAll('.hobby-grid input').forEach(i => {
        i.checked = interests.includes(i.value)
      })

      // UI Sprachoptionen markieren
      document.querySelectorAll('#native-language .language-option').forEach(opt => {
        opt.classList.toggle('selected', opt.textContent === nativeLanguage)
      })
      document.querySelectorAll('#learning-language .language-option').forEach(opt => {
        opt.classList.toggle('selected', opt.textContent === learningLanguage)
      })
    }
  } catch (err) {
    console.error('Fehler beim Laden des Profils (try/catch):', err.message)
  }
}

// Profil speichern / updaten
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const profileData = {
    user_id: currentUser.id,
    fullname: fullnameInput.value,
    username: usernameInput.value,
    age: 0, // Standardwert, da kein Eingabefeld
    native_language: nativeLanguage,
    learning_language: learningLanguage,
    interests: getSelectedHobbies()
  }

  try {
    // Existenz prüfen
    const { data: existing, error: existingErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (existingErr) {
      console.error('Fehler beim Prüfen des Profils:', existingErr)
      alert('Fehler beim Prüfen des Profils. Siehe Konsole.')
      return
    }

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
      console.error('Fehler beim Speichern des Profils:', result.error)
      alert('Fehler beim Speichern des Profils. Siehe Konsole.')
    } else {
      console.log('Profil erfolgreich gespeichert:', result.data)
      alert('Profil erfolgreich gespeichert!')
    }
  } catch (err) {
    console.error('Fehler beim Speichern (try/catch):', err)
    alert('Fehler beim Speichern des Profils. Siehe Konsole.')
  }
})

loadProfile()
