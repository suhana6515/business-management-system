import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProductPage from "./pages/ProductPage";
import ReadymadeStickerPage from "./pages/ReadymadeStickerPage";
import CustomStickerPage from "./pages/CustomStickerPage";

function App() {
  return (
    <>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<ProductPage />} />
          <Route
            path="/readymade-stickers"
            element={<ReadymadeStickerPage />}
          />
          <Route path="/custom-stickers" element={<CustomStickerPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
