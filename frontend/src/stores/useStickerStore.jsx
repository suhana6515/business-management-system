import { useContext } from "react";
import { StoreContext } from "./StoreContext";

export const useStickerStore = () => {
  return useContext(StoreContext);
};
