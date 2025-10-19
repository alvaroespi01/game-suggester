import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [likedGames, likedGame] = useState([]);
    
    const normGame = (game) => {
        return typeof game === "string" ? { id: game, name: game } : game;
    };
    
    useEffect(() => {
        const username = localStorage.getItem("currentUser");
    
        if (!username) {
            navigate("/login"); 
        } else {
            setUsername(username);
    
            const users = JSON.parse(localStorage.getItem("users")) || {};
            const currentUser = users[username];
    
            if (currentUser) {
                let localGames = currentUser.likedGames.map(normGame) || [];
                likedGame(localGames); 
    
                const gamesLIked = async () => {
                    try {
                        const response = await fetch(`http://localhost:3001/liked-games?username=${username}`);
                        const data = await response.json();
    
                        const mergedGames = [...new Map([...localGames, ...data].map(game => [game.id, game])).values()];
                        
                        likedGame(mergedGames);
    
                        currentUser.likedGames = mergedGames;
                        users[username] = currentUser;
                        localStorage.setItem("users", JSON.stringify(users));
    
                    } catch (error) {
                        console.error("Error getting liked games:", error);
                    }
                };
    
                gamesLIked();
            } else {
                console.error("User not found in localStorage:", username);
            }
        }
    }, [navigate]);
    

    const esrbRating = {
        8: "E (Everyone)", 
        10: "T (Teen)", 
        11: "M (Mature)", 
    };

    const getESRB = (ratings) => {
        const filtered = ratings
            .map((rating) => esrbRating[rating]) 
            .filter(Boolean); 
        return filtered.length > 0 ? filtered.join(", ") : "";
    };

    const platformCat = {
        6: "PC (Windows)", 
        48: "PlayStation 4", 
        167: "PlayStation 5",
        49: "Xbox One", 
        169: "Xbox Series X/S",
        130: "Switch"
    };

    const getConsoles = (platforms) => {
        if (!platforms || platforms.length === 0) return "Other";
    
        const platformFilter = platforms.map(p => platformCat[p] || "Other");
        
        return [...new Set(platformFilter)].join(", ");
    };

    const getStars = (rating) => {
        if (rating >= 90) return "★★★★★";  
        if (rating >= 75) return "★★★★";   
        if (rating >= 60) return "★★★";     
        if (rating >= 45) return "★★";     
        if (rating >= 30) return "★";       
        return "";  
    };

    const logout = () => {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("likedGames"); 
        navigate("/");
    };

    const removeGames = async (game) => {
        const users = JSON.parse(localStorage.getItem("users")) || {};
        const username = localStorage.getItem("currentUser"); 
        const currentUser = users[username];
    
        if (!username || !currentUser) {
            alert("Incorrect username or password. Please try again.");
            return;
        }
    
        const confrimRemoval = window.confirm(`Are you sure you want to remvoe ${game.name} from you profile?`);

        if (!confrimRemoval){
            return;
        }

        const updatedLikedGames = currentUser.likedGames.filter((g) => g.id !== game.id);
    
        currentUser.likedGames = updatedLikedGames;
        users[username] = currentUser;
        localStorage.setItem("users", JSON.stringify(users));
    
        likedGame(updatedLikedGames);
    
        try {
            const response = await fetch("http://localhost:3001/api/like-game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    action: "remove",
                    username, 
                    game 
                }),
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log("Game successfully revmoed:", result.message);
            } else {
                console.error("Error removing game:", response.statusText);
            }
        } catch (error) {
            console.error("Error updating liked games:", error);
        }
    };

    return (
        <>
            <h2>Welcome, {username}</h2>
            <button onClick={logout}>Logout</button>

            <h3>Your Liked Games</h3>
            {likedGames.length > 0 ? (
                <ul className="profile-games">
                    {likedGames.map((game) => (
                        <li key={game.id} className="game-info">
                            <h3>{game.title || game.name}</h3>
                            <p>Genre: {game.genres?.map(genres => genres.name).join(', ') || "Unknown"}</p>
                            <p>Platforms: {getConsoles(game.platforms?.map(p => p.id))}</p>
                            <p>ESRB Rating: {getESRB(game.age_ratings?.map(a => a.rating))}</p>
                            <p>Critic Rating: {getStars(game.aggregated_rating)}</p>
                            <p>
                                <button 
                                    onClick={() => removeGames(game)} 
                                    className="remove-button">
                                    Remove
                                </button>
                            </p>    
                            {game.cover && (
                                <a 
                                    href={`https://www.igdb.com/games/${game.slug}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        const externalConfirm = window.confirm("You are leaving this site for an external page. Continue?");
                                        if (!externalConfirm) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    <img 
                                        src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`} 
                                        alt={game.name} 
                                    />
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No liked games yet.</p>
            )}
        </>
    );
}

export default ProfilePage;
