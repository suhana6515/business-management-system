import { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Image, Transformer, Text, Group } from "react-konva";
import { Html } from "react-konva-utils";
import useImage from "use-image";
import RichText from "./RichText";
import { useStickerStore } from "../../stores/useStickerStore";
import { observer } from "mobx-react-lite";

const URLImage = observer(({ element }) => {
  const [image] = useImage(element.url);

  if (!image) return null;

  return (
    <Group
      x={element.x}
      y={element.y}
      clipFunc={(ctx) => {
        ctx.beginPath();
        ctx.arc(
          element.radius,
          element.radius,
          element.radius,
          0,
          Math.PI * 2,
          false,
        );
      }}
    >
      <Image
        image={image}
        width={element.radius * 2}
        height={element.radius * 2}
        draggable
      />
    </Group>
  );
});

const StickerEditor = observer(() => {
  const store = useStickerStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editingNode, setEditingNode] = useState(null);

  const handleUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;
    const reader = new FileReader();

    reader.onload = () => {
      store.addImage(reader.result);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const textRef = useRef(null);
  const transformerRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;

    if (!transformer || !stage) return;

    if (!store.selectedId) {
      transformer.nodes([]);
      return;
    }

    const selectedNode = stage.findOne(`#${store.selectedId}`);

    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [store.selectedId, store.elements.length]);

  const handleTextEdit = (e) => {
    const node = e.target;

    store.selectElement(node.id());

    setEditingNode(node);
    setIsEditing(true);
  };

  const handleTextCommit = useCallback(
    (newText, textStyle) => {
      if (editingNode) {
        store.updateElement(editingNode.id(), {
          value: newText,
          ...textStyle,
        });
      }

      setIsEditing(false);
      setEditingNode(null);
    },
    [editingNode, store],
  );

  const handleTextCancel = useCallback(() => {
    setIsEditing(false);
    setEditingNode(null);
  }, []);

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

    stage.scale({
      x: newScale,
      y: newScale,
    });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
  };

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
          style={{
            cursor: "pointer",
            display: "block",
            padding: "20px",
            marginTop: "15px",
            background: "#f2f2f2",
            borderRadius: "6px",
          }}
          onClick={() => store.addText()}
        >
          Text
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
          width={store.width}
          height={store.height}
          ref={stageRef}
          onWheel={handleWheel}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) {
              store.selectElement(null);
            }
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage()) {
              store.selectElement(null);
            }
          }}
        >
          <Layer>
            {store.elements.map((element) => {
              if (element.type === "text") {
                return (
                  <Text
                    ref={textRef}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    text={element.value}
                    fontSize={element.fontSize}
                    fontStyle={element.fontStyle}
                    textDecoration={element.textDecoration}
                    fill="black"
                    draggable={!isEditing}
                    visible={!isEditing}
                    onClick={() => store.selectElement(element.id)}
                    onDblClick={handleTextEdit}
                    onDragEnd={(e) => {
                      store.updateElement(element.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                      });
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;

                      const width = Math.max(30, node.width() * node.scaleX());

                      node.scaleX(1);
                      node.scaleY(1);

                      store.updateElement(element.id, {
                        x: node.x(),
                        y: node.y(),
                        width,
                      });
                    }}
                  />
                );
              }
              if (element.type === "image") {
                return (
                  <URLImage key={element.id} element={element} store={store} />
                );
              }
            })}

            {isEditing && editingNode && (
              <Html>
                <RichText
                  textNode={editingNode}
                  onCommit={handleTextCommit}
                  onCancel={handleTextCancel}
                />
              </Html>
            )}

            {isEditing && (
              <Transformer
                ref={transformerRef}
                enabledAnchors={["middle-left", "middle-right"]}
              />
            )}
          </Layer>
        </Stage>
      </main>
    </div>
  );
});

export default StickerEditor;
