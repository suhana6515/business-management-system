import { types } from "mobx-state-tree";

const TextModel = types.model("Text", {
  id: types.identifier,
  type: types.literal("text"),
  text: types.string,
  x: types.number,
  y: types.number,
  width: types.number,
  fontSize: types.number,
  fontFamily: types.string,
  textDecoration: types.string,
  fill: types.string,
});

const ImageModel = types.model("URL Image", {
  id: types.identifier,
  type: types.literal("text"),
  x: types.number,
  y: types.number,
  radius: types.number,
  url: types.string,
});

const StickerStore = types
  .model("StickerStore", {
    width: types.optional(types.number, 400),
    height: types.optional(types.number, 200),
    backgroundColor: types.optional(types.string, "#ffffff"),

    elements: types.array(types.union(TextModel, ImageModel)),

    selectedId: types.maybeNull(types.string),
  })
  .actions((self) => ({
    addText() {
      self.elements.push({
        id: crypto.randomUUID(),
        type: "text",
        text: "Double click to edit",
        x: 50,
        y: 50,
        width: 200,
        fontSize: 24,
        fontFamily: "Arial",
        textDecoration: "",
        fill: "#000000",
        rotation: 0,
      });
    },

    addImage(src) {
      self.elements.push({
        id: crypto.randomUUID(),
        type: "image",
        src,
        x: 50,
        y: 50,
        width: 150,
        height: 150,
        rotation: 0,
      });
    },

    selectElement(id) {
      self.selectedId = id;
    },

    updateElement(id, updates) {
      const element = self.elements.find((item) => item.id === id);

      if (element) {
        Object.assign(element, updates);
      }
    },
  }));

export const stickerStore = StickerStore.create({});
