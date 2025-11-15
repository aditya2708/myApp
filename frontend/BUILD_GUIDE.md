# Panduan Build Aplikasi React Native

## Overview
Project ini sudah dikonfigurasi untuk mendukung build APK dan AAB (Android App Bundle) untuk kebutuhan development dan production.

## Build Commands

### 1. Preview Builds (Untuk Testing)

#### Build APK
```bash
npm run build:preview:apk
# atau
npx eas build -p android --profile preview-apk
```

#### Build AAB ( untuk Play Store)
```bash
npm run build:preview:aab
# atau
npx eas build -p android --profile preview-aab
```

### 2. Production Builds

#### Build APK
```bash
npm run build:production:apk
# atau
npx eas build -p android --profile production
```

#### Build AAB (untuk Play Store)
```bash
npm run build:production:aab
# atau
npx eas build -p android --profile production-aab
```

### 3. Development Builds

#### Build Development APK
```bash
npm run build:dev
# atau
npx eas build -p android --profile dev-standalone
```

## Perbedaan APK vs AAB

### APK (Android Package Kit)
- Format tradisional untuk distribusi Android
- Bisa diinstall langsung di device
- Ukuran file lebih besar
- Tidak optimal untuk Play Store

### AAB (Android App Bundle)
- Format modern untuk Play Store
- Ukuran file lebih kecil
- Google Play akan menghasilkan APK yang dioptimasi per device
- Wajib untuk upload ke Play Store
- Tidak bisa diinstall langsung (perlu melalui Play Store atau conversion tool)

## Rekomendasi

1. **Development & Internal Testing**: Gunakan `preview-apk`
2. **Play Store Upload**: Gunakan `production-aab`
3. **Production APK untuk distribusi manual**: Gunakan `production-apk`

## Konfigurasi EAS Profiles

### Preview Profiles
- `preview-apk`: Build APK untuk internal testing
- `preview-aab`: Build AAB untuk testing Play Store

### Production Profiles  
- `production`: Build APK untuk production
- `production-aab`: Build AAB untuk Play Store submission

## Catatan

- Semua build menggunakan `autoIncrement: true` untuk production builds
- Build profiles sudah dikonfigurasi dengan distribusi yang tepat
- AAB builds menggunakan `buildType: "app-bundle"` (bukan "aab") untuk EAS compliance
- AAB builds siap untuk submission ke Google Play Console

## Troubleshooting

Jika mengalami masalah saat build:
1. Pastikan EAS CLI sudah terinstall: `npm install -g eas-cli`
2. Login ke EAS: `eas login`
3. Cek konfigurasi project: `eas project:info`
4. Pastikan signing keys sudah dikonfigurasi untuk production builds
5. Pastikan menggunakan `buildType: "app-bundle"` untuk AAB builds (bukan "aab")
