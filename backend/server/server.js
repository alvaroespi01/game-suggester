import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import zmq from "zeromq";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


dotenv.config(); 

const app = express();
const PORT = 3001;


app.use(cors());

app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const likedGames = {};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE_PATH = path.resolve(__dirname, '../popular-games.json');
const CACHE_METADATA_PATH = path.resolve(__dirname, '../cache-metadata.json');


const getAccessToken = async () => {
    try {
        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "client_credentials", 
                
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (!response.ok) {
            const errorData = await response.json(); 
            console.error("Error getting access token:", response.status, errorData); 
            throw new Error(`Failed to get access token: ${response.status}`); 
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Error in getAccessToken:", error); 
        return null; 
    }
};

function cacheExpired() {
    try {
      if (!fs.existsSync(FILE_PATH) || !fs.existsSync(CACHE_METADATA_PATH)) {
        return true;
      }
  
      const metadata = JSON.parse(fs.readFileSync(CACHE_METADATA_PATH, "utf-8"));
      const latestUpdate = new Date(metadata.lastUpdated);
      const currentTime = new Date();
      
      // Calculate time difference in hours
      const timeDiff = (currentTime - latestUpdate) / (1000 * 60 * 60);
      
      return timeDiff >= 24;
    } catch (error) {
      console.error("Error checking cache:", error);
      return true; 
    }
  }
  
  function updateCacheTime() {
    const metadata = {
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(CACHE_METADATA_PATH, JSON.stringify(metadata, null, 2), "utf-8");
  }

app.post("/api/games", async (req, res) => {
    try {
        const accessToken = await getAccessToken();

        console.log("Received filters from frontend:", req.body); 

        const { searchQuery, genres, platforms, age_ratings, rating, page = 1 } = req.body; 
        const limit = 10;
        const offset = (page - 1) * limit;

        let where = "aggregated_rating != null & genres.name != null";

        if (searchQuery) {
            where += ` & name ~ *"${searchQuery}"*`;  
        }
        if (platforms) {
            where += ` & platforms.name = "${platforms}"`;
        }
        if (genres) {
            const sanitizedGenre = genres.replace(/[^a-zA-Z0-9 ]/g, ""); 
            where += ` & genres.name = "${sanitizedGenre}"`;  
        }
        if (age_ratings) {
            where += ` & age_ratings.rating = ${age_ratings}`; 
        }
        if (rating) {
            if (rating === "90") {
                where += ` & aggregated_rating >= 90`;
            } else if (rating === "75") {
                where += ` & aggregated_rating >= 75 & aggregated_rating < 90`;
            } else if (rating === "60") {
                where += ` & aggregated_rating >= 60 & aggregated_rating < 75`;
            } else if (rating === "45") {
                where += ` & aggregated_rating >= 45 & aggregated_rating < 60`;
            } else if (rating === "30") {
                where += ` & aggregated_rating >= 30 & aggregated_rating < 45`;
            }
        }

        // console.log("Final IGDB Query:", where); 

        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": CLIENT_ID,
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: `fields name, genres.name, platforms.name, slug, aggregated_rating, age_ratings.rating, cover.image_id; where ${where}; limit ${limit}; offset ${offset};`
        });

        const data = await response.json();
        console.log("IGDB API Response:", data); 
        res.json(data);
    } catch (error) {
        console.error("Error getting games:", error);
        res.status(500).json({ error: "Failed to get games" });
    }
});

app.post("/export-csv", async (req, res) => {
    const json_data = req.body;
    console.log("Received data to export:", json_data); 

    try {
        const socket = new zmq.Request(); 
        
        await socket.connect("tcp://localhost:5555"); 
        
        console.log("Sending data to microservice...");

        await socket.send(JSON.stringify(json_data));
        const [csv_data] = await socket.receive();

        const emailSocket = new zmq.Request();
        await emailSocket.connect("tcp://localhost:5557");

        const emailMessage = {
            Type: "event",
            Date: new Date().toISOString(),
            detail: "CSV export was completed."
        };
        console.log("Sending email request to microservice...");
        await emailSocket.send(JSON.stringify(emailMessage));

        const [emailResponse] = await emailSocket.receive();
        console.log("Email microservice response:", emailResponse.toString());

        res.setHeader('Content-Disposition', 'attachment; filename=recommended_games.csv');
        res.set('Content-Type', 'text/csv');
        res.send(csv_data.toString());
    } catch (error) {
        console.error("Error exporting to CSV:", error);
        res.status(500).json({ error: "Failed to export to CSV" });
    }
});

