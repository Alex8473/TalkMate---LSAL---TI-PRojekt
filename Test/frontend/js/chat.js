import { supabase } from './supabaseClient.js'

const currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html'
}

const chatBox = document.getElementById('chat-box')
const messageInput = document.getElementById('chat-message')
const sendBtn = document.getElementById('send-message')
const receiverSelect = document.getElementById('receiver-select')

let receivers = {} // { user_id: fullname }

// Lade alle gegenseitigen Matches
async function loadMatches() {
  try {
    // Alle User, die du geliked hast
    const { data: likedByMe, error: err1 } = await supabase
      .from('matches')
      .select('target_id')
      .eq('target_id', currentUser.id) // ggf. andere Richtung prüfen
      .eq('liked', true)

    if (err1) throw err1

    // Alle User, die dich geliked haben
    const { data: likedMe, error: err2 } = await supabase
      .from('matches')
      .select('target_id')
      .eq('target_id', currentUser.id)
      .eq('liked', true)

    if (err2) throw err2

    // Gegenseitige Matches
    // Einfach: alle, die du geliked hast und die dich geliked haben
    const { data: profilesData, error: err3 } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', likedByMe.map(m => m.target_id))

    if (err3) throw err3

    receivers = {}
    receiverSelect.innerHTML = ''

    profilesData.forEach(p => {
      receivers[p.id] = p.name
      const option = document.createElement('option')
      option.value = p.id
      option.textContent = p.name
      receiverSelect.appendChild(option)
    })

    if (!profilesData.length) {
      const option = document.createElement('option')
      option.value = ''
      option.textContent = 'Keine Matches verfügbar'
      receiverSelect.appendChild(option)
      sendBtn.disabled = true
    } else {
      sendBtn.disabled = false
    }

  } catch (err) {
    console.error('Fehler beim Laden der Matches:', err.message)
  }
}

// Lade Nachrichten zwischen currentUser und ausgewähltem Receiver
async function loadMessages() {
  const receiverId = receiverSelect.value
  if (!receiverId) return

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Fehler beim Laden der Nachrichten:', error)
    return
  }

  chatBox.innerHTML = ''
  data.forEach(msg => {
    const senderName = msg.sender_id === currentUser.id ? 'Du' : receivers[msg.sender_id] || 'User'
    const msgEl = document.createElement('p')
    msgEl.innerHTML = `<b>${senderName}:</b> ${msg.content}`
    chatBox.appendChild(msgEl)
  })

  chatBox.scrollTop = chatBox.scrollHeight
}

// Nachricht senden
sendBtn.addEventListener('click', async () => {
  const receiverId = receiverSelect.value
  const content = messageInput.value.trim()
  if (!receiverId || !content) return

  const { error } = await supabase
    .from('messages')
    .insert([{ sender_id: currentUser.id, receiver_id: receiverId, content }])

  if (error) {
    console.error('Fehler beim Senden:', error)
  } else {
    messageInput.value = ''
    loadMessages()
  }
})

// Realtime Updates
supabase
  .channel('realtime-messages')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    payload => {
      const msg = payload.new
      const receiverId = receiverSelect.value
      if (!receiverId) return
      // Nur Nachrichten zwischen currentUser und ausgewähltem Receiver
      if (
        (msg.sender_id === currentUser.id && msg.receiver_id === receiverId) ||
        (msg.sender_id === receiverId && msg.receiver_id === currentUser.id)
      ) {
        loadMessages()
      }
    }
  )
  .subscribe()

// Empfänger wechseln
receiverSelect.addEventListener('change', loadMessages)

// Start
loadMatches().then(loadMessages)
