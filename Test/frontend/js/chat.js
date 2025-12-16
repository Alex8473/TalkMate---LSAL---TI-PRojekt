import { supabase } from './supabaseClient.js'

// -Dieses Logiksegment prüft den Anmeldestatus und initialisiert die DOM-Elemente und Zustandsvariablen-

// --- 1. DOM-Elemente und Initialisierung ---
const currentUser = JSON.parse(localStorage.getItem('user')) // Liest die gespeicherten Benutzerdaten aus dem lokalen Speicher.
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html' // Stellt sicher, dass die Seite nur für eingeloggte Benutzer zugänglich ist.
}

// Ansichten
const contactListView = document.getElementById('contact-list-view') // Der Container für die Kontaktliste.
const chatView = document.getElementById('chat-view') // Der Container für den Einzelchat.

// Listen-Ansicht
const contactListContainer = document.getElementById('contact-list-container')
const showRequestsBtn = document.getElementById('show-requests-button') // Button für die Chat-Anfragen (noch ungenutzt).

// Chat-Ansicht
const chatBox = document.getElementById('chat-box')
const messageInput = document.getElementById('chat-message')
const sendBtn = document.getElementById('send-message')
const backToListBtn = document.getElementById('back-to-list-button')
const chatPartnerNameEl = document.getElementById('chat-partner-name') // Das Element, das den Namen des Chat-Partners anzeigt.

// Globale Variablen
let receivers = {} // Speichert die Namen der Chat-Partner anhand ihrer ID (Format: { user_id: fullname }).
let currentReceiverId = null // Speichert die ID des Users, mit dem aktuell gechattet wird.

// --- 2. View-Wechsel ---

// -Dieses Logiksegment steuert das Umschalten zur Einzelchat-Ansicht und bereitet das Laden der Nachrichten vor-

function showChatView(userId, userName) {
  currentReceiverId = userId
  chatPartnerNameEl.textContent = userName // Setzt den Namen des Chat-Partners in die Kopfzeile.
  contactListView.classList.add('hidden') // Versteckt die Kontaktliste.
  chatView.classList.remove('hidden') // Zeigt den Chat an.
  loadMessages() // Ruft die Nachrichtenhistorie für diesen Partner ab.
}

// -Dieses Logiksegment steuert das Umschalten zurück zur Kontaktlisten-Ansicht-

function showListView() {
  currentReceiverId = null
  chatBox.innerHTML = '' // Leert die Chat-Box.
  chatView.classList.add('hidden')
  contactListView.classList.remove('hidden') // Zeigt die Kontaktliste an.
}

backToListBtn.addEventListener('click', showListView) // Der "Zurück"-Button löst den Wechsel aus.
showRequestsBtn.addEventListener('click', () => alert('Hier kommen später Chat-Anfragen hin.')) // Platzhalter-Funktion für den Anfragen-Button.

// --- 3. Echte Matches laden (Kontaktliste) ---

// -Dieses Logiksegment identifiziert alle gematchten Chat-Partner, lädt deren Profile und baut die Kontaktliste in der UI auf-

async function loadMatches() {
  contactListContainer.innerHTML = '<p>Lade deine Chats...</p>'

  // Lade alle Matches, bei denen currentUser beteiligt ist UND der Like auf TRUE steht (beidseitiges Like = Match).
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .or(`source_id.eq.${currentUser.id},target_id.eq.${currentUser.id}`) // Sucht Einträge, in denen der User source_id ODER target_id ist.
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

  // Hole Profilinfos der Chatpartner
  const partnerIds = matches.map(m =>
    m.source_id === currentUser.id ? m.target_id : m.source_id // Extrahiert die ID des jeweiligen Partners.
  )

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, fullname')
    .in('user_id', partnerIds) // Lädt die Profilnamen für alle Partner-IDs.

  if (profileError) {
    console.error('Fehler beim Laden der Profile:', profileError)
    return
  }

  // Kontaktliste aufbauen
  receivers = {}
  contactListContainer.innerHTML = ''
  profiles.forEach(profile => {
    receivers[profile.user_id] = profile.fullname // Speichert den Namen zur schnellen Auflösung.

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
    item.addEventListener('click', () => showChatView(profile.user_id, profile.fullname)) // Fügt den Listener zum Öffnen des Chats hinzu.
    contactListContainer.appendChild(item)
  })
}

