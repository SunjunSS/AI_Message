# PyTorch VRAM 메모리 단편화 방지 설정
# 모델 로드 중 OOM 오류를 줄이기 위해 모든 코드보다 먼저 실행해야 함
import os
os.environ["PYTORCH_ALLOC_CONF"] = "expandable_segments:True"

# 필요한 Python 패키지를 설치
# transformers: Huggingface LLM 라이브러리
# accelerate, bitsandbytes: 모델 가속/양자화 라이브러리
# flask, flask-cors: API 서버와 CORS 지원
!pip install -q transformers accelerate bitsandbytes flask flask-cors

import re
import warnings
import torch
import logging
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
from huggingface_hub import login
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    AutoModelForSequenceClassification,
    BitsAndBytesConfig,
)

# 로깅/경고 설정
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
warnings.filterwarnings("ignore", category=FutureWarning)

# Hugging Face Hub 토큰으로 로그인
login(token=os.environ.get("HF_TOKEN"))


# 1. 감정 분류 모델 로드
EMOTION_MODEL_PATH = "./emotion_model"

print("🔵 감정 분류 모델 로딩 중...")
emotion_tokenizer = AutoTokenizer.from_pretrained(EMOTION_MODEL_PATH)
emotion_model = AutoModelForSequenceClassification.from_pretrained(EMOTION_MODEL_PATH)
emotion_model = emotion_model.to("cuda")
emotion_model.eval()
id2label = emotion_model.config.id2label
print("✅ 감정 분류 모델 로드 완료!\n")


# 2. 톤 변환 모델 로드 (Gemma 3 4B 4bit 양자화)
MODEL_ID = "google/gemma-3-4b-it"

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

print(f"🔵 톤 변환 모델 로딩 중: {MODEL_ID}")
print("처음 실행 시 다운로드로 인해 5~10분 소요될 수 있습니다...\n")

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
)

print("✅ 톤 변환 모델 로드 완료!\n")


# 3. 톤 프리셋 정의
TONE_PRESETS = {
    "polite": {
        "label": "🎓 정중한",
        "desc": "최대한 공손하고 격식 있는 존댓말(~습니다, ~드립니다)을 사용하면서도 원본 메시지의 핵심 내용과 요청사항은 그대로 유지",
    },
    "professional": {
        "label": "💼 전문적인",
        "desc": "원본의 핵심 정보와 요청사항을 명확하게 유지하되, 불필요한 표현은 제거하고 간결하고 체계적인 문체로",
    },
    "persuasive": {
        "label": "💡 설득적인",
        "desc": "원본 메시지의 요청사항은 유지하되, 상대방이 얻을 이점을 추가하여 긍정적이고 논리적인 문체로",
    },
    "apologetic": {
        "label": "🙏 공손한",
        "desc": "원본의 요청 내용은 그대로 전달하되, 상대방을 배려하는 표현을 추가하여 진정성 있고 부드러운 문체로",
    },
    "cooperative": {
        "label": "🤝 협조적인",
        "desc": "원본 메시지의 핵심 요청은 명확히 유지하되, 감사 표현과 부드러운 어투를 더해 거절감 없이 받아들이기 쉬운 문체로",
    },
}


# 4. 핵심 함수 정의
# 감정 분석 함수
def analyze_emotion(text: str) -> dict:
    """
    감정 분류 모델로 텍스트 감정 분석
    Returns:
        {
            "results": [("불안", 0.56), ...],
            "top_emotion": "불안",
            "confidence": 0.56,
        }
    """
    inputs = emotion_tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=128,
    )
    inputs = {k: v.to("cuda") for k, v in inputs.items()}  # GPU로 전송

    with torch.no_grad():
        outputs = emotion_model(**inputs)

    probs = torch.softmax(outputs.logits[0], dim=-1)
    results = [(id2label[i], float(p)) for i, p in enumerate(probs)]
    results.sort(key=lambda x: x[1], reverse=True)  # 확률 높은 순 정렬

    return {
        "results": results,
        "top_emotion": results[0][0],
        "confidence": results[0][1],
    }


