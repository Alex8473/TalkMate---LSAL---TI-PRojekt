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

// Lade empfangbare Matches
async function loadMatches() {
    try {
        // Alle Profile die du akzeptiert hast
        const { data, error } = await supabase
            .from('matches')
            .select(`
                target_id,
                liked,
                profiles(fullname)
            `)
            .eq('user_id', currentUser.id)
            .eq('liked', true) // nur akzeptierte

        if (error) throw error

        receivers = {}
        receiverSelect.innerHTML = ''

        data.forEach(match => {
            if (match.profiles) {
                receivers[match.target_id] = match.profiles.fullname
                const option = document.createElement('option')
                option.value = match.target_id
                option.textContent = match.profiles.fullname
                receiverSelect.appendChild(option)
            }
        })

        if (!data.length) {
            const option = document.createElement('option')
            option.value = ''
            option.textContent = 'Keine Matches verfügbar'
            receiverSelect.appendChild(option)
            sendBtn.disabled = true
        }

    } catch (err) {
        console.error('Fehler beim Laden der Matches:', err.message)
    }
}

// Nachrichten laden
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
        chatBox.innerHTML += `<p><b>${senderName}:</b> ${msg.content}</p>`
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

// Realtime Nachrichten empfangen
supabase
    .channel('chat')
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
            const msg = payload.new
            const receiverId = receiverSelect.value
            if (!receiverId) return
            if (msg.sender_id === currentUser.id || msg.sender_id === receiverId) {
                loadMessages()
            }
        }
    )
    .subscribe()

// Empfänger wechseln
receiverSelect.addEventListener('change', loadMessages)

// Start
loadMatches().then(loadMessages)
