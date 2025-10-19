import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

function HomePage() {
    const [filters, setFilters] = useState({
        genres: "",
        platforms: "",
        rating: "",
        age_rating: "",
        searchQuery: "",
    });
    
    const [topGames, setTopGames] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const topGames = async () => {
            try {
                console.log("Frontend: Rquesting trending games from microserviceC...")
                const response = await fetch("http://localhost:3001/api/popular-games", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
        
                const data = await response.json();
                console.log("Frontend: Received data from server via microserviceC");
                console.log("Top Games Data:", data);
                setTopGames(data || []);
            } catch (error) {
                console.error("Error getting info from microservice:", error);
            }
        };
        topGames();
    }, []);
    
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

    const passFilters = (event) => {
        const { name, value } = event.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const passSearch = () => {
        const queryParams = new URLSearchParams();

        console.log("Sending filters to API:", JSON.stringify(filters, null, 2));

        if (filters.searchQuery) queryParams.append("search", filters.searchQuery);
        if (filters.genres) queryParams.append("genres", filters.genres);
        if (filters.platforms) queryParams.append("platforms", filters.platforms);
        if (filters.rating) queryParams.append("rating", filters.rating);
        if (filters.age_rating) queryParams.append("age_ratings", filters.age_rating);

        navigate(`/recommendedGames?${queryParams.toString()}`);
    };

    return (
        <>
            <h2>Find Your Perfect Game</h2>
            <p>Enter a game title (e.g. "Zelda", "Call of Duty") to search for a game by title.</p>
        
            <section className="search-bar">
                <input
                    type="text"
                    name="searchQuery"
                    placeholder="Search for a game..."
                    value={filters.searchQuery}
                    onChange={passFilters}
                    className="search-input"
                />
                <button 
                    onClick={passSearch} 
                    className="search-button" 
                    aria-label="Click to search for a game">
                    Search &nbsp;
                    <Icon icon="pixelarticons:search" />
                </button>
            </section>

            <p className="filter-gap1">Alternatively, use the dropdowns below to filter by genre, platform, rating, and age ratings to narrow your search.</p>
            <p className="filter-gap2">Or press "Search" to browse all games.</p>
            <section className="filters">
                <div className="filter-item">
                    <label>
                        <div className="tooltip">
                            Genre
                            <span className="tooltiptext">Filter by Genre: Helps you find games that match your specific interests.</span>
                        </div>
                    </label>
                    <select name="genres" value={filters.genres} onChange={passFilters}>
                        <option value="">All</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Arcade">Arcade</option>
                        <option value="Card & Board Game">Card & Board Game</option>
                        <option value="Fighting">Fighting</option>
                        <option value="Hack and slash/Beat 'em up">Hack and slash/Beat 'em up</option>
                        <option value="Indie">Indie</option>
                        <option value="MOBA">MOBA</option>
                        <option value="Music">Music</option>
                        <option value="Pinball">Pinball</option>
                        <option value="Platform">Platform</option>
                        <option value="Point-and-click">Point-and-click</option>
                        <option value="Puzzle">Puzzle</option>
                        <option value="Quiz/Trivia">Quiz/Trivia</option>
                        <option value="Racing">Racing</option>
                        <option value="Real Time Strategy (RTS)">Real Time Strategy (RTS)</option>
                        <option value="Role-playing (RPG)">Role-playing (RPG)</option>
                        <option value="Shooter">Shooter</option>
                        <option value="Simulator">Simulator</option>
                        <option value="Sport">Sport</option>
                        <option value="Strategy">Strategy</option>
                        <option value="Tactical">Tactical</option>
                        <option value="Turn-based strategy (TBS)">Turn-based strategy (TBS)</option>
                        <option value="Visual Novel">Visual Novel</option>
                    </select>
                </div>

                <div className="filter-item">
                    <label>
                        <div className="tooltip">
                            Platform
                            <span className="tooltiptext">Filter by Platform: Ensures compatibility with your gaming system.</span>
                        </div>
                    </label>
                    <select name="platforms" value={filters.platforms} onChange={passFilters}>
                        <option value="">All</option>
                        <option value="PC (Microsoft Windows)">PC (Windows)</option>
                        <option value="PlayStation 4">PlayStation 4</option>
                        <option value="PlayStation 5">PlayStation 5</option>
                        <option value="Nintendo Switch">Switch</option>
                        <option value="Xbox One">Xbox One</option>
                        <option value="Xbox Series X|S">Xbox Series X|S</option>
                    </select>
                </div>

                <div className="filter-item">
                    <label>
                        <div className="tooltip">
                            ESRB Rating
                            <span className="tooltiptext">Filter by ESRB Rating: Find games suitable for your age group.</span>
                        </div>
                    </label>
                    <select name="age_rating" value={filters.age_rating} onChange={passFilters}>
                        <option value="">All</option>
                        <option value="8">Everyone</option>
                        <option value="10">Teen</option>
                        <option value="11">Mature</option>
                    </select>
                </div>

                <div className="filter-item">
                    <label>
                        <div className="tooltip">
                            Critic Rating
                            <span className="tooltiptext">Filter by Critic Rating: Discover top-rated games.</span>
                        </div>
                    </label>
                    <select name="rating" value={filters.rating} onChange={passFilters}>
                        <option value="">Any</option>   
                        <option value="90">★★★★★</option>
                        <option value="75">★★★★</option>
                        <option value="60">★★★</option>
                        <option value="45">★★</option>
                        <option value="30">★</option>
                    </select>
                </div>
            </section>

            <section className="search">
                <button onClick={passSearch} className="search-button">
                    Search &nbsp;
                    <Icon icon="pixelarticons:search" />
                </button>
            </section>
            <p>Note: Searching with multiple filters or broad keywords might take a bit longer, depending on the number of results. Please be patient while the best games are gathered for you.</p>

            <section className="top-games">
                <h3>Top 10 Most Played Games</h3>
                <ul className = "trending-games">
                    {topGames.length > 0 ? (
                        topGames.map((game, index) => (
                            <li key={index} className="game-info">
                                <h4>{game.name}</h4>
                                <p>Platforms: {getConsoles(game.platforms?.map(p => p.id))}</p>
                                <p>ESRB Rating: {getESRB(game.age_ratings?.map(a => a.rating))}</p>
                                <p>Critic Rating: {getStars(game.aggregated_rating)}</p>
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
                        ))
                    ) : (
                        <p>Loading top games...</p>
                    )}
                </ul>
            </section>
        </>
    );
}

export default HomePage;
