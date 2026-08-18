import { useIsDark } from "@/lib/themeStore";
import { textSecondary } from "@/lib/themeClasses";

interface NoteRendererProps {
  content: string;
}

export function NoteRenderer({ content }: NoteRendererProps) {
  const isDark = useIsDark();
  const textColor = isDark ? "#C8C0B4" : "#4A3C2C";

  /* Si le contenu est du texte brut (pas de balise HTML), on l'affiche tel quel. */
  const isHtml = content.trimStart().startsWith("<");

  if (!isHtml) {
    return (
      <p style={{ fontSize: 15, lineHeight: "26px", color: textColor, margin: 0, whiteSpace: "pre-wrap" }}>
        {content}
      </p>
    );
  }

  return (
    <>
      <div
        className="pastek-note-render"
        dangerouslySetInnerHTML={{ __html: content }}
        style={{ fontSize: 15, color: textColor }}
      />
      <style>{`
        .pastek-note-render p { margin: 0 0 4px 0; line-height: 26px; }
        .pastek-note-render p:last-child { margin-bottom: 0; }
        .pastek-note-render ul { list-style: disc; padding-left: 22px; margin: 0 0 4px 0; }
        .pastek-note-render ol { list-style: decimal; padding-left: 22px; margin: 0 0 4px 0; }
        .pastek-note-render li { margin-bottom: 2px; line-height: 24px; }
        .pastek-note-render strong { font-weight: 700; }
        .pastek-note-render em { font-style: italic; }
        .pastek-note-render u { text-decoration: underline; }
      `}</style>
    </>
  );
}
