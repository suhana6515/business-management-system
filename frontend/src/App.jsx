import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProductPage from "./pages/ProductPage";
import ReadymadeStickerPage from "./pages/ReadymadeStickerPage";

function App() {
  return (
    <>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<ProductPage />} />
          <Route path="readymade-stockers" element={ReadymadeStickerPage} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
