import { createContext } from "react";
import { stickerStore } from "./StickerStore";

export const StoreContext = createContext(stickerStore);
