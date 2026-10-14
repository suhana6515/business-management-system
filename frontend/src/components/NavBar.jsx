import { Link } from "react-router-dom";
import { MdSearch } from "react-icons/md";

function NavBar() {
  return (
    <div className="nav-bar">
      <Link to="/">
        <h3>HOP & SHOP</h3>
      </Link>
      <span className="category-label">
        <Link to="readymade-stickers">
          <h4>Readymade Stickers</h4>
        </Link>
        <Link to="custom-stickers">
          <h4>Custom Stickers</h4>
        </Link>
      </span>
      <form className="search-form">
        <MdSearch className="search-icon" />
        <input type="text" placeholder="Search" className="search-input" />
      </form>
    </div>
  );
}

export default NavBar;
