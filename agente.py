import anthropic
import json
import re
from datetime import datetime
import uuid

client = anthropic.Anthropic()
MODELO = "claude-sonnet-4-6"
MODELO_LEVE = "claude-haiku-4-5-20251001"  # usado em tarefas sem web search
HISTORICO_PATH = "historico.json"
N_EXEMPLOS = 3  # quantos aceitos/recusados realimentar no prompt


def ler_arquivo(caminho):
    try:
        with open(caminho, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "(arquivo ainda não existe)"


def ler_historico():
    try:
        with open(HISTORICO_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def salvar_historico(entrada):
    historico = ler_historico()
    historico.append(entrada)
    with open(HISTORICO_PATH, "w", encoding="utf-8") as f:
        json.dump(historico, f, ensure_ascii=False, indent=2)


def _montar_exemplos_feedback():
    historico = ler_historico()
    aceitos = [e for e in historico if e["decisao"] == "aprovado"][-N_EXEMPLOS:]
    recusados = [e for e in historico if e["decisao"] == "recusado"][-N_EXEMPLOS:]

    partes = []

    if aceitos:
        linhas = ["EXEMPLOS QUE ELA APROVOU (escreva mais parecido com estes):"]
        for e in aceitos:
            motivos = ", ".join(e.get("motivos", []))
            if e.get("motivo_outro"):
                motivos += f", {e['motivo_outro']}"
            linhas.append(f"Tema: {e['tema']}")
            linhas.append(f"O que ela gostou: {motivos}")
            linhas.append(f"Roteiro:\n{e['roteiro']}\n")
        partes.append("\n".join(linhas))

    if recusados:
        linhas = ["EXEMPLOS QUE ELA RECUSOU (evite este estilo/estes temas):"]
        for e in recusados:
            motivos = ", ".join(e.get("motivos", []))
            if e.get("motivo_outro"):
                motivos += f", {e['motivo_outro']}"
            linhas.append(f"Tema: {e['tema']}")
            linhas.append(f"O que não funcionou: {motivos}")
            linhas.append(f"Roteiro:\n{e['roteiro']}\n")
        partes.append("\n".join(linhas))

    return "\n\n".join(partes) if partes else "(ainda sem histórico de feedback)"


def sugerir_temas(contexto_temas=None):
    """Busca na web e retorna lista de 3 temas como objetos {titulo, resumo}."""
    tipos_de_conteudo = contexto_temas or ler_arquivo("tipos_de_conteudo.md")
    historias_usadas  = ler_arquivo("historias_coletadas.md")
    preferencias      = ler_arquivo("preferencias_temas.md")

    system_prompt = f"""Você é um agente que sugere temas para vídeos curtos de Instagram.

TIPOS DE CONTEÚDO desejados:
{tipos_de_conteudo}

TEMAS JÁ USADOS (não repita nenhum destes):
{historias_usadas}

PREFERÊNCIAS APRENDIDAS (use para calibrar o estilo dos temas):
{preferencias}

TAREFA:
1. Use a busca na web para encontrar 3 histórias ou temas recentes e interessantes que combinam com os tipos de conteúdo acima.
2. Responda APENAS com um array JSON válido, sem nenhum texto antes ou depois, neste formato exato:
[
  {{"titulo": "Título curto do tema", "resumo": "Uma frase descrevendo a história"}},
  {{"titulo": "Título curto do tema", "resumo": "Uma frase descrevendo a história"}},
  {{"titulo": "Título curto do tema", "resumo": "Uma frase descrevendo a história"}}
]"""

    mensagens = [{"role": "user", "content": "Sugira 3 temas."}]

    while True:
        resposta = client.messages.create(
            model=MODELO,
            max_tokens=1000,
            system=system_prompt,
            messages=mensagens,
            tools=[{"type": "web_search_20250305", "name": "web_search"}],
        )
        mensagens.append({"role": "assistant", "content": resposta.content})
        if resposta.stop_reason != "tool_use":
            break

    texto = "".join(b.text for b in resposta.content if b.type == "text")

    # Extrai o JSON mesmo que venha dentro de bloco markdown
    inicio = texto.find("[")
    fim = texto.rfind("]") + 1
    if inicio == -1 or fim == 0:
        raise ValueError(f"Resposta não contém JSON válido: {texto}")
    return json.loads(texto[inicio:fim])


def escrever_roteiro(tema, resumo_tema, contexto_jargoes=None, contexto_roteiro=None):
    """Escreve o roteiro completo para o tema escolhido, realimentado pelo histórico."""
    estilo_de_fala = contexto_jargoes or ler_arquivo("estilo_de_fala.md")
    estrutura      = contexto_roteiro or "Estrutura obrigatória: gancho inicial → história/conteúdo → virada → call to action."
    exemplos_feedback = _montar_exemplos_feedback()

    system_prompt = f"""Você é um agente que escreve roteiros para vídeos curtos de Instagram.

ESTILO DE FALA da pessoa (siga sempre, use os jargões dela):
{estilo_de_fala}

ESTRUTURA DESEJADA:
{estrutura}

{exemplos_feedback}

TAREFA:
Escreva um roteiro de vídeo curto (30 a 60 segundos) sobre o tema fornecido, no estilo de fala acima.
Responda apenas com o roteiro. Sem títulos, sem marcações extras."""

    resposta = client.messages.create(
        model=MODELO_LEVE,
        max_tokens=600,
        system=system_prompt,
        messages=[
            {"role": "user", "content": f"Tema: {tema}\n\nContexto: {resumo_tema}"}
        ],
    )
    return "".join(b.text for b in resposta.content if b.type == "text")
