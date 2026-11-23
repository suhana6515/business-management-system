import { useEffect, useRef, useState, useCallback } from "react";

const commands = [
  { command: "bold", label: <b>B</b> },
  { command: "italic", label: <i>I</i> },
  { command: "underline", label: <u>U</u> },
];

const fontFamilies = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Gabriola",
];

const fontColors = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#FF9800",
  "#FFEB3B",
  "#4CAF50",
  "#2196F3",
  "#9C27B0",
  "#E91E63",
  "#795548",
];

const generateFontSizes = (min = 8, max = 72, step = 2) => {
  const sizes = [];
  for (let i = min; i <= max; i += step) {
    sizes.push(i);
  }
  return sizes;
};

function RichText({ textNode, richHtml = "", onCommit }) {
  const rootRef = useRef(null);
  const editorRef = useRef(null);
  const committedRef = useRef(false);
  const savedSelectionRef = useRef(null);
  const selectedColorRef = useRef(textNode?.fill() ?? "#000000");

  const [style, setStyle] = useState({
    fontSize: textNode?.fontSize() ?? 24,
    fontStyle: textNode?.fontStyle() ?? "normal",
    fontFamily: textNode?.fontFamily() ?? "Arial",
    textDecoration: textNode?.textDecoration() ?? "",
  });

  const [textConfig, setTextConfig] = useState({
    fontSize: textNode?.fontSize() ?? 24,
  });

  const fontSizes = generateFontSizes(8, 72, 2);
  const handleFontSizeChange = (e) => {
    const nextSize = Number(e.target.value);

    if (!Number.isFinite(nextSize) || nextSize <= 0) {
      return;
    }

    restoreSelection();

    document.execCommand("fontSize", false, "7");

    const editor = editorRef.current;
    const selection = window.getSelection();

    if (editor && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      editor.querySelectorAll('font[size="7"]').forEach((font) => {
        font.removeAttribute("size");
        font.style.fontSize = `${nextSize}px`;
      });

      if (range.collapsed) {
        editor.style.fontSize = `${nextSize}px`;
      }
    }

    saveSelection();

    setTextConfig((prev) => ({
      ...prev,
      fontSize: nextSize,
    }));
    setStyle((prev) => ({
      ...prev,
      fontSize: nextSize,
    }));
  };

  const [showColors, setShowColors] = useState(false);
  const [selectedColor, setSelectedColor] = useState(
    textNode?.fill() ?? "#000000",
  );

  useEffect(() => {
    if (!textNode || !editorRef.current) return;

    committedRef.current = false;

    const color = textNode.fill() ?? "#000000";
    selectedColorRef.current = color;
    setSelectedColor(color);

    setStyle({
      fontSize: textNode.fontSize() ?? 24,
      fontStyle: textNode.fontStyle() ?? "normal",
      fontFamily: textNode.fontFamily() ?? "Arial",
      textDecoration: textNode.textDecoration() ?? "",
    });

    const editor = editorRef.current;
    editor.innerHTML = richHtml || textNode.text();
    editor.focus();

    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(editor);
    range.collapse(false);

    selection?.removeAllRanges();
    selection?.addRange(range);

    savedSelectionRef.current = range.cloneRange();
  }, [richHtml, textNode]);

  const handleCommit = useCallback(() => {
    if (committedRef.current || !editorRef.current) return;

    committedRef.current = true;

    const editor = editorRef.current;

    const maxFontSize = Math.max(
      style.fontSize,
      ...Array.from(editor.querySelectorAll("*")).map((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize) || 0;
      }),
    );

    onCommit(
      editor.innerText,
      {
        ...style,
        fontSize: maxFontSize,
        fontColor: selectedColorRef.current,
      },
      editor.innerHTML,
    );
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

  const saveSelection = () => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) return;

    const editor = editorRef.current;
    const range = selection.getRangeAt(0);

    if (editor && editor.contains(range.commonAncestorContainer)) {
      savedSelectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || !savedSelectionRef.current) return;

    editor.focus();
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current);
  };

  const applyFontFamily = (fontFamily) => {
    const editor = editorRef.current;

    if (!editor) return;

    restoreSelection();

    document.execCommand("fontName", false, fontFamily);

    saveSelection();

    setStyle((current) => ({
      ...current,
      fontFamily,
    }));
  };

  const applyTextColor = (color) => {
    const editor = editorRef.current;

    if (!editor) return;

    restoreSelection();

    document.execCommand("foreColor", false, color);

    saveSelection();

    setStyle((current) => ({
      ...current,
      fontColor: color,
    }));
  };

  const executeCommand = (command) => {
    const editor = editorRef.current;

    if (!editor) return;

    restoreSelection();

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

    saveSelection();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCommit();
      return;
    }

    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleCommit();
    }
  };

  if (!textNode) return null;

  const position = textNode.getAbsolutePosition();
  const absoluteScale = textNode.getAbsoluteScale();

  return (
    <div
      ref={rootRef}
      onClick={(event) => event.stopPropagation()}
      style={{
        position: "absolute",
        top: position.y,
        left: position.x - 50,
        width: textNode.width() * absoluteScale.x,
        height: textNode.height() * absoluteScale.y,
        minWidth: Math.max(200, textNode.width() * absoluteScale.x),
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: "10px",
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "center",
          gap: "4px",
          padding: "6px",
          background: "white",
          width: "max-content",
          borderRadius: "8px",
          zIndex: 1000,
        }}
      >
        {commands.map(({ command, value, label }) => (
          <button
            key={`${command}-${value ?? "default"}`}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              saveSelection();
            }}
            onClick={() => executeCommand(command, value)}
            style={{
              padding: "5px 10px",
              cursor: "pointer",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            {label}
          </button>
        ))}

        <select
          aria-label="Font family"
          title="Font family"
          value={style.fontFamily}
          onMouseDown={saveSelection}
          onChange={(event) => applyFontFamily(event.target.value)}
          style={{
            maxWidth: "150px",
            padding: "6px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {fontFamilies.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>

        <select
          aria-label="Font Size"
          title="Font size"
          value={textConfig.fontSize}
          onMouseDown={saveSelection}
          onChange={handleFontSizeChange}
          style={{
            maxWidth: "150px",
            padding: "6px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {fontSizes.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              saveSelection();
            }}
            onClick={() => setShowColors((current) => !current)}
            style={{
              padding: "5px 10px",
              cursor: "pointer",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <span
              style={{
                color: selectedColor,
                fontSize: "18px",
              }}
            >
              A
            </span>
          </button>

          {showColors && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                marginTop: "5px",
                padding: "10px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "8px",
                width: "180px",
                zIndex: 2000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {fontColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyTextColor(color)}
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    border:
                      selectedColor === color
                        ? "2px solid #333"
                        : "1px solid #ddd",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onKeyDown={handleKeyDown}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        style={{
          display: "block",
          position: "relative",
          width: Math.max(200, textNode.width() * absoluteScale.x),
          background: "transparent",
          color: textNode.fill(),
          outline: "none",
          cursor: "text",
          boxSizing: "border-box",
          padding: 0,
          margin: 0,
          whiteSpace: "pre-wrap",
          lineHeight: 1,
        }}
      />
    </div>
  );
}

export default RichText;
