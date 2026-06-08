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
        "tema": dados["tema"],
        "resumo_tema": dados.get("resumo_tema", ""),
        "roteiro": dados["roteiro"],
        "decisao": "aprovado" if aprovado else "recusado",
        "motivos": dados.get("motivos", []),
        "motivo_outro": dados.get("motivo_outro", ""),
    }
    salvar_historico(entrada)

    if aprovado:
        with open("historias_coletadas.md", "a", encoding="utf-8") as f:
            f.write(f"\n- {dados['tema']}: {dados.get('resumo_tema', '')}")

    return jsonify({"status": "ok"})


@app.route("/historico", methods=["GET"])
def rota_historico():
    return jsonify(ler_historico())


@app.route("/contexto-agente", methods=["GET"])
def rota_contexto_agente():
    from agente import ler_arquivo
    return jsonify({
        "tipos_de_conteudo":   ler_arquivo("tipos_de_conteudo.md"),
        "estilo_de_fala":      ler_arquivo("estilo_de_fala.md"),
        "historias_coletadas": ler_arquivo("historias_coletadas.md"),
    })


@app.route("/contexto-agente/historias", methods=["PUT"])
def atualizar_historias():
    dados = request.get_json()
    with open("historias_coletadas.md", "w", encoding="utf-8") as f:
        f.write(dados.get("conteudo", "# Histórias já usadas\n(ainda nenhuma)"))
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
