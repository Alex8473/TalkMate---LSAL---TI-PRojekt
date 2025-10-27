import { supabase } from './supabaseClient.js'

const usernameInput = document.querySelector('#username')
const passwordInput = document.querySelector('#password')
const loginBtn = document.querySelector('#loginBtn')
const registerBtn = document.querySelector('#registerBtn')

// Benutzer registrieren
registerBtn?.addEventListener('click', async () => {
  const username = usernameInput.value
  const password = passwordInput.value

  const { error } = await supabase.from('users').insert([{ username, password }])
  if (error) return alert('Fehler bei der Registrierung: ' + error.message)
  alert('Erfolgreich registriert!')
})

// Benutzer einloggen
loginBtn?.addEventListener('click', async () => {
  const username = usernameInput.value
  const password = passwordInput.value

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single()

  if (error || !data) return alert('Falscher Benutzername oder Passwort!')
  localStorage.setItem('user', JSON.stringify(data))
  window.location.href = 'profile.html'
})
