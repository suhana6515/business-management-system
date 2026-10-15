import { types, onSnapshot } from "mobx-state-tree";

const TextModel = types.model("TextModel", {
  x: types.optional(types.number, 100),
  y: types.optional(types.number, 100),
  width: types.optional(types.number, 200),
  value: types.optional(types.string, "Edit Text"),
  richHtml: types.optional(types.string, ""),
  fontSize: types.optional(types.number, 24),
  fontStyle: types.optional(types.string, "normal"),
  textDecoration: types.optional(types.string, ""),
});

const EditorStore = types
  .model("EditorStore", {
    text: types.optional(TextModel, {}),
    showText: types.optional(types.boolean, false),
    isEditing: types.optional(types.boolean, false),
    isTextSelected: types.optional(types.boolean, false),
    imageObjectURL: types.maybeNull(types.string),
    scale: types.optional(types.number, 1),
    stageX: types.optional(types.number, 0),
    stageY: types.optional(types.number, 0),
  })
  .actions((self) => ({
    showTextElement() {
      self.showText = true;
      self.isEditing = false;
      self.isTextSelected = true;
    },

    selectText(value) {
      self.isTextSelected = value;
    },

    startEditing() {
      self.isEditing = true;
      self.isTextSelected = false;
    },

    commitText(value, style, html) {
      self.text.value = value;
      self.text.richHtml = html ?? "";

      if (style) {
        if (typeof style.fontSize === "number") {
          self.text.fontSize = style.fontSize;
        }

        if (typeof style.fontStyle === "string") {
          self.text.fontStyle = style.fontStyle;
        }

        if (typeof style.textDecoration === "string") {
          self.text.textDecoration = style.textDecoration;
        }
      }

      self.isEditing = false;
      self.isTextSelected = true;
    },

    cancelEditing() {
      self.isEditing = false;
      self.isTextSelected = true;
    },

    deleteText() {
      self.showText = false;
      self.isEditing = false;
      self.isTextSelected = false;
      self.text.richHtml = "";
    },

    deleteImage() {
      self.imageObjectURL = null;
    },

    updateTextPosition(x, y) {
      self.text.x = x;
      self.text.y = y;
    },

    updateTextTransform(x, y, width) {
      self.text.x = x;
      self.text.y = y;
      self.text.width = width;
    },

    setImageObjectURL(url) {
      self.imageObjectURL = url;
    },

    updateStage(scale, x, y) {
      self.scale = scale;
      self.stageX = x;
      self.stageY = y;
    },
  }));

const STORAGE_KEY = "sticker-editor-state";

function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export const editorStore = EditorStore.create(loadSavedState());

onSnapshot(editorStore, (snapshot) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.error("Could not save sticker editor state.", error);
  }
});
