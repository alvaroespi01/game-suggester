import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const loggedIn = localStorage.getItem("currentUser") !== null;

  const handleProfileClick = () => {
    if (!loggedIn) {
      navigate("/loginPage"); 
    } else {
      navigate("/profile"); 
    }
  };

  return (
    <>
      <nav>
        {location.pathname === "/recommendedGames" && (
          <button onClick={() => navigate("/", { replace: false })} className="nav-icon">
            <Icon icon="pixelarticons:undo" />
          </button>
        )}

        <Link to="/">
          <Icon icon="pixelarticons:home" />
        </Link>

        {!loggedIn && (
          <Link to="/loginPage">
            <Icon icon="pixelarticons:login" />
          </Link>
        )}

        <button onClick={handleProfileClick} className="nav-icon">
          <Icon icon="pixelarticons:user" />
        </button>
      </nav>
    </>
  );
}

export default Navigation;
