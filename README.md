# Pro Kalkulator Ultra

Norsk kalkulator med vitenskapelig modus, RPN, tape, prosent og MVA, valuta med
offisielle kurser fra Norges Bank, og enhetskonvertering. Den kjører som PWA i
nettleseren og som Android-app (APK) bygget med Capacitor.

## Struktur

```
public/            appen: index.html, style.css, app.js, fonts/, icons/, sw.js, manifest
resources/         kildene til Androids adaptive ikonlag (SVG)
scripts/icons.mjs  lager alle PNG-ikoner fra SVG-kildene
scripts/build-web.mjs  lager Android-kopien i www/: uten testpakken, minimert
android/           Capacitor-prosjektet for Android
```

Skriften er Schibsted Grotesk (SIL OFL 1.1, lisens i `public/fonts/`), med Inter
som reserve for matematiske tegn som √ og π. Begge ligger i appen og virker uten nett.

Ikonene tegnes bare i SVG (`public/icons/*.svg` og `resources/*.svg`).
`npm run icons` lager favicon, PWA-ikoner (any, maskable, monochrome),
iOS-ikon, og adaptive Android-ikoner med monokromt lag og splash.

## Nettversjonen

```sh
npm run serve        # http://localhost:8080
```

Testene ligger i appen: Innstillinger → «Kjør testene».

## Android-appen

Krever Node 20+, JDK 21 og Android SDK 35 (`ANDROID_HOME` satt).

```sh
npm install
npm run android:sync   # ikoner, www/ fra public/ (uten tester, minimert), kopier inn i android/
npm run android:apk    # signert app-release.apk hvis nøkkelen er satt opp
```

APK-en havner i `android/app/build/outputs/apk/release/app-release.apk`.

### Signering

Release-bygget signeres med nøkkelen i `android/keystore.properties`, som aldri
committes:

```properties
storeFile=/full/sti/til/kalkulator-release.jks
storePassword=...
keyAlias=kalkulator
keyPassword=...
```

Ta vare på `.jks`-filen og passordet. Android godtar bare oppdateringer som er
signert med den samme nøkkelen, så uten den må appen avinstalleres før en ny
versjon kan legges inn.

### Installere på telefonen

1. Overfør APK-en til telefonen.
2. Åpne den og tillat installasjon fra denne kilden når Android spør.
3. Appen heter «Kalkulator» og får det adaptive ikonet, også som tema-ikon på
   Android 13+.

Appen er pakket med alle filene og virker uten nett. Bare valutakursene hentes
fra Norges Bank (og open.er-api.com som utfylling) når det er nett. Ellers brukes
sist lagrede kurser.
