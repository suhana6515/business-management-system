import { useNavigate, Link } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();

  const handleNavigation = (event) => {
    const targetURL = event.target.value;
    if (targetURL) {
      navigate(targetURL);
    }
  };

  return (
    <div className="nav-bar">
      <Link to="/">HOP & SHOP</Link>
      <select name="category" id="category" onChange={handleNavigation}>
        <option value="">Select a category</option>
        <option value="/readymade-stickers">Readymade Stickers</option>
        <option value="/Custom Stickers">Custom Stickers</option>
      </select>
    </div>
  );
}

export default NavBar;
