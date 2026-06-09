import anthropic
import json
import os
import re
from datetime import datetime
import uuid
from json_repair import repair_json

def env_var(nome, padrao=None):
    valor = os.environ.get(nome)
    if valor:
        return valor

    if os.name == "nt":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as chave:
                valor, _ = winreg.QueryValueEx(chave, nome)
                return valor or padrao
        except OSError:
            pass

    return padrao


client = anthropic.Anthropic()
MODELO = "claude-sonnet-4-6"
MODELO_LEVE = "claude-haiku-4-5-20251001"  # usado em tarefas sem web search
MODELO_GEMINI_FACT_CHECK = env_var("GEMINI_FACT_CHECK_MODEL", "gemini-2.5-flash")
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
    """Busca na web e retorna lista de 10 temas como objetos {titulo, dominio, resumo, sacada, numeros}."""
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
1. Use a busca na web para encontrar 10 histórias ou temas DIFERENTES E INÉDITOS que combinam com os critérios acima.
2. Para cada tema encontrado, preencha os 4 campos abaixo com precisão:
   - titulo: nome curto da empresa ou história
   - dominio: domínio oficial da empresa ou organização, sem https:// e sem caminho. Se não existir um domínio confiável, use string vazia.
   - resumo: 3-4 frases com o arco completo — quem é o fundador (origem, contexto pessoal), qual era o problema concreto que ele resolveu, e como começou a empresa
   - sacada: em 1-2 frases, qual foi o momento de virada ou a tática inusitada que mudou o rumo da história
   - numeros: os principais números de crescimento com datas (ex: "De 0 a US$60M em 3 anos. Valuation atual: US$800M.")
3. Responda APENAS com um array JSON válido com exatamente 10 itens, sem nenhum texto antes ou depois, neste formato exato:
[
  {{"titulo": "Nome da empresa", "dominio": "empresa.com", "resumo": "3-4 frases de contexto e arco da história", "sacada": "O momento de virada em 1-2 frases", "numeros": "Números concretos de crescimento"}},
  ...
]"""

    mensagens = [{"role": "user", "content": "Sugira 3 temas."}]

    while True:
        resposta = client.messages.create(
            model=MODELO,
            max_tokens=4000,
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


def _checar_fatos_anthropic(titulo, resumo="", sacada="", numeros="", dominio="", editoria="historias_americanas"):
    """Verifica fatos, datas e números de um tema usando web search."""
    arquivo_editoria = EDITORIAS.get(editoria, EDITORIAS["historias_americanas"])["arquivo"]
    criterios_editoria = ler_arquivo(arquivo_editoria)

    system_prompt = f"""Você é uma checadora de fatos rigorosa para vídeos curtos lidos por uma pessoa com grande audiência.

EDITORIA:
{criterios_editoria}

TAREFA:
Use busca na web para verificar se as informações do tema são verdadeiras, atuais e bem formuladas.
Priorize fontes primárias, páginas oficiais, comunicados da empresa, documentos regulatórios, bases públicas e veículos jornalísticos confiáveis.
Verifique especialmente:
- nomes de fundadores, empresa e produto
- datas
- valores, valuation, receita, crescimento, aquisição, falência ou rodada
- causalidade sugerida pela história

Responda APENAS com um objeto JSON válido neste formato:
{{
  "status": "confiavel | atencao | incerto",
  "resumo": "síntese curta do que foi confirmado ou precisa de ajuste",
  "pontos": [
    {{
      "afirmacao": "afirmação checada",
      "veredito": "confirmado | ajustar | nao_encontrado",
      "detalhe": "explicação objetiva, incluindo correção quando necessário"
    }}
  ],
  "fontes": [
    {{"titulo": "Nome da fonte", "url": "https://..."}}
  ],
  "versao_segura": "texto revisado do tema, com linguagem mais precisa e sem exageros"
}}"""

    contexto = "\n\n".join([
        f"Título: {titulo}",
        f"Domínio informado: {dominio or '(não informado)'}",
        f"Resumo: {resumo or '(não informado)'}",
        f"Sacada: {sacada or '(não informado)'}",
        f"Números: {numeros or '(não informado)'}",
    ])

    mensagens = [{"role": "user", "content": contexto}]

    while True:
        resposta = client.messages.create(
            model=MODELO,
            max_tokens=2500,
            system=system_prompt,
            messages=mensagens,
            tools=[{"type": "web_search_20250305", "name": "web_search"}],
        )
        mensagens.append({"role": "assistant", "content": resposta.content})
        if resposta.stop_reason != "tool_use":
            break

    texto = "".join(b.text for b in resposta.content if b.type == "text")
    try:
        return _extrair_json_objeto(texto)
    except (json.JSONDecodeError, ValueError):
        return _checagem_incerta_por_json_invalido()


def _extrair_json_objeto(texto):
    texto = (texto or "").strip()
    if texto.startswith("```"):
        texto = re.sub(r"^```(?:json)?\s*", "", texto)
        texto = re.sub(r"\s*```$", "", texto)

    inicio = texto.find("{")
    fim = texto.rfind("}") + 1
    if inicio == -1 or fim == 0:
        raise ValueError(f"Resposta não contém JSON válido: {texto}")

    fragmento = texto[inicio:fim]
    try:
        return json.loads(fragmento)
    except json.JSONDecodeError as exc:
        print(f"[_extrair_json_objeto] JSON inválido ({exc}), tentando repair_json")
        reparado = repair_json(fragmento)
        print(f"[_extrair_json_objeto] repair_json resultado (100 chars): {reparado[:100]}")
        return json.loads(reparado)


def _reparar_json_gemini(client_gemini, types, texto):
    resposta = client_gemini.models.generate_content(
        model=MODELO_GEMINI_FACT_CHECK,
        contents=(
            "Reescreva o texto abaixo como um unico objeto JSON valido. "
            "Nao acrescente explicacoes, markdown ou comentarios. "
            "Preserve os campos status, resumo, pontos, fontes e versao_segura.\n\n"
            f"{texto}"
        ),
        config=types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
        ),
    )
    return _extrair_json_objeto(resposta.text or "")


def _checagem_incerta_por_json_invalido(fontes=None):
    return {
        "status": "incerto",
        "resumo": "A checagem encontrou fontes, mas a resposta voltou em um formato invalido. Tente checar novamente.",
        "pontos": [
            {
                "afirmacao": "Formato da resposta de checagem",
                "veredito": "nao_encontrado",
                "detalhe": "O backend evitou retornar erro 500, mas nao conseguiu interpretar o JSON do modelo.",
            }
        ],
        "fontes": fontes or [],
        "versao_segura": "",
    }


def _fontes_gemini(resposta):
    fontes = []
    for candidato in getattr(resposta, "candidates", []) or []:
        grounding = getattr(candidato, "grounding_metadata", None)
        chunks = getattr(grounding, "grounding_chunks", None) if grounding else None
        if not chunks:
            continue
        for chunk in chunks:
            web = getattr(chunk, "web", None)
            if not web or not getattr(web, "uri", None):
                continue
            fonte = {
                "titulo": getattr(web, "title", "") or web.uri,
                "url": web.uri,
            }
            if fonte not in fontes:
                fontes.append(fonte)
    return fontes


def _checar_fatos_gemini(titulo, resumo="", sacada="", numeros="", dominio="", editoria="historias_americanas"):
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise RuntimeError("Instale google-genai para usar FACT_CHECK_PROVIDER=gemini.") from exc

    api_key = env_var("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Configure GEMINI_API_KEY para usar FACT_CHECK_PROVIDER=gemini.")

    arquivo_editoria = EDITORIAS.get(editoria, EDITORIAS["historias_americanas"])["arquivo"]
    criterios_editoria = ler_arquivo(arquivo_editoria)
    system_prompt = f"""Você é uma checadora de fatos rigorosa para vídeos curtos lidos por uma pessoa com grande audiência.

