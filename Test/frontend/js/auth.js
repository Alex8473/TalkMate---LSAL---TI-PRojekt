import { supabase } from './supabaseClient.js'

// -Dieses Logiksegment holt die notwendigen DOM-Elemente für die Authentifizierung-

const usernameInput = document.querySelector('#username') // Das Input-Feld für den Benutzernamen.
const passwordInput = document.querySelector('#password') // Das Input-Feld für das Passwort.
const loginBtn = document.querySelector('#loginBtn') // Der Login-Button.
const registerBtn = document.querySelector('#registerBtn') // Der Registrierungs-Button.

// -Dieses Logiksegment implementiert die Benutzerregistrierung-

// Benutzer registrieren
registerBtn?.addEventListener('click', async () => {
  const username = usernameInput.value
  const password = passwordInput.value // Liest die eingegebenen Daten.

  const { error } = await supabase.from('users').insert([{ username, password }]) // Versucht, einen neuen Benutzer in die 'users'-Tabelle einzufügen.
  if (error) return alert('Fehler bei der Registrierung: ' + error.message) // Zeigt einen Fehler an.
  alert('Erfolgreich registriert!') // Bestätigt den Erfolg.
})

// -Dieses Logiksegment implementiert die Benutzeranmeldung und die Sitzungsverwaltung-

// Benutzer einloggen
loginBtn?.addEventListener('click', async () => {
  const username = usernameInput.value
  const password = passwordInput.value // Liest die Anmeldedaten.

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username) // Filtert nach Benutzernamen.
    .eq('password', password) // Filtert nach Passwort.
    .single() // Erwartet genau einen Benutzer.

  if (error || !data) return alert('Falscher Benutzername oder Passwort!') // Fehlermeldung bei falscher Kombination.
  localStorage.setItem('user', JSON.stringify(data)) // Speichert die vollständigen Benutzerdaten im lokalen Speicher (Sitzungsverwaltung).
  window.location.href = 'profile.html' // Leitet zur Profilseite weiter.
})