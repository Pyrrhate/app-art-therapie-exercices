/**
 * Éditeur WYSIWYG (web uniquement) — TipTap + aspect e-ink.
 */
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useIsDark } from "@/lib/themeStore";

interface EinkEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type MarkType = "bold" | "italic" | "underline";

const TOOLS: { mark: MarkType; label: string; title: string }[] = [
  { mark: "bold", label: "G", title: "Gras" },
  { mark: "italic", label: "I", title: "Italique" },
  { mark: "underline", label: "S", title: "Souligné" },
];

export function EinkEditor({
  value,
  onChangeText,
  placeholder = "Vos notes…",
  minHeight = 180,
}: EinkEditorProps) {
  const isDark = useIsDark();

  const paperBg = isDark ? "#1E1C18" : "#FAF6F0";
  const borderColor = isDark ? "#3A3630" : "#E0D6C8";
  const textColor = isDark ? "#DDD5C8" : "#3A3020";
  const toolbarBg = isDark ? "#252320" : "#F3EDE3";
  const toolbarBorder = isDark ? "#3A3630" : "#DDD3C3";
  const btnBg = isDark ? "#302C28" : "#EDE5D8";
  const btnText = isDark ? "#C8BEB0" : "#6A5C4C";
  const btnBorder = isDark ? "#4A4540" : "#D4C8B8";
  const placeholderColor = isDark ? "#6A6258" : "#B8A898";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate({ editor: ed }) {
      onChangeText(ed.getText());
    },
    editorProps: {
      attributes: {
        style: [
          `min-height:${minHeight}px`,
          `padding:14px 18px 14px 18px`,
          `font-size:15px`,
          `color:${textColor}`,
          `background:${paperBg}`,
          `outline:none`,
          `font-family:Georgia,serif`,
          `letter-spacing:0.2px`,
          `word-break:break-word`,
          `box-sizing:border-box`,
        ].join(";"),
        spellcheck: "true",
      },
    },
  });

  /* Sync value externe → éditeur (ex. reset après save) */
  useEffect(() => {
    if (!editor) return;
    const current = editor.getText();
    if (current !== value) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  function toggleMark(mark: MarkType) {
    if (!editor) return;
    if (mark === "bold") editor.chain().focus().toggleBold().run();
    else if (mark === "italic") editor.chain().focus().toggleItalic().run();
    else if (mark === "underline") editor.chain().focus().toggleUnderline().run();
  }

  function isActive(mark: MarkType): boolean {
    if (!editor) return false;
    return editor.isActive(mark);
  }

  const charCount = editor?.getText().length ?? 0;

  return (
    <div
      className="pastek-eink-editor"
      style={{
        borderRadius: 16,
        border: `1px solid ${borderColor}`,
        overflow: "hidden",
        backgroundColor: paperBg,
        boxShadow: isDark
          ? "inset 0 1px 3px rgba(0,0,0,0.4)"
          : "inset 0 1px 3px rgba(100,80,50,0.10), 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      {/* Barre d'outils */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          backgroundColor: toolbarBg,
          borderBottom: `1px solid ${toolbarBorder}`,
        }}
      >
        {TOOLS.map((tool) => (
          <button
            key={tool.mark}
            type="button"
            title={tool.title}
            onClick={() => toggleMark(tool.mark)}
            style={{
              borderRadius: 8,
              border: `1px solid ${btnBorder}`,
              backgroundColor: isActive(tool.mark) ? borderColor : btnBg,
              color: isActive(tool.mark) ? textColor : btnText,
              padding: "4px 10px",
              minWidth: 32,
              fontSize: 13,
              fontWeight: tool.mark === "bold" ? 700 : 400,
              fontStyle: tool.mark === "italic" ? "italic" : "normal",
              textDecoration: tool.mark === "underline" ? "underline" : "none",
              cursor: "pointer",
              lineHeight: 1.4,
              fontFamily: "Georgia, serif",
              transition: "background 0.1s",
            }}
          >
            {tool.label}
          </button>
        ))}
        {/* Séparateur */}
        <div
          style={{
            width: 1,
            height: 18,
            backgroundColor: btnBorder,
            margin: "0 4px",
          }}
        />
        {/* Listes */}
        {(
          [
            { cmd: "toggleBulletList", label: "•—", title: "Liste à puces" },
            { cmd: "toggleOrderedList", label: "1.", title: "Liste numérotée" },
          ] as const
        ).map((btn) => (
          <button
            key={btn.cmd}
            type="button"
            title={btn.title}
            onClick={() => {
              if (!editor) return;
              if (btn.cmd === "toggleBulletList")
                editor.chain().focus().toggleBulletList().run();
              else editor.chain().focus().toggleOrderedList().run();
            }}
            style={{
              borderRadius: 8,
              border: `1px solid ${btnBorder}`,
              backgroundColor: btnBg,
              color: btnText,
              padding: "4px 9px",
              fontSize: 12,
              cursor: "pointer",
              lineHeight: 1.4,
            }}
          >
            {btn.label}
          </button>
        ))}
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: placeholderColor,
            letterSpacing: 0.4,
          }}
        >
          {charCount > 0 ? `${charCount} car.` : ""}
        </span>
      </div>

      {/* Zone d'édition TipTap */}
      <EditorContent editor={editor} />

      <style>{`
        .pastek-eink-editor .ProseMirror {
          outline: none !important;
        }
        .pastek-eink-editor .ProseMirror p {
          margin: 0 0 6px 0 !important;
          line-height: 26px !important;
        }
        .pastek-eink-editor .ProseMirror p:last-child {
          margin-bottom: 0 !important;
        }
        .pastek-eink-editor .ProseMirror ul {
          list-style: disc !important;
          padding-left: 22px !important;
          margin: 0 0 6px 0 !important;
        }
        .pastek-eink-editor .ProseMirror ol {
          list-style: decimal !important;
          padding-left: 22px !important;
          margin: 0 0 6px 0 !important;
        }
        .pastek-eink-editor .ProseMirror li {
          margin-bottom: 2px !important;
          line-height: 24px !important;
        }
        .pastek-eink-editor .ProseMirror strong {
          font-weight: 700 !important;
        }
        .pastek-eink-editor .ProseMirror em {
          font-style: italic !important;
        }
        .pastek-eink-editor .ProseMirror u {
          text-decoration: underline !important;
        }
        .pastek-eink-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: ${placeholderColor};
          pointer-events: none;
          float: left;
          height: 0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
