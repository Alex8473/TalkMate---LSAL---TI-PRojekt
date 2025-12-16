// js/swipen.js (verbose, robust)
import { supabase } from './supabaseClient.js'

// -Dieses Logiksegment initialisiert die Swiping-Umgebung und die Zustandsvariablen-

const swipeContainer = document.getElementById('profile-swipe')
const acceptBtn = document.getElementById('accept-btn') // Der Like-Button.
const rejectBtn = document.getElementById('reject-btn') // Der Dislike-Button.

let profiles = [] // Dieses Array hält alle Profile, die dem User zum Swipen angezeigt werden sollen.
let currentIndex = 0 // Zeigt auf das aktuell angezeigte Profil im `profiles`-Array.

// Aktuellen Nutzer laden
const currentUser = JSON.parse(localStorage.getItem('user')) // Liest die User-Daten.
if (!currentUser) {
  alert('Bitte zuerst einloggen!')
  window.location.href = 'login.html' // Leitet zur Login-Seite um.
}

// Hilfsfunktion: sichere Anzeige von Fehlern
function showError(msg, err) {
  console.error(msg, err)
  swipeContainer.innerHTML = `<div class="profile-info-overlay"><p style="color:red">${msg}</p></div>` // Zeigt eine Fehlermeldung im Swipe-Container an.
}

// -Dieses Logiksegment fragt Profile ab, die dem Benutzer noch nicht angezeigt wurden (Filterung)-

// Profile aus Supabase laden
async function loadProfiles() {
  try {
    console.log('[swipe] Lade bereits bewertete target_ids für', currentUser.id)

    // 1. Zuerst werden die IDs der bereits bewerteten Profile geladen, damit diese ausgeschlossen werden können.
    const { data: seen, error: seenErr } = await supabase
      .from('matches')
      .select('target_id')
      .eq('source_id', currentUser.id) // Filtert nach allen Matches, die der aktuelle User als Quelle bewertet hat.

    if (seenErr) {
      // Wenn hier Permission denied oder RLS, stoppen und ausgeben - (RLS-Ploicies - Fehler bei Supabase)
      return showError('Fehler beim Lesen bereits bewerteter Einträge (matches). Prüfe RLS/Policies.', seenErr)
    }

    const seenIds = (seen || []).map(m => m.target_id).filter(Boolean) // Erstellt ein sauberes Array der IDs.
    console.log('[swipe] seenIds:', seenIds)

    // 2. Die Hauptabfrage für neue Profile wird erstellt:
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('user_id', currentUser.id) // Schließt das eigene Profil aus (Not Equal).

    if (seenIds.length > 0) {
      // Schließt alle Profile aus, deren ID in der Liste der `seenIds` enthalten ist.
      const quoted = seenIds.map(id => `'${id}'`).join(',')
      console.log('[swipe] using NOT IN with:', quoted)
      query = query.not('user_id', 'in', `(${quoted})`) // Erzeugt eine `NOT IN`-Abfrage.
    } else {
      console.log('[swipe] no seenIds, loading all except self')
    }

    const { data, error } = await query // Führt die vorbereitete Datenbankabfrage aus.
    if (error) {
      return showError('Fehler beim Laden der Profiles (Query).', error)
    }

    if (!data || data.length === 0) {
      // Zustand: Keine neuen Profile gefunden.
      swipeContainer.innerHTML = `
        <div class="profile-info-overlay">
          <p>Keine neuen Profile verfügbar.</p>
        </div>`
      acceptBtn.disabled = true
      rejectBtn.disabled = true
      return
    }

    profiles = data // Speichert die erhaltenen, ungesehenen Profile.
    currentIndex = 0
    console.log('[swipe] geladene profiles:', profiles)
    showProfile() // Beginnt mit der Anzeige des ersten Profils.
  } catch (err) {
    showError('Unerwarteter Fehler beim Laden der Profile.', err)
  }
}

// -Dieses Logiksegment generiert und aktualisiert die HTML-Anzeige des aktuellen Profils-

// Profil anzeigen
function showProfile() {
  if (currentIndex >= profiles.length) {
    // Wenn alle Profile durchgeswipt wurden:
    swipeContainer.innerHTML = '<div class="profile-info-overlay"><p>Keine weiteren Profile verfügbar.</p></div>'
    acceptBtn.disabled = true
    rejectBtn.disabled = true
    return
  }

  const p = profiles[currentIndex]
  let hobbiesHTML = ''
  // Erstellt HTML-Tags für die Interessen (Hobbys), um sie als visuelle Tags darzustellen.
  if (Array.isArray(p.interests)) {
    hobbiesHTML = p.interests.map(hobby => `<span class="profile-hobby-tag">${hobby}</span>`).join('')
  }

  // Der gesamte Inhalt des Swipe-Containers wird mit den Daten des aktuellen Profils überschrieben.
  swipeContainer.innerHTML = `
    <div class="profile-info-overlay">
      <div class="profile-name-age">
        ${p.fullname || 'Unbekannt'}, ${p.age || '?'} // Zeigt Name und Alter an.
      </div>
      <div class="profile-description">
        Muttersprache: ${p.native_language || '-'}<br>
        Sprache die ich lernen will: ${p.learning_language || '-'} // Zeigt die Sprachinformationen an.
      </div>
      <div class="profile-hobbies-list">
        ${hobbiesHTML || 'Keine Hobbys angegeben'} // Zeigt die Hobbys an.
      </div>
    </div>
  `
}

