// js/swipen.js (verbose, robust)
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

// Hilfsfunktion: sichere Anzeige von Fehlern
function showError(msg, err) {
  console.error(msg, err)
  swipeContainer.innerHTML = `<div class="profile-info-overlay"><p style="color:red">${msg}</p></div>`
}

// Profile aus Supabase laden
async function loadProfiles() {
  try {
    console.log('[swipe] Lade bereits bewertete target_ids für', currentUser.id)

    const { data: seen, error: seenErr } = await supabase
      .from('matches')
      .select('target_id')
      .eq('source_id', currentUser.id)

    if (seenErr) {
      // Wenn hier Permission denied oder RLS, stoppen und ausgeben
      return showError('Fehler beim Lesen bereits bewerteter Einträge (matches). Prüfe RLS/Policies.', seenErr)
    }

    const seenIds = (seen || []).map(m => m.target_id).filter(Boolean)
    console.log('[swipe] seenIds:', seenIds)

    // Build safe 'in' clause: quoted UUIDs e.g. ('u1','u2')
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('user_id', currentUser.id) // ausgeschlossen: eigener user

    if (seenIds.length > 0) {
      // quote each id to ensure SQL IN works
      const quoted = seenIds.map(id => `'${id}'`).join(',')
      console.log('[swipe] using NOT IN with:', quoted)
      query = query.not('user_id', 'in', `(${quoted})`)
    } else {
      console.log('[swipe] no seenIds, loading all except self')
    }

    const { data, error } = await query
    if (error) {
      return showError('Fehler beim Laden der Profiles (Query).', error)
    }

    if (!data || data.length === 0) {
      swipeContainer.innerHTML = `
        <div class="profile-info-overlay">
          <p>Keine neuen Profile verfügbar.</p>
        </div>`
      acceptBtn.disabled = true
      rejectBtn.disabled = true
      return
    }

    profiles = data
    currentIndex = 0
    console.log('[swipe] geladene profiles:', profiles)
    showProfile()
  } catch (err) {
    showError('Unerwarteter Fehler beim Laden der Profile.', err)
  }
}

// Profil anzeigen
function showProfile() {
  if (currentIndex >= profiles.length) {
    swipeContainer.innerHTML = '<div class="profile-info-overlay"><p>Keine weiteren Profile verfügbar.</p></div>'
    acceptBtn.disabled = true
    rejectBtn.disabled = true
    return
  }

  const p = profiles[currentIndex]
  let hobbiesHTML = ''
  if (Array.isArray(p.interests)) {
    hobbiesHTML = p.interests.map(hobby => `<span class="profile-hobby-tag">${hobby}</span>`).join('')
  }

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
  `
}

// Speichere Swipe (robust; prüft existent, führt insert oder update aus)
async function saveSwipe(liked) {
  const selected = profiles[currentIndex]
  if (!selected) {
    console.warn('[swipe] kein ausgewähltes Profil zum Speichern')
    return
  }

  // Bestimme target id: versuche user_id, fallback id
  const targetId = selected.user_id || selected.id
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
      .maybeSingle()

    if (existingErr) {
      
      if (existingErr.code === '42501' || /permission/.test(String(existingErr).toLowerCase())) {
        return showError('Permission error beim Prüfen bestehender Matches. Prüfe RLS-Policies in Supabase.', existingErr)
      }
      return showError('Fehler beim Prüfen bestehender Matches.', existingErr)
    }

    if (!existing) {
      // INSERT
      const { data: inserted, error: insertErr } = await supabase
        .from('matches')
        .insert([{
          source_id: currentUser.id,
          target_id: targetId,
          liked: liked
        }])
        .select() // damit Supabase result.data liefert

      if (insertErr) {
        // Wenn unique constraint verletzt oder permission error, liefern wir klare Nachricht
        console.error('[swipe] insert error:', insertErr)
        return showError('Fehler beim Speichern (insert). Schau in die Konsole für Details.', insertErr)
      }

      console.log('[swipe] insert erfolgreich:', inserted)
    } else {
      // UPDATE falls schon vorhanden
      const { data: updated, error: updateErr } = await supabase
        .from('matches')
        .update({ liked })
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

// Animation + Speicherung
function animateSwipe(liked) {
  acceptBtn.disabled = true
  rejectBtn.disabled = true

  const animationClass = liked ? 'swipe-right' : 'swipe-left'
  swipeContainer.classList.add(animationClass)

  setTimeout(async () => {
    await saveSwipe(liked)
    nextProfile()
    swipeContainer.classList.add('no-transition')
    swipeContainer.classList.remove(animationClass)

    setTimeout(() => {
      swipeContainer.classList.remove('no-transition')
      if (currentIndex < profiles.length) {
        acceptBtn.disabled = false
        rejectBtn.disabled = false
      }
    }, 20)
  }, 400) // Animation kurz halten
}

function nextProfile() {
  currentIndex++
  showProfile()
}

acceptBtn.addEventListener('click', () => animateSwipe(true))
rejectBtn.addEventListener('click', () => animateSwipe(false))

document.addEventListener('DOMContentLoaded', loadProfiles)
