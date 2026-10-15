import { useState, useRef, useEffect, useCallback } from "react";
import {
  Stage,
  Layer,
  Image,
  Transformer,
  Text,
  Group,
  Circle,
} from "react-konva";
import { Html } from "react-konva-utils";
import useImage from "use-image";
import { observer } from "mobx-react-lite";

import RichText from "./RichText";
import { editorStore } from "../../stores/editorStore";

const DeleteCross = ({ x, y, onDelete }) => (
  <Group
    x={x}
    y={y}
    onClick={(e) => {
      e.cancelBubble = true;
      onDelete();
    }}
    onTap={(e) => {
      e.cancelBubble = true;
      onDelete();
    }}
  >
    <Circle radius={11} fill="#7b7878" stroke="white" strokeWidth={1} />

    <Text
      x={-10}
      y={-10}
      width={20}
      height={20}
      text="×"
      fontSize={20}
      fontStyle="bold"
      fill="white"
      align="center"
      verticalAlign="middle"
      listening={false}
    />
  </Group>
);

const URLImage = ({ url, radius = 100, showCross, onSelect, onDelete }) => {
  const [image] = useImage(url);

  if (!image) return null;

  return (
    <Group
      x={150}
      y={150}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
    >
      <Group
        clipFunc={(ctx) => {
          ctx.beginPath();
          ctx.arc(radius, radius, radius, 0, Math.PI * 2, false);
        }}
      >
        <Image image={image} width={radius * 2} height={radius * 2} draggable />
      </Group>

      {showCross && <DeleteCross x={radius * 2} y={0} onDelete={onDelete} />}
    </Group>
  );
};

const StickerEditor = observer(() => {
  const store = editorStore;

  const [editingNode, setEditingNode] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);

  const textRef = useRef(null);
  const transformerRef = useRef(null);
  const stageRef = useRef(null);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        store.setImageObjectURL(reader.result);
        setSelectedElement("image");
        store.selectText(false);
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleTextEdit = useCallback(
    (e) => {
      e.cancelBubble = true;

      setSelectedElement("text");
      setEditingNode(e.target);
      store.startEditing();
    },
    [store],
  );

  const handleTextCommit = useCallback(
    (newText, newStyle, html) => {
      store.commitText(newText, newStyle, html);
      setEditingNode(null);
      setSelectedElement("text");
    },
    [store],
  );

  const handleTextCancel = useCallback(() => {
    store.cancelEditing();
    setEditingNode(null);
    setSelectedElement("text");
  }, [store]);

  const handleDeleteText = () => {
    setEditingNode(null);
    setSelectedElement(null);
    store.deleteText();
  };

  const handleDeleteImage = () => {
    setSelectedElement(null);
    store.deleteImage();
  };

  const handleCanvasOutsideClick = (e) => {
    if (store.isEditing) return;

    if (e.target === e.target.getStage()) {
      store.selectText(false);
      setSelectedElement(null);
    }
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;

    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let direction = e.evt.deltaY > 0 ? 1 : -1;

    if (e.evt.ctrlKey) {
      direction = -direction;
    }

    const scaleBy = 1.01;

    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);

    store.updateStage(newScale, newPos.x, newPos.y);
    stage.batchDraw();
  };

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) return;

    stage.scale({ x: store.scale, y: store.scale });
    stage.position({ x: store.stageX, y: store.stageY });
    stage.batchDraw();
  }, [store]);

  useEffect(() => {
    const transformer = transformerRef.current;
    const textNode = textRef.current;

    if (!transformer) return;

    if (
      store.showText &&
      selectedElement === "text" &&
      store.isTextSelected &&
      !store.isEditing &&
      textNode
    ) {
      transformer.nodes([textNode]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [store.showText, store.isTextSelected, store.isEditing, selectedElement]);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <aside
        style={{
          width: "220px",
          minWidth: "220px",
          padding: "20px",
          background: "#fff",
          borderRight: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      >
        <label
          style={{
            display: "block",
            padding: "20px",
            marginTop: "25px",
            background: "#f2f2f2",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Upload Image
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </label>

        <button
          type="button"
          style={{
            display: "block",
            width: "100%",
            padding: "20px",
            marginTop: "15px",
            background: "#f2f2f2",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            textAlign: "center",
            fontSize: "18px",
          }}
          onClick={() => {
            store.showTextElement();
            store.selectText(true);
            setSelectedElement("text");
          }}
        >
          Edit Text
        </button>
      </aside>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            height: "65px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            background: "#fff",
            borderBottom: "1px solid #ddd",
            boxSizing: "border-box",
          }}
        >
          <h2 style={{ fontSize: "20px" }}>Custom Editor</h2>
        </header>

        <Stage
          width={Math.max(0, window.innerWidth - 220)}
          height={Math.max(0, window.innerHeight - 65)}
          ref={stageRef}
          onWheel={handleWheel}
          onMouseDown={handleCanvasOutsideClick}
          onTouchStart={handleCanvasOutsideClick}
        >
          <Layer>
            {store.showText && (
              <Text
                ref={textRef}
                x={store.text.x}
                y={store.text.y}
                width={store.text.width}
                text={store.text.value}
                fontSize={store.text.fontSize}
                fontStyle={store.text.fontStyle}
                textDecoration={store.text.textDecoration}
                fill="black"
                visible={!store.isEditing}
                draggable={!store.isEditing}
                onClick={(e) => {
                  e.cancelBubble = true;
                  store.selectText(true);
                  setSelectedElement("text");
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  store.selectText(true);
                  setSelectedElement("text");
                }}
                onDblClick={handleTextEdit}
                onDblTap={handleTextEdit}
                onDragEnd={(e) => {
                  store.updateTextPosition(e.target.x(), e.target.y());
                }}
                onTransformEnd={() => {
                  const node = textRef.current;

                  if (!node) return;

                  const width = Math.max(30, node.width() * node.scaleX());

                  node.scaleX(1);
                  node.scaleY(1);

                  store.updateTextTransform(node.x(), node.y(), width);
                }}
              />
            )}

            {store.showText &&
              selectedElement === "text" &&
              !store.isEditing && (
                <DeleteCross
                  x={store.text.x + store.text.width}
                  y={store.text.y}
                  onDelete={handleDeleteText}
                />
              )}

            {store.isEditing && editingNode && (
              <Html>
                <RichText
                  key="rich-text-editor"
                  textNode={editingNode}
                  richHtml={store.text.richHtml}
                  onCommit={handleTextCommit}
                  onCancel={handleTextCancel}
                />
              </Html>
            )}

            {store.showText &&
              selectedElement === "text" &&
              store.isTextSelected &&
              !store.isEditing && (
                <Transformer
                  ref={transformerRef}
                  enabledAnchors={["middle-left", "middle-right"]}
                />
              )}

            {store.imageObjectURL && (
              <URLImage
                url={store.imageObjectURL}
                radius={100}
                showCross={selectedElement === "image"}
                onSelect={() => {
                  setSelectedElement("image");
                  store.selectText(false);
                }}
                onDelete={handleDeleteImage}
              />
            )}
          </Layer>
        </Stage>
      </main>
    </div>
  );
});

export default StickerEditor;
