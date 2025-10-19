import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";


function RecommendedGames() {
    const [games, setGames] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoad] = useState(false);
    const [exporting, setExporting] = useState(false);
    const location = useLocation();
 
    const searchParams = new URLSearchParams(location.search);
    const filters = {
        searchQuery: searchParams.get("search") || "",
        genres: searchParams.get("genres") || "",
        platforms: searchParams.get("platforms") || "",
        rating: searchParams.get("rating") || "",
        age_ratings: searchParams.get("age_ratings") || "",
    };

    const gamesLiked = async (game) => {
        try {
            console.log("Sending like request for game:", game);
    
            const username = localStorage.getItem("currentUser");
            if (!username) {
                alert("You must be logged in to like a game.");
                return;
            }
    
            const users = JSON.parse(localStorage.getItem("users")) || {};
            const currentUser = users[username];
    
            if (!currentUser) {
                alert("User data not found. Please log in again.");
                return;
            }
    
            if (!currentUser.likedGames.some(g => g.id === game.id)) {
                currentUser.likedGames.push(game);
    
                users[username] = currentUser;
                localStorage.setItem("users", JSON.stringify(users));
    
                alert(`${game.name} has been liked!`);
            } else {
                alert(`${game.name} is already liked!`);
                return;
            }
    
            console.log("Updated localStorage:", users);
    
            const response = await fetch('/api/like-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: "add",
                    username,
                    game,
                }),
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log("Game liked successfully:", data);
            } else {
                console.error("Error liking game:", response.statusText);
                alert("Error liking game. Please try again.");
            }
        } catch (error) {
            console.error("Error liking game:", error);
            alert("An error occurred while liking the game.");
        }
    };    
        
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
        return ;  
    };

    const getGames = async (pageNumber) => {
        try {
            setLoad(true);
            console.log("Sending filters to API:", filters);
            const response = await fetch(`/api/games`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({...filters, page: pageNumber}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            setGames((prevGames) => [...prevGames, ...data]);
            setLoad(false);
            setGames(data);
        } catch (error) {
            console.error("Error getting games:", error);
        }
    };

    useEffect(() => {
        setGames([]); 
        setPage(1); 
        getGames(1);
    }, [location.search]); 

    const nextPages = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        getGames(nextPage);

        setTimeout(() => {
            window.scrollTo({top: 0, behavior: "smooth"});
        }, 100);
    };

    const exportGames = async () => {
        if (games.length === 0) return alert("No games to export!");
        setExporting(true);
    
        try {
            const response = await fetch("http://127.0.0.1:3001/export-csv", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(games),
            });
    
            if (!response.ok) throw new Error("Failed to export");
    
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "data.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error("Export failed:", error);
        }
    
        setExporting(false);
    };
    
    
    return (
        <div>
            <h2>Recommended Games</h2>
            <ul className="recommended-games">
                {games.map((game) => (
                    <li key={game.id} className="game-info">
                        <h3>{game.name}</h3>
                        <p>Genre: {game.genres?.map(genres => genres.name).join(', ') || "Unknown"}</p>
                        <p>Platforms: {getConsoles(game.platforms?.map(p => p.id))}</p>
                        <p>ESRB Rating: {getESRB(game.age_ratings?.map(a => a.rating))}</p>
                        <p>Critic Rating: {getStars(game.aggregated_rating)}</p>
                        <div className="recToolTip">
                            <button onClick={() => gamesLiked(game)} className="like-button">                    
                                <Icon icon="pixelarticons:plus"/>
                                <span className="rectooltiptext">Add to your profile game list.</span>
                            </button>
                        </div>
                        {game.cover && (
                            <a 
                                href={`https://www.igdb.com/games/${game.slug}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                    const extnalConfirm = window.confirm("You are leaving this site for an external page. Continue?");
                                    if (!extnalConfirm) {
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
            <div className="nextPageContainer">
                {loading ? <p>Loading...</p> : <button onClick={nextPages} className="next-page">Load More</button>}
            </div>
            <button onClick={exportGames} disabled={exporting} className="export-button">
                {exporting ? "Exporting..." : "Export to CSV"}
            </button>
        </div>
    );
}

export default RecommendedGames;