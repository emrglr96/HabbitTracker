# Ceyda'nın Planı

Alışkanlıklar, görevler, 14 günlük ev işleri döngüsü ve takvim için telefona uygun, sade bir web uygulaması.

- **Bugün:** tek ekranda günün görevleri, alışkanlıkları, yarın ve sonraki günler. Görev satırı sola kaydırılınca bir gün ertelenir, sağa kaydırılınca bugüne alınır. "Düzenle" ile bütün alışkanlıklar ve 14 günlük plan yönetilir
- **14 günlük plan:** Gün 1'den Gün 14'e ev işleri döngüsü, sürekli tekrar eder. Her günün işleri o günün görevi olarak listeye düşer. Aylık işler iki döngüde bir gelir
- **Takvim:** ay görünümü. Özel günler (istenirse her yıl tekrar eden) ve ek planlar eklenir; seçilen günün görevleri ve alışkanlıkları görünür
- **Analiz:** haftalık ve aylık tamamlama, takvim ısı haritası, alışkanlık karnesi
- **Ayarlar:** ad, tema, gün sayacı, yedekleme

Ceyda'nın planı (ev işleri döngüsü, günlük alışkanlıklar, kişisel rutin) `app.js` içindeki `PRESET` listesinde durur. Sürüm numarası artınca yeni eklenenler telefona bir kez yüklenir. Döngünün 1. günü `PRESET.start` ile belirlenir ve uygulamadan değiştirilebilir.

Derleme adımı yok; düz HTML, CSS ve JavaScript. Veriler yalnızca cihazdaki tarayıcı depolamasında tutulur.

## Yerelde çalıştırma

```
python3 -m http.server 4173
```

Ardından `http://localhost:4173` adresini aç.
