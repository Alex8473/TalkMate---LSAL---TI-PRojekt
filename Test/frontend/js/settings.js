// Inhalt für js/settings.js

document.addEventListener('DOMContentLoaded', function() {
    
    // Alle Elemente holen
    var settingsPage = document.getElementById('settings-container');
    var filterPage = document.getElementById('filter-container');
    
    var openBtn = document.getElementById('openFilterBtn');
    
    // Knopf: backToSettingsBtn
    var backBtn = document.getElementById('backToSettingsBtn'); 
   
    
    var filterForm = document.getElementById('filter-form');

    // Funktion zum Umschalten (unverändert)
    function showFilterPage(show) {
        if (show) {
            settingsPage.style.display = 'none';
            filterPage.style.display = 'block';
        } else {
            settingsPage.style.display = 'block';
            filterPage.style.display = 'none';
        }
    }

    // Event-Listener
    
    // "Filter anpassen"-Button klickt
    openBtn.addEventListener('click', function() {
        showFilterPage(true);
    });

    

    // "Filter speichern"-Button klickt
    filterForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        console.log("Filter gespeichert!");
        showFilterPage(false); // Zurück zur Einstellungs-Seite
    });

    // Logik für die Sprachauswahl 
    var languageOptions = document.querySelectorAll('.language-option');
    
    languageOptions.forEach(function(option) {
        option.addEventListener('click', function() {
            languageOptions.forEach(function(opt) {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
        });
    });

});