import { useEffect, useRef, useState } from "react";

const commands = [
  { command: "bold", label: <b>B</b> },
  { command: "italic", label: <i>I</i> },
  { command: "underline", label: <u>U</u> },
  { command: "formatBlock", value: "h1", label: "H1" },
  { command: "formatBlock", value: "h2", label: "H2" },
];

const headingSizes = {
  h1: 60,
  h2: 32,
};

function RichText({ textNode, onCommit, onCancel }) {
  const rootRef = useRef(null);
  const editorRef = useRef(null);
  const [value, setValue] = useState(textNode?.text() ?? "");
  const [style, setStyle] = useState({
    fontSize: textNode?.fontSize() ?? 24,
    fontStyle: textNode?.fontStyle() ?? "normal",
    textDecoration: textNode?.textDecoration() ?? "",
  });

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || !textNode) return;

    editor.innerText = textNode.text();
    editor.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [textNode]);

  useEffect(() => {
    const handleOutsidePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        onCommit(value, style);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [onCommit, style, value]);

  const executeCommand = (command, commandValue) => {
    editorRef.current?.focus();

    if (command === "formatBlock") {
      document.execCommand(command, false, `<${commandValue}>`);
      setStyle((currentStyle) => ({
        ...currentStyle,
        fontSize: headingSizes[commandValue],
      }));
    } else {
      document.execCommand(command, false, null);
      setStyle((currentStyle) => {
        const isActive = document.queryCommandState(command);

        if (command === "bold") {
          return {
            ...currentStyle,
            fontStyle: isActive
              ? currentStyle.fontStyle === "italic"
                ? "bold italic"
                : "bold"
              : currentStyle.fontStyle.replace("bold", "").trim() || "normal",
          };
        }

        if (command === "italic") {
          return {
            ...currentStyle,
            fontStyle: isActive
              ? currentStyle.fontStyle === "bold"
                ? "bold italic"
                : "italic"
              : currentStyle.fontStyle.replace("italic", "").trim() || "normal",
          };
        }

        return {
          ...currentStyle,
          textDecoration: isActive ? "underline" : "",
        };
      });
    }

    setValue(editorRef.current?.innerText ?? "");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onCommit(value, style);
    }
  };

  if (!textNode) return null;

  const textPosition = textNode.position();

  return (
    <div
      ref={rootRef}
      style={{
        position: "absolute",
        top: `${textPosition.y}px`,
        left: `${textPosition.x}px`,
        width: `${Math.max(30, textNode.width())}px`,
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {commands.map(({ command, value: commandValue, label }) => (
          <button
            key={`${command}-${commandValue ?? "default"}`}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              executeCommand(command, commandValue);
            }}
            style={{ padding: "2px 8px", cursor: "pointer" }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => setValue(event.currentTarget.innerText)}
        onKeyDown={handleKeyDown}
        style={{
          minHeight: `${Math.max(30, textNode.height())}px`,
          border: "1px solid #ccc",
          padding: "8px",
          background: "white",
          outline: "none",
          fontSize: `${style.fontSize}px`,
          fontFamily: textNode.fontFamily(),
          lineHeight: textNode.lineHeight() || "normal",
          color: textNode.fill(),
          fontStyle: style.fontStyle,
          textDecoration: style.textDecoration,
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
        }}
      />
    </div>
  );
}

export default RichText;
