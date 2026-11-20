# Ceyda'nın Planı

Alışkanlık, hobi, görev ve iki haftalık rutin takibi için telefona uygun, sade bir web uygulaması.

- **Bugün:** günün alışkanlıkları, sayaçlar, bugünün ve yarının görevleri
- **Alışkanlık:** her gün, belirli günler ya da haftada N kez; alışkanlık ve hobi ayrımı, seri takibi
- **Görevler:** tarihli ya da tarihsiz yapılacaklar. Satırı sola kaydırınca bir gün ertelenir, sağa kaydırınca bugüne alınır
- **2 haftalık rutin:** 1. hafta, 2. hafta ya da her hafta, seçilen günlerde tekrar eden işler. Her tekrar o günün görevi olarak listeye düşer
- **Analiz:** haftalık ve aylık tamamlama, takvim ısı haritası, alışkanlık karnesi
- **Profil:** seviye ve XP, rozetler, tema, yedekleme

Hazır rutinler `app.js` içindeki `PRESET` listesine yazılır; sürüm numarası artınca telefona bir kez yüklenir.

Derleme adımı yok; düz HTML, CSS ve JavaScript. Veriler yalnızca cihazdaki tarayıcı depolamasında tutulur.

## Yerelde çalıştırma

```
python3 -m http.server 4173
```

Ardından `http://localhost:4173` adresini aç.
