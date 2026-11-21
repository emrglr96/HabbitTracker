# Ceyda'nın Planı

Alışkanlıklar, görevler, 14 günde bir tekrar eden ev işleri rutini ve takvim için telefona uygun, sade bir web uygulaması.

- **Bugün:** tek ekranda günün görevleri, alışkanlıkları, yarın ve sonraki günler. Görev satırı sola kaydırılınca bir gün ertelenir, sağa kaydırılınca bugüne alınır. "Düzenle" ile bütün alışkanlıklar ve ev işleri rutini yönetilir
- **Ev işleri rutini:** 14 gün sürer, bitince baştan başlar. Her günün işleri o günün görevi olarak listeye düşer; bazı işler ayda bir gelir. İşin türü renkle ayırt edilir
- **Takvim:** ay görünümü. Özel günler (istenirse her yıl tekrar eden) ve ek planlar eklenir; seçilen günün görevleri ve alışkanlıkları görünür
- **Analiz:** haftalık ve aylık tamamlama, takvim ısı haritası, alışkanlık karnesi
- **Sayaçlar:** bir tarihten bugüne kaçıncı gün olduğunu sayan sayaç ve bir alışkanlığa bağlı, her işarette bir artan sayaç (örneğin Duolingo serisi)
- **Geriye dönük işaretleme:** üstteki son 7 gün şeridinden ya da takvimden geçmiş bir gün seçilip unutulan alışkanlık ve görevler o güne işaretlenir
- **Ayarlar:** ad, tema, gün sayacı, yedekleme

Ceyda'nın planı (ev işleri rutini, günlük alışkanlıklar, kişisel rutin) `app.js` içindeki `PRESET` listesinde durur. Sürüm numarası artınca yeni eklenenler telefona bir kez yüklenir. Rutinin ilk günü `PRESET.start` ile belirlenir ve uygulamadan değiştirilebilir.

Derleme adımı yok; düz HTML, CSS ve JavaScript. Veriler yalnızca cihazdaki tarayıcı depolamasında tutulur.

## Yerelde çalıştırma

```
python3 -m http.server 4173
```

Ardından `http://localhost:4173` adresini aç.
