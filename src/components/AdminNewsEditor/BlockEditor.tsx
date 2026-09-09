"use client";

import { useEffect, useRef, useState } from "react";
import { BlockNoteSchema, createHeadingBlockSpec, defaultBlockSpecs, type PartialBlock } from "@blocknote/core";
import { ru } from "@blocknote/core/locales";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { uploadNewsImage } from "@/app/genlix-admin/(panel)/news/actions";
import type { RichBlock } from "@/lib/rich-text";
import adminStyles from "@/app/genlix-admin/admin.module.css";
import styles from "./AdminNewsEditor.module.css";

const schema = BlockNoteSchema.create({ blockSpecs: {
  paragraph: defaultBlockSpecs.paragraph,
  heading: createHeadingBlockSpec({ levels: [2, 3], defaultLevel: 2, allowToggleHeadings: false }),
  bulletListItem: defaultBlockSpecs.bulletListItem,
  numberedListItem: defaultBlockSpecs.numberedListItem,
  checkListItem: defaultBlockSpecs.checkListItem,
  quote: defaultBlockSpecs.quote,
  image: defaultBlockSpecs.image,
  table: defaultBlockSpecs.table,
  divider: defaultBlockSpecs.divider,
} });

export default function BlockEditor({ initialContent, disabled, onDocument, onUploadChange }: {
  initialContent: RichBlock[]; disabled: boolean;
  onDocument: (blocks: RichBlock[], changed: boolean) => void;
  onUploadChange: (change: number) => void;
}) {
  const callbacks = useRef({ onDocument, onUploadChange });
  useEffect(() => { callbacks.current = { onDocument, onUploadChange }; });
  const [error, setError] = useState("");
  const editor = useCreateBlockNote({
    schema, dictionary: ru,
    initialContent: initialContent.length ? initialContent as unknown as PartialBlock<typeof schema.blockSchema>[] : undefined,
    tables: { headers: true, splitCells: false, cellBackgroundColor: true, cellTextColor: true },
    domAttributes: { editor: { "aria-label": "Текст статьи", "aria-multiline": "true", role: "textbox" } },
    uploadFile: async (file) => {
      setError("");
      callbacks.current.onUploadChange(1);
      try {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Выберите фотографию в формате JPG, PNG или WebP.");
        if (file.size > 3 * 1024 * 1024) throw new Error("Фотография больше 3 МБ. Уменьшите размер файла.");
        const data = new FormData(); data.set("file", file);
        const result = await uploadNewsImage(data);
        if ("error" in result) throw new Error(result.error);
        return result.url;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось загрузить фото. Попробуйте ещё раз.";
        setError(message); throw new Error(message);
      } finally { callbacks.current.onUploadChange(-1); }
    },
  });
  // JSON removes undefined fields (e.g. optional image width); the server validates all persisted data.
  const read = () => JSON.parse(JSON.stringify(editor.document)) as RichBlock[];
  useEffect(() => { callbacks.current.onDocument(JSON.parse(JSON.stringify(editor.document)) as RichBlock[], false); }, [editor]);
  return <div className={styles.editor}>
    {error ? <p role="alert" className={adminStyles.alert}>{error}</p> : null}
    <BlockNoteView editor={editor} editable={!disabled} theme="light" onChange={() => callbacks.current.onDocument(read(), true)} />
  </div>;
}
