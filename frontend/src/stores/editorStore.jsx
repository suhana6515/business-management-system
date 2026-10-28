import { types, onSnapshot, getSnapshot, applySnapshot } from "mobx-state-tree";

const TextModel = types.model("TextModel", {
  x: types.optional(types.number, 100),
  y: types.optional(types.number, 100),
  width: types.optional(types.number, 200),
  value: types.optional(types.string, "Edit Text"),
  richHtml: types.optional(types.string, ""),
  fontSize: types.optional(types.number, 24),
  fontStyle: types.optional(types.string, "normal"),
  fontFamily: types.optional(types.string, "Arial"),
  textDecoration: types.optional(types.string, ""),
  fill: types.optional(types.string, "#000000"),
});

const TemplateTextModel = types.model("TemplateText", {
  id: types.identifier,
  value: types.string,
  x: types.number,
  y: types.number,
  fontFamily: types.string,
  fontSize: types.number,
  fontStyle: types.optional(types.string, "normal"),
  fill: types.optional(types.string, "#000000"),
});

const TextGroupModel = types.model("TextGroup", {
  id: types.identifier,
  x: types.number,
  y: types.number,
  texts: types.array(TemplateTextModel),
});

const ShapeModel = types.model("ShapeModel", {
  id: types.identifier,
  x: types.number,
  y: types.number,
  width: types.number,
  height: types.number,
  fill: types.string,
  rotation: types.optional(types.number, 0),
});

const TemplateStateModel = types.model("TemplateState", {
  text: types.optional(TextModel, {}),
  backgroundColor: types.optional(types.string, "#ffffff"),
  textGroups: types.optional(types.array(TextGroupModel), []),
  showText: types.optional(types.boolean, false),
  x: types.optional(types.number, 100),
  y: types.optional(types.number, 100),
  width: types.optional(types.number, 200),
  imageObjectURL: types.maybeNull(types.string),
  shapes: types.optional(types.array(ShapeModel), []),
  scale: types.optional(types.number, 1),
  stageX: types.optional(types.number, 0),
  stageY: types.optional(types.number, 0),
});

const EditorStore = types
  .model("EditorStore", {
    text: types.optional(TextModel, {}),
    backgroundColor: types.optional(types.string, "#ffffff"),
    textGroups: types.optional(types.array(TextGroupModel), []),
    showText: types.optional(types.boolean, false),
    isEditing: types.optional(types.boolean, false),
    isTextSelected: types.optional(types.boolean, false),
    x: types.optional(types.number, 100),
    y: types.optional(types.number, 100),
    width: types.optional(types.number, 200),
    imageObjectURL: types.maybeNull(types.string),
    scale: types.optional(types.number, 1),
    stageX: types.optional(types.number, 0),
    stageY: types.optional(types.number, 0),
    shapes: types.optional(types.array(ShapeModel), []),
    activeTemplate: types.optional(
      types.enumeration("TemplateType", ["logo-sticker", "nametag"]),
      "logo-sticker",
    ),
    logoStickerState: types.optional(TemplateStateModel, {}),
    nametagState: types.optional(TemplateStateModel, {}),
  })
  .actions((self) => ({
    saveCurrentTemplate() {
      const target =
        self.activeTemplate === "nametag"
          ? self.nametagState
          : self.logoStickerState;

      applySnapshot(target, {
        text: getSnapshot(self.text),
        backgroundColor: self.backgroundColor,
        textGroups: getSnapshot(self.textGroups),
        showText: self.showText,
        x: self.x,
        y: self.y,
        width: self.width,
        imageObjectURL: self.imageObjectURL,
        shapes: getSnapshot(self.shapes),
        scale: self.scale,
        stageX: self.stageX,
        stageY: self.stageY,
      });
    },

    switchTemplate(template) {
      if (template !== "logo-sticker" && template !== "nametag") {
        return;
      }

      if (template === self.activeTemplate) return;

      // Save the template being left.
      self.saveCurrentTemplate();

      // Remember the newly selected template.
      self.activeTemplate = template;

      // Restore the selected template's data.
      const source =
        template === "nametag" ? self.nametagState : self.logoStickerState;

      const saved = getSnapshot(source);

      applySnapshot(self.text, saved.text);
      self.backgroundColor = saved.backgroundColor;
      applySnapshot(self.textGroups, saved.textGroups);
      self.showText = saved.showText;
      self.x = saved.x;
      self.y = saved.y;
      self.width = saved.width;
      self.imageObjectURL = saved.imageObjectURL;
      applySnapshot(self.shapes, saved.shapes);
      self.scale = saved.scale;
      self.stageX = saved.stageX;
      self.stageY = saved.stageY;

      self.isEditing = false;
      self.isTextSelected = false;
    },

    setBackgroundColor(color) {
      self.backgroundColor = color;
    },

    updateTemplateText(groupId, textId, newValue) {
      const group = self.textGroups.find((group) => group.id === groupId);

      if (!group) return;

      const text = group.texts.find((text) => text.id === textId);

      if (!text) return;

      text.value = newValue;
    },

    addShape(type) {
      self.shapes.push({
        id: crypto.randomUUID(),
        type,
        x: 150,
        y: 150,
        width: 100,
        height: 100,
        fill: "#000000",
        rotation: 0,
      });
    },

    updateShape(id, updates) {
      const shape = self.shapes.find((s) => s.id === id);

      if (shape) {
        Object.assign(shape, updates);
      }
    },

    deleteShape(id) {
      const shape = self.shapes.find((s) => s.id === id);

      if (shape) {
        self.shapes.remove(shape);
      }
    },

    addTextTemplate(template) {
      self.textGroups.push({
        id: crypto.randomUUID(),
        x: 150,
        y: 150,
        texts: template.texts.map((text) => ({
          ...text,
          id: crypto.randomUUID(),
        })),
      });
    },

    updateTextGroupPosition(id, x, y) {
      const group = self.textGroups.find((group) => group.id === id);

      if (group) {
        group.x = x;
        group.y = y;
      }
    },

    updateTextGroupElement(groupId, textId, value) {
      const group = self.textGroups.find((group) => group.id === groupId);

      const text = group?.texts.find((text) => text.id === textId);

      if (text) {
        text.value = value;
      }
    },

    setFontFamily(fontFamily) {
      self.text.fontFamily = fontFamily;
    },

    setFontStyle(fontStyle) {
      self.text.fontStyle = fontStyle;
    },

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

        if (typeof style.fontFamily === "string") {
          self.text.fontFamily = style.fontFamily;
        }

        if (typeof style.textDecoration === "string") {
          self.text.textDecoration = style.textDecoration;
        }

        if (typeof style.fontColor === "string") {
          self.text.fill = style.fontColor;
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

    deleteTemplateText(groupId) {
      self.textGroups = self.textGroups.filter((group) => group.id !== groupId);
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

    setImageObjectURL(url, x = 150, y = 150) {
      self.imageObjectURL = url;
      self.x = x;
      self.y = y;
      self.width = 200;
    },

    updateImageTransform(x, y, width) {
      self.x = x;
      self.y = y;
      self.width = width;
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
