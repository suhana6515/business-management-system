import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProductPage from "./pages/ProductPage";
import ReadymadeStickerPage from "./pages/ReadymadeStickerPage";
import CustomStickerPage from "./pages/CustomStickerPage";
import { StoreProvider } from "./stores/StoreProvider";

function App() {
  return (
    <>
      <BrowserRouter>
        <StoreProvider>
          <NavBar />
          <Routes>
            <Route path="/" element={<ProductPage />} />
            <Route
              path="/readymade-stickers"
              element={<ReadymadeStickerPage />}
            />
            <Route path="/custom-stickers" element={<CustomStickerPage />} />
          </Routes>
        </StoreProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
