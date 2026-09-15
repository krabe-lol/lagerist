# Known Issues

## Foto-/Datei-Upload schlägt auf manchen Android-Geräten lautlos fehl

**Betrifft:** Foto-Upload (Kamera *und* Galerie) sowie Datei-Anhänge, auf
Android-Geräten mit wenig freiem Arbeitsspeicher.
**Bezug:** [Issue #5](https://github.com/krabe-lol/lagerist/issues/5)
**Status:** Ursache identifiziert, noch nicht behoben.

### Symptom

Auf dem Handy auf "Foto aufnehmen" oder "Aus Galerie wählen" tippen, im
Kamera-/Galerie-Dialog ein Bild auswählen bzw. aufnehmen, zurück zur
Lagerist-Seite — und nichts passiert. Kein Fehler, kein Ladeindikator, kein
Foto erscheint. Am Server kommt nie eine Upload-Anfrage an.

### Ursache

`<input type="file">` (mit oder ohne `capture`) startet auf Android immer
eine **externe** App (Kamera-App bzw. Foto-/Dateiauswahl). Während diese App
im Vordergrund läuft, wird der Browser-Tab in den Hintergrund geschickt.
Android darf dann bei Speicherdruck den Chrome-Tab-Prozess komplett beenden,
um RAM freizugeben — ein normaler, dokumentierter Teil des
Android-Speichermanagements, kein App-Bug.

Kommt der Nutzer danach zur Lagerist-Seite zurück, lädt Chrome die Seite
komplett neu (kompletter Reload, gesamter React-Zustand geht verloren). Das
Ergebnis der externen App (das aufgenommene/gewählte Foto) sollte eigentlich
über ein Callback an genau die Browser-Seite zurückgeliefert werden, die die
Auswahl gestartet hat — die existiert zu diesem Zeitpunkt aber nicht mehr.
Das Foto geht dabei ersatzlos verloren, ohne dass Chrome, Android oder unser
Code das irgendwo als Fehler meldet.

Das betrifft grundsätzlich sowohl den Kamera- als auch den Galerie-Weg,
da beide eine externe App starten; bei sehr speicherschwachen Geräten reicht
offenbar schon der kurze Wechsel zur Galerie-App, damit der Tab-Prozess
beendet wird.

Belege für das allgemeine Phänomen (nicht Lagerist-spezifisch):

- [Mozilla Bugzilla #868937 — "Taking a camera picture causes page reload because of lack of RAM"](https://bugzilla.mozilla.org/show_bug.cgi?id=868937)
- [Android 14 & 15 File Inputs: Why the Camera Option is Missing in Chrome and How to Fix It](https://blog.addpipe.com/html-file-input-accept-video-camera-option-is-missing-android-14-15/)

### Was schon ausprobiert/ausgeschlossen wurde

Auf dem Weg zu dieser Diagnose wurden mehrere andere Ursachen vermutet und
per Fix ausgeschlossen (alle im Branch `5-foto-upload-ohne-kamerazugriff`):

1. `capture="environment"` fehlte ursprünglich → ergänzt, öffnet die Kamera
   jetzt korrekt.
2. Zwei-Schritt-Flow (Datei wählen, dann separat auf "Hochladen" tippen) las
   die Datei über eine Ref erst beim späteren Klick aus → umgestellt auf
   sofortigen Upload direkt im `onChange`.
3. `display:none` (Tailwind `hidden`) auf dem versteckten `<input
   type="file">` verhinderte auf diesem Gerät das Öffnen des Datei-Dialogs
   über das umschließende `<label>` → auf `sr-only` (nicht `display:none`)
   umgestellt.
4. Upload lief über `fetch()` mit der in JS gehaltenen `File`-Referenz →
   umgestellt auf ein natives `<form encType="multipart/form-data">`, das
   der Browser selbst serialisiert (robuster als ein JS-Verweis über die
   App-Wechsel-Grenze hinweg).

Jede dieser Änderungen war für sich genommen eine echte Verbesserung (Punkt 1
löste das ursprüngliche Issue "keine Kamera-Option", Punkt 3 behob einen
zusätzlichen, unabhängigen Bug), keine davon behebt aber das hier
beschriebene Grundproblem — das liegt oberhalb unseres Codes, im
Android-Prozess-Lifecycle.

### Mögliche echte Lösung (noch nicht umgesetzt)

Eine In-Page-Kamera bauen: Foto direkt auf der Lagerist-Seite per
`getUserMedia()` + `<video>`-Vorschau + Canvas-Snapshot aufnehmen, ganz ohne
externe App. Der Browser-Tab bleibt dabei durchgehend im Vordergrund, das
Problem tritt strukturell nicht mehr auf. Das ist ein eigenständiges,
größeres Feature (Kamera-Berechtigung, Vorschau-UI, Aufnehmen/Wiederholen,
Canvas→Blob-Konvertierung) und wurde bewusst noch nicht begonnen.

### Workaround für Nutzer

Kein zuverlässiger Workaround bekannt. Andere im Hintergrund laufende Apps
schließen, um Speicher freizugeben, kann die Erfolgschance erhöhen; ein
erneuter Versuch klappt manchmal, wenn das Gerät gerade nicht unter
Speicherdruck steht.

### Debug-Hilfsmittel im Branch

`UploadAttachmentForm.tsx` zeigt aktuell testweise eine sichtbare
"Debug:"-Zeile unter den Upload-Buttons (Klick erkannt? Datei erkannt?
Formular abgeschickt?), die zur Diagnose dieses Problems eingebaut wurde.
Vor dem Mergen entweder entfernen oder — falls die In-Page-Kamera-Lösung
angegangen wird — im Rahmen dieses Umbaus mit aufräumen.
