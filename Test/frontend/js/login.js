// js/login.js
import { supabase } from './supabaseClient.js'

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register-btn');
const formTitle = document.getElementById('form-title');
const backToLoginBtn = document.getElementById('back-to-login-btn');

// Zeige Registrierungsformular
showRegisterBtn.addEventListener('click', () => {
  loginForm.style.display = 'none';
  showRegisterBtn.style.display = 'none';
  registerForm.style.display = 'block';
})

// Zurück zum Login
backToLoginBtn.addEventListener('click', () => {
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
})

// Registrierung
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const username = document.getElementById('Benutzername').value
  const password = document.getElementById('Passwort').value

  const { error } = await supabase
    .from('users')
    .insert([{ Benutzername, Passwort }])

  if (error) {
    alert('Fehler bei Registrierung: ' + error.message)
  } else {
    alert('Benutzer erfolgreich erstellt!')
    registerForm.style.display = 'none'
    loginForm.style.display = 'block'
  }
})

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const username = document.getElementById('login-username').value
  const password = document.getElementById('login-password').value

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single()

  if (error || !data) {
    alert('Falscher Benutzername oder Passwort!')
  } else {
    // Speichere Daten lokal, inklusive id für Profil-Tabelle
    localStorage.setItem('user', JSON.stringify({ id: data.id, username: data.username }))
    window.location.href = 'profile.html'
  }
})
