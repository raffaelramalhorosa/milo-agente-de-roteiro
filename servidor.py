from flask import Flask, render_template, request, jsonify
import uuid
from datetime import datetime
import anthropic
from agente import sugerir_temas, escrever_roteiro, ler_historico, salvar_historico

app = Flask(__name__)


@app.route("/")
def pagina_inicial():
    return render_template("index.html")


@app.route("/sugerir-temas", methods=["POST"])
def rota_sugerir_temas():
    dados = request.get_json(silent=True) or {}
    try:
        temas = sugerir_temas(
            editoria=dados.get("editoria", "historias_americanas"),
            contexto_temas=dados.get("contexto_temas") or None,
        )
        return jsonify({"temas": temas})
    except anthropic.RateLimitError:
        return jsonify({"erro": "Limite de requisições atingido. Aguarde alguns segundos e tente novamente."}), 429
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@app.route("/gerar-roteiro", methods=["POST"])
def rota_gerar_roteiro():
    dados = request.get_json()
    try:
        roteiro = escrever_roteiro(
            dados["titulo"],
            dados["resumo"],
            editoria=dados.get("editoria", "historias_americanas"),
            contexto_jargoes=dados.get("contexto_jargoes") or None,
            contexto_roteiro=dados.get("contexto_roteiro") or None,
        )
        return jsonify({"roteiro": roteiro})
    except anthropic.RateLimitError:
        return jsonify({"erro": "Rate limit atingido."}), 429
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@app.route("/decidir", methods=["POST"])
def rota_decidir():
    dados = request.get_json()
    aprovado = dados["aprovado"]

    entrada = {
        "id": str(uuid.uuid4()),
        "data": datetime.now().isoformat(),
        "editoria": dados.get("editoria", "historias_americanas"),
        "tema": dados["tema"],
        "resumo_tema": dados.get("resumo_tema", ""),
        "roteiro": dados["roteiro"],
        "decisao": "aprovado" if aprovado else "recusado",
        "motivos": dados.get("motivos", []),
        "motivo_outro": dados.get("motivo_outro", ""),
    }
    salvar_historico(entrada)

    if aprovado:
        with open("rawData/historias_coletadas.md", "a", encoding="utf-8") as f:
            f.write(f"\n- {dados['tema']}: {dados.get('resumo_tema', '')}")

    return jsonify({"status": "ok"})


@app.route("/votar-sugestao", methods=["POST"])
def rota_votar_sugestao():
    dados = request.get_json()
    titulo = dados.get("titulo", "")
    resumo = dados.get("resumo", "")
    voto   = dados.get("voto", "")

    if voto not in ("salvar", "descartar"):
        return jsonify({"erro": "voto inválido"}), 400

    caminho = "rawData/sugestoes_salvas.md" if voto == "salvar" else "rawData/sugestoes_descartadas.md"
    with open(caminho, "a", encoding="utf-8") as f:
        f.write(f"- **{titulo}**: {resumo}\n")

    return jsonify({"status": "ok"})


@app.route("/sugestoes-salvas", methods=["GET"])
def rota_sugestoes_salvas():
    linhas = []
    try:
        with open("rawData/sugestoes_salvas.md", "r", encoding="utf-8") as f:
            for linha in f:
                linha = linha.strip()
                if not linha.startswith("- **"):
                    continue
                # formato: - **Titulo**: Resumo
                resto = linha[4:]  # remove "- **"
                if "**:" in resto:
                    titulo, resumo = resto.split("**:", 1)
                    linhas.append({"titulo": titulo.strip(), "resumo": resumo.strip()})
    except FileNotFoundError:
        pass
    return jsonify({"sugestoes": linhas})


@app.route("/votar-tema", methods=["POST"])
def rota_votar_tema():
    dados = request.get_json()
    titulo = dados.get("titulo", "")
    resumo = dados.get("resumo", "")
    voto   = dados.get("voto", "")

    if voto not in ("bom", "ruim"):
        return jsonify({"erro": "voto inválido"}), 400

    entrada = f"- **{titulo}**: {resumo}"
    secao   = "## ✅ Temas aprovados" if voto == "bom" else "## ❌ Temas a evitar"

    try:
        with open("preferencias_temas.md", "r", encoding="utf-8") as f:
            conteudo = f.read()
    except FileNotFoundError:
        conteudo = "# Preferências de temas\n\n## ✅ Temas aprovados\n\n## ❌ Temas a evitar\n"

    conteudo = conteudo.replace(secao + "\n", secao + "\n" + entrada + "\n")

    with open("preferencias_temas.md", "w", encoding="utf-8") as f:
        f.write(conteudo)

    return jsonify({"status": "ok"})


@app.route("/historico", methods=["GET"])
def rota_historico():
    return jsonify(ler_historico())


@app.route("/contexto-agente", methods=["GET"])
def rota_contexto_agente():
    from agente import ler_arquivo
    return jsonify({
        "editoria":            ler_arquivo("rawData/editoria_historias_americanas.md"),
        "estilo_de_fala":      ler_arquivo("rawData/estilo_de_fala.md"),
        "historias_coletadas": ler_arquivo("rawData/historias_coletadas.md"),
    })


@app.route("/contexto-agente/historias", methods=["PUT"])
def atualizar_historias():
    dados = request.get_json()
    with open("rawData/historias_coletadas.md", "w", encoding="utf-8") as f:
        f.write(dados.get("conteudo", "# Histórias já usadas\n(ainda nenhuma)"))
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
