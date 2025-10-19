import zmq
import smtplib
import json
import time
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

load_dotenv()

# Email Configuration
sender_email = os.getenv("SENDER_EMAIL")
recipient_email = os.getenv("RECIPIENT_EMAIL")
email_password = os.getenv("EMAIL_PASSWORD")
DIGEST_INTERVAL_MINUTES = 1 

# ZeroMQ Setup
context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://*:5557") 

message_store = []
last_digest_time = time.time()

def should_send_digest():
    """Check if it's time to send a digest"""
    elapsed_minutes = (time.time() - last_digest_time) / 60
    return elapsed_minutes >= DIGEST_INTERVAL_MINUTES

def send_email(subject, body):
    """Send an email"""
    try:
        mailserver = smtplib.SMTP('smtp.mail.yahoo.com', 587)
        mailserver.ehlo()
        mailserver.starttls()
        mailserver.login(sender_email, email_password)

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, "plain"))

        mailserver.sendmail(sender_email, recipient_email, msg.as_string())
        mailserver.quit()
        return True
    except smtplib.SMTPException as e:
        print(f"SMTP error occurred: {e}")
    except Exception as e:
        print(f"Unexpected error occurred: {e}")
        return False

def send_digest():
    """Send a digest email with all stored messages"""
    global message_store, last_digest_time
    
    if not message_store:
        print("No messages to send in digest")
        return False
    
    action_items = [msg for msg in message_store if msg['Type'] == 'action']
    event_items = [msg for msg in message_store if msg['Type'] == 'event']

    digest_text = f"DIGEST REPORT - {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    
    digest_text += f"ACTIONS ({len(action_items)}):\n" + "=" * 50 + "\n"
    for item in action_items:
        digest_text += f"[{item['Date']}] {item['detail']}\n"
    digest_text += "\n\n"

    digest_text += f"EVENTS ({len(event_items)}):\n" + "=" * 50 + "\n"
    for item in event_items:
        digest_text += f"[{item['Date']}] {item['detail']}\n"

    if send_email("Activity Digest", digest_text):
        print(f"Digest sent with {len(message_store)} items")
        message_store = [] 
        last_digest_time = time.time()
        return True
    return False

print("Email Microservice running on port 5557...")

while True:
    message = socket.recv()
    request_data = json.loads(message)
    print("MicroserviceA: Received message:", request_data)
    
    message_store.append(request_data)

    if should_send_digest():
        send_digest()
        print(f"m")
    
    socket.send_string("Message received successfully!")
