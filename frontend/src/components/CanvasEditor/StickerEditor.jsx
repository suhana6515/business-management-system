import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import {
  Stage,
  Layer,
  Image,
  Transformer,
  Text,
  Group,
  Circle,
  Rect,
  Line,
} from "react-konva";
import { Html } from "react-konva-utils";
import useImage from "use-image";
import { observer } from "mobx-react-lite";
import RichText from "./RichText";
import { editorStore } from "../../stores/editorStore";
import { nametagTemplate } from "./NametagTemplate";

const backgroundColors = [
  "#ffffff",
  "#000000",
  "#f87171",
  "#fbbf24",
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#f9a8d4",
  "#d1d5db",
  "#fef3c7",
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

const MM_TO_PX = 300 / 25.4;

const StickerEditor = observer(() => {
  const store = editorStore;

  const [editingNode, setEditingNode] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [editingTemplateTextId, setEditingTemplateTextId] = useState(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [templateElements, setTemplateElements] = useState([]);
  const [stickerType, setStickerType] = useState(
    () => store.activeTemplate || "logo-sticker",
  );
  const [editingNametagId, setEditingNametagId] = useState(null);
  const [selectedShapeId, setSelectedShapeId] = useState(null);

  const finalScale = fitScale * zoom;

  const textRef = useRef(null);
  const transformerRef = useRef(null);
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const imageTransformerRef = useRef(null);
  const templateTransformerRef = useRef(null);
  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const shapeTransformerRef = useRef(null);

  const dimensions = (() => {
    switch (stickerType) {
      case "nametag":
        return {
          width: 100,
          height: 44.15,
        };

      case "logo-sticker":
      default:
        return {
          width: 64,
          height: 34,
        };
    }
  })();

  const stageWidth = dimensions.width * MM_TO_PX;
  const stageHeight = dimensions.height * MM_TO_PX;

  const handleElementSelect = (e) => {
    if (!store.selectedSidebarShape) return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();

    const x = pointerPosition.x / finalScale;
    const y = pointerPosition.y / finalScale;

    store.addShape(x, y);
  };

  const handleTemplateSelect = (value) => {
    store.switchTemplate(value);
    setStickerType(value);

    setEditingNametagId(null);
    setEditingTemplateTextId(null);
    setSelectedTemplateId(null);
    setSelectedElement(null);
    setEditingNode(null);

    if (value === "logo-sticker") {
      setTemplateElements([]);
    } else if (value === "nametag") {
      setTemplateElements(structuredClone(nametagTemplate.elements));
    }
  };

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

  const handleDeleteElement = () => {
    if (!selectedShapeId) return;

    store.deleteShape(selectedShapeId);
    setSelectedShapeId(null);
  };

  const handleDeleteTemplateText = () => {
    if (!selectedTemplateId) return;

    store.deleteTemplateText(selectedTemplateId);
    setSelectedTemplateId(null);
  };

  const handleCanvasOutsideClick = (e) => {
    if (store.isEditing) return;

    if (e.target === e.target.getStage()) {
      store.selectText(false);
      setSelectedElement(null);
      setSelectedTemplateId(null);
      setSelectedShapeId(null);
    }
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;

    setZoom((prevZoom) => {
      const newZoom =
        e.evt.deltaY < 0 ? prevZoom * scaleBy : prevZoom / scaleBy;

      return Math.max(0.25, Math.min(newZoom, 5));
    });
  };

  const handleNametagTextCommit = useCallback(
    (newText, newStyle, html) => {
      setTemplateElements((prev) =>
        prev.map((element) =>
          element.id === editingNametagId
            ? {
                ...element,
                text: newText,
                fontSize: newStyle.fontSize,
                fontStyle: newStyle.fontStyle,
                fontFamily: newStyle.fontFamily,
                textDecoration: newStyle.textDecoration,
                fill: newStyle.fontColor || element.fill,
                richHtml: html,
              }
            : element,
        ),
      );

      setEditingNode(null);
      setEditingNametagId(null);
    },
    [editingNametagId],
  );

  useEffect(() => {
    store.saveCurrentTemplate();
  });

  useEffect(() => {
    if (stickerType === "nametag") {
      setTemplateElements(structuredClone(nametagTemplate.elements));
    } else {
      setTemplateElements([]);
    }
  }, []);

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

  useEffect(() => {
    const container = canvasContainerRef.current;

    if (!container) return;

    const updateScale = () => {
      const availableWidth = container.clientWidth - 40;
      const availableHeight = container.clientHeight - 40;

      const scaleX = availableWidth / stageWidth;
      const scaleY = availableHeight / stageHeight;

      setFitScale(Math.max(0.01, Math.min(scaleX, scaleY, 1)));
    };

    const resizeObserver = new ResizeObserver(updateScale);

    resizeObserver.observe(container);
    updateScale();

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const transformer = shapeTransformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    const selectedShape = selectedShapeId
      ? stage.findOne(`#shape-${selectedShapeId}`)
      : null;
    transformer.nodes(selectedShape ? [selectedShape] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedShapeId, store.shapes.length]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        width: "100%",
        height: "calc(100vh - 105px)",
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
          onClick={() =>
            setActivePanel(activePanel === "background" ? null : "background")
          }
        >
          Background Color
        </button>

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
          onClick={() =>
            setActivePanel(activePanel === "elements" ? null : "elements")
          }
        >
          Elements
        </button>
      </aside>

      {activePanel && (
        <div
          style={{
            width: "250px",
            minWidth: "250px",
            padding: "20px",
            background: "#fff",
            borderRight: "1px solid #ddd",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          {activePanel === "fontCombinations" && (
            <div>
              {fontTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => store.addTextTemplate(template)}
                  style={{
                    padding: "15px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: "#f9f9f9",
                    cursor: "pointer",
                    textAlign: "left",
                    marginBottom: "10px",
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
            </div>
          )}

          {activePanel === "background" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "5px",
                marginTop: "15px",
              }}
            >
              {backgroundColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => store.setBackgroundColor(color)}
                  style={{
                    width: "30px",
                    height: "30px",
                    backgroundColor: color,
                    border:
                      store.backgroundColor === color
                        ? "3px solid #2563eb"
                        : "1px solid #ccc",
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          )}

          {activePanel === "elements" && (
            <div
              style={{
                width: "200px",
                padding: "10px",
              }}
            >
              <button
                onClick={() => {
                  store.selectSidebarShape("rect");
                  store.addShape(stageWidth / 2, stageHeight / 2);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "20px",
                  marginTop: "15px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "center",
                  fontSize: "18px",
                  background:
                    store.selectedSidebarShape === "rect" ? "#ddd" : "#fff",
                }}
              >
                Rectangle
              </button>
              <button
                onClick={() => {
                  store.selectSidebarShape("circle");
                  store.addShape(stageWidth / 2, stageHeight / 2);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "20px",
                  marginTop: "15px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "center",
                  fontSize: "18px",
                  background: "transparent",
                }}
              >
                Circle
              </button>
            </div>
          )}
        </div>
      )}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
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
          <select
            value={stickerType}
            style={{
              fontSize: "16px",
              outline: "none",
              padding: "5px 8px",
              width: "auto",
              minWidth: "220px",
              border: "none",
              background: "#fff",
              cursor: "pointer",
            }}
            onChange={(e) => handleTemplateSelect(e.target.value)}
          >
            <option value="logo-sticker">Logo Sticker (64 * 34 mm)</option>
            <option value="nametag">Name Tags (100 *44.15 mm)</option>
          </select>

          <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
            <button onClick={() => setZoom((z) => Math.max(0.25, z / 1.1))}>
              -
            </button>

            <span>{Math.round(zoom * 100)}%</span>

            <button onClick={() => setZoom((z) => Math.min(5, z * 1.1))}>
              +
            </button>

            <button onClick={() => setZoom(1)}>Reset</button>
          </div>
        </header>

        <div
          ref={canvasContainerRef}
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            background: "#f0f0f0",
          }}
        >
          <div
            style={{
              width: stageWidth * finalScale,
              height: stageHeight * finalScale,
              flexShrink: 0,
            }}
          >
            <Stage
              ref={stageRef}
              width={stageWidth * finalScale}
              height={stageHeight * finalScale}
              scaleX={finalScale}
              scaleY={finalScale}
              onWheel={handleWheel}
              onMouseDown={handleCanvasOutsideClick}
              style={{ background: "#fff" }}
            >
              <Layer>
                <Rect
                  x={0}
                  y={0}
                  width={stageWidth}
                  height={stageHeight}
                  fill={store.backgroundColor}
                  onMouseDown={() => {
                    if (store.isEditing) return;

                    store.selectText(false);
                    setSelectedElement(null);
                    setSelectedTemplateId(null);
                    setSelectedShapeId(null);
                  }}
                />
                <Rect
                  width={stageWidth}
                  height={stageHeight}
                  fill="transparent"
                  onClick={(e) => {
                    setSelectedShapeId(null);
                    handleElementSelect(e);
                  }}
                />

                {store.shapes?.map((shape) => {
                  if (shape.type === "rect") {
                    return (
                      <Rect
                        key={shape.id}
                        id={`shape-${shape.id}`}
                        x={shape.x - 25}
                        y={shape.y - 25}
                        scaleX={shape.scaleX}
                        scaleY={shape.scaleY}
                        rotation={shape.rotation}
                        width={50}
                        height={50}
                        fill={shape.fill}
                        draggable
                        onClick={(e) => {
                          e.cancelBubble = true;
                          setSelectedShapeId(shape.id);
                        }}
                        onTransformEnd={(e) => {
                          const node = e.target;
                          store.updateShapeTransform(
                            shape.id,
                            node.x() + 25,
                            node.y() + 25,
                            node.scaleX(),
                            node.scaleY(),
                            node.rotation(),
                          );
                        }}
                      />
                    );
                  } else if (shape.type === "circle") {
                    return (
                      <Circle
                        key={shape.id}
                        id={`shape-${shape.id}`}
                        x={shape.x - 25}
                        y={shape.y - 25}
                        scaleX={shape.scaleX}
                        scaleY={shape.scaleY}
                        rotation={shape.rotation}
                        radius={25}
                        fill={shape.fill}
                        draggable
                        onClick={(e) => {
                          e.cancelBubble = true;
                          setSelectedShapeId(shape.id);
                        }}
                        onTransformEnd={(e) => {
                          const node = e.target;
                          store.updateShapeTransform(
                            shape.id,
                            node.x() + 25,
                            node.y() + 25,
                            node.scaleX(),
                            node.scaleY(),
                            node.rotation(),
                          );
                        }}
                      />
                    );
                  }
                  return null;
                })}
                {selectedShapeId && (
                  <DeleteCross
                    x={selectedShapeId.x}
                    y={selectedShapeId.y}
                    onDelete={handleDeleteElement}
                  />
                )}
                <Transformer
                  ref={shapeTransformerRef}
                  rotateEnabled
                  enabledAnchors={[
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                  ]}
                />

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
                    fill={store.text.fill}
                    visible={!store.isEditing}
                    draggable={!store.isEditing}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      store.selectText(true);
                      setSelectedElement("text");
                    }}
                    onDblClick={handleTextEdit}
                    onDragEnd={(e) =>
                      store.updateTextPosition(e.target.x(), e.target.y())
                    }
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

                {store.showText &&
                  selectedElement === "text" &&
                  !store.isEditing && (
                    <DeleteCross
                      x={store.text.x + store.text.width}
                      y={store.text.y}
                      onDelete={handleDeleteText}
                    />
                  )}

                {store.imageObjectURL && (
                  <URLImage
                    ref={imageRef}
                    x={store.x}
                    y={store.y}
                    width={store.width}
                    url={store.imageObjectURL}
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

                      const newWidth = Math.max(
                        30,
                        store.width * node.scaleX(),
                      );

                      store.updateImageTransform(node.x(), node.y(), newWidth);

                      node.scaleX(1);
                      node.scaleY(1);
                    }}
                  />
                )}

                {selectedElement === "image" && (
                  <Transformer
                    ref={imageTransformerRef}
                    keepRatio
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
                    id={String(group.id)}
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

                    {selectedTemplateId === group.id && (
                      <DeleteCross
                        x={150}
                        y={0}
                        onDelete={handleDeleteTemplateText}
                      />
                    )}
                  </Group>
                ))}

                <Transformer ref={templateTransformerRef} keepRatio />

                {editingTemplateTextId &&
                  (() => {
                    const { groupId, textId, node } = editingTemplateTextId;

                    const group = store.textGroups.find(
                      (g) => g.id === groupId,
                    );

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
                          onBlur={() => setEditingTemplateTextId(null)}
                        />
                      </Html>
                    );
                  })()}

                {templateElements.map((element) => {
                  if (element.type === "text") {
                    const isEditing = editingNametagId === element.id;

                    return (
                      <Text
                        key={element.id}
                        {...element}
                        draggable={!isEditing}
                        visible={!isEditing}
                        onDblClick={(e) => {
                          e.cancelBubble = true;
                          setEditingNametagId(element.id);
                          setEditingNode(e.target);
                        }}
                        onDragEnd={(e) => {
                          setTemplateElements((prev) =>
                            prev.map((item) =>
                              item.id === element.id
                                ? {
                                    ...item,
                                    x: e.target.x(),
                                    y: e.target.y(),
                                  }
                                : item,
                            ),
                          );
                        }}
                      />
                    );
                  }

                  if (element.type === "line") {
                    return <Line key={element.id} {...element} draggable />;
                  }

                  return null;
                })}

                {editingNametagId &&
                  editingNode &&
                  (() => {
                    const element = templateElements.find(
                      (e) => e.id === editingNametagId,
                    );

                    if (!element) return null;

                    return (
                      <Html>
                        <RichText
                          key={`nametag-rich-text-${editingNametagId}`}
                          textNode={editingNode}
                          richHtml={element.richHtml}
                          onCommit={handleNametagTextCommit}
                        />
                      </Html>
                    );
                  })()}
              </Layer>
            </Stage>
          </div>
        </div>
      </main>
    </div>
  );
});

export default StickerEditor;
