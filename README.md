# Ceyda'nın Atölyesi

Alışkanlık, hobi ve görev takibi için telefona uygun, oyunlaştırılmış bir web uygulaması.

Fikir: her gün çömlekçi çarkında bir halka döner. Gün ne kadar doluysa halka o kadar geniş olur. Ay bitince ortaya üç boyutlu bir vazo çıkar; silüeti o ayın grafiğidir. Kaçan gün çatlak bırakır, geri dönünce altınla onarılır (kintsugi). Seri alevi fırının ateşidir.

- **Bugün:** çarkta dönen vazo, günün alışkanlıkları, sayaçlar ve görevler
- **Alışkanlık:** her gün, belirli günler ya da haftada N kez; alışkanlık ve hobi ayrımı
- **Görevler:** tarihli ya da tarihsiz yapılacaklar, büyüklüğüne göre XP
- **Analiz:** haftalık ve aylık tamamlama, takvim ısı haritası, alışkanlık karnesi
- **Atölye:** vazo, raf (geçmiş ayların vazoları), sır renkleri, unvanlar, rozetler, yedekleme

Derleme adımı yok; düz HTML, CSS ve JavaScript. Vazo `vase.js` içinde WebGL ile çizilir. Veriler yalnızca cihazdaki tarayıcı depolamasında tutulur.

## Yerelde çalıştırma

```
python3 -m http.server 4173
```

Ardından `http://localhost:4173` adresini aç.
