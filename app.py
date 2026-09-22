import logging
import os
import traceback
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from google import genai

# 1. 환경변수 로드 (.env 파일 읽기)
load_dotenv()

# 2. 로깅 설정 (요청, 응답, 오류를 콘솔에 표준 형식으로 출력)
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# 3. Flask 앱 초기화
app = Flask(__name__)


def generate_with_gemini(api_key: str, prompt: str) -> str:
    """Gemini API를 호출하여 텍스트를 생성하는 헬퍼 함수

    요청된 gemini-3.5-flash-lite 모델을 최우선으로 호출하며, 
    API 가용성에 따라 순차적으로 안정적인 모델을 시도합니다.
    """
    client = genai.Client(api_key=api_key)
    models_to_try = [
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
    ]
    last_error = None

    for model_name in models_to_try:
        try:
            logger.info(f"Gemini API 호출 시도 중 (모델: {model_name})")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if response and response.text:
                logger.info(f"Gemini API 응답 성공 (모델: {model_name})")
                return response.text
        except Exception as err:
            logger.warning(f"모델 {model_name} 호출 실패: {str(err)}")
            last_error = err

    if last_error:
        raise last_error
    raise RuntimeError("Gemini API로부터 유효한 응답을 받지 못했습니다.")


@app.route("/")
def index():
    """메인 페이지 라우트: templates/index.html을 렌더링하여 반환합니다."""
    logger.info("메인 페이지('/') 접근 요청")
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    """AI 이력서 및 포트폴리오 생성 API 라우트

    JSON 요청을 검증하고, 프롬프트 유형(A/B)에 따라 Gemini API를 호출합니다.
    """
    try:
        # 요청 데이터 파싱
        data = request.get_json(silent=True)
        if not data:
            logger.warning("요청 본문이 없거나 올바른 JSON 형식이 아닙니다.")
            return (
                jsonify({
                    "success": False,
                    "error": (
                        "요청 데이터가 올바르지 않습니다. JSON 형식으로 전송해"
                        " 주세요."
                    ),
                }),
                400,
            )

        name = data.get("name", "").strip()
        role = data.get("role", "").strip()
        experience = data.get("experience", "").strip()
        projects = data.get("projects", "").strip()
        tone = data.get("tone", "전문적이고 신뢰감 있는").strip()
        prompt_type = data.get("prompt_type", "A").strip().upper()

        # 백엔드 입력값 검증 (필수 항목 확인)
        logger.info(
            f"생성 요청 수신 - 이름: {name}, 지원 직무: {role}, 어조: {tone},"
            f" 모드: Prompt {prompt_type}"
        )
        if not name or not role or not experience or not projects:
            missing_fields = []
            if not name:
                missing_fields.append("이름")
            if not role:
                missing_fields.append("지원 직무")
            if not experience:
                missing_fields.append("경력 및 학력 사항")
            if not projects:
                missing_fields.append("주요 프로젝트")

            error_msg = f"필수 입력 항목이 누락되었습니다: {', '.join(missing_fields)}"
            logger.warning(f"입력 검증 실패: {error_msg}")
            return jsonify({"success": False, "error": error_msg}), 400

        # API Key 검증 (.env 파일에서 읽어왔는지 확인)
        api_key = os.getenv("GEMINI_API_KEY")
        if (
            not api_key
            or api_key.strip() == ""
            or api_key == "your_gemini_api_key_here"
        ):
            error_msg = (
                ".env 파일에 올바른 GEMINI_API_KEY가 설정되어 있지 않습니다. "
                ".env 파일을 열어 실제 API 키를 입력해 주세요."
            )
            logger.error(f"API 키 누락: {error_msg}")
            return jsonify({"success": False, "error": error_msg}), 500

        # Prompt 엔지니어링: 프롬프트 유형(A: 일반, B: 전문가)에 따른 프롬프트 생성
        if prompt_type == "B":
            # Prompt B: 전문가 모드 (STAR 기법 및 성과 지표 중심)
            prompt = f"""
당신은 최고의 글로벌 테크 기업 시니어 테크니컬 리크루터이자 커리어 컨설턴트입니다.
지원자의 경험을 채용 담당자가 매료될 수 있도록 STAR(Situation, Task, Action, Result) 기법과 구체적인 성과 지표를 바탕으로 전문적이고 임팩트 있게 재구성해 주세요.

[지원자 기본 정보]
- 이름: {name}
- 지원 직무: {role}
- 경력 및 학력 사항:
{experience}
- 주요 프로젝트:
{projects}
- 요청 어조(Tone): {tone}

[작성 원칙 - Prompt B 전문가 모드]
1. 출력은 반드시 깔끔한 마크다운(Markdown) 포맷으로 구성하세요.
2. 결과물은 명확하게 아래 2개의 큰 파트로 나누어 작성하세요:
   # Part 1. 이력서 (Resume)
     - ## 핵심 프로필 요약 (3~4줄의 강력한 임팩트 요약문)
     - ## 핵심 보유 기술 및 역량 (기술 스택별 분류)
     - ## 경력 및 활동 상세 (STAR 기법을 적용한 성과 중심 서술)
     - ## 학력 및 교육 이수 사항
   # Part 2. 포트폴리오 (Portfolio)
     - ## 프로젝트 개요 및 목표
     - ## 주요 담당 역할 및 기술적 기여도
     - ## 핵심 기술적 문제 및 해결 과정 (Troubleshooting)
     - ## 정량적 성과 및 교훈
3. 문장의 서술어는 명확하고 행동 지향적인 표현(Action Verbs)을 사용하세요.
4. 요청된 어조({tone})를 글 전체에 걸쳐 일관되게 유지하세요.
"""
        else:
            # Prompt A: 일반 모드 (표준 이력서 및 가독성 중심)
            prompt = f"""
당신은 친절하고 꼼꼼한 커리어 멘토입니다.
지원자가 입력한 정보를 바탕으로 깔끔하고 표준적인 기업 제출용 이력서와 포트폴리오 초안을 정돈해 주세요.

[지원자 기본 정보]
- 이름: {name}
- 지원 직무: {role}
- 경력 및 학력 사항:
{experience}
- 주요 프로젝트:
{projects}
- 요청 어조(Tone): {tone}

[작성 원칙 - Prompt A 일반 모드]
1. 출력은 반드시 깔끔한 마크다운(Markdown) 포맷으로 작성하세요.
2. 결과물은 명확하게 아래 2개의 큰 파트로 나누어 작성하세요:
   # Part 1. 이력서 (Resume)
     - ## 자기소개 및 프로필 요약
     - ## 핵심 역량 및 보유 기술
     - ## 경력 및 주요 활동
     - ## 학력 사항
   # Part 2. 포트폴리오 (Portfolio)
     - ## 프로젝트 소개
     - ## 사용 기술 스택
     - ## 주요 구현 내용 및 나의 기여도
     - ## 결과 및 배운 점
3. 읽는 사람이 한눈에 파악할 수 있도록 불릿 포인트(-)와 명확한 헤딩(#, ##)을 적극 활용하세요.
4. 요청된 어조({tone})를 자연스럽게 반영하세요.
"""

        # Gemini API 호출 실행
        result_text = generate_with_gemini(api_key=api_key, prompt=prompt)
        logger.info(
            f"생성 완료 - 이름: {name}, 생성된 텍스트 길이: {len(result_text)}자"
        )

        # 성공 응답 반환
        return jsonify({"success": True, "result": result_text})

    except Exception as exc:
        error_details = str(exc)
        logger.error(f"생성 중 예기치 않은 오류 발생: {error_details}")
        logger.error(traceback.format_exc())
        return (
            jsonify({
                "success": False,
                "error": f"서버 처리 중 오류가 발생했습니다: {error_details}",
            }),
            500,
        )


if __name__ == "__main__":
    # 개발 서버 구동 (포트: 5000, 디버그 모드 활성화)
    logger.info("Flask 개발 서버 시작 중... (http://127.0.0.1:5000)")
    app.run(host="127.0.0.1", port=5000, debug=True)
