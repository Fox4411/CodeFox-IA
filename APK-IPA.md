# CodeFox → APK (Android) y IPA (iOS)

Tu app web ya está en: https://code-fox-ia.vercel.app

La forma más estable (con login + IA) es empaquetarla con **Capacitor**
cargando esa URL dentro de una app nativa.

## Requisitos

### Android (APK)
- Node.js
- Android Studio: https://developer.android.com/studio
- JDK 17+

### iOS (IPA) — solo Mac
- Mac con Xcode
- Cuenta Apple (gratis para probar en tu iPhone; pago para App Store)

---

## 1) Preparar el proyecto

En la carpeta del proyecto:

```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init CodeFox com.codefox.app --web-dir out
```

Si ya existe `capacitor.config.ts`, no hace falta recrearlo.
Revisa que tenga:

```ts
server: {
  url: 'https://code-fox-ia.vercel.app',
  cleartext: false,
}
```

---

## 2) Android APK

```bash
npx cap add android
npx cap sync
npx cap open android
```

En Android Studio:
1. Espera que Gradle termine
2. Menú **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Cuando termine, **locate** el APK
4. Copia el `.apk` a tu teléfono e instálalo

Para probar en emulador o móvil conectado:
- botón verde **Run**

---

## 3) iOS IPA (después, en Mac)

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

En Xcode:
1. Elige tu equipo en Signing
2. Conecta iPhone o usa simulador
3. Run
4. Para IPA de distribución: Product → Archive

---

## Notas importantes

- La app nativa abre tu web de Vercel. Si actualizas la web, la app se actualiza sola (sin nuevo APK), salvo cambios nativos.
- Login y IA usan las mismas variables de Vercel.
- En móvil usa la barra inferior: Archivos / Código / CodeFox.

## Alternativa sin Android Studio

Puedes usar https://www.pwabuilder.com con la URL
https://code-fox-ia.vercel.app
para generar un paquete Android (TWA). Es más simple, menos control.
