
import os

from flask import Flask, render_template, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are StudyMate AI, a friendly study assistant for college students.

Your goals:
- Explain concepts in simple, student-friendly language.
- Use examples when they help understanding.
- Break difficult topics into smaller steps.
- Be honest when you are uncertain.
- Never pretend that every answer is guaranteed to be correct.
- Encourage students to verify important academic information.
- Do not simply give an answer when guiding a student through learning;
  help them understand the reasoning too.
"""


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}

    message = data.get("message", "").strip()
    history = data.get("history", [])

    if not message:
        return jsonify({"error": "Please enter a question."}), 400

    try:
        conversation = []

        for item in history[-10:]:
            role = item.get("role")
            content = item.get("content", "")

            if role in ("user", "assistant") and content:
                conversation.append({
                    "role": role,
                    "content": content
                })

        conversation.append({
            "role": "user",
            "content": message
        })

        response = client.responses.create(
            model="gpt-4.1-mini",
            instructions=SYSTEM_PROMPT,
            input=conversation
        )

        answer = response.output_text

        return jsonify({"answer": answer})

    except Exception:
        app.logger.exception("AI request failed")
        return jsonify({
            "error": (
                "StudyMate couldn't get a response. "
                "Check the API configuration and try again."
            )
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
