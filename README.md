# coolBase

One Next.js codebase, three targets. All PDF work happens on the device (pdf-lib + pdf.js), so nothing is uploaded.

## Setup
```bash
npm install
npm run dev          # website at http://localhost:3000
```

## Website
`npm run build` produces a static site in `out/`. Deploy it to Vercel, Netlify, Cloudflare Pages or any static host.

## Android (Capacitor)
Requires Android Studio.
```bash
npx cap add android      # first time only
npm run android:sync     # build + copy into the Android project
npm run android:open     # opens Android Studio, then Run / Build APK
```
Downloads: Capacitor's WebView does not save blob downloads by default. Before shipping, add
`@capacitor/filesystem` + `@capacitor/share` and branch inside `download()` in `lib/pdf.js` when
`Capacitor.isNativePlatform()` is true.

## Windows (Electron)
```bash
npm run win:dev      # build + launch in a desktop window
npm run win:build    # installer in dist/ (.exe, via electron-builder)
```

## Tools
Merge, Split, Organize, Compress, JPG to PDF, PDF to JPG, Page Numbers, Watermark, Edit (text and signature), Protect, Unlock.

## Known limits
- Compress and Unlock re-render pages as images: smaller or unlocked, but text is no longer selectable.
- Protect depends on `@pdfsmaller/pdf-encrypt`; verify the output opens with a password in Adobe Reader.
- Word/Excel/PowerPoint conversion and OCR are not possible fully client-side; they need a backend (LibreOffice, Tesseract).

## Logo
Place your logo image in these spots (it is the same picture, different sizes):
- `public/logo.jpg` - website header and favicon (any size, square works best)
- `build/icon.png` - Windows app icon (PNG, at least 256x256)
- `assets/icon-only.png` - Android launcher icon (PNG, 1024x1024), then run `npm run icons` and `npm run android:sync`

## Deploy the website on GitHub Pages
1. Create a GitHub repo (e.g. `coolbase`) and push this folder to the `main` branch.
2. Repo Settings > Pages > Source: **GitHub Actions**.
3. Push again (or run the workflow from the Actions tab). The site goes live at `https://<username>.github.io/coolbase/`.
For a user site (`<username>.github.io` repo) or a custom domain, set `NEXT_PUBLIC_BASE_PATH` to empty in `.github/workflows/deploy.yml`.

## Get the .exe and .apk from GitHub
Actions tab > "Build Windows and Android apps" > Run workflow. When it finishes, open the run and
download `coolbase-windows` (.exe) and `coolbase-android` (.apk) from the Artifacts section.
Or push a tag (`git tag v0.1.0 && git push --tags`) to publish both files on the repo's Releases page.
The APK is a debug build, installable on your own phone. Play Store needs a signed release build.
