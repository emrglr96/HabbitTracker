# Ceyda'nın Planı

Alışkanlık, hobi, görev ve iki haftalık rutin takibi için telefona uygun, sade bir web uygulaması.

- **Bugün:** günün alışkanlıkları, sayaçlar, bugünün ve yarının görevleri
- **Alışkanlık:** her gün, belirli günler ya da haftada N kez; alışkanlık ve hobi ayrımı, seri takibi
- **Görevler:** tarihli ya da tarihsiz yapılacaklar. Satırı sola kaydırınca bir gün ertelenir, sağa kaydırınca bugüne alınır
- **14 günlük plan:** Gün 1'den Gün 14'e ev işleri döngüsü, sürekli tekrar eder. Her günün işleri o günün görevi olarak listeye düşer. Aylık işler iki döngüde bir gelir
- **Gün sayacı:** bir başlangıç gününden bugüne kaçıncı gün olduğunu gösterir
- **Analiz:** haftalık ve aylık tamamlama, takvim ısı haritası, alışkanlık karnesi
- **Profil:** seviye ve XP, rozetler, tema, yedekleme

Ceyda'nın planı (ev işleri döngüsü, günlük alışkanlıklar, kişisel rutin) `app.js` içindeki `PRESET` listesinde durur. Sürüm numarası artınca yeni eklenenler telefona bir kez yüklenir. Döngünün 1. günü `PRESET.start` ile belirlenir ve uygulamadan değiştirilebilir.

Derleme adımı yok; düz HTML, CSS ve JavaScript. Veriler yalnızca cihazdaki tarayıcı depolamasında tutulur.

## Yerelde çalıştırma

```
python3 -m http.server 4173
```

Ardından `http://localhost:4173` adresini aç.
