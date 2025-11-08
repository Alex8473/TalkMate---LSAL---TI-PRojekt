import { supabase } from './supabaseClient.js'

// --- 1. DOM-Elemente ---
const currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html'
}

// Ansichten
const contactListView = document.getElementById('contact-list-view')
const chatView = document.getElementById('chat-view')

// Listen-Ansicht
const contactListContainer = document.getElementById('contact-list-container')
const showRequestsBtn = document.getElementById('show-requests-button')

// Chat-Ansicht
const chatBox = document.getElementById('chat-box')
const messageInput = document.getElementById('chat-message')
const sendBtn = document.getElementById('send-message')
const backToListBtn = document.getElementById('back-to-list-button')
const chatPartnerNameEl = document.getElementById('chat-partner-name')

// --- 2. Globale Variablen ---
let receivers = {} // { user_id: fullname }
let currentReceiverId = null

// --- 3. View-Wechsel ---
function showChatView(userId, userName) {
  currentReceiverId = userId
  chatPartnerNameEl.textContent = userName
  contactListView.classList.add('hidden')
  chatView.classList.remove('hidden')
  loadMessages()
}

function showListView() {
  currentReceiverId = null
  chatBox.innerHTML = ''
  chatView.classList.add('hidden')
  contactListView.classList.remove('hidden')
}

backToListBtn.addEventListener('click', showListView)
showRequestsBtn.addEventListener('click', () => alert('Hier kommen später Chat-Anfragen hin.'))

// --- 4. Nachricht senden ---
sendBtn.addEventListener('click', async () => {
  const content = messageInput.value.trim()
  if (!currentReceiverId || !content) return

  const { error } = await supabase
    .from('messages')
    .insert([
      {
        sender_id: currentUser.id,
        receivers_id: currentReceiverId, // <- dein Tabellenname
        content
      }
    ])

  if (error) {
    console.error('Fehler beim Senden:', error)
  } else {
    messageInput.value = ''
  }
})

// --- 5. Echte Matches laden ---
async function loadMatches() {
  contactListContainer.innerHTML = '<p>Lade deine Chats...</p>'

  // 1️⃣ Lade alle Matches, bei denen currentUser beteiligt ist
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .or(`source_id.eq.${currentUser.id},target_id.eq.${currentUser.id}`)
    .eq('liked', true)

  if (matchError) {
    console.error('Fehler beim Laden der Matches:', matchError)
    contactListContainer.innerHTML = '<p>Fehler beim Laden.</p>'
    return
  }

  if (!matches || matches.length === 0) {
    contactListContainer.innerHTML = '<p>Keine aktiven Chats.</p>'
    return
  }

  // 2️⃣ Hole Profilinfos der Chatpartner
  const partnerIds = matches.map(m =>
    m.source_id === currentUser.id ? m.target_id : m.source_id
  )

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, fullname')
    .in('user_id', partnerIds)

  if (profileError) {
    console.error('Fehler beim Laden der Profile:', profileError)
    return
  }

  // 3️⃣ Kontaktliste aufbauen
  receivers = {}
  contactListContainer.innerHTML = ''
  profiles.forEach(profile => {
    receivers[profile.user_id] = profile.fullname

    const item = document.createElement('div')
    item.className = 'contact-item'
    item.dataset.userId = profile.user_id
    item.innerHTML = `
      <img src="images/icon3.png" alt="Profilbild" class="contact-photo">
      <div class="contact-info">
        <span class="contact-name">${profile.fullname}</span>
        <span class="contact-preview">Klicke, um zu chatten...</span>
      </div>
    `
    item.addEventListener('click', () => showChatView(profile.user_id, profile.fullname))
    contactListContainer.appendChild(item)
  })
}

// --- 6. Nachrichten laden ---
async function loadMessages() {
  const receiverId = currentReceiverId
  if (!receiverId) return

  chatBox.innerHTML = '<p>Lade Nachrichten...</p>'

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${currentUser.id},receivers_id.eq.${receiverId}),
       and(sender_id.eq.${receiverId},receivers_id.eq.${currentUser.id})`
    )
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Fehler beim Laden der Nachrichten:', error)
    chatBox.innerHTML = '<p>Fehler beim Laden der Nachrichten.</p>'
    return
  }

  chatBox.innerHTML = ''
  if (data.length === 0) {
    chatBox.innerHTML = '<p>Noch keine Nachrichten. Sag "Hallo"!</p>'
  }

  data.forEach(msg => {
    const senderName = msg.sender_id === currentUser.id ? 'Du' : receivers[msg.sender_id] || 'User'
    const msgEl = document.createElement('p')
    msgEl.innerHTML = `<b>${senderName}:</b> ${msg.content}`
    chatBox.appendChild(msgEl)
  })
  chatBox.scrollTop = chatBox.scrollHeight
}

// Realtime-Listener 
supabase
  .channel('realtime-messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
    const msg = payload.new
    if (!currentReceiverId) return

    if (
      (msg.sender_id === currentUser.id && msg.receivers_id === currentReceiverId) ||
      (msg.sender_id === currentReceiverId && msg.receivers_id === currentUser.id)
    ) {
      const noMsgEl = chatBox.querySelector('p')
      if (noMsgEl && noMsgEl.textContent.startsWith('Noch keine Nachrichten')) {
        chatBox.innerHTML = ''
      }
      const senderName = msg.sender_id === currentUser.id ? 'Du' : receivers[msg.sender_id] || 'User'
      const msgEl = document.createElement('p')
      msgEl.innerHTML = `<b>${senderName}:</b> ${msg.content}`
      chatBox.appendChild(msgEl)
      chatBox.scrollTop = chatBox.scrollHeight
    }
  })
  .subscribe()

// Start 
loadMatches()
