# Milo — Agente de Roteiros

Milo é um agente de IA que pesquisa temas na web e escreve roteiros personalizados para vídeos curtos no Instagram. Ele aprende com seus feedbacks e escreve cada vez mais no seu estilo.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3 + Flask |
| Agente (temas) | `claude-sonnet-4-6` com web search |
| Agente (roteiro) | `claude-haiku-4-5-20251001` |
| Frontend | React 19 + Vite + Tailwind CSS v3 |

---

## Pré-requisitos

- Python 3.10 ou superior
- Node.js 18 ou superior
- Conta na [Anthropic](https://console.anthropic.com) com créditos de API

---

## Variável de ambiente

O Milo precisa de uma chave da API da Anthropic. Ela deve ser configurada como variável de ambiente do sistema — **nunca diretamente no código**.

### Windows (PowerShell)

```powershell
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-sua-chave-aqui", "User")
[System.Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "sua-chave-gemini-aqui", "User")
[System.Environment]::SetEnvironmentVariable("FACT_CHECK_PROVIDER", "gemini", "User")
```

Feche e reabra o terminal após executar.

### macOS / Linux

```bash
export ANTHROPIC_API_KEY="sk-ant-sua-chave-aqui"
export GEMINI_API_KEY="sua-chave-gemini-aqui"
export FACT_CHECK_PROVIDER="gemini"
```

Para tornar permanente, adicione a linha acima ao `~/.bashrc` ou `~/.zshrc`.

---

## Instalação

**1. Clone o repositório:**

```bash
git clone https://github.com/raffaelramalhorosa/milo-agente-de-roteiro.git
cd milo-agente-de-roteiro
```

**2. Instale as dependências Python:**

```bash
pip install -r requirements.txt
```

**3. Instale as dependências do frontend:**

```bash
cd frontend
npm install
cd ..
```

---

## Rodando o projeto

Você precisa de **dois terminais** abertos na pasta do projeto.

**Terminal 1 — Backend:**

```bash
python servidor.py
```

Servidor iniciado em `http://localhost:5000`.

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

App disponível em `http://localhost:5173`.

---

## Como usar

1. Acesse `http://localhost:5173`
2. Clique em **Sugerir temas** — o Milo pesquisa 3 temas na web
3. Escolha o tema que mais combina
4. O Milo escreve o roteiro no seu estilo
5. Aprove ou recuse com um motivo — ele aprende com cada decisão

---

## Personalizando o Milo

Clique no **☰** no canto superior direito para abrir as configurações.

| Aba | O que configura |
|---|---|
| 🎯 Temas | Que tipo de história o Milo deve buscar na web |
| 📋 Roteiro | Como o roteiro deve ser estruturado (seções, duração) |
| 🗣️ Jargões | Seu tom de voz, expressões e o que nunca usar |

**Formas de configurar:**
- Escrever diretamente no campo de texto
- Clicar em **+ Importar .md** para carregar um arquivo
- Arrastar um arquivo `.md` direto para o campo (se já houver conteúdo, o Milo pede confirmação antes de substituir)
- Clicar no **?** ao lado de cada aba para ver um prompt pronto — cole no Claude Code ou em qualquer LLM para gerar o arquivo de configuração ideal para o seu perfil

### Perfis de teste prontos

A pasta `testes/` tem dois perfis para você começar:

```
testes/
├── perfil-empreendedor/   — histórias de negócios, bastidores, mentalidade
└── perfil-tech/           — ferramentas, IA, produtividade para devs
```

Cada perfil tem três arquivos — um para cada aba de configuração.

---

## Aba "O que eu sei"

Acesse pelo **☰ > 🧠 O que eu sei** para ver tudo que o Milo está usando:

- **Configuração ativa** — o contexto real que ele lê antes de trabalhar (editável)
- **Memória de temas** — lista de temas já abordados para não repetir (editável)
- **Padrões aprendidos** — o que você aprovou, o que recusou e por quê

---

## Observações

- O histórico de aprovações fica salvo em `historico.json` (criado automaticamente, não versionado no git)
- A memória de temas fica em `historias_coletadas.md` — o Milo atualiza automaticamente a cada aprovação
- Se aparecer o erro **"O Milo está sobrecarregado"**, aguarde alguns segundos e tente de novo — é um limite de requisições da API da Anthropic
