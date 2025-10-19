import zmq
import json
import os

context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://*:5558") 

def loadUsers():
    if not os.path.exists("users.json"):
        return {}
    
    with open("users.json", "r") as file:
        try:
            return json.load(file)  
        except json.JSONDecodeError:
            return {}

def saveUsers(users):
    with open("users.json", "w") as file:
        json.dump(users, file, indent=4)

def signup(request_data):
    username = request_data.get("username")
    password = request_data.get("password")

    users = loadUsers()

    if username in users:
        return json.dumps({"status": "error", "message": "Username already exists!"})

    users[username] = {"password": password, "likedGames": []}

    saveUsers(users)

    return json.dumps({"status": "success", "message": "User created successfully!"})

def Login(data):
    """User login."""
    username = data.get("username")
    password = data.get("password")

    users = loadUsers()

    if username not in users or users[username]["password"] != password:
        return json.dumps({"status": "error", "message": "Invalid username or password!"})

    return json.dumps({"status": "success", "message": "Login successful!", "likedGames": users[username]["likedGames"]})

print("Profil microservice running on port 5558...")

while True:
    request = socket.recv()
    request_data = json.loads(request.decode("utf-8"))
    print(f"MicroserviceD: Received request from frontend: {request_data}")

    action = request_data.get("action")
    
    if action == "signup":
        response = signup(request_data)
        print(f"MicroserviceD: Sending singup confirmation to frontend.")
    elif action == "login":
        response = Login(request_data)
    else:
        response = json.dumps({"status": "error", "message": "Invalid action!"})

    socket.send_string(response)
