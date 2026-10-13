import { meatCutRegions, type MeatCutRegion } from "@/lib/meat-cuts";

export const MEAT_CATALOG_ARTWORK_VIEWBOX = { width: 1681, height: 936 } as const;

export type CatalogMeatCutRegion = MeatCutRegion & {
  path: string;
  label: { x: number; y: number; lines: string[]; rotate?: number; fontSize?: number };
  legacyCutIds?: string[];
};

function cut(id: string, titleRu: string, path: string, label: CatalogMeatCutRegion["label"], legacyCutIds?: string[]): CatalogMeatCutRegion {
  const previous = meatCutRegions.find(region => region.id === id);
  return { id, titleRu, titleEn: previous?.titleEn ?? "", description: previous?.description ?? "",
    points: "", enabled: true, path, label, legacyCutIds };
}

// Shared edges follow the clean bull's anatomy. IDs already used by products
// stay stable; the three round cuts also recognise links to the older round zone.
export const meatCatalogArtworkRegions: CatalogMeatCutRegion[] = [
  cut("sheya", "Шея",
    "M 510 162 C 574 139 639 166 700 196 C 685 301 630 422 525 522 L 490 477 C 516 389 537 261 510 162 Z",
    { x: 575, y: 326, lines: ["Шея"], rotate: -66 }),
  cut("lopatka", "Лопатка",
    "M 700 196 L 800 225 C 825 324 835 430 822 510 C 726 520 626 545 559 582 L 525 522 C 630 422 685 301 700 196 Z",
    { x: 716, y: 416, lines: ["Лопатка"] }),
  cut("tolstyj-kraj", "Толстый край",
    "M 800 225 C 845 235 887 242 930 248 C 949 305 963 366 966 423 L 970 500 L 822 510 C 835 430 825 324 800 225 Z",
    { x: 890, y: 357, lines: ["Толстый", "край"] }),
  cut("tonkij-kraj", "Тонкий край",
    "M 930 248 C 978 254 1028 260 1075 260 C 1093 302 1108 350 1114 400 C 1064 402 1014 410 966 423 C 963 366 949 305 930 248 Z",
    { x: 1023, y: 345, lines: ["Тонкий", "край"] }),
  cut("kostrec", "Кострец",
    "M 1075 260 C 1123 260 1173 246 1225 240 C 1274 278 1305 333 1310 414 C 1246 402 1180 397 1114 400 C 1108 350 1093 302 1075 260 Z",
    { x: 1190, y: 337, lines: ["Кострец"] }),
  cut("podbederok", "Подбедерок",
    "M 1225 240 C 1280 231 1321 217 1368 230 C 1455 239 1507 288 1516 362 C 1408 343 1305 303 1225 240 Z",
    { x: 1390, y: 284, lines: ["Подбедерок"], rotate: 25, fontSize: 25 }, ["myakot-bedra"]),
  cut("oguzok", "Огузок",
    "M 1225 240 C 1305 303 1408 343 1516 362 C 1525 391 1528 420 1527 448 C 1448 452 1376 478 1318 530 C 1327 491 1320 453 1310 414 C 1305 333 1274 278 1225 240 Z",
    { x: 1432, y: 407, lines: ["Огузок"] }, ["myakot-bedra"]),
  cut("vyrezka", "Вырезка",
    "M 966 423 C 1014 410 1064 402 1114 400 C 1180 397 1246 402 1310 414 C 1320 453 1327 491 1318 530 C 1249 513 1200 503 1150 502 L 970 500 Z",
    { x: 1161, y: 453, lines: ["Вырезка"], fontSize: 25 }),
  cut("grudinka", "Грудинка",
    "M 559 582 C 602 558 646 545 695 534 C 708 595 698 638 700 677 C 645 680 591 633 559 582 Z",
    { x: 629, y: 610, lines: ["Грудинка"], rotate: 20, fontSize: 25 }),
  cut("golyashka-pered", "Передняя голяшка",
    "M 695 534 C 737 522 780 515 822 510 C 825 582 803 651 773 702 C 748 739 704 740 700 677 C 698 638 708 595 695 534 Z",
    { x: 758, y: 617, lines: ["Передняя", "голяшка"], rotate: -73, fontSize: 25 }),
  cut("pokromka", "Рёберный",
    "M 822 510 L 970 500 L 1150 502 C 1156 545 1152 583 1141 623 C 1090 649 1054 671 1010 651 C 925 630 854 604 773 702 C 803 651 825 582 822 510 Z",
    { x: 980, y: 574, lines: ["Рёберный"] }),
  cut("pashina", "Пашина",
    "M 1150 502 C 1200 503 1249 513 1318 530 L 1301 603 C 1249 553 1195 590 1141 623 C 1152 583 1156 545 1150 502 Z",
    { x: 1232, y: 550, lines: ["Пашина"], fontSize: 25 }),
  cut("okovalok", "Оковалок",
    "M 1318 530 C 1376 478 1448 452 1527 448 C 1527 501 1515 552 1482 601 C 1439 626 1369 633 1301 603 Z",
    { x: 1429, y: 548, lines: ["Оковалок"] }, ["myakot-bedra"]),
  cut("golyashka-zad", "Задняя голяшка",
    "M 1301 603 C 1369 633 1439 626 1482 601 C 1482 625 1500 648 1506 674 C 1514 692 1504 711 1500 738 C 1498 783 1501 818 1509 845 C 1485 856 1462 855 1445 844 C 1454 818 1448 781 1445 760 C 1438 720 1414 681 1398 669 C 1377 653 1367 629 1356 617 C 1343 607 1324 603 1301 603 Z",
    { x: 1468, y: 744, lines: ["Задняя", "голяшка"], rotate: 78, fontSize: 22 }),
];

export function findCatalogMeatCut(id?: string | null): MeatCutRegion | undefined {
  return meatCatalogArtworkRegions.find(region => region.id === id)
    ?? meatCutRegions.find(region => region.id === id && region.enabled !== false);
}
