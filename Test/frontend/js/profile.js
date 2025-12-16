import { supabase } from './supabaseClient.js'

// -Dieses Logiksegment holt die notwendigen DOM-Elemente und initialisiert die globalen Variablen für die Sprachwahl-

const profileForm = document.getElementById('profile-form')
const fullnameInput = document.getElementById('fullname')
const usernameInput = document.getElementById('username') // Liest die DOM-Elemente für die Formularfelder aus.

// Sprachwahl
let nativeLanguage = 'Deutsch' // Variable für die Muttersprache, initial mit einem Standardwert belegt.
let learningLanguage = 'Englisch' // Variable für die Lernsprache.

// -Dieses Logiksegment setzt die Logik für die klickbaren Sprach-Tags der Muttersprache um-

// Sprachoptionen klickbar machen (Native Language)
document.querySelectorAll('#native-language .language-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('#native-language .language-option').forEach(o => o.classList.remove('selected')) // Entfernt zuerst bei allen Geschwistern im Container die 'selected'-Klasse.
    opt.classList.add('selected') // Fügt dem geklickten Element die 'selected'-Klasse hinzu (visuelle Hervorhebung).
    nativeLanguage = opt.textContent // Aktualisiert die globale Variable `nativeLanguage` mit dem Text der gewählten Option.
  })
})

// -Dieses Logiksegment setzt die Logik für die klickbaren Sprach-Tags der Lernsprache um-

document.querySelectorAll('#learning-language .language-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('#learning-language .language-option').forEach(o => o.classList.remove('selected')) // Entfernt die 'selected'-Klasse von allen Optionen der Lernsprache.
    opt.classList.add('selected') // Setzt die 'selected'-Klasse auf die angeklickte Option.
    learningLanguage = opt.textContent // Aktualisiert die globale Variable `learningLanguage`.
  })
})

// -Dieses Logiksegment extrahiert die ausgewählten Hobbys aus den Checkboxen-

// Hobbys sammeln
function getSelectedHobbies() {
  return Array.from(document.querySelectorAll('.hobby-grid input:checked')).map(i => i.value) // Wählt alle Input-Elemente im Hobby-Raster aus, die aktuell gecheckt sind, und bildet ein Array aus deren `value`-Attributen.
}

// -Dieses Logiksegment prüft den Sitzungsstatus und sichert die Seite, falls der Benutzer nicht eingeloggt ist-

// Aktuellen User laden
const currentUser = JSON.parse(localStorage.getItem('user')) // Liest die gespeicherten Benutzerdaten aus dem lokalen Speicher.
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html' // Leitet zur Login-Seite um, falls keine Benutzerdaten gefunden werden.
}

// -Dieses Logiksegment liest beim Laden der Seite vorhandene Profilinformationen aus der Datenbank und füllt das Formular-

// Profil laden
async function loadProfile() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id) // Filtert die 'profiles'-Tabelle nach der ID des eingeloggten Benutzers.
      .single() // Erwartet maximal ein Profil pro Benutzer.

    if (error && error.code !== 'PGRST116') { // PGRST116 bedeutet "Did not find a row" (kein Profil vorhanden), was in Ordnung ist.
      console.error('Fehler beim Laden des Profils:', error)
      return
    }

    if (data) {
      console.log('Profil geladen:', data)
      // Formularfelder füllen
      fullnameInput.value = data.fullname || ''
      usernameInput.value = data.username || ''
      // Globale Variablen aktualisieren
      nativeLanguage = data.native_language || 'Deutsch'
      learningLanguage = data.learning_language || 'Englisch'

      const interests = data.interests || []
      // Hobbys markieren: Die Checkboxen werden aktiviert, wenn der gespeicherte Wert im Interessen-Array enthalten ist.
      document.querySelectorAll('.hobby-grid input').forEach(i => {
        i.checked = interests.includes(i.value)
      })

      // UI Sprachoptionen markieren: Aktualisiert die visuelle Darstellung der Sprachauswahl.
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

// -Dieses Logiksegment verarbeitet das Speichern des Profils und führt je nach Existenz einen UPDATE oder INSERT in der Datenbank durch-

// Profil speichern / updaten
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const profileData = { // Erstellt das Datenobjekt, das an die Datenbank gesendet wird.
    user_id: currentUser.id,
    fullname: fullnameInput.value,
    username: usernameInput.value,
    age: 0, 
    native_language: nativeLanguage,
    learning_language: learningLanguage,
    interests: getSelectedHobbies()
  }

  try {
    // Existenz prüfen: Es wird gesucht, ob bereits ein Profil für diesen User existiert.
    const { data: existing, error: existingErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle() // Erlaubt null, wenn kein Eintrag gefunden wird.

    if (existingErr) {
      console.error('Fehler beim Prüfen des Profils:', existingErr)
      alert('Fehler beim Prüfen des Profils. Siehe Konsole.')
      return
    }

    let result
    if (existing) {
      // UPDATE: Wenn das Profil existiert, wird es mit den neuen Daten aktualisiert.
      result = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', currentUser.id)
    } else {
      // INSERT: Wenn kein Profil existiert, wird ein neuer Eintrag erstellt.
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

loadProfile() // Startet den Profil-Ladevorgang beim Initialisieren des Skripts.