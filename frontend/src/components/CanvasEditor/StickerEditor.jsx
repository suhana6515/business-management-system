import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
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

const fontFamilies = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Roboto",
  "Poppins",
  "Montserrat",
];

const fontTemplates = [
  {
    id: "elegant",
    name: "Elegant Serif",
    texts: [
      {
        value: "Beautiful",
        x: 0,
        y: 0,
        fontFamily: "Georgia",
        fontSize: 36,
        fontStyle: "italic",
        fill: "#342c27",
      },
      {
        value: "MOMENTS",
        x: 0,
        y: 45,
        fontFamily: "Arial",
        fontSize: 22,
        fontStyle: "bold",
        fill: "#977a56",
      },
    ],
  },
  {
    id: "sale",
    name: "Bold Sale",
    texts: [
      {
        value: "BIG SALE",
        x: 0,
        y: 0,
        fontFamily: "Montserrat",
        fontSize: 42,
        fontStyle: "bold",
        fill: "#202e45",
      },
      {
        value: "UP TO 50% OFF",
        x: 5,
        y: 55,
        fontFamily: "Roboto",
        fontSize: 18,
        fontStyle: "normal",
        fill: "#e09a32",
      },
    ],
  },
];

const DeleteCross = ({ x, y, onDelete }) => (
  <Group
    x={x}
    y={y}
    onClick={(e) => {
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

const URLImage = forwardRef(
  (
    {
      url,
      x,
      y,
      width,
      showCross,
      onSelect,
      onDelete,
      onDragEnd,
      onTransformEnd,
    },
    ref,
  ) => {
    const [image] = useImage(url);

    if (!image) return null;

    const radius = width / 2;

    return (
      <Group
        ref={ref}
        x={x}
        y={y}
        draggable
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onDragEnd={onDragEnd}
      >
        <Group
          ref={ref}
          onTransformEnd={onTransformEnd}
          clipFunc={(ctx) => {
            ctx.beginPath();
            ctx.arc(radius, radius, radius, 0, Math.PI * 2);
            ctx.closePath();
          }}
        >
          <Image image={image} width={width} height={width} />
        </Group>

        {showCross && <DeleteCross x={width} y={0} onDelete={onDelete} />}
      </Group>
    );
  },
);

const StickerEditor = observer(() => {
  const store = editorStore;

  const [editingNode, setEditingNode] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [editingTemplateTextId, setEditingTemplateTextId] = useState(null);

  const textRef = useRef(null);
  const transformerRef = useRef(null);
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const imageTransformerRef = useRef(null);
  const templateTransformerRef = useRef(null);

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

  const handleDeleteTemplateText = () => {
    setSelectedTemplateId(null);
    store.deleteTemplateText();
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

  useEffect(() => {
    const transformer = imageTransformerRef.current;
    const imageNode = imageRef.current;

    if (!transformer) return;

    if (selectedElement === "image" && imageNode) {
      transformer.nodes([imageNode]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [selectedElement, store.imageObjectURL]);

  useEffect(() => {
    const transformer = templateTransformerRef.current;
    const stage = stageRef.current;

    if (!transformer || !stage) return;

    const selectedGroup = selectedTemplateId
      ? stage.findOne(`#${selectedTemplateId}`)
      : null;

    transformer.nodes(selectedGroup ? [selectedGroup] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedTemplateId, store.textGroups.length]);

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
        <button
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
          onClick={() =>
            setActivePanel(
              activePanel === "fontCombinations" ? null : "fontCombinations",
            )
          }
        >
          Font Combinations
        </button>
        {activePanel === "fontCombinations" && (
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
          >
            {fontTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  store.addTextTemplate(template);
                }}
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "#f9f9f9",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <strong>{template.name}</strong>

                {template.texts.map((text, index) => (
                  <div
                    key={index}
                    style={{
                      fontFamily: text.fontFamily,
                      fontSize: Math.min(text.fontSize, 24),
                      fontStyle: text.fontStyle,
                      color: text.fill,
                    }}
                  >
                    {text.value}
                  </div>
                ))}
              </button>
            ))}
          </button>
        )}
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

        {store.showText && selectedElement === "text" && (
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              gap: "10px",
              align: "left",
              padding: "10px",
            }}
          >
            <select
              value={store.text.fontFamily}
              onChange={(e) => store.setFontFamily(e.target.value)}
            >
              {fontFamilies.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        )}

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
                fontFamily={store.text.fontFamily}
                textDecoration={store.text.textDecoration}
                fill="black"
                visible={!store.isEditing}
                draggable={!store.isEditing}
                onClick={(e) => {
                  e.cancelBubble = true;
                  store.selectText(true);
                  setSelectedElement("text");
                }}
                onDblClick={handleTextEdit}
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
                  enabledAnchors={[
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                  ]}
                />
              )}

            {store.imageObjectURL && (
              <URLImage
                ref={imageRef}
                x={store.x}
                y={store.y}
                width={store.width}
                url={store.imageObjectURL}
                radius={100}
                showCross={selectedElement === "image"}
                onSelect={() => {
                  setSelectedElement("image");
                  store.selectText(false);
                }}
                onDelete={handleDeleteImage}
                onDragEnd={(e) => {
                  store.updateImageTransform(
                    e.target.x(),
                    e.target.y(),
                    store.width,
                  );
                }}
                onTransformEnd={() => {
                  const node = imageRef.current;

                  if (!node) return;
                  const parent = node.getParent();

                  const newWidth = Math.max(30, store.width * node.scaleX());

                  node.scaleX(1);
                  node.scaleY(1);

                  store.updateImageTransform(
                    parent.x() + node.x(),
                    parent.y() + node.y(),
                    newWidth,
                  );
                  node.position({ x: 0, y: 0 });
                }}
              />
            )}

            {selectedElement === "image" && (
              <Transformer
                ref={imageTransformerRef}
                keepRatio={true}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ]}
              />
            )}

            {store.textGroups.map((group) => (
              <Group
                key={group.id}
                x={group.x}
                y={group.y}
                draggable={!editingTemplateTextId}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedTemplateId(group.id);
                  setSelectedElement(null);
                  store.selectText(false);
                }}
                onDragEnd={(e) => {
                  store.updateTextGroupPosition(
                    group.id,
                    e.target.x(),
                    e.target.y(),
                  );
                }}
              >
                {group.texts.map((text) => (
                  <Text
                    key={text.id}
                    x={text.x}
                    y={text.y}
                    text={text.value}
                    fontSize={text.fontSize}
                    fontStyle={text.fontStyle}
                    fontFamily={text.fontFamily}
                    fill={text.fill}
                    onDelete={() => handleDeleteTemplateText()}
                    onDblClick={(e) => {
                      e.cancelBubble = true;

                      setSelectedTemplateId(group.id);

                      setEditingTemplateTextId({
                        groupId: group.id,
                        textId: text.id,
                        node: e.target,
                      });
                    }}
                    onDblTap={(e) => {
                      e.cancelBubble = true;

                      setEditingTemplateTextId({
                        groupId: group.id,
                        textId: text.id,
                        node: e.target,
                      });
                    }}
                    visible={
                      !(
                        editingTemplateTextId?.groupId === group.id &&
                        editingTemplateTextId?.textId === text.id
                      )
                    }
                  />
                ))}
              </Group>
            ))}
            <Transformer ref={templateTransformerRef} keepRatio />
            {editingTemplateTextId &&
              (() => {
                const { groupId, textId, node } = editingTemplateTextId;

                const group = store.textGroups.find((g) => g.id === groupId);

                const text = group?.texts.find((t) => t.id === textId);

                if (!text) return null;

                const position = node.getAbsolutePosition();

                const stage = node.getStage();
                const stagePosition = stage.getAbsolutePosition();
                const stageScale = stage.scaleX();

                const x = (position.x - stagePosition.x) / stageScale;
                const y = (position.y - stagePosition.y) / stageScale;

                return (
                  <Html>
                    <textarea
                      autoFocus
                      defaultValue={text.value}
                      style={{
                        position: "absolute",
                        left: x,
                        top: y,
                        fontFamily: text.fontFamily,
                        fontSize:
                          (text.fontSize * node.getAbsoluteScale().x) /
                          stageScale,
                        fontStyle: text.fontStyle.includes("italic")
                          ? "italic"
                          : "normal",
                        fontWeight: text.fontStyle.includes("bold")
                          ? "bold"
                          : "normal",
                        color: text.fill,
                        background: "transparent",
                        border: "1px dashed #888",
                        outline: "none",
                        resize: "none",
                        minWidth: "150px",
                        minHeight: "50px",
                        padding: 0,
                        margin: 0,
                        overflow: "hidden",
                      }}
                      onChange={(e) => {
                        store.updateTemplateText(
                          groupId,
                          textId,
                          e.target.value,
                        );
                      }}
                      onBlur={() => {
                        setEditingTemplateTextId(null);
                      }}
                    />
                  </Html>
                );
              })()}
          </Layer>
        </Stage>
      </main>
    </div>
  );
});

export default StickerEditor;
