document.addEventListener('DOMContentLoaded', function() {
    
    // -Dieses Logiksegment holt die notwendigen DOM-Elemente und initialisiert die Ansichten-

    // Alle Elemente holen
    var settingsPage = document.getElementById('settings-container'); // Der Container für die allgemeinen Einstellungen.
    var filterPage = document.getElementById('filter-container'); // Der Container für die Filter-Einstellungen.
    
    var openBtn = document.getElementById('openFilterBtn'); // Button zum Wechsel zur Filterseite.
    
    // Knopf: backToSettingsBtn
    var backBtn = document.getElementById('backToSettingsBtn'); // Button zum Zurückwechseln.
   
    
    var filterForm = document.getElementById('filter-form'); // Das Formular, das die Filterdaten enthält.

    // -Dieses Logiksegment steuert das Umschalten zwischen Einstellungs- und Filteransicht-

    // Funktion zum Umschalten
    function showFilterPage(show) {
        if (show) {
            settingsPage.style.display = 'none'; // Blendet die Einstellungen aus.
            filterPage.style.display = 'block'; // Zeigt die Filterseite an.
        } else {
            settingsPage.style.display = 'block'; // Zeigt die Einstellungen an.
            filterPage.style.display = 'none'; // Blendet die Filterseite aus.
        }
    }

    // -Dieses Logiksegment verwaltet die Event-Listener für den Ansichtenwechsel und den Formularversand-

    // Event-Listener
    
    // "Filter anpassen"-Button klickt
    openBtn.addEventListener('click', function() {
        showFilterPage(true); // Wechselt zur Filterseite.
    });

    

    // "Filter speichern"-Button klickt
    filterForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Verhindert das Neuladen der Seite durch den Formularversand.
        console.log("Filter gespeichert!");
        showFilterPage(false); // Zurück zur Einstellungs-Seite.
    });

    // "Zurück"-Button klickt
    backBtn.addEventListener('click', function() {
        showFilterPage(false); // Wechselt zur Einstellungs-Seite zurück.
    });


    // -Dieses Logiksegment implementiert die Logik für die visuelle Sprachauswahl (Styling)-

    // Logik für die Sprachauswahl 
    var languageOptions = document.querySelectorAll('.language-option');
    
    languageOptions.forEach(function(option) {
        option.addEventListener('click', function() {
            languageOptions.forEach(function(opt) {
                opt.classList.remove('selected'); // Entfernt die 'selected'-Klasse von allen Optionen.
            });
            this.classList.add('selected'); // Fügt die 'selected'-Klasse zur angeklickten Option hinzu.
        });
    });

});