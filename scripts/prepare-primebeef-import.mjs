import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/imports/primebeef-2026-10-29');
const source = path.join(root, 'source.xlsx');
// This is the supplier-specific read/normalization step, not the admin's generic template importer.
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(source);
function sourceValue(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value.richText)) return value.richText.map(run => run.text).join('');
  // Read the saved result only; supplier formulas are never evaluated.
  if ('formula' in value || 'sharedFormula' in value) return value.result ?? null;
  throw new Error('Unsupported source cell value');
}
const sheets = ['ПраймФУДС', 'ПРАЙС ПРАЙМБИФ'].map(name => {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) throw new Error('Missing source worksheet: ' + name);
  return {name, values: Array.from({length:sheet.rowCount}, (_, index) => sheet.getRow(index+1).values.slice(1).map(sourceValue))};
});
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const warnings = [];
const brokenWords = ['филей-ной','держа-щихся','со-седствует','раз-личных','Распо-лагается','Ха-рактеристика','сладкова-тым','мра-морностью','во-локнами','яв-ляется','жи-вотного','премиаль-ной','ребрыш-ки','напри-мер','на-поминающий','волокна-ми','диа-фрагме','тазо-бедренного','пояс-ничным','основ-ные','огуз-ком','туше-ние','тазобедрен-ного','на-резке'];
function prose(value) {
  let text = String(value ?? '').replace(/\r/g, '').replace(/\u00a0/g, ' ')
    .replace(/([а-яё])-\s*\n\s*([а-яё])/gi, '$1$2');
  for (const word of brokenWords) text = text.replaceAll(word, word.replaceAll('-', ''));
  text = text.replace(/^(?:[• ]*)?(?:ТОЛСТЫЙ КРАЙ|ТОЛСТЫЙ|КРАЙ|ТОНКИЙ КРАЙ|ШЕЯ\/ЛОПАТКА|ПОКРОМКА!?|ПАШИНА|КОСТРЕЦ|ГРУДИНКА|РУДИНКА|ГОЛЯШКА|Мякоть БЕДРА|мякоть|БЕДРА):?\s*$/gmi, '')
    .replace(/ЧТО МЫ МОЖЕМ ПОЛУЧИТЬ ИЗ (?:ОТРУБА[^\n]*|РЕБЕР[^\n]*)/g, '\n\nПрименение:')
    .replace(/РЕКОМЕНДАЦИИ ПО ПРИГОТОВЛЕНИЮ:?/g, '\n\nРекомендации по приготовлению:')
    .replace(/\bиспользуите\b/g, 'используйте').replace(/подоидет/g, 'подойдёт')
    .replace(/Ддолгое/g, 'Долгое').replace(/подлопаточнойчасти/g, 'подлопаточной части')
    .replace(/верхнейчасти/g, 'верхней части').replace(/заднейчасти/g, 'задней части')
    .replace(/лопатки\.Отруб/g, 'лопатки. Отруб').replace(/шей-но/g, 'шейно')
    .replace(/Нью-Иорка/g, 'Нью-Йорка').replace(/TОP|ТОP|ТОР/g, 'TOP')
    .replace(/KNUKLE/g, 'KNUCKLE').replace(/САР МЕАТ/g, 'CAP MEAT').replace(/PLATE МЕАТ/g, 'PLATE MEAT');
  // These stray glyphs are OCR noise in front of otherwise legible ranges.
  for (const [from, to] of [['857-62','57-62'],['862-67','62-67'],['662-67','62-67'],['665-75','65-75'],['855-58','55-58'],['6110','110'],['155-58','55-58']]) text = text.replaceAll(from, to);
  text = text.replace(/([(&%¿•]|температур[аые]|внутренней|до)\s*[g&86%¿+]\s*(?=\d{2,3}-\d{2,3})/g, '$1 ')
    .replace(/\(\s*[g&86%¿]\s*(?=\d{2,3}-\d{2,3})/g, '(')
    .replace(/g\s*(?=\d{2,3}-\d{2,3})/g, '')
    .replace(/\) u medium/g, ') и medium')
    .replace(/[&]\s+(?=\d{2,3}-\d{2,3})/g, '')
    .replace(/°C O /g, '°C, ').replace(/°С У /g, '°С, ')
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n')
    .split(/\n\s*\n/).map(p => clean(p)).filter(Boolean).join('\n\n');
  return text.replace(/([а-яё])\n\n(?=[а-яё])/g, '$1 ');
}
function annotation(row, sku) {
  if (typeof row[7] !== 'string' || !row[7].trim()) return null;
  let description = row[7], cooking = row[8];
  description = description.replace(/с дру-\s*Важно/, 'с другой.\n\nВажно').replace(/груд-\s*РУДИНКА\s*ной/, 'грудной');
  if (sku === '66815') {
    description = description.replace(/Экстра Прайм \(Rib, Roast-Ready Prime,109D\)/g, 'Экстра Top Choice (Rib, Roast-Ready, 109D)')
      .replace(/Грейдинг Prime[^\n]*?во вкусе\./, 'Категория качества — Top Choice.');
    warnings.push({sku, field:'annotation', action:'Убрано ошибочное упоминание Prime в аннотации товара Top Choice.'});
  }
  if (sku === '66085') {
    description = description.replaceAll('TENDERLOIN DEFATTED', 'TENDERLOIN').replace(/Процент обрези ~3%-5% от массы отруба\./, '');
    warnings.push({sku, field:'annotation', action:'Для незачищенной вырезки убрано Defatted и процент обрези зачищенного варианта.'});
  }
  if (sku === '66162') {
    description = description.replace(/\n• Формат:[^\n]*/, '');
    warnings.push({sku, field:'annotation', action:'Убран вес 1,5–1,8 кг из аннотации: структурированная спецификация указывает 1,3 кг.'});
  }
  if (sku === '79925') {
    cooking = cooking.replace(/данногоFLAP BONELESS[^]*$/, 'данного отруба.');
    warnings.push({sku, field:'cooking', action:'Удалён приклеенный фрагмент описания соседнего отруба Бавет.'});
  }
  if (sku === '66043') description = description.replace(/Процент обрези ~\s*$/, '');
  if (sku === '66160') {
    description = 'FLAP BONELESS — нижняя часть костреца, стейк «Бавет» или внутренняя косая брюшная мышца. ' + description
      .replace(/^ПАШИНА\s*мышца\.\s*/, '').split('РЕКОМЕНДАЦИИ ПО ПРИГОТОВЛЕНИЮ:')[0];
    warnings.push({sku, field:'annotation', action:'Восстановлен порядок фрагментов аннотации; повтор приготовления удалён из описания.'});
    cooking = cooking.slice(cooking.indexOf('РЕКОМЕНДАЦИИ ПО ПРИГОТОВЛЕНИЮ:'));
  }
  const body = prose(description);
  let preparation = prose(cooking);
  if (preparation && !preparation.includes('Рекомендации по приготовлению:') && sku !== '66063') preparation = 'Рекомендации по приготовлению:\n' + preparation;
  return {description: [body, preparation].filter(Boolean).join('\n\n'), cookingText: preparation};
}

const families = [
  [/109D/i, 'Рибай на кости', 'large-cut'],
  [/174 Beef|Short Loin/i, 'Ти-бон на кости', 'large-cut'],
  [/Ribeye|Ribyey/i, 'Рибай', 'large-cut'],
  [/Strip\s*Loin/i, 'Стриплойн', 'large-cut'],
  [/Tenderloin/i, 'Вырезка', 'fillet'],
  [/Under Blade|Д[ЕЭ]НВЕР/i, 'Денвер', 'large-cut'],
  [/Chuck Eye Roll/i, 'Чак Ай Ролл', 'large-cut'],
  [/Top Blade/i, 'Топ Блейд', 'large-cut'],
  [/Shoulder Tender|Вырезка из лопатки/i, 'Вырезка из лопатки', 'fillet'],
  [/Chuck Tender/i, 'Передняя часть лопатки', 'large-cut'],
  [/Clod, 114E/i, 'Задняя часть лопатки', 'large-cut'],
  [/Vegas|Вегас/i, 'Стейк Вегас Стрип', 'steak'],
  [/Flanken/i, 'Рёбра Кальби, поперечная нарезка', 'large-cut'],
  [/130\b|Кальби/i, 'Рёбра Кальби', 'large-cut'],
  [/123A|Short Ribs, Trimmed/i, 'Рёбра Short Ribs', 'large-cut'],
  [/Back Ribs/i, 'Рёбра Back Ribs', 'large-cut'],
  [/Brisket|БРИСКЕТ/i, 'Брискет', 'large-cut'],
  [/Plate Meat/i, 'Грудинка для запекания', 'large-cut'],
  [/Cap Meat/i, 'Говядина для запекания', 'large-cut'],
  [/Hanging Tender/i, 'Стейк Мясника', 'steak'],
  [/Outside Skirt/i, 'Стейк Мачете', 'steak'],
  [/Inside Skirt/i, 'Стейк из диафрагмы', 'steak'],
  [/Flank|Флэнк/i, 'Стейк Флэнк', 'steak'],
  [/Spider|Паук/i, 'Стейк Паук', 'steak'],
  [/Flap Boneless|Bottom Sirloin|БАВЕТ/i, 'Бавет', 'large-cut'],
  [/Top Sirloin[,\s]+Cap/i, 'Пиканья', 'large-cut'],
  [/Top Sirloin Butt/i, 'Кострец', 'large-cut'],
  [/Eye of Round/i, 'Глазной мускул', 'large-cut'],
  [/Rump Roast|Side Roast/i, 'Наружная часть бедра для запекания', 'large-cut'],
  [/Shank|Голяшка/i, 'Голяшка', 'large-cut'],
  [/Knuckle|ОКОВАЛОК/i, 'Оковалок', 'large-cut'],
  [/168 Beef|Round Top|ОГУЗОК/i, 'Огузок', 'large-cut'],
  [/Tri-Tip|Трай-Тип/i, 'Трай-Тип', 'large-cut'],
  [/Фарш ЛАЙТ/i, 'Фарш Лайт 80/20', 'minced-meat'],
  [/Тримминг|Котлетное мясо/i, 'Тримминг', 'large-cut'],
];
const methods = text => [
  ['grill','Гриль',/грил|открытом огне/i], ['fry','Жарка',/обжар|жарк|прожарк|сковород/i],
  ['braise','Тушение',/тушен|томлен|томить|брейзинг/i], ['bake','Запекание',/запек|духов|ростбиф/i], ['boil','Варка',/варк|бульон|студн/i],
].filter(([, , pattern]) => pattern.test(text));
function weight(value) {
  if (value == null || value === '') return '';
  return clean(value).replace(/\s*кг\.?/gi, '').replace(/,$/, '').replaceAll('.', ',').replace(/\s*-\s*/g, '–');
}
const records = [];
for (const [sheetIndex, sheet] of sheets.slice(0,2).entries()) {
  let frozen = false;
  for (const [index, row] of sheet.values.entries()) {
    const originalTitle = clean(row[0]);
    if (/^Заморозка$/i.test(originalTitle)) frozen = true;
    if (!/^\d{5,}$/.test(String(row[1]))) continue;
    const sku = String(row[1]), brand = sheetIndex === 0 ? 'Праймфудс' : 'Primebeef';
    const family = families.find(([pattern]) => pattern.test(originalTitle));
    if (!family) throw new Error('Unmapped product ' + sku + ': ' + originalTitle);
    const [, name, productType] = family;
    const grade = originalTitle.match(/TOP CHOICE|CHOICE|PRIME|SELECT|БЕЗ ГРЕЙДИНГА/i)?.[0].toUpperCase() ?? '';
    const variants = [grade && grade !== 'БЕЗ ГРЕЙДИНГА' ? grade.replace('TOP CHOICE','Top Choice').replace('PRIME','Prime').replace('CHOICE','Choice').replace('SELECT','Select') : '', /Экстра/i.test(originalTitle) ? 'Экстра' : '', /SLIM/i.test(originalTitle) ? 'SLIM' + (/НС/i.test(originalTitle) ? '/НС' : '') : '', originalTitle.match(/\b[13]\/[24]\b/)?.[0] ?? '', sku === '66085' || sku === '62085' ? 'незачищенная' : '', /ТОМАГАВК/i.test(originalTitle) ? 'Томагавк' : ''];
    if (name === 'Тримминг') variants.unshift(originalTitle.match(/60\/40|70\/30|(?:60|70)%/)?.[0] ?? '');
    const condition = frozen ? 'Замороженное' : 'Охлаждённое';
    const ending = name.startsWith('Рёбра') ? 'ые' : /^(?:Вырезка|Передняя|Задняя|Грудинка|Говядина|Пиканья|Наружная|Голяшка)/.test(name) ? 'ая' : 'ый';
    const title = [name, ...variants.filter(Boolean)].join(' ') + ', ' + (frozen ? 'замороженн' : 'охлаждённ') + ending;
    let unitWeight = weight(row[sheetIndex === 0 ? 5 : 3]);
    let boxWeight = weight(row[sheetIndex === 0 ? 3 : 5]);
    let units = clean(row[4]);
    if (units && !/^[1-9]\d*$/.test(units)) {
      warnings.push({sku, field:'units', value:units, action:'Не перенесено нечисловое количество вложений.'});
      units = '';
    }
    if (sku === '65079') {
      warnings.push({sku, field:'weight', value:{unit:row[5],box:row[3],count:row[4]}, action:'Вес единицы и короба противоречит названию и количеству; оба веса оставлены пустыми до уточнения.'});
      unitWeight = ''; boxWeight = '';
    }
    if (sku === '60696') warnings.push({sku, field:'unitWeight', value:row[5], action:'Убрана лишняя запятая: «2,кг» → «2».'});
    const shelfLife = clean(row[sheetIndex === 0 ? 2 : 6]) + ' суток';
    const packaging = [unitWeight ? `Средний вес единицы: ${unitWeight} кг` : '', boxWeight ? `Короб: ${boxWeight} кг` : '', units ? `${units} шт. в коробе` : ''].filter(Boolean).join('; ') || 'Фасовка уточняется';
    const notes = sheetIndex === 1 ? annotation(row, sku) : null;
    const description = notes?.description ?? `${name}. ${frozen ? 'Замороженная' : 'Охлаждённая'} говядина ${brand}.${unitWeight ? ` Средний вес единицы — ${unitWeight} кг.` : ''}`;
    const cooking = methods(notes?.cookingText ?? '');
    const form = {
      category:'meat', title, brand, description, image:'', images:'', detailCategory:'Говядина',
      packagingDisplay:packaging, shelfLife, storage:`${frozen ? 'Замороженный' : 'Охлаждённый'} продукт. Температурный режим — согласно маркировке производителя.`,
      species:'beef', country:'unspecified', channel:'horeca', productType, packaging:'tray-or-box', cutIds:'',
      cooking:cooking.map(m=>m[0]).join(','), cookingMethods:cooking.map(m=>m[1]).join(','),
      meatCondition:condition, meatGrade:grade === 'БЕЗ ГРЕЙДИНГА' ? 'Без грейдинга' : grade,
      meatUnitWeight:unitWeight, meatBoxWeight:boxWeight, meatUnitsPerPack:units, meatArticle:sku,
      specs:`Канал поставки | HoReCa\nФасовка | ${unitWeight ? `В среднем ${unitWeight} кг` : 'Уточняется'}\nПродукт | ${frozen ? 'Замороженная' : 'Охлаждённая'} говядина`,
      buttonLabel:'Запросить поставку', buttonHref:'/#contacts',
    };
    if (form.title.length > 220 || form.description.length > 5000) throw new Error('Field too long: ' + sku);
    records.push({sku, brand, source:{sheet:sheet.name,row:index+1,title:originalTitle,annotation:Boolean(notes),prices: sheetIndex === 0 ? {withoutVat:row[6],withVat:row[7],unit:'руб./кг, как в источнике'} : typeof row[7] === 'number' ? {H:row[7],I:row[8],note:'Числа под заголовками аннотаций; назначение не подтверждено'} : null}, form});
  }
}
if (records.length !== 173 || new Set(records.map(r=>r.brand+':'+r.sku)).size !== 173) throw new Error('Unexpected product count');
await fs.mkdir(root,{recursive:true});
const bytes = await fs.readFile(source);
await fs.writeFile(root+'/source.xlsx',bytes);
await fs.writeFile(root+'/catalog.json',JSON.stringify({version:1,sourceFile:'source.xlsx',sourceSha256:createHash('sha256').update(bytes).digest('hex'),records,warnings},null,2)+'\n');
console.log(JSON.stringify({products:records.length,annotations:records.filter(r=>r.source.annotation).length,warnings,brands:[...new Set(records.map(r=>r.brand))]},null,2));
