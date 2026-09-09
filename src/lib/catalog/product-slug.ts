const transliteration: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya", і: "i", ў: "u", ї: "yi", є: "ye", ґ: "g",
};

export function createProductSlug(title: string, id: string) {
  const stem = Array.from(title.toLowerCase(), (letter) => transliteration[letter] ?? letter)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "") || "tovar";
  const suffix = id.replaceAll("-", "").toLowerCase().slice(0, 12);
  if (!/^[a-f0-9]{12}$/.test(suffix)) throw new Error("Invalid product ID");
  return `${stem}-${suffix}`;
}
