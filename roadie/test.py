from g4f.client import Client
from g4f.Provider import ChatgptFree

client = Client()

client = Client(
    provider = ChatgptFree
)

chat_completion = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}],
)

print(chat_completion.choices[0].message.content or "")