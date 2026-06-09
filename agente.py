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

EDITORIAS = {
    "historias_americanas": {
        "label": "Histórias Americanas",
        "arquivo": "rawData/editoria_historias_americanas.md",
    },
    "ia_empreendedorismo": {
        "label": "IA & Empreendedorismo",
        "arquivo": "rawData/editoria_ia.md",
    },
    "insucessos_vc": {
        "label": "Insucessos de VC",
        "arquivo": "rawData/editoria_insucessos_vc.md",
    },
}


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


def _montar_exemplos_feedback(editoria="historias_americanas"):
    historico = ler_historico()
    # filtra pelo campo editoria; registros antigos sem campo são tratados como historias_americanas
    def _mesma_editoria(e):
        return e.get("editoria", "historias_americanas") == editoria

    aceitos   = [e for e in historico if e["decisao"] == "aprovado"  and _mesma_editoria(e)][-N_EXEMPLOS:]
    recusados = [e for e in historico if e["decisao"] == "recusado"  and _mesma_editoria(e)][-N_EXEMPLOS:]

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


def sugerir_temas(editoria="historias_americanas", contexto_temas=None, temas_sessao=None):
    """Busca na web e retorna lista de 3 temas como objetos {titulo, resumo, sacada, numeros}."""
    arquivo_editoria  = EDITORIAS.get(editoria, EDITORIAS["historias_americanas"])["arquivo"]
    tipos_de_conteudo = contexto_temas or ler_arquivo(arquivo_editoria)
    historias_usadas      = ler_arquivo("rawData/historias_coletadas.md")
    sugestoes_salvas      = ler_arquivo("rawData/sugestoes_salvas.md")
    sugestoes_descartadas = ler_arquivo("rawData/sugestoes_descartadas.md")
    preferencias          = ler_arquivo("preferencias_temas.md")

    # temas mostrados nesta sessão mas ainda não votados
    secao_sessao = ""
    if temas_sessao:
        linhas = [f"- {t['titulo']}: {t.get('resumo', '')}" for t in temas_sessao]
        secao_sessao = (
            "\nSUGESTÕES JÁ APRESENTADAS NESTA SESSÃO (não repita nenhuma delas):\n"
            + "\n".join(linhas)
        )

    system_prompt = f"""Você é um agente que sugere temas para vídeos curtos de Instagram.

TIPOS DE CONTEÚDO desejados:
{tipos_de_conteudo}

TEMAS JÁ USADOS (não repita nenhum destes):
{historias_usadas}

SUGESTÕES JÁ VISTAS — SALVAS PARA DEPOIS (não repita):
{sugestoes_salvas}

SUGESTÕES REJEITADAS PELO USUÁRIO (nunca sugira):
{sugestoes_descartadas}
{secao_sessao}
PREFERÊNCIAS APRENDIDAS (use para calibrar o estilo dos temas):
{preferencias}

TAREFA:
1. Use a busca na web para encontrar 3 histórias ou temas DIFERENTES E INÉDITOS que combinam com os critérios acima.
2. Para cada tema encontrado, preencha os 4 campos abaixo com precisão:
   - titulo: nome curto da empresa ou história
   - resumo: 3-4 frases com o arco completo — quem é o fundador (origem, contexto pessoal), qual era o problema concreto que ele resolveu, e como começou a empresa
   - sacada: em 1-2 frases, qual foi o momento de virada ou a tática inusitada que mudou o rumo da história
   - numeros: os principais números de crescimento com datas (ex: "De 0 a US$60M em 3 anos. Valuation atual: US$800M.")
3. Responda APENAS com um array JSON válido, sem nenhum texto antes ou depois, neste formato exato:
[
  {{"titulo": "Nome da empresa", "resumo": "3-4 frases de contexto e arco da história", "sacada": "O momento de virada em 1-2 frases", "numeros": "Números concretos de crescimento"}},
  {{"titulo": "Nome da empresa", "resumo": "3-4 frases de contexto e arco da história", "sacada": "O momento de virada em 1-2 frases", "numeros": "Números concretos de crescimento"}},
  {{"titulo": "Nome da empresa", "resumo": "3-4 frases de contexto e arco da história", "sacada": "O momento de virada em 1-2 frases", "numeros": "Números concretos de crescimento"}}
]"""

    mensagens = [{"role": "user", "content": "Sugira 3 temas."}]

    while True:
        resposta = client.messages.create(
            model=MODELO,
            max_tokens=2000,
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


def escrever_roteiro(tema, resumo_tema, editoria="historias_americanas", contexto_jargoes=None, contexto_roteiro=None):
    """Escreve o roteiro completo para o tema escolhido, realimentado pelo histórico."""
    estilo_de_fala    = contexto_jargoes or ler_arquivo("rawData/estilo_de_fala.md")
    estrutura         = contexto_roteiro or ler_arquivo("rawData/estrutura_roteiro.md")
    exemplos_feedback = _montar_exemplos_feedback(editoria)

    arquivo_editoria   = EDITORIAS.get(editoria, EDITORIAS["historias_americanas"])["arquivo"]
    criterios_editoria = ler_arquivo(arquivo_editoria)

    system_prompt = f"""Você é um agente que escreve roteiros para vídeos curtos de Instagram.

EDITORIA ATIVA (ângulo e critérios que o roteiro deve seguir):
{criterios_editoria}

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
