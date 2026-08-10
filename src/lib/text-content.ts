export type TextContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

export type TextPage = {
  tag: string;
  date: string;
  dateTime: string;
  title: string;
  description: string;
  image?: string;
  content: TextContentBlock[];
};