# 톤 추천 함수
def recommend_tones_by_llm(text: str, emotion_results: list) -> list:
    """
    Gemma 3 4B IT에게 감정 분석 결과를 전달하여 적합한 톤 추천 요청
    응답을 파싱해서 추천 톤 키 리스트 반환 (파싱 실패 시 전체 톤 반환)
    """
    # 상위 2개 감정만 전달 (나머지는 노이즈)
    top_emotions = emotion_results[:2]
    emotion_str = "\n".join([f"  {e}: {p:.1%}" for e, p in top_emotions])

    tone_list = "\n".join([
        f"  {k} ({v['label']}): {v['desc']}"
        for k, v in TONE_PRESETS.items()
    ])

    prompt = f"""너는 한국어 이메일/메신저 문장을 다듬는 톤 컨설턴트야.
아래 메시지를 어떤 톤으로 보내는 것이 가장 효과적인지 골라줘.

[메시지]
{text.strip()}

[감정 분석 참고]
{emotion_str}
(감정 수치는 참고용이며, 메시지의 맥락과 목적을 우선으로 판단해줘.)

[선택 가능한 톤]
{tone_list}

규칙:
- 메시지의 목적, 상대방과의 관계, 전달하고자 하는 의도를 종합적으로 고려해서 판단해.
- 가장 적합한 톤 2개를 순서대로 골라.
- 아래 형식 이외의 말은 절대 하지 마.

출력 형식 (tone_key는 반드시 polite, professional, persuasive, apologetic, cooperative 중에서만 선택):
1순위: tone_key
2순위: tone_key"""

    chat = [{"role": "user", "content": prompt}]
    text_input = tokenizer.apply_chat_template(
        chat, tokenize=False, add_generation_prompt=True
    )

    inputs = tokenizer(text_input, return_tensors="pt").to(model.device)
    input_len = inputs["input_ids"].shape[1]

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=32,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated = outputs[0][input_len:]
    raw = tokenizer.decode(generated, skip_special_tokens=True).strip()

    # 파싱: "1순위: polite" 형태에서 키 값만 추출 (polite 등)
    valid_keys = list(TONE_PRESETS.keys())
    recommended = []
    for line in raw.splitlines():
        match = re.search(r":\s*\[?(\w+)\]?", line)
        if match:
            key = match.group(1).strip().lower()
            if key in valid_keys and key not in recommended:
                recommended.append(key)

    # 파싱 실패 시 전체 톤 반환
    if not recommended:
        print(f"⚠️ 톤 추천 파싱 실패 (raw: {repr(raw)}) → 전체 톤 제공")
        return valid_keys

    return recommended


# 톤 변환 함수
def convert_tone(message: str, tone_desc: str, is_subject: bool = False, max_new_tokens: int = 300) -> str:
    """
    톤 변환 함수
    제목(is_subject=True)과 본문(is_subject=False)에 따라 다른 프롬프트 사용
    """
    if is_subject:
        # 제목용 프롬프트
        prompt = f"""너는 한국어 이메일 제목을 다듬는 전문가야.
아래 이메일 제목을 "{tone_desc}" 톤으로 자연스럽게 다시 써줘.

규칙:
- 원래 제목의 핵심 의미와 의도는 유지해.
- 한 줄로 간결하게 작성해.
- 변환된 제목만 출력하고, 다른 설명은 쓰지 마.

원본 제목:
{message}

변환된 제목:"""
    else:
        # 본문용 프롬프트
        prompt = f"""너는 한국어 비즈니스 커뮤니케이션 문장을 다듬는 톤 컨설턴트야.
아래 메시지를 "{tone_desc}" 톤으로 자연스럽게 다시 써줘.

규칙:
- 원본 메시지의 핵심 내용과 요청사항은 반드시 유지해.
- 존댓말/격식, 말투, 표현만 조정해서 읽기 쉽게 다듬어.
- 맥락에 어울리는 표현은 약간 추가해도 되지만, 새로운 요구사항을 만들지는 마.
- 한 문단으로 이어서 작성해.
- 변환된 메시지만 출력하고, 다른 설명은 쓰지 마.

원본 메시지:
{message}

변환된 메시지:"""

    chat = [{"role": "user", "content": prompt}]
    text = tokenizer.apply_chat_template(
        chat, tokenize=False, add_generation_prompt=True
    )

    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    input_len = inputs["input_ids"].shape[1]

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated = outputs[0][input_len:]
    return tokenizer.decode(generated, skip_special_tokens=True).strip()


# 5. Flask 앱 초기화
app = Flask(__name__)
CORS(app)


