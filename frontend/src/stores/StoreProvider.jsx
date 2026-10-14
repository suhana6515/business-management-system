import { StoreContext } from "./StoreContext";
import { stickerStore } from "./StickerStore";

export const StoreProvider = ({ children }) => {
  return (
    <StoreContext.Provider value={stickerStore}>
      {children}
    </StoreContext.Provider>
  );
};
