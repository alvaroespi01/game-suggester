import zmq
import pandas as pd
import json
import io
import sys

def convert_json_to_csv(json_data):
    
    if isinstance(json_data, dict):
        json_data = [json_data] 
    
    df = pd.json_normalize(json_data)
    df.fillna("N/A", inplace=True)

    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    return csv_buffer.getvalue()


def signal_handler(sig, frame):
    print("Exiting the microservice...")
    sys.exit(0)

print("Microservice running...")

context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://*:5555")  

while True:
    message = socket.recv_json()
    print("Received data from Node.js:", message)  
    
    csv_data = convert_json_to_csv(message)
    print("CSV data generated:", csv_data[:100])  
    
    socket.send_string(csv_data)
