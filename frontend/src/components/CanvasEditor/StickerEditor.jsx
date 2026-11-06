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
  Arrow,
  Ellipse,
  RegularPolygon,
  Star,
} from "react-konva";
import { HexColorPicker, HexColorInput } from "react-colorful";
import {
  LuTrash2,
  LuImages,
  LuFileText,
  LuLayoutTemplate,
  LuPaintBucket,
  LuShapes,
} from "react-icons/lu";
import { Html } from "react-konva-utils";
import useImage from "use-image";
import { observer } from "mobx-react-lite";
import RichText from "./RichText";
import { editorStore } from "../../stores/editorStore";
import { nametagTemplate } from "./NametagTemplate";

const backgroundColors = [
  "#ffffff",
  "#000000",
  "#FF0000",
  "#d3d3fe",
  "#f3f394",
  "#2cd207b7",
  "#f9a8d4",
  "#aad9f4",
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

const ShapePatternLoader = ({ url, children }) => {
  const [imgObj] = useImage(url || "");

  return children(imgObj);
};

const URLImage = forwardRef(
  (
    { url, x, y, imageWidth, imageHeight, onSelect, onDragEnd, imageRef },
    ref,
  ) => {
    const [image] = useImage(url);

    if (!image) return null;

    return (
      <Group
        ref={ref}
        x={x}
        y={y}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onDragEnd={onDragEnd}
      >
        <Image
          ref={imageRef}
          image={image}
          width={imageWidth}
          height={imageHeight}
          draggable
        />
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
  const [detectedColor, setDetectedColor] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokeWidth, setShowStrokeWidth] = useState(false);
  const [selectedShapeImageId, setSelectedShapeImageId] = useState(null);

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
  const innerImageRef = useRef(null);
  const shapeImageRef = useRef(null);
  const shapeImageTransformerRef = useRef(null);

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

  const handleElementClick = (e) => {
    const clickedColor = e.target.getAttr("fill");

    setDetectedColor(
      clickedColor && clickedColor !== "transparent"
        ? clickedColor
        : store.backgroundColor,
    );
  };

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

  const handleShapeImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file || !selectedShapeId) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        store.updateShapeImage(selectedShapeId, reader.result);
        setSelectedShapeImageId(null);
        setSelectedElement("shape");
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

  const handleDeleteSelected = () => {
    if (selectedShapeId) {
      store.deleteShape(selectedShapeId);
      setSelectedShapeId(null);
    } else if (selectedTemplateId) {
      store.deleteTemplateText(selectedTemplateId);
      setSelectedTemplateId(null);
    } else if (selectedElement === "text") {
      setEditingNode(null);
      setSelectedElement(null);
      store.deleteText();
    } else if (selectedElement === "image") {
      setSelectedElement(null);
      store.deleteImage();
      setSelectedShapeImageId(null);
    }
  };

  const handleCanvasOutsideClick = (e) => {
    if (store.isEditing) return;

    const clickedOnStage = e.target === e.target.getStage();

    const clickedOnBackground = e.target.name() === "sticker-background";

    if (clickedOnStage || clickedOnBackground) {
      store.selectText(false);
      setSelectedElement(null);
      setSelectedTemplateId(null);
      setSelectedShapeId(null);
      setSelectedShapeImageId(null);
      return;
    }
  };

  const handleShapeImageClick = (e, shapeId) => {
    e.cancelBubble = true;
    setSelectedShapeId(shapeId);
    setSelectedElement("shape");
    store.selectText(false);
    setSelectedShapeImageId(e.evt?.shiftKey ? shapeId : null);
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

  const selectedShape = store.shapes.find(
    (shape) => shape.id === selectedShapeId,
  );

  const selectedLine =
    selectedShape &&
    ["line", "dotted-line", "arrow"].includes(selectedShape.type);

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
    const imageNode = innerImageRef.current;

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

    let selectedNode = null;

    if (selectedShapeId) {
      selectedNode =
        selectedShapeImageId === selectedShapeId
          ? stage.findOne(`#shape-image-${selectedShapeId}`)
          : stage.findOne(`#shape-${selectedShapeId}`);
    }

    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [
    selectedShapeId,
    selectedShapeImageId,
    store.shapes.length,
    selectedShape?.imageObjectURL,
  ]);

  useEffect(() => {
    const transformer = shapeImageTransformerRef.current;
    const stage = stageRef.current;

    if (!transformer || !stage) return;

    const imageNode = selectedShapeImageId
      ? stage.findOne(`#shape-image-${selectedShapeImageId}`)
      : null;

    transformer.nodes(imageNode ? [imageNode] : []);
    transformer.forceUpdate();
    transformer.getLayer()?.batchDraw();
  });

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
      <input
        type="file"
        ref={shapeImageRef}
        onChange={handleShapeImageUpload}
        style={{ display: "none" }}
        accept="image/*"
      />
      <aside
        style={{
          width: "100px",
          minWidth: "150px",
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
          }}
        >
          <LuImages size={24} />
          <p style={{ fontSize: "16px", marginTop: "10px" }}>Image</p>
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
            width: "100%",
            padding: "20px",
            marginTop: "15px",
            outline: "none",
            border: "none",
            background: "none",
          }}
          onClick={() => {
            store.showTextElement();
            store.selectText(true);
            setSelectedElement("text");
          }}
        >
          <LuFileText size={24} />
          <p style={{ fontSize: "16px", marginTop: "10px" }}>Text</p>
        </button>

        <button
          style={{
            width: "100%",
            padding: "20px",
            marginTop: "15px",
            outline: "none",
            border: "none",
            background: "none",
          }}
          onClick={() =>
            setActivePanel(
              activePanel === "fontCombinations" ? null : "fontCombinations",
            )
          }
        >
          <LuLayoutTemplate size={24} />
          <p style={{ fontSize: "16px", marginTop: "10px" }}>Templates</p>
        </button>

        <button
          type="button"
          style={{
            width: "100%",
            padding: "20px",
            marginTop: "15px",
            outline: "none",
            border: "none",
            background: "none",
          }}
          onClick={() =>
            setActivePanel(activePanel === "background" ? null : "background")
          }
        >
          <LuPaintBucket size={24} />
          <p style={{ fontSize: "16px", marginTop: "10px" }}>Background</p>
        </button>

        <button
          type="button"
          style={{
            width: "100%",
            padding: "20px",
            marginTop: "15px",
            outline: "none",
            border: "none",
            background: "none",
          }}
          onClick={() =>
            setActivePanel(activePanel === "elements" ? null : "elements")
          }
        >
          <LuShapes size={24} />
          <p style={{ fontSize: "16px", marginTop: "10px" }}>Elements</p>
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
            <div>
              <h4 style={{ marginBottom: "15px" }}>Background Color</h4>
              <HexColorPicker
                color={store.backgroundColor}
                onChange={(color) => store.setBackgroundColor(color)}
                style={{ width: "100%", height: "180px" }}
              />
              <div style={{ marginTop: "15px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    marginBottom: "5px",
                  }}
                >
                  HEX Color
                </label>
                <HexColorInput
                  color={store.backgroundColor}
                  onChange={(color) => store.setBackgroundColor(color)}
                  prefixed
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                <h4 style={{ marginTop: "20px", marginBottom: "10px" }}>
                  Preset Colors
                </h4>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "8px",
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
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activePanel === "elements" && (
            <div
              style={{
                width: "200px",
                marginLeft: "-10px",
              }}
            >
              <h5 style={{ textAlign: "left", margin: "20px" }}>Shapes</h5>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                }}
              >
                <button
                  onClick={(e) => {
                    store.selectSidebarShape("rect");
                    store.addShape(stageWidth / 2, stageHeight / 2);
                    handleElementClick(e);
                  }}
                  style={{
                    outline: "none",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  <svg width="100" height="100" viewBox="0 0 40 40">
                    <rect width="30" height="30" x="8" y="8" fill="#a19f9f " />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    store.selectSidebarShape("circle");
                    store.addShape(stageWidth / 2, stageHeight / 2);
                    handleElementClick(e);
                  }}
                  style={{
                    outline: "none",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  <svg width="100" height="100" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="15" fill="#a19f9f" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    store.selectSidebarShape("ellipse");
                    store.addShape(stageWidth / 2, stageHeight / 2);
                    handleElementClick(e);
                  }}
                  style={{
                    outline: "none",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  <svg width="100" height="100" viewBox="0 0 40 40">
                    <ellipse cx="20" cy="20" rx="18" ry="11" fill="#a19f9f" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    store.selectSidebarShape("triangle");
                    store.addShape(stageWidth / 2, stageHeight / 2);
                    handleElementClick(e);
                  }}
                  style={{
                    outline: "none",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  <svg width="100" height="100" viewBox="0 0 40 40">
                    <polygon
                      points="20,4 36,34 4,34"
                      fill="#a19f9f"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    store.selectSidebarShape("star");
                    store.addShape(stageWidth / 2, stageHeight / 2);
                    handleElementClick(e);
                  }}
                  style={{
                    outline: "none",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  <svg width="100" height="100" viewBox="0 0 40 40">
                    <path
                      d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.785 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"
                      fill="#a19f9f"
                    />
                  </svg>
                </button>
              </div>

              <h5 style={{ textAlign: "left", margin: "20px" }}>Lines</h5>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                }}
              >
                <button
                  onClick={(e) => {
                    store.selectSidebarShape("line");
                    store.addShape(stageWidth / 2, stageHeight / 2);
                    handleElementClick(e);
                  }}
                  style={{
                    outline: "none",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  <svg width="100" height="100" viewBox="0 0 40 40">
                    <line
                      x1="6"
                      y1="20"
                      x2="34"
                      y2="20"
                      stroke="#a19f9f"
                      strokeWidth={1}
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    store.selectSidebarShape("dotted-line");
                    store.addShape(stageWidth / 2, stageHeight / 2);
                    handleElementClick(e);
                  }}
                  style={{
                    outline: "none",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  <svg width="100" height="100" viewBox="0 0 40 40">
                    <line
                      x1="6"
                      y1="20"
                      x2="34"
                      y2="20"
                      stroke="#a19f9f"
                      strokeDasharray="1,5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    store.selectSidebarShape("arrow");
                    store.addShape(stageWidth / 2, stageHeight / 2);
                    handleElementClick(e);
                  }}
                  style={{
                    outline: "none",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  <svg width="100" height="100" viewBox="0 0 40 40">
                    <line
                      x1="4"
                      y1="20"
                      x2="32"
                      y2="20"
                      stroke="#a19f9f"
                      strokeLinecap="round"
                    />
                    <polygon points="32,16 38,20 32,24" fill="#a19f9f" />
                  </svg>
                </button>
              </div>
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
            }}
            onChange={(e) => handleTemplateSelect(e.target.value)}
          >
            <option value="logo-sticker">Logo Sticker (64 * 34 mm)</option>
            <option value="nametag">Name Tags (100 *44.15 mm)</option>
          </select>

          <div style={{ padding: "20px", position: "relative" }}>
            {detectedColor && (
              <span
                onClick={() => setShowColorPicker((prev) => !prev)}
                style={{
                  backgroundColor: detectedColor,
                  display: "inline-block",
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            )}
            {showColorPicker && detectedColor && (
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  left: "0",
                  zIndex: 9999,
                  padding: "25px",
                  margin: "10px",
                }}
              >
                <HexColorPicker
                  color={detectedColor}
                  onChange={(color) => {
                    if (selectedShapeId) {
                      store.updateShapeColor(selectedShapeId, color);
                    } else {
                      store.setBackgroundColor(color);
                    }
                  }}
                  style={{ width: "100%", height: "180px" }}
                />
                <div style={{ width: "250px" }} />
              </div>
            )}
          </div>

          {selectedShape && selectedLine && (
            <div style={{ position: "relative", marginLeft: "5px" }}>
              <button
                type="button"
                onClick={() => setShowStrokeWidth((prev) => !prev)}
                title="Stroke Width"
                style={{
                  width: "40px",
                  height: "40px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>

              {showStrokeWidth && (
                <div
                  style={{
                    position: "absolute",
                    top: "45px",
                    left: "0",
                    width: "200px",
                    padding: "10px",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                    zIndex: 9999,
                  }}
                >
                  <label style={{ fontSize: "14px", textAlign: "left" }}>
                    Stroke Width: {selectedShape.strokeWidth}px
                  </label>

                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={selectedShape.strokeWidth}
                    onChange={(e) =>
                      store.setShapeStroke(
                        selectedShapeId,
                        Number(e.target.value),
                      )
                    }
                    style={{ width: "100%", marginTop: "10px" }}
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            cursor="pointer"
            onClick={handleDeleteSelected}
            disabled={
              !selectedShapeId && !selectedTemplateId && !selectedElement
            }
            style={{
              outline: "none",
              border: "none",
              background: "transparent",
            }}
          >
            <LuTrash2 size={22}></LuTrash2>
          </button>

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
                  name="sticker-background"
                  width={stageWidth}
                  height={stageHeight}
                  fill={store.backgroundColor}
                  onClick={(e) => {
                    setSelectedShapeId(null);
                    handleElementSelect(e);
                    handleElementClick(e);
                  }}
                />

                {store.shapes?.map((shape) => {
                  const isSelected = selectedShapeId === shape.id;

                  const baseProps = {
                    key: shape.id,
                    id: `shape-${shape.id}`,
                    x: shape.x - 25,
                    y: shape.y - 25,
                    scaleX: shape.scaleX,
                    scaleY: shape.scaleY,
                    rotation: shape.rotation,
                    fill: shape.fill,
                    draggable: true,
                    onClick: (e) => {
                      e.cancelBubble = true;
                      setSelectedShapeId(shape.id);
                      handleElementClick(e);
                    },
                    onDragEnd: (e) => {
                      const node = e.target;

                      store.updateShapeTransform(
                        shape.id,
                        node.x() + 25,
                        node.y() + 25,
                        node.scaleX(),
                        node.scaleY(),
                        node.rotation(),
                      );
                    },
                    onTransformEnd: (e) => {
                      const node = e.target;
                      store.updateShapeTransform(
                        shape.id,
                        node.x() + 25,
                        node.y() + 25,
                        node.scaleX(),
                        node.scaleY(),
                        node.rotation(),
                      );
                    },
                  };

                  switch (shape.type) {
                    case "line":
                      return (
                        <Line
                          {...baseProps}
                          points={[0, 0, 500, 0]}
                          stroke={shape.fill}
                          strokeWidth={shape.strokeWidth}
                          hitStrokeWidth={10}
                          lineCap="round"
                        />
                      );

                    case "dotted-line":
                      return (
                        <Line
                          {...baseProps}
                          points={[0, 0, 500, 0]}
                          dash={[2, 8]}
                          stroke={shape.fill}
                          strokeWidth={shape.strokeWidth}
                          hitStrokeWidth={10}
                          lineCap="round"
                        />
                      );

                    case "arrow":
                      return (
                        <Arrow
                          {...baseProps}
                          points={[0, 0, 500, 0]}
                          pointerLength={10}
                          pointerWidth={10}
                          stroke={shape.fill}
                          strokeWidth={shape.strokeWidth}
                          hitStrokeWidth={10}
                          lineCap="round"
                        />
                      );
                  }

                  return (
                    <ShapePatternLoader
                      key={shape.id}
                      url={shape.imageObjectURL}
                    >
                      {(loadedImage) => {
                        let width = shape.imageWidth;
                        let height = shape.imageHeight;

                        let clipX = 0;
                        let clipY = 0;
                        let clipWidth = width;
                        let clipHeight = height;

                        if (
                          ["circle", "ellipse", "triangle", "star"].includes(
                            shape.type,
                          )
                        ) {
                          clipX = -width / 2;
                          clipY = -height / 2;
                        }

                        const clipFunc = (ctx) => {
                          ctx.beginPath();

                          if (shape.type === "rect") {
                            ctx.rect(0, 0, width, height);
                          } else if (shape.type === "circle") {
                            ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
                          } else if (shape.type === "ellipse") {
                            ctx.ellipse(
                              0,
                              0,
                              width / 2,
                              height / 2,
                              0,
                              0,
                              Math.PI * 2,
                            );
                          } else if (shape.type === "triangle") {
                            ctx.moveTo(0, -50);
                            ctx.lineTo(50, 50);
                            ctx.lineTo(-50, 50);
                            ctx.closePath();
                          } else if (shape.type === "star") {
                            const outerRadius = 50;
                            const innerRadius = 25;

                            for (let i = 0; i < 10; i++) {
                              const radius =
                                i % 2 === 0 ? outerRadius : innerRadius;
                              const angle = (Math.PI / 5) * i - Math.PI / 2;

                              const x = Math.cos(angle) * radius;
                              const y = Math.sin(angle) * radius;

                              if (i === 0) {
                                ctx.moveTo(x, y);
                              } else {
                                ctx.lineTo(x, y);
                              }
                            }

                            ctx.closePath();
                          }

                          ctx.clip();
                        };

                        let initialScale = 1;
                        let initialX = clipX;
                        let initialY = clipY;

                        if (loadedImage) {
                          initialScale = Math.max(
                            clipWidth / loadedImage.width,
                            clipHeight / loadedImage.height,
                          );

                          initialX =
                            clipX +
                            (clipWidth - loadedImage.width * initialScale) / 2;

                          initialY =
                            clipY +
                            (clipHeight - loadedImage.height * initialScale) /
                              2;
                        }

                        const imageScaleX = shape.imageScaleX || initialScale;

                        const imageScaleY = shape.imageScaleY || initialScale;

                        const imageX = shape.imageScaleX
                          ? shape.imageX
                          : initialX;

                        const imageY = shape.imageScaleY
                          ? shape.imageY
                          : initialY;

                        const shapeClick = (e) => {
                          e.cancelBubble = true;

                          setSelectedShapeId(shape.id);
                          setSelectedShapeImageId(null);
                          setSelectedElement("shape");

                          store.selectText(false);
                          handleElementClick(e);
                        };

                        return (
                          <Group
                            key={shape.id}
                            id={`shape-${shape.id}`}
                            x={shape.x}
                            y={shape.y}
                            scaleX={shape.scaleX}
                            scaleY={shape.scaleY}
                            rotation={shape.rotation}
                            draggable={selectedShapeImageId !== shape.id}
                            clipFunc={clipFunc}
                            onClick={(e) => {
                              e.cancelBubble = true;
                              handleCanvasOutsideClick(e);
                            }}
                            onDragEnd={(e) => {
                              const node = e.target;
                              store.updateShapeTransform(
                                shape.id,
                                node.x(),
                                node.y(),
                                node.scaleX(),
                                node.scaleY(),
                                node.rotation(),
                              );
                            }}
                            onTransformEnd={(e) => {
                              e.cancelBubble = true;
                              const node = e.target;
                              store.updateShapeTransform(
                                shape.id,
                                node.x(),
                                node.y(),
                                node.scaleX(),
                                node.scaleY(),
                                node.rotation(),
                              );
                            }}
                          >
                            {shape.type === "rect" && (
                              <Rect
                                width={shape.imageWidth}
                                height={shape.imageHeight}
                                fill={loadedImage ? "transparent" : shape.fill}
                                stroke={shape.strokeColor}
                                strokeWidth={shape.strokeWidth}
                                onClick={shapeClick}
                              />
                            )}
                            {shape.type === "circle" && (
                              <Circle
                                x={0}
                                y={0}
                                radius={width / 2}
                                fill={loadedImage ? "transparent" : shape.fill}
                                stroke={shape.strokeColor}
                                strokeWidth={shape.strokeWidth}
                                onClick={shapeClick}
                              />
                            )}
                            {shape.type === "ellipse" && (
                              <Ellipse
                                x={0}
                                y={0}
                                radiusX={width / 2}
                                radiusY={height / 2}
                                fill={loadedImage ? "transparent" : shape.fill}
                                stroke={shape.strokeColor}
                                strokeWidth={shape.strokeWidth}
                                onClick={shapeClick}
                              />
                            )}
                            {shape.type === "triangle" && (
                              <RegularPolygon
                                x={0}
                                y={0}
                                sides={3}
                                radius={50}
                                fill={loadedImage ? "transparent" : shape.fill}
                                stroke={shape.strokeColor}
                                strokeWidth={shape.strokeWidth}
                                onClick={shapeClick}
                              />
                            )}
                            {shape.type === "star" && (
                              <Star
                                x={0}
                                y={0}
                                numPoints={5}
                                innerRadius={25}
                                outerRadius={50}
                                fill={loadedImage ? "transparent" : shape.fill}
                                stroke={shape.strokeColor}
                                strokeWidth={shape.strokeWidth}
                                onClick={shapeClick}
                              />
                            )}

                            {loadedImage && (
                              <Image
                                id={`shape-image-${shape.id}`}
                                image={loadedImage}
                                x={imageX}
                                y={imageY}
                                width={loadedImage.width}
                                height={loadedImage.height}
                                scaleX={imageScaleX}
                                scaleY={imageScaleY}
                                draggable={selectedShapeImageId === shape.id}
                                onClick={(e) => {
                                  e.cancelBubble = true;
                                  handleShapeImageClick(e, shape.id);
                                }}
                                onDragEnd={(e) => {
                                  e.cancelBubble = true;
                                  const node = e.target;
                                  store.updateShapeInnerImageTransform(
                                    shape.id,
                                    node.x(),
                                    node.y(),
                                    node.scaleX(),
                                    node.scaleY(),
                                  );
                                }}
                                onTransformEnd={(e) => {
                                  e.cancelBubble = true;
                                  const node = e.target;
                                  store.updateShapeInnerImageTransform(
                                    shape.id,
                                    node.x(),
                                    node.y(),
                                    node.scaleX(),
                                    node.scaleY(),
                                  );
                                }}
                              />
                            )}

                            {isSelected && (
                              <Html
                                divProps={{
                                  style: {
                                    position: "absolute",
                                    left: `${shape.type === "rect" ? 0 : -50}px`,
                                    top: "-85px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    pointerEvents: "auto",
                                    zIndex: 9999,
                                  },
                                }}
                              >
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedShapeId(shape.id);
                                      setSelectedShapeImageId(shape.id);
                                      shapeImageRef.current?.click();
                                    }}
                                    style={{
                                      padding: "5px 8px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      cursor: "pointer",
                                      background: "#fff",
                                      border: "1px solid #ccc",
                                      borderRadius: "5px",
                                    }}
                                  >
                                    <LuImages size={16} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      store.removeShapeImageOption(shape.id);
                                      setSelectedShapeImageId(null);
                                    }}
                                    style={{
                                      padding: "5px 8px",
                                      color: "red",
                                      cursor: "pointer",
                                      background: "#fff",
                                      border: "1px solid #ccc",
                                      borderRadius: "5px",
                                    }}
                                  >
                                    <LuTrash2 size={16} />
                                  </button>
                                </div>
                              </Html>
                            )}
                          </Group>
                        );
                      }}
                    </ShapePatternLoader>
                  );
                })}

                <Transformer
                  ref={shapeTransformerRef}
                  rotateEnabled
                  enabledAnchors={[
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                    "middle-left",
                    "middle-right",
                    "top-center",
                    "bottom-center",
                  ]}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 10 || newBox.height < 10) return oldBox;
                    return newBox;
                  }}
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
                      handleElementClick(e);
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
                        "middle-left",
                        "middle-right",
                        "top-center",
                        "bottom-center",
                      ]}
                    />
                  )}

                {store.imageObjectURL && (
                  <URLImage
                    ref={imageRef}
                    innerImageRef={innerImageRef}
                    x={40}
                    y={120}
                    frameWidth={store.width}
                    imageWidth={store.imageWidth}
                    imageHeight={store.imageHeight}
                    url={store.imageObjectURL}
                    showCross={selectedElement === "image"}
                    onSelect={() => {
                      setSelectedElement("image");
                      store.selectText(false);
                    }}
                    onDragEnd={(e) => {
                      store.updateInnerImageTransform(
                        e.target.x(),
                        e.target.y(),
                        store.imageWidth,
                        store.imageHeight,
                      );
                    }}
                    onTransformEnd={() => {
                      const node = innerImageRef.current;

                      if (!node) return;

                      const newWidth = Math.max(
                        30,
                        store.width * node.scaleX(),
                      );

                      const newHeight = Math.max(
                        30,
                        node.height() * node.scaleY(),
                      );

                      store.updateImageTransform(newWidth, newHeight);

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
                      "middle-left",
                      "middle-right",
                      "top-center",
                      "bottom-center",
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
                        onClick={(e) => {
                          handleElementClick(e);
                        }}
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
