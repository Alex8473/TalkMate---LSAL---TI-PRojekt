import { supabase } from './supabaseClient.js'

const user = JSON.parse(localStorage.getItem('user'))
const receiverInput = document.querySelector('#receiver')
const messageInput = document.querySelector('#message')
const sendBtn = document.querySelector('#sendBtn')
const chatBox = document.querySelector('#chatBox')

// Nachricht senden
sendBtn?.addEventListener('click', async () => {
  const { error } = await supabase
    .from('messages')
    .insert([{ 
      sender_id: user.id, 
      receiver_id: receiverInput.value, 
      content: messageInput.value 
    }])
  if (error) console.error(error)
  messageInput.value = ''
})

// Nachrichten live empfangen
supabase
  .channel('chat')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'messages' },
    payload => {
      const msg = payload.new
      chatBox.innerHTML += `<p><b>${msg.sender_id}</b>: ${msg.content}</p>`
    }
  )
  .subscribe()
