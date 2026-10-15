import { useEffect, useRef, useState, useCallback } from "react";

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

function RichText({ textNode, richHtml = "", onCommit }) {
  const rootRef = useRef(null);
  const editorRef = useRef(null);
  const committedRef = useRef(false);

  const [style, setStyle] = useState({
    fontSize: textNode?.fontSize() ?? 24,
    fontStyle: textNode?.fontStyle() ?? "normal",
    textDecoration: textNode?.textDecoration() ?? "",
  });

  useEffect(() => {
    if (!textNode || !editorRef.current) return;

    committedRef.current = false;

    const editor = editorRef.current;
    editor.innerHTML = richHtml || textNode.text();
    editor.focus();

    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(editor);
    range.collapse(false);

    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [textNode]);

  const handleCommit = useCallback(() => {
    if (committedRef.current || !editorRef.current) return;

    committedRef.current = true;

    const editor = editorRef.current;

    onCommit(editor.innerText, style, editor.innerHTML);
  }, [onCommit, style]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        handleCommit();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [handleCommit]);

  const executeCommand = (command, commandValue) => {
    const editor = editorRef.current;

    if (!editor) return;

    editor.focus();

    if (command === "formatBlock") {
      document.execCommand("formatBlock", false, commandValue);

      setStyle((current) => ({
        ...current,
        fontSize: headingSizes[commandValue],
      }));

      return;
    }

    document.execCommand(command, false, null);

    const active = document.queryCommandState(command);

    if (command === "bold" || command === "italic") {
      setStyle((current) => {
        const styles = new Set(
          current.fontStyle
            .split(" ")
            .filter((item) => item && item !== "normal"),
        );

        if (active) {
          styles.add(command);
        } else {
          styles.delete(command);
        }

        return {
          ...current,
          fontStyle: [...styles].join(" ") || "normal",
        };
      });
    } else if (command === "underline") {
      setStyle((current) => ({
        ...current,
        textDecoration: active ? "underline" : "",
      }));
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();

      if (!committedRef.current) {
        handleCommit();
      }

      return;
    }

    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleCommit();
    }
  };

  if (!textNode) return null;

  const position = textNode.position();

  return (
    <div
      ref={rootRef}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        width: Math.max(200, textNode.width()),
        zIndex: 1000,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          marginBottom: "6px",
          padding: "6px",
        }}
      >
        {commands.map(({ command, value, label }) => (
          <button
            key={`${command}-${value ?? "default"}`}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => executeCommand(command, value)}
            style={{
              padding: "5px 10px",
              cursor: "pointer",
              background: "white",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        style={{
          minHeight: Math.max(40, textNode.height()),
          width: "100%",
          padding: "8px",
          background: "white",
          color: textNode.fill(),
          outline: "none",
          fontSize: style.fontSize,
          fontFamily: textNode.fontFamily(),
          lineHeight: textNode.lineHeight() || "normal",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          cursor: "text",
        }}
      />
    </div>
  );
}

export default RichText;