// -Dieses Logiksegment speichert das Like/Dislike-Ergebnis in der 'matches'-Tabelle (Insert oder Update)-

// Speichere Swipe (robust; prüft existent, führt insert oder update aus)
async function saveSwipe(liked) {
  const selected = profiles[currentIndex]
  if (!selected) {
    console.warn('[swipe] kein ausgewähltes Profil zum Speichern')
    return
  }

  // Bestimme target id: versuche user_id, fallback id
  const targetId = selected.user_id || selected.id // Die ID des bewerteten Users wird ermittelt.
  if (!targetId) {
    console.error('[swipe] selected hat keine user_id oder id:', selected)
    return
  }

  try {
    console.log(`[swipe] Speichere swipe: source=${currentUser.id}, target=${targetId}, liked=${liked}`)

    // Prüfen, ob bereits ein Eintrag vorhanden ist
    const { data: existing, error: existingErr } = await supabase
      .from('matches')
      .select('id, liked')
      .eq('source_id', currentUser.id)
      .eq('target_id', targetId)
      .maybeSingle() // Erlaubt 0 oder 1 Ergebnis.

    if (existingErr) {
      
      if (existingErr.code === '42501' || /permission/.test(String(existingErr).toLowerCase())) {
        return showError('Permission error beim Prüfen bestehender Matches. Prüfe RLS-Policies in Supabase.', existingErr)
      }
      return showError('Fehler beim Prüfen bestehender Matches.', existingErr)
    }

    if (!existing) {
      // INSERT: Wenn der Eintrag neu ist, wird er erstellt.
      const { data: inserted, error: insertErr } = await supabase
        .from('matches')
        .insert([{
          source_id: currentUser.id,
          target_id: targetId,
          liked: liked // Speichert die Bewertung (true für Like, false für Dislike).
        }])
        .select() 

      if (insertErr) {
        console.error('[swipe] insert error:', insertErr)
        return showError('Fehler beim Speichern (insert). Schau in die Konsole für Details.', insertErr)
      }

      console.log('[swipe] insert erfolgreich:', inserted)
    } else {
      // UPDATE: Der vorhandene Eintrag wird aktualisiert.
      const { data: updated, error: updateErr } = await supabase
        .from('matches')
        .update({ liked }) // Aktualisiert nur den `liked`-Wert.
        .eq('id', existing.id)
        .select()

      if (updateErr) {
        console.error('[swipe] update error:', updateErr)
        return showError('Fehler beim Aktualisieren des Swipes.', updateErr)
      }
      console.log('[swipe] update erfolgreich:', updated)
    }
  } catch (err) {
    showError('Unerwarteter Fehler beim Speichern des Swipes.', err)
  }
}

// -Dieses Logiksegment führt die Animation aus, speichert das Ergebnis und wechselt zum nächsten Profil-

// Animation + Speicherung
function animateSwipe(liked) {
  acceptBtn.disabled = true // Buttons deaktivieren, um Mehrfachklicks während der Animation zu verhindern.
  rejectBtn.disabled = true

  const animationClass = liked ? 'swipe-right' : 'swipe-left'
  swipeContainer.classList.add(animationClass) // Fügt die CSS-Klasse hinzu, die die Wischbewegung auslöst.

  setTimeout(async () => {
    await saveSwipe(liked) // Daten werden asynchron gespeichert.
    nextProfile() // Geht zum nächsten Profil-Index.
    
    // UI-Cleanup: Die Animationsklassen werden entfernt, um das nächste Profil ohne Übergang anzuzeigen.
    swipeContainer.classList.add('no-transition')
    swipeContainer.classList.remove(animationClass)

    setTimeout(() => {
      swipeContainer.classList.remove('no-transition')
      if (currentIndex < profiles.length) {
        acceptBtn.disabled = false // Buttons werden wieder aktiviert.
        rejectBtn.disabled = false
      }
    }, 20)
  }, 400) // Die Zeit stimmt mit der Dauer der CSS-Animation überein.
}

function nextProfile() {
  currentIndex++ // Erhöht den Index.
  showProfile() // Ruft die Funktion zur Anzeige des nächsten Profils auf.
}

acceptBtn.addEventListener('click', () => animateSwipe(true)) // Klick auf Like löst Swipe mit `true` aus.
rejectBtn.addEventListener('click', () => animateSwipe(false)) // Klick auf Dislike löst Swipe mit `false` aus.

document.addEventListener('DOMContentLoaded', loadProfiles) // Startet den Hauptprozess, nachdem die Seite geladen wurde.