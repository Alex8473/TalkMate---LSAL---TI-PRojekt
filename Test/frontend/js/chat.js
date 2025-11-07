import { supabase } from './supabaseClient.js'

// --- 1. DOM-Elemente holen ---
const currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html'
}

// Ansichten
const contactListView = document.getElementById('contact-list-view');
const chatView = document.getElementById('chat-view');

// Listen-Ansicht
const contactListContainer = document.getElementById('contact-list-container');
const showRequestsBtn = document.getElementById('show-requests-button'); // NEU

// Chat-Ansicht
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('chat-message');
const sendBtn = document.getElementById('send-message');
const backToListBtn = document.getElementById('back-to-list-button');
const chatPartnerNameEl = document.getElementById('chat-partner-name');

// --- 2. Globale Variablen ---
let receivers = {} // { user_id: fullname }
let currentReceiverId = null; // Speichert, mit wem du gerade chattest

// --- 3. View-Wechsel-Logik ---

// Zeigt die Chat-Ansicht für einen bestimmten User
function showChatView(userId, userName) {
  currentReceiverId = userId; // Den aktiven Chat-Partner setzen
  chatPartnerNameEl.textContent = userName; // Namen im Header anzeigen

  // Ansichten umschalten
  contactListView.classList.add('hidden');
  chatView.classList.remove('hidden');

  loadMessages(); // Nachrichten für diesen (Fake-)User laden
}

// Zeigt wieder die Kontaktliste an
function showListView() {
  currentReceiverId = null; // Keinen aktiven Chat-Partner
  chatBox.innerHTML = ''; // Chat-Box leeren

  // Ansichten umschalten
  chatView.classList.add('hidden');
  contactListView.classList.remove('hidden');
}

// --- 4. Event-Listener ---

// Klick auf "Zurück"-Button im Chat
backToListBtn.addEventListener('click', showListView);

// Klick auf das NEUE Brief-Icon
showRequestsBtn.addEventListener('click', () => {
  alert('Hier würden die Anfragen angezeigt.');
  // Später kannst du hier eine 'showRequestsView()'-Funktion aufrufen
});

// Klick auf "Senden"
sendBtn.addEventListener('click', async () => {
  const receiverId = currentReceiverId; 
  const content = messageInput.value.trim()
  if (!receiverId || !content) return

  // HINWEIS: Dies sendet ECHTE Nachrichten an Supabase,
  // auch wenn der User 'fake-user-1' heißt.
  const { error } = await supabase
   .from('messages')
   .insert([{ sender_id: currentUser.id, receiver_id: receiverId, content }])

  if (error) {
    console.error('Fehler beim Senden:', error)
  } else {
    messageInput.value = ''
  }
});


// --- 5. Lade-Funktionen ---

/**
 * NEU: Lade FAKE-Matches statt echter
 * Das ist die Funktion, die deine 2 Kontakte anzeigt.
 */
function loadFakeMatches() {
  console.log("Lade FAKE-Kontakte zum Testen...");

  // 1. Unsere Fake-Kontakte
  const fakeProfiles = [
    { id: 'fake-user-1', name: 'Alex' },
    { id: 'fake-user-2', name: 'Lukas' }
  ];

  // 2. 'receivers'-Objekt füllen (wichtig für Chat-Anzeige)
  receivers = {};
  fakeProfiles.forEach(profile => {
    receivers[profile.id] = profile.name;
  });

  // 3. HTML für die Kontaktliste leeren
  contactListContainer.innerHTML = '';

  // 4. HTML für jeden Fake-Kontakt erstellen
  fakeProfiles.forEach(profile => {
    const item = document.createElement('div');
    item.className = 'contact-item';
    item.dataset.userId = profile.id; // WICHTIG: ID speichern

    item.innerHTML = `
      <img src="images/icon3.png" alt="Profilbild" class="contact-photo">
      <div class="contact-info">
        <span class="contact-name">${profile.name}</span>
        <span class="contact-preview">Klicke, um den Chat zu öffnen...</span>
      </div>
    `;
    
    // 5. Klick-Listener hinzufügen -> Dieser öffnet den Chat!
    item.addEventListener('click', () => {
      showChatView(profile.id, profile.name);
    });

    contactListContainer.appendChild(item);
  });
  
  sendBtn.disabled = false;
}

/**
 * Diese Funktion lädt ECHTE Nachrichten von Supabase.
 * Für unsere Fake-User wird sie einfach 0 Nachrichten finden,
 * was perfekt für den Test ist.
 */
async function loadMessages() {
  const receiverId = currentReceiverId; 
  if (!receiverId) return;

  console.log(`Lade Nachrichten für User: ${receiverId}`);
  chatBox.innerHTML = '<p>Lade Nachrichten...</p>'; // Lade-Anzeige

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Fehler beim Laden der Nachrichten:', error)
    chatBox.innerHTML = '<p>Fehler beim Laden der Nachrichten.</p>';
    return
  }

  chatBox.innerHTML = '' // Lade-Anzeige entfernen
  if (data.length === 0) {
    chatBox.innerHTML = '<p>Noch keine Nachrichten. Sag "Hallo"!</p>';
  }

  data.forEach(msg => {
    const senderName = msg.sender_id === currentUser.id ? 'Du' : receivers[msg.sender_id] || 'User'
    const msgEl = document.createElement('p')
    msgEl.innerHTML = `<b>${senderName}:</b> ${msg.content}`
    chatBox.appendChild(msgEl)
  })

  chatBox.scrollTop = chatBox.scrollHeight
}

// --- 6. Realtime-Updates (unverändert) ---
supabase
  .channel('realtime-messages')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    payload => {
      const msg = payload.new
      const receiverId = currentReceiverId; 
      if (!receiverId) return

      if (
        (msg.sender_id === currentUser.id && msg.receiver_id === receiverId) ||
        (msg.sender_id === receiverId && msg.receiver_id === currentUser.id)
      ) {
        // Wenn die "Noch keine Nachrichten"-Info da ist, entferne sie
        const noMsgEl = chatBox.querySelector('p');
        if (noMsgEl && noMsgEl.textContent.startsWith('Noch keine Nachrichten')) {
          chatBox.innerHTML = '';
        }

        // Neue Nachricht anhängen
        const senderName = msg.sender_id === currentUser.id ? 'Du' : receivers[msg.sender_id] || 'User'
        const msgEl = document.createElement('p')
        msgEl.innerHTML = `<b>${senderName}:</b> ${msg.content}`
        chatBox.appendChild(msgEl)
        chatBox.scrollTop = chatBox.scrollHeight
    }
   }
  )
  .subscribe()



loadFakeMatches();