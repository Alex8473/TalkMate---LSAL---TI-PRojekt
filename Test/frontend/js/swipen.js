import { supabase } from './supabaseClient.js'

const swipeContainer = document.getElementById('profile-swipe')
const acceptBtn = document.getElementById('accept-btn')
const rejectBtn = document.getElementById('reject-btn')

let profiles = []
let currentIndex = 0

// Aktuellen Nutzer laden
const currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html'
}

// Profile aus Supabase laden
async function loadProfiles() {
  try {
    // 1. IDs der Profile holen, die der User schon bewertet hat
    const { data: seen, error: seenErr } = await supabase
      .from('matches')
      .select('target_id')
      .eq('source_id', currentUser.id);

    if (seenErr) throw seenErr;

    // seenIds ist jetzt ein Array von UUIDs, z.B. ['uuid1', 'uuid2']
    const seenIds = seen.map(m => m.target_id);

    // 2. Query-Builder für Profile starten
    // Wir fangen mit dem Basis-Query an
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('user_id', currentUser.id); // eigenen User immer ausschließen

    // 3. Den .not Filter NUR hinzufügen, wenn seenIds NICHT leer ist
    if (seenIds.length > 0) {
      // Nur wenn wir IDs haben, fügen wir den Filter hinzu
      query = query.not('user_id', 'in', `(${seenIds.join(',')})`);
    }
    
    // 4. Query jetzt sicher ausführen
    const { data, error } = await query;

    if (error) throw error; // Fängt andere Query-Fehler ab

    // 5. Ergebnisse verarbeiten
    if (!data || data.length === 0) {
      swipeContainer.innerHTML = `
        <div class="profile-info-overlay">
          <p>Keine neuen Profile verfügbar.</p>
        </div>`;
      acceptBtn.disabled = true;
      rejectBtn.disabled = true;
      return;
    }

    profiles = data;
    console.log('Geladene Profile:', profiles);
    currentIndex = 0;
    
    // 6. Das erste Profil mit der korrekten HTML-Struktur anzeigen
    showProfile(); // Diese Funktion nutzt jetzt deinen korrigierten Code von vorhin

  } catch (err) {
    console.error('Fehler beim Laden der Profile:', err.message);
    // Wir verwenden hier auch die Overlay-Struktur, damit der Fehler besser aussieht
    swipeContainer.innerHTML = `
      <div class="profile-info-overlay">
         <p>Fehler beim Laden der Profile.</p>
         <p style="font-size: 12px; margin-top: 10px;">${err.message}</p>
      </div>`;
  }
}

// Aktuelles Profil anzeigen
function showProfile() {
  if (currentIndex >= profiles.length) {
    swipeContainer.innerHTML = '<div class="profile-info-overlay"><p>Keine weiteren Profile verfügbar.</p></div>'
    acceptBtn.disabled = true
    rejectBtn.disabled = true
    return
  }

  const p = profiles[currentIndex];

  // Erzeuge die Hobby-Tags als HTML-String
  let hobbiesHTML = '';
  if (Array.isArray(p.interests)) {
    hobbiesHTML = p.interests.map(hobby => 
      `<span class="profile-hobby-tag">${hobby}</span>`
    ).join(''); // Erzeugt: <span..._>Reisen</span><span..._>Kochen</span>...
  }

  // Setze das innerHTML mit der KORREKTEN Struktur aus deinem HTML/CSS
  swipeContainer.innerHTML = `
    
    <div class="profile-info-overlay">

      <div class="profile-name-age">
        ${p.fullname || 'Unbekannt'}, ${p.age || '?'}
      </div>

      <div class="profile-description">
        Muttersprache: ${p.native_language || '-'}<br>
        Sprache die ich lernen will: ${p.learning_language || '-'}
      </div>

      <div class="profile-hobbies-list">
        ${hobbiesHTML || 'Keine Hobbys angegeben'}
      </div>

    </div>
  `;

}
// ALT
async function saveSwipe(liked) {
  const selected = profiles[currentIndex]

  try {
   const { error } = await supabase
    
   if (error) throw error
   console.log(`${liked ? 'Akzeptiert' : 'Abgelehnt'}: ${selected.fullname}`)
  } catch (err) {
   console.error('Fehler beim Speichern des Swipes:', err.message)
  }
}

// NEU (Diese Funktion komplett einfügen)
function animateSwipe(liked) {
  // 1. Buttons sperren
  acceptBtn.disabled = true;
  rejectBtn.disabled = true;

  // 2. CSS-Klasse für Animation hinzufügen
  const animationClass = liked ? 'swipe-right' : 'swipe-left';
  swipeContainer.classList.add(animationClass);

  // 3. Warten, bis Animation fertig ist (500ms)
  setTimeout(() => {
    // 4. Jetzt erst speichern
    saveSwipe(liked);

    // 5. Nächstes Profil laden
    nextProfile();

    // 6. Animation zurücksetzen für die nächste Karte
    swipeContainer.classList.add('no-transition');
    swipeContainer.classList.remove(animationClass);

    setTimeout(() => {
      swipeContainer.classList.remove('no-transition');
      // 7. Buttons wieder freigeben
      if (currentIndex < profiles.length) {
         acceptBtn.disabled = false;
         rejectBtn.disabled = false;
      }
    }, 20); 

  }, 500); // Muss zur CSS-Zeit passen
}

// Nächstes Profil
function nextProfile() {
  currentIndex++
  showProfile()
}

// Buttons aktivieren
acceptBtn.addEventListener('click', () => animateSwipe(true))
rejectBtn.addEventListener('click', () => animateSwipe(false))

// Start
document.addEventListener('DOMContentLoaded', loadProfiles)
