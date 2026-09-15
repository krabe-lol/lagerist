# Known Issues

## Foto-/Datei-Upload schlägt auf manchen Android-Geräten lautlos fehl

**Betrifft:** Foto-Upload (Kamera *und* Galerie) sowie Datei-Anhänge, auf
Android-Geräten mit wenig freiem Arbeitsspeicher.
**Bezug:** [Issue #5](https://github.com/krabe-lol/lagerist/issues/5)
**Status:** Offen. Ein In-Page-Kamera-Fix (`getUserMedia()` statt externer
App) wurde probeweise gebaut und hätte das Problem für den Kamera-Weg
strukturell gelöst, wurde aber wieder verworfen zugunsten eines einzigen
Upload-Buttons ohne `capture`-Attribut, der eigentlich den nativen
OS-Auswahldialog (Kamera/Dateien/Galerie) zeigen sollte. Auf einem echten
Android-Gerät zeigte sich aber: ohne `capture` öffnet der Browser dort nicht
zuverlässig diesen Chooser, sondern direkt die Galerie/Dateiauswahl — die
Kamera-Option war so praktisch nicht mehr erreichbar. Daher zurück auf zwei
getrennte Buttons ("Kamera" mit `capture="environment"`, "Dateien" ohne),
die die Wahl explizit vorab abfragen statt sich auf den (browser-/
geräteabhängigen) nativen Chooser zu verlassen. Das Grundproblem (externe
App reißt den Tab in den Hintergrund) bleibt für beide Wege bestehen, siehe
unten.

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
- [flutter_inappwebview #2313 — identisches Symptom (Kamera öffnet, Foto aufgenommen, "OK" getippt, Foto kommt nie am File-Input an) in einer anderen Android-WebView-Implementierung, geschlossen ohne dokumentierte Lösung](https://github.com/pichillilorenzo/flutter_inappwebview/issues/2313)

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

### Erwogene, aber verworfene Lösung: In-Page-Kamera (`getUserMedia()`)

Ein Foto direkt auf der Lagerist-Seite per `getUserMedia()` + `<video>`-
Vorschau + Canvas-Snapshot aufzunehmen (ganz ohne externe App) würde das
Problem für den Kamera-Weg strukturell lösen, da der Browser-Tab dabei
durchgehend im Vordergrund bliebe. Ein solcher Prototyp (`CameraCapture.tsx`)
wurde gebaut und lokal gegen eine simulierte Kamera verifiziert, dann aber
wieder entfernt — stattdessen wurde die UI auf einen einzelnen Upload-Button
vereinfacht, der den nativen OS-Auswahldialog (Kamera/Dateien/Galerie)
zeigt, näher an der gewünschten Bedienung.

Das bedeutet: Der native Auswahldialog startet für die Kamera-Option
weiterhin eine externe App, das Grundproblem bleibt also offen. Falls es in
der Praxis tatsächlich zu Datenverlust kommt, ist die In-Page-Kamera die
naheliegende strukturelle Lösung — sie deckt dann aber nur den Kamera-Pfad
ab, nicht die Dateiauswahl/Galerie, die immer eine externe App braucht.

Recherche dazu, inkl. eines Projekts, das dasselbe Problem hatte und exakt
so gelöst hat:

- [geir-eilertsen/rack #32](https://github.com/geir-eilertsen/rack/issues/32) — unabhängiges Projekt mit demselben Android-Problem, gelöst durch Ersetzen der externen Kamera-App durch `getUserMedia()` + `ImageCapture`
- [MDN: Taking still photos with getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos)
- [web.dev: Capturing an image from the user](https://web.dev/articles/media-capturing-images)

**Wichtige Einschränkung, falls das wieder aufgegriffen wird:**
`getUserMedia()` funktioniert nur in einem *secure context* — HTTPS oder
`localhost`. Das aktuelle Deployment (`stack.yml`) läuft über einfaches HTTP
ohne TLS-Terminierung; eine In-Page-Kamera bräuchte also zusätzlich einen
Reverse Proxy mit TLS-Zertifikat vor der App (z. B. Let's Encrypt).

### Workaround für Nutzer

Kein zuverlässiger Workaround bekannt; andere Hintergrund-Apps schließen, um
Speicher freizugeben, kann helfen.
