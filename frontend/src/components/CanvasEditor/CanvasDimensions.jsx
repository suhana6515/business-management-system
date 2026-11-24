export const MM_TO_PX = 300 / 25.4;
export const getCanvasDimensions = (stickerType) => {
  switch (stickerType) {
    case "nametag":
      return {
        width: 100,
        height: 44.15,
        cols: 2,
        rows: 6,
        marginLeft: 5 * MM_TO_PX,
        marginTop: 13.5 * MM_TO_PX,
        gapX: 0,
        gapY: 1.2 * MM_TO_PX,
      };

    case "logo-sticker":
    default:
      return {
        width: 64,
        height: 34,
        cols: 3,
        rows: 8,
        marginLeft: 7 * MM_TO_PX,
        marginTop: 12.5 * MM_TO_PX,
        gapX: 2.0 * MM_TO_PX,
        gapY: 0,
      };
  }
};
