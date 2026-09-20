from app.agents.calendar_agent import understand_command


commands = [
    "What do I have tomorrow?",
    "When is my next meeting?",
    "Schedule a meeting with Pavani tomorrow at 4 PM.",
    "I want to go to hospital at 4pm today.",
    "Delete my dentist appointment.",
]


for command in commands:
    print("\nUSER:", command)

    result = understand_command(command)

    print("NOVA:", result.model_dump())