EDITORIA:
{criterios_editoria}

TAREFA:
Use Google Search grounding para verificar se as informações do tema são verdadeiras, atuais e bem formuladas.
Priorize fontes primárias, páginas oficiais, comunicados da empresa, documentos regulatórios, bases públicas e veículos jornalísticos confiáveis.
Verifique especialmente nomes, datas, valores, valuation, receita, crescimento, aquisição, falência, rodada e causalidade sugerida pela história.

Responda APENAS com um objeto JSON válido neste formato:
{{
  "status": "confiavel | atencao | incerto",
  "resumo": "síntese curta do que foi confirmado ou precisa de ajuste",
  "pontos": [
    {{
      "afirmacao": "afirmação checada",
      "veredito": "confirmado | ajustar | nao_encontrado",
      "detalhe": "explicação objetiva, incluindo correção quando necessário"
    }}
  ],
  "fontes": [
    {{"titulo": "Nome da fonte", "url": "https://..."}}
  ],
  "versao_segura": "texto revisado do tema, com linguagem mais precisa e sem exageros"
}}"""
    contexto = "\n\n".join([
        f"Título: {titulo}",
        f"Domínio informado: {dominio or '(não informado)'}",
        f"Resumo: {resumo or '(não informado)'}",
        f"Sacada: {sacada or '(não informado)'}",
        f"Números: {numeros or '(não informado)'}",
    ])

    client_gemini = genai.Client(api_key=api_key)
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        tools=[types.Tool(google_search=types.GoogleSearch())],
        temperature=0.1,
    )
    resposta = client_gemini.models.generate_content(
        model=MODELO_GEMINI_FACT_CHECK,
        contents=contexto,
        config=config,
    )

    fontes_grounding = _fontes_gemini(resposta)
    try:
        resultado = _extrair_json_objeto(resposta.text or "")
    except (json.JSONDecodeError, ValueError):
        try:
            resultado = _reparar_json_gemini(client_gemini, types, resposta.text or "")
        except (json.JSONDecodeError, ValueError):
            return _checagem_incerta_por_json_invalido(fontes_grounding)

    if fontes_grounding and not resultado.get("fontes"):
        resultado["fontes"] = fontes_grounding
    return resultado


def checar_fatos_tema(titulo, resumo="", sacada="", numeros="", dominio="", editoria="historias_americanas"):
    """Verifica fatos, datas e números usando o provider configurado."""
    provider = env_var("FACT_CHECK_PROVIDER", "gemini").lower()
    print(f"[checar_fatos] provider={provider} titulo={titulo!r}")
    try:
        if provider == "gemini":
            resultado = _checar_fatos_gemini(titulo, resumo, sacada, numeros, dominio, editoria)
        else:
            resultado = _checar_fatos_anthropic(titulo, resumo, sacada, numeros, dominio, editoria)
        print(f"[checar_fatos] status={resultado.get('status')} pontos={len(resultado.get('pontos', []))}")
        return resultado
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"[checar_fatos] JSONDecodeError/ValueError capturado: {exc}")
        resultado = _checagem_incerta_por_json_invalido()
        resultado["resumo"] = f"A checagem retornou um formato invalido: {exc}"
        return resultado
    except Exception as exc:
        print(f"[checar_fatos] exceção inesperada ({type(exc).__name__}): {exc}")
        resultado = _checagem_incerta_por_json_invalido()
        resultado["resumo"] = f"Erro inesperado na checagem ({type(exc).__name__}): {exc}"
        return resultado


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
