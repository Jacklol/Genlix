# Бык и интерактивные отрубы

Основа: изображение пользователя из сообщения 11 октября 2026 года. Разметка зон и подписи ориентируются на https://aleksandrov.by/catalog.

Инструмент: встроенный `image_gen`, режим редактирования, `transparent_background: true`.

Результат: `public/assets/catalog/meat/catalog-hero/bull-clean.png`, 1681 × 936, PNG с альфа-каналом. Границы, подписи и выбор отрубов добавлены в SVG отдельно от изображения. Исходный экспорт Figma сохранён в `bull.png`.

Точный запрос для генерации:

> Use case: precise-object-edit / background-extraction. Edit target: the attached tan bull illustration, for an interactive beef cuts diagram on a website. Remove ALL white anatomical dividing lines and ALL Russian labels/text from the bull; seamlessly reconstruct the natural fur under every removed mark. Remove the dark navy background completely and output genuine transparent alpha. Preserve this exact bull: same left-facing pose, same silhouette, head and long curved horns, body proportions, four legs, hooves, tail, photorealistic golden-brown fur, existing natural shadows and lighting. Do not invent another bull, change its shape, reposition limbs, add any objects or change the fur color. Keep the entire bull visible including all horns, hooves and tail, with a little clean transparent margin. Maintain the original wide landscape composition and relative placement; ideally the same approximately 1681 by 936 canvas proportions. The final image is a clean unlabelled photographic bull cutout. No lines, no labels, no letters, no symbols, no watermark, no diagram overlays, no ground, no cast shadow outside the animal.

Коды для поля «Отрубы» в админке и `cutIds` в Excel:

| Зона | Код |
| --- | --- |
| Шея | `sheya` |
| Лопатка | `lopatka` |
| Толстый край | `tolstyj-kraj` |
| Тонкий край | `tonkij-kraj` |
| Кострец | `kostrec` |
| Подбедерок | `podbederok` |
| Огузок | `oguzok` |
| Вырезка | `vyrezka` |
| Грудинка | `grudinka` |
| Передняя голяшка | `golyashka-pered` |
| Рёберный | `pokromka` |
| Пашина | `pashina` |
| Оковалок | `okovalok` |
| Задняя голяшка | `golyashka-zad` |

Прежний код `myakot-bedra` принимается в старых ссылках и выделяет все три зоны задней части. Он не подменяет новые отдельные коды и не переопределяет сохранённые товары.
