import { Fragment, type CSSProperties, type ReactNode } from "react";
import { richBackgroundColors, richTextColors, type RichBlock, type RichInline, type RichProps, type RichStyles } from "@/lib/rich-text";
import styles from "./RichArticleContent.module.css";

function textStyle(props: RichProps | RichStyles): CSSProperties {
  return { color: richTextColors[props.textColor ?? ""], backgroundColor: richBackgroundColors[props.backgroundColor ?? ""], ...("textAlignment" in props ? { textAlign: props.textAlignment } : {}) };
}
function safeLink(href: string) {
  if (/^\/(?!\/)[^\\\s\u0000-\u001f]*$/.test(href)) return href;
  try { const url = new URL(href); if (url.protocol === "https:" && !url.username && !url.password) return url.href; } catch { /* Render invalid links as plain text in the unsaved preview. */ }
  return undefined;
}
function Inline({ content }: { content: RichInline[] }) {
  return content.map((item, i) => {
    if (item.type === "link") {
      const href = safeLink(item.href);
      return href ? <a href={href} key={i} rel="noopener noreferrer"><Inline content={item.content} /></a> : <Inline key={i} content={item.content} />;
    }
    let value: ReactNode = item.text;
    if (item.styles.code) value = <code>{value}</code>;
    if (item.styles.bold) value = <strong>{value}</strong>;
    if (item.styles.italic) value = <em>{value}</em>;
    if (item.styles.underline) value = <u>{value}</u>;
    if (item.styles.strike) value = <s>{value}</s>;
    return <span key={i} style={textStyle(item.styles)}>{value}</span>;
  });
}

function Blocks({ blocks }: { blocks: RichBlock[] }) {
  const result: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const inline = <Inline content={Array.isArray(block.content) ? block.content : []} />;
    const css = textStyle(block.props);
    let element: ReactNode;
    if (["bulletListItem", "numberedListItem", "checkListItem"].includes(block.type)) {
      const items = [block];
      while (blocks[i + 1]?.type === block.type && !(block.type === "numberedListItem" && blocks[i + 1].props.start !== undefined)) items.push(blocks[++i]);
      const children = items.map((item) => <li key={item.id} style={textStyle(item.props)}>
        {item.type === "checkListItem" ? <span aria-label={item.props.checked ? "Выполнено" : "Не выполнено"} className={styles.check}>{item.props.checked ? "☑" : "☐"}</span> : null}
        <Inline content={Array.isArray(item.content) ? item.content : []} />
        {item.children.length ? <Blocks blocks={item.children} /> : null}
      </li>);
      result.push(block.type === "numberedListItem" ? <ol key={block.id} start={block.props.start}>{children}</ol> : <ul className={block.type === "checkListItem" ? styles.checklist : undefined} key={block.id}>{children}</ul>);
      continue;
    }
    switch (block.type) {
      case "heading": element = block.props.level === 3 ? <h3 style={css}>{inline}</h3> : <h2 style={css}>{inline}</h2>; break;
      case "quote": element = <blockquote style={css}>{inline}</blockquote>; break;
      case "divider": element = <hr />; break;
      case "image": element = block.props.url ? <figure style={{ ...css, maxWidth: block.props.previewWidth, marginLeft: block.props.textAlignment === "right" ? "auto" : undefined, marginRight: block.props.textAlignment === "left" ? "auto" : undefined }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.props.url} alt={block.props.caption || block.props.name || "Иллюстрация к статье"} loading="lazy" />
        {block.props.caption ? <figcaption>{block.props.caption}</figcaption> : null}
      </figure> : null; break;
      case "table": {
        const table = !Array.isArray(block.content) ? block.content : undefined;
        element = table ? <div className={styles.tableScroll} role="region" aria-label="Таблица в статье" tabIndex={0}><table style={css}>
          <colgroup>{table.columnWidths.map((width, index) => <col key={index} style={width ? { width } : undefined} />)}</colgroup>
          <tbody>{table.rows.map((row, r) => <tr key={r}>{row.cells.map((cell, c) => {
            const Tag = r < (table.headerRows ?? 0) || c < (table.headerCols ?? 0) ? "th" : "td";
            return <Tag key={c} scope={Tag === "th" ? r < (table.headerRows ?? 0) ? "col" : "row" : undefined} style={textStyle(cell.props)}><Inline content={cell.content} /></Tag>;
          })}</tr>)}</tbody>
        </table></div> : null;
        break;
      }
      default: element = <p style={css}>{Array.isArray(block.content) && block.content.length ? inline : <br />}</p>;
    }
    result.push(<Fragment key={block.id}>{element}{block.children.length ? <div className={styles.nested}><Blocks blocks={block.children} /></div> : null}</Fragment>);
  }
  return result;
}

/** Lightweight React renderer: visitors never download the editing package. */
export function RichArticleContent({ blocks }: { blocks: RichBlock[] }) {
  return <div className={styles.richContent}><Blocks blocks={blocks} /></div>;
}
