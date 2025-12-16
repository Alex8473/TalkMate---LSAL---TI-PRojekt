import { supabase } from './supabaseClient.js'

// -Dieses Logiksegment holt die notwendigen Elemente aus dem DOM und verwaltet den visuellen Wechsel zwischen Login und Registrierung-

const loginForm = document.getElementById('login-form')
const registerForm = document.getElementById('register-form')
const showRegisterBtn = document.getElementById('show-register-btn')
const backToLoginBtn = document.getElementById('back-to-login-btn')
const languageOptions = document.querySelectorAll('.language-option'); // Holt alle relevanten DOM-Elemente, um sie später mit Event-Listenern zu verbinden.

// Zeige Registrierungsformular
showRegisterBtn.addEventListener('click', () => {
  loginForm.style.display = 'none' // Blendet das Login-Formular aus, indem die CSS-Anzeige auf 'none' gesetzt wird.
  showRegisterBtn.style.display = 'none' // Blendet den Button, der zur Registrierung führt, aus.
  registerForm.style.display = 'block' // Zeigt das Registrierungsformular an.
})

// Zurück zum Login
backToLoginBtn.addEventListener('click', () => {
  registerForm.style.display = 'none' // Blendet das Registrierungsformular aus.
  loginForm.style.display = 'block' // Zeigt das Login-Formular wieder an.
  showRegisterBtn.style.display = 'block' // Zeigt den Registrierungs-Button wieder an.
})

// -Dieses Logiksegment implementiert die Benutzerregistrierung und speichert die Daten in Supabase-

// Registrierung
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault() // Verhindert, dass das Formular standardmäßig gesendet wird, was zu einem Neuladen der Seite führen würde.
  const username = document.getElementById('register-username').value
  const password = document.getElementById('register-password').value // Liest die Werte aus den Formularfeldern.

  const { data, error } = await supabase
    .from('users') // Wählt die Tabelle 'users' aus.
    .insert([{ username, password }]) // Versucht, einen neuen Datensatz mit Benutzername und Passwort einzufügen.
    .select() // Fordert die Datenbank auf, die neu erstellten Daten zurückzugeben.

  if (error) {
    alert('Fehler bei Registrierung: ' + error.message) // Gibt eine Fehlermeldung aus, falls der Datenbank-Eintrag fehlschlägt.
  } else {
    alert('Benutzer erfolgreich erstellt!') // Bestätigt den Erfolg.
    registerForm.style.display = 'none' // Nach erfolgreicher Registrierung wird zurück zur Login-Ansicht gewechselt.
    loginForm.style.display = 'block'
    showRegisterBtn.style.display = 'block'
  }
})

// -Dieses Logiksegment implementiert die Benutzeranmeldung und die Sitzungsverwaltung via Local Storage-

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const username = document.getElementById('login-username').value
  const password = document.getElementById('login-password').value // Liest die Anmeldedaten.

  const { data, error } = await supabase
    .from('users')
    .select('*') // Wählt alle Spalten aus.
    .eq('username', username) // Filtert die Zeilen, bei denen die Spalte 'username' dem eingegebenen Wert entspricht.
    .eq('password', password) // Filtert zusätzlich nach dem eingegebenen Passwort.
    .single() // Stellt sicher, dass nur ein einziger Datensatz zurückgegeben wird (oder keiner, falls keine Übereinstimmung gefunden wird).

  if (error || !data) {
    alert('Falscher Benutzername oder Passwort!') // Die Fehlermeldung ist allgemein gehalten, um keine Informationen über existierende Benutzernamen preiszugeben.
  } else {
    // Wenn Login erfolgreich:
    localStorage.setItem('user', JSON.stringify({ id: data.id, username: data.username })) // Speichert die Benutzer-ID und den Namen als JSON-String im lokalen Speicher (Browser-Speicher), um den angemeldeten Zustand zu halten.
    window.location.href = 'profile.html' // Leitet den Benutzer zur Hauptseite weiter, auf der das Profil erstellt wird.
  }
})

// -Dieses Logiksegment steuert die visuelle Darstellung der Sprachauswahl in der UI-

languageOptions.forEach((option) => {
    option.addEventListener('click', () => {
      const parentContainer = option.parentElement;
      const optionsInGroup = parentContainer.querySelectorAll('.language-option');
      optionsInGroup.forEach((sibling) => {
        sibling.classList.remove('selected'); // Entfernt die visuelle Markierung von allen Optionen der Gruppe.
      });

      option.classList.add('selected'); // Markiert die angeklickte Option als ausgewählt.
    });
  });