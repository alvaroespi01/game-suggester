import zmq
import json
import os

GAMES_FILE = "../popular-games.json"

context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://*:5559")

def cachedGames():
    # print(f"Looking for file at: {os.path.abspath(GAMES_FILE)}")
    if os.path.exists(GAMES_FILE):
        try:
            with open(GAMES_FILE, "r") as f:
                data = json.load(f)
                # print(f"Successfully loaded data: {len(data)} games found")
                return data
        except Exception as e:
            print(f"Error loading JSON file: {e}")
            return {"status": "error", "message": f"Error loading data: {str(e)}"}
    else:
        print(f"File not found: {GAMES_FILE}")
    return {"status": "error", "message": "No cached data available"}

print("Trending Game microservice running on port 5559...")

while True:
    request = socket.recv()
    request_data = json.loads(request.decode("utf-8"))
    print(f"MicroserviceC: Received request from frontend: {request_data}")

    if request_data.get("action") == "get_top_games":
        response = json.dumps(cachedGames())
        print(f"Sending games to frontend")
    else:
        response = json.dumps({"status": "error", "message": "Invalid action."})

    socket.send_string(response)