# 6. API 엔드포인트
# 감정 분석 + 톤 추천 API
@app.route("/analyze", methods=["POST"])
def analyze():
    """
    감정 분석 + 톤 추천 API (Node.js → Colab 호출)

    Request Body:
    {
        "message": "분석할 메시지"
    }

    Response:
    {
        "top_emotion": "불안",
        "confidence": 0.56,
        "emotion_analysis": [["불안", 0.56], ["분노", 0.16], ...],
        "recommended_tones": ["professional", "polite"]
    }
    """
    try:
        data = request.json
        message = data.get("message", "").strip()

        if not message:
            return jsonify({"error": "메시지를 입력해주세요."}), 400

        print(f"\n🧠 감정 분석 요청 수신")
        print(f"   메시지: {message}")

        # 1단계: 감정 분류 모델로 감정 분석
        emotion_result = analyze_emotion(message)
        print(f"   주요 감정: {emotion_result['top_emotion']} ({emotion_result['confidence']:.1%})")

        # 2단계: Gemma가 원본 텍스트 + 감정 결과 보고 톤 추천
        print("💡 Gemma 톤 추천 중...")
        recommended = recommend_tones_by_llm(message, emotion_result["results"])
        print(f"   추천 톤: {recommended}")

        return jsonify({
            "top_emotion": emotion_result["top_emotion"],
            "confidence": emotion_result["confidence"],
            "emotion_analysis": emotion_result["results"],
            "recommended_tones": recommended
        })

    except Exception as e:
        print(f"❌ 에러 발생: {str(e)}")
        return jsonify({"error": str(e)}), 500


# 톤 변환 API
@app.route("/tone-convert", methods=["POST"])
def tone_convert():
    """
    톤 변환 API (Node.js → Colab 호출)

    Request Body:
    {
        "message": "변환할 메시지",
        "tone": "polite" | "professional" | "persuasive" | "apologetic" | "cooperative",
        "is_subject": true | false,
        "context": "제목 변환 시 본문 내용 (is_subject=true인 경우에만 전달)"
    }

    Response:
    {
        "original": "원본 메시지",
        "converted": "변환된 메시지",
        "tone": "선택된 톤"
    }
    """
    try:
        data = request.json
        message = data.get("message", "").strip()
        tone = data.get("tone", "").strip()
        is_subject = data.get("is_subject", False)

        # 입력 검증
        if not message:
            return jsonify({"error": "메시지를 입력해주세요."}), 400

        if tone not in TONE_PRESETS:
            return jsonify({
                "error": f"지원하지 않는 톤입니다. 사용 가능한 톤: {list(TONE_PRESETS.keys())}"
            }), 400

        message_type = "제목" if is_subject else "본문"
        print(f"\n📢 {message_type} 톤 변환 요청 수신")
        print(f"   {message_type}: {message}")
        print(f"   선택된 톤: {tone}")

        # 톤 변환 실행
        selected_tone = TONE_PRESETS[tone]
        print(f"⏳ 변환 중...")
        converted_message = convert_tone(message, selected_tone["desc"], is_subject)

        print(f"✅ 변환 완료")
        print(f"   {message_type} 변환: {converted_message}\n")

        return jsonify({
            "original": message,
            "converted": converted_message,
            "tone": tone
        })

    except Exception as e:
        print(f"❌ 에러 발생: {str(e)}")
        return jsonify({"error": str(e)}), 500


# 톤 목록 조회 API
@app.route("/tones", methods=["GET"])
def get_tones():
    """사용 가능한 톤 목록 조회 API"""
    tones = [
        {"key": key, "label": value["label"]}
        for key, value in TONE_PRESETS.items()
    ]
    return jsonify({"tones": tones})


# 서버 상태 체크 API
@app.route("/health", methods=["GET"])
def health_check():
    """서버 상태 체크 API"""
    return jsonify({"status": "ok", "model": MODEL_ID})


# 7. 서버 실행 및 localtunnel 공개 URL 설정
if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("🚀 톤 변환 API 서버 시작")
    print("=" * 50)
    print(f"📌 사용 가능한 엔드포인트:")
    print(f"   POST /analyze      - 감정 분석 + 톤 추천")
    print(f"   POST /tone-convert - 톤 변환")
    print(f"   GET  /tones        - 톤 목록 조회")
    print(f"   GET  /health       - 서버 상태 체크")
    print("=" * 50 + "\n")

    # Localtunnel 설정 (외부 접속용)
    tunnel = subprocess.Popen(
        ['npx', 'localtunnel', '--port', '5002', '--subdomain', 'tone-converter'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    public_url = None
    for i in range(30):
        line = tunnel.stdout.readline()
        print(f"[tunnel] {line.strip()}")
        if 'loca.lt' in line:
            # "your url is: https://..." 에서 URL만 추출
            public_url = line.strip().split('your url is:')[-1].strip()
            if not public_url.startswith('http'):
                public_url = line.strip()
            print(f"🔗 Localtunnel public URL: {public_url}\n")
            break

    if public_url is None:
        print("❌ localtunnel 주소를 얻지 못했습니다. 별도 셀에서 !npx localtunnel --port 5002 --subdomain tone-converter 실행 필요")
    else:
        print(f"🔗 외부에서 {public_url}/analyze 또는 {public_url}/tone-convert 로 POST 요청을 보내면 Colab Flask로 연결됩니다.\n")

    app.run(host="0.0.0.0", port=5002, threaded=True)