import zmq
import json
import os

context = zmq.Context()
socket = context.socket(zmq.REP)  
socket.bind("tcp://*:5000") 

def loadUsers():
    if not os.path.exists("users.json"):
        return {}

    with open("users.json", "r") as file:
        try:
            data = json.load(file)
            return data if isinstance(data, dict) else {}
        except json.JSONDecodeError:
            return {}

def saveUsers(users):
    with open("users.json", "w") as file:
        json.dump(users, file, indent=4)

def likeRequest(request):
    try:
        data = json.loads(request)
        action = data.get("action") 
        username = data.get("username")
        game = data.get("game")

        if not username or not game:
            return json.dumps({"message": "Username and game are required."})

        users = loadUsers() 

        if username not in users:
            users[username] = {"password": "", "likedGames": []}  

        if action == "add":
            already_liked = any(liked_game['id'] == game['id'] for liked_game in users[username]['likedGames'])
            if already_liked:
                return json.dumps({"message": f"{game['title']} is already in your liked games."})
            else:
                users[username]["likedGames"].append(game)
                saveUsers(users)  
                return json.dumps({"message": f"{game['title']} has been liked!"})

        elif action == "remove":
            users[username]["likedGames"] = [
                liked_game for liked_game in users[username]["likedGames"] if liked_game["id"] != game["id"]
            ]
            saveUsers(users)  
            return json.dumps({"message": f"{game['title']} has been removed!"})

        else:
            return json.dumps({"message": "Invalid action. Use 'add' or 'remove'."})

    except Exception as e:
        return json.dumps({"message": f"Error: {str(e)}"})

print("Like Games microservice running on port 5000...")

while True:
    request = socket.recv()  
    print(f"MicroserviceB: Received request from frontend.")

    response = likeRequest(request)
    print(f"MicroserviceB: Received request from frontend:")

    socket.send(response.encode("utf-8"))  
