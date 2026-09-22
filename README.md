# 📄 AI Resume & Portfolio Builder

사용자의 기본 정보와 경험을 바탕으로 **Google Gemini AI**를 활용하여 완성도 높은 이력서(Resume)와 포트폴리오(Portfolio) 초안을 즉시 생성해 주는 Flask 기반 풀스택 웹 애플리케이션입니다.

---

## ✨ 주요 기능 (Key Features)

1. **맞춤형 AI 문서 초안 생성**
   - 이름, 지원 직무, 경력 및 학력 사항, 주요 프로젝트 경험, 작성 어조(Tone)를 조합하여 체계적인 이력서와 포트폴리오를 동시 생성합니다.
2. **프롬프트 엔지니어링 모드 선택 (Prompt A vs B)**
   - **Prompt A (일반 모드)**: 표준적이고 가독성이 뛰어난 기업 제출용 문서 형식
   - **Prompt B (전문가 모드)**: STAR(Situation-Task-Action-Result) 기법과 구체적인 성과 지표 중심의 임팩트 있는 문서 형식
3. **실시간 마크다운 렌더링 & 뷰 모드 전환**
   - 생성된 마크다운 결과를 웹 브라우저에서 큰 제목, 구분선, 불릿 포인트가 적용된 **예쁜 서식 문서**로 렌더링하여 표시
   - **[📝 원본 보기] / [👁️ 렌더링 보기]** 토글 버튼으로 마크다운 원본 텍스트와 렌더링 뷰를 실시간 전환 가능
4. **원클릭 복사 & 파일 다운로드**
   - **[📋 전체 복사]**: 클립보드에 원본 마크다운 텍스트 즉시 복사
   - **[💾 .md 파일 다운로드]**: `[이름]_Resume_Portfolio.md` 파일로 즉시 다운로드 저장
5. **쾌적한 와이드스크린 반응형 UI**
   - 모니터 화면 전체를 98% 활용하는 와이드 2열 카드 레이아웃
   - 따뜻하고 눈이 편안한 파스텔 옐로우 테마
6. **안전한 보안 및 에러 처리**
   - Google Gemini API Key는 `.gitignore` 처리된 [`.env`](file:///C:/AI-study/resume-builder/.env) 파일에서만 안전하게 로드
   - 프론트엔드와 백엔드 양방향 입력값 유효성 검증
   - 상세한 백엔드 로그(요청, 응답, 오류) 기록

---

## 🛠️ 기술 스택 (Tech Stack)

- **Backend**: Python 3.x, Flask, python-dotenv
- **AI / LLM**: Google Gemini API (`google-genai` SDK)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Markdown Renderer**: marked.js
- **Version Control**: Git

---

## 📁 프로젝트 구조 (Project Structure)

```text
resume-builder/
├── app.py                # Flask 백엔드 서버 및 Gemini API 연동 라우트
├── requirements.txt      # 프로젝트 필수 파이썬 라이브러리 목록
├── .env                  # 실제 Gemini API 키 설정 파일 (Git 제외)
├── .env.example          # 환경변수 설정 가이드 템플릿
├── .gitignore            # Git 추적 제외 목록 (venv, .env, __pycache__)
├── README.md             # 프로젝트 소개 및 실행 매뉴얼
├── templates/
│   └── index.html        # 메인 웹 페이지 템플릿
└── static/
    ├── css/
    │   └── style.css     # 와이드 반응형 UI 및 마크다운 렌더링 스타일
    └── js/
        └── app.js        # 비동기 통신, 렌더링 토글, 복사/다운로드 스크립트
```

---

## 🚀 시작하기 (Getting Started)

### 1. 프로젝트 폴더 이동
```powershell
Set-Location C:\AI-study\resume-builder
```

### 2. 가상환경 생성 및 활성화
```powershell
# 가상환경 생성
py -m venv venv

# 가상환경 활성화 (PowerShell)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\venv\Scripts\Activate.ps1
```
*(활성화 성공 시 터미널 프롬프트 맨 앞에 `(venv)` 가 표시됩니다.)*

### 3. 필수 패키지 설치
```powershell
py -m pip install -r requirements.txt
```

### 4. 환경변수(.env) 설정
1. [.env.example](file:///C:/AI-study/resume-builder/.env.example) 파일을 복사하여 [`.env`](file:///C:/AI-study/resume-builder/.env) 파일을 생성합니다.
2. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 무료 Gemini API 키를 발급받습니다.
3. [`.env`](file:///C:/AI-study/resume-builder/.env) 파일에 본인의 키를 입력합니다:
   ```text
   GEMINI_API_KEY=AIzaSy...실제발급받은키
   ```

### 5. 웹 애플리케이션 실행
```powershell
py app.py
```

### 6. 웹 브라우저 접속
인터넷 브라우저를 열고 아래 주소로 접속합니다:
```text
http://127.0.0.1:5000
```

---

## 📝 라이선스 (License)
본 프로젝트는 학습 및 포트폴리오 용도로 자유롭게 수정 및 활용할 수 있습니다.
