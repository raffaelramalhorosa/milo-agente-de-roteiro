import anthropic

client = anthropic.Anthropic()  # lê a chave da variável de ambiente

resposta = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=100,
    messages=[
        {"role": "user", "content": "Responda só com: funcionou!"}
    ],
)

print(resposta.content[0].text)