// - Info - -------------------------------------------------------------------

// --- 4. Chat-Kernfunktionen (Senden, Laden, Realtime) ---

// -Hinweis: Dieses Logiksegment enthält die Kernfunktionen zum Chatten. Die Funktionalität (Senden, Laden, Realtime) ist im Code angelegt, 
// aber das Problem liegt möglicherweise an der Datenbankkonfiguration (z.B. RLS-Policies oder fehlende 'messages'-Tabelle) in Supabase. 
// Ich vermute, dass das chatten daher nicht funktioniert und die Funktion daher nicht gegeben ist!

// -Dieses Logiksegment speichert eine neue, gesendete Nachricht in der Datenbank-

sendBtn.addEventListener('click', async () => {
  const content = messageInput.value.trim()
  if (!currentReceiverId || !content) return // Abbruch, wenn kein Text oder kein Empfänger vorhanden ist.

  const { error } = await supabase
    .from('messages')
    .insert([
      {
        sender_id: currentUser.id,
        receivers_id: currentReceiverId, // Die ID des Chat-Partners (Empfängers).
        content // Der Text der Nachricht.
      }
    ]) // Fügt die Nachricht in die Datenbank ein.

  if (error) {
    console.error('Fehler beim Senden:', error)
  } else {
    messageInput.value = '' // Leert das Eingabefeld nach erfolgreichem Senden.
  }
})

// -Dieses Logiksegment lädt die komplette Nachrichten-Historie für den geöffneten Chat-

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
    ) // Filtert alle Nachrichten zwischen den beiden Usern.
    .order('created_at', { ascending: true }) // Sortiert die Nachrichten chronologisch.

  if (error) {
    console.error('Fehler beim Laden der Nachrichten:', error)
    chatBox.innerHTML = '<p>Fehler beim Laden der Nachrichten.</p>'
    return
  }

  chatBox.innerHTML = ''
  if (data.length === 0) {
    chatBox.innerHTML = '<p>Noch keine Nachrichten. Sag "Hallo"!</p>' // Zeigt eine Startnachricht an.
  }

  data.forEach(msg => {
    const senderName = msg.sender_id === currentUser.id ? 'Du' : receivers[msg.sender_id] || 'User' // Ermittelt den Namen des Absenders.
    const msgEl = document.createElement('p')
    msgEl.innerHTML = `<b>${senderName}:</b> ${msg.content}`
    chatBox.appendChild(msgEl)
  })
  chatBox.scrollTop = chatBox.scrollHeight // Scrollt automatisch zur neuesten Nachricht.
}

// -Dieses Logiksegment implementiert die Realtime-Funktionalität für Live-Updates bei neuen Nachrichten-

const realtimeListener = supabase
  .channel('realtime-messages') // Abonniert den Realtime-Kanal.
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
    const msg = payload.new // Die neu eingefügte Nachricht.
    if (!currentReceiverId) return // Abbruch, wenn kein Chat geöffnet ist.

    // Prüft, ob die neue Nachricht zum aktuell geöffneten Chat gehört.
    if (
      (msg.sender_id === currentUser.id && msg.receivers_id === currentReceiverId) ||
      (msg.sender_id === currentReceiverId && msg.receivers_id === currentUser.id)
    ) {
      const noMsgEl = chatBox.querySelector('p')
      if (noMsgEl && noMsgEl.textContent.startsWith('Noch keine Nachrichten')) {
        chatBox.innerHTML = '' // Entfernt die "Noch keine Nachrichten"-Meldung, falls sie existiert.
      }
      const senderName = msg.sender_id === currentUser.id ? 'Du' : receivers[msg.sender_id] || 'User'
      const msgEl = document.createElement('p')
      msgEl.innerHTML = `<b>${senderName}:</b> ${msg.content}`
      chatBox.appendChild(msgEl) // Fügt die neue Nachricht hinzu.
      chatBox.scrollTop = chatBox.scrollHeight // Scrollt nach unten.
    }
  })
  .subscribe() // Aktiviert den Listener.

// --- 5. Start ---
loadMatches() // Startet den Ladevorgang der Kontaktliste beim Initialisieren des Skripts.