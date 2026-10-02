function NavBar() {
  return (
    <div className="nav-bar">
      <h3>HOP & SHOP</h3>
      <select name="category" id="category">
        <label for="category" id="category-types">
          Category
          <option value="Readymade Stickers">Readymade Stickers</option>
          <option value="Custom Stickers">Custom Stickers</option>
        </label>
      </select>
    </div>
  );
}

export default NavBar;