app.post("/send-email", async (req, res) => {
    try {
        const socket = new zmq.Request();
        await socket.connect("tcp://localhost:5557");

        console.log("Sending email request to microservice...");
        await socket.send(JSON.stringify(req.body));

        const [response] = await socket.receive();
        res.json({ message: response.toString() });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

app.post("/api/like-game", async (req, res) => {
    //Adding are removing games. 
    const { action, username, game } = req.body;
    const gameTitle = { ...game, title: game.name };

    if (!username || !game || !action) {
        return res.status(400).json({ error: "Username, game, and action are required" });
    }

    if (!likedGames[username]) {
        likedGames[username] = [];
    }

    if (action === "add" && !likedGames[username].some(g => g.id === game.id)) {
        likedGames[username].push(game);
    } else if (action === "remove") {
        likedGames[username] = likedGames[username].filter(g => g.id !== game.id);
    }

    console.log(`Sending "${action}" request for game:`, { username, gameTitle });

    try {
        const likeGameSocket = new zmq.Request();
        await likeGameSocket.connect("tcp://localhost:5000");

        console.log(`Sending "${action}" request to microservice:`, {
            action,
            username,
            game: gameTitle,
        });

        await likeGameSocket.send(
            JSON.stringify({
                action, 
                username,
                game: gameTitle,
            })
        );

        const [response] = await likeGameSocket.receive();
        const responseData = JSON.parse(response.toString());

        console.log("Received response from microservice:", responseData);
        res.json({
            message: `Game ${action}ed successfully`,
            likedGames: likedGames[username],
            response: responseData,
        });

    } catch (error) {
        console.error("Error in route:", error);
        res.status(500).json({ error: `Failed to ${action} game` });
    }
});

app.get("/liked-games", (req, res) => {
    const { username } = req.query;
    if (!username || !likedGames[username]) {
        return res.status(404).json({ message: "No liked games found for user." });
    }

    res.json(likedGames[username]); 
});


app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    try {
        const socket = new zmq.Request();
        await socket.connect("tcp://localhost:5558");

        await socket.send(JSON.stringify({ action: "signup", username, password }));
        const [response] = await socket.receive();
        const data = JSON.parse(response.toString());

        if (data.status === "success") {
            res.json({ message: data.message });
        } else {
            res.status(400).json({ error: data.message });
        }
    } catch (error) {
        console.error("Error with microservice:", error);
        res.status(500).json({ error: "Signup unavailable" });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const socket = new zmq.Request();
        await socket.connect("tcp://localhost:5558");

        await socket.send(JSON.stringify({ action: "login", username, password }));
        const [response] = await socket.receive();
        const data = JSON.parse(response.toString());

        if (data.status === "success") {
            res.json({ message: data.message, likedGames: data.likedGames });
        } else {
            res.status(400).json({ error: data.message });
        }
    } catch (error) {
        console.error("Error with microservice:", error);
        res.status(500).json({ error: "Login unavailable" });
    }
});

app.post("/api/popular-games", async (req, res) => {
    try {
      // Only get new data if cache is expired
      if (cacheExpired()) {
        console.log("Cache expired or not found. Getting fresh popular games data.");
        const accessToken = await getAccessToken();
  
        const mostPopularRes = await fetch("https://api.igdb.com/v4/popularity_primitives", {
          method: "POST",
          headers: {
            "Client-ID": CLIENT_ID,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: `fields game_id,value,popularity_type; sort value desc; where popularity_type = 3; limit 10;`
        });
  
        const mostPlayed = await mostPopularRes.json();
  
        if (!mostPlayed || mostPlayed.length === 0) {
          return res.status(404).json({ error: "No popular games found" });
        }
  
        const gameIds = mostPlayed.map(item => item.game_id);
  
        const gameInfoRes = await fetch("https://api.igdb.com/v4/games", {
          method: "POST",
          headers: {
            "Client-ID": CLIENT_ID,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: `fields name,platforms.name, slug, aggregated_rating, age_ratings.rating, cover.image_id, id; where id = (${gameIds.join(",")});`
        });
  
        const gameDetails = await gameInfoRes.json();
  
        fs.writeFile(FILE_PATH, JSON.stringify(gameDetails, null, 2), { encoding: "utf-8" }, (err) => {
            if (err) {
                console.error("Error writing cache:", err);
            } else {
                console.log("Cache updated successfully.");
            }
        });
                
        updateCacheTime();
        
        console.log("Cache updated successfully.");
      } else {
        console.log("Using cached popular games data.");
      }
  
      const sock = new zmq.Request();
      await sock.connect("tcp://localhost:5559");
  
      await sock.send(JSON.stringify({ action: "get_top_games" }));
      
      const [result] = await sock.receive();
      const microserviceData = JSON.parse(result.toString());
      
      res.json(microserviceData);
    } catch (error) {
      console.error("Error getting popular games:", error);
      res.status(500).json({ error: "Failed to get popular games" });
    }
  });

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
