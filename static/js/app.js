/**
 * AI Resume & Portfolio Builder - 프론트엔드 자바스크립트 (app.js)
 * 폼 제출, /generate API 통신, 로딩 및 오류 처리, 클립보드 복사, 마크다운 다운로드 구현
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. DOM 요소 선택
    const resumeForm = document.getElementById("resumeForm");
    const generateBtn = document.getElementById("generateBtn");
    const formError = document.getElementById("formError");

    const emptyState = document.getElementById("emptyState");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const resultBox = document.getElementById("resultBox");
    const resultContent = document.getElementById("resultContent");
    const resultActions = document.getElementById("resultActions");

    const copyBtn = document.getElementById("copyBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const toggleViewBtn = document.getElementById("toggleViewBtn");

    // 생성된 결과 텍스트를 메모리에 보관할 변수 및 뷰 모드 상태
    let currentGeneratedMarkdown = "";
    let isRenderedMode = true; // 기본값: 예쁜 마크다운 렌더링 보기

    /**
     * 마크다운 텍스트를 깔끔한 HTML로 변환하는 함수
     * marked.js 라이브러리를 우선 사용하며, 네트워크 차단 시 자체 파서로 안전하게 대체합니다.
     */
    function renderMarkdown(md) {
        if (window.marked && typeof window.marked.parse === "function") {
            return window.marked.parse(md);
        }
        // 자체 백업 마크다운 변환기 (오프라인 대비)
        let html = md
            .replace(/^# (.*$)/gim, "<h1>$1</h1>")
            .replace(/^## (.*$)/gim, "<h2>$1</h2>")
            .replace(/^### (.*$)/gim, "<h3>$1</h3>")
            .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
            .replace(/^\s*-\s+(.*$)/gim, "<li>$1</li>")
            .replace(/\n\n/gim, "<br><br>")
            .replace(/\n/gim, "<br>");
        return html;
    }

    /**
     * 결과 화면 업데이트 (렌더링 HTML 모드 <-> 마크다운 원본 텍스트 모드)
     */
    function updateResultDisplay() {
        if (!currentGeneratedMarkdown) return;

        if (isRenderedMode) {
            resultContent.className = "markdown-body";
            resultContent.innerHTML = renderMarkdown(currentGeneratedMarkdown);
            toggleViewBtn.textContent = "📝 원본 보기";
        } else {
            resultContent.className = "raw-markdown";
            resultContent.textContent = currentGeneratedMarkdown;
            toggleViewBtn.textContent = "👁️ 렌더링 보기";
        }
    }

    /**
     * 에러 메시지를 화면에 표시하는 헬퍼 함수
     */
    function showError(message) {
        formError.textContent = message;
        formError.style.display = "block";
    }

    /**
     * 에러 메시지를 화면에서 숨기는 헬퍼 함수
     */
    function clearError() {
        formError.textContent = "";
        formError.style.display = "none";
    }

    /**
     * 로딩 상태를 켜거나 끄는 함수
     */
    function setLoading(isLoading) {
        if (isLoading) {
            // 로딩 시작
            clearError();
            generateBtn.disabled = true;
            generateBtn.textContent = "⏳ AI가 작성 중입니다...";
            emptyState.style.display = "none";
            resultBox.style.display = "none";
            resultActions.style.display = "none";
            loadingIndicator.style.display = "flex";
        } else {
            // 로딩 종료
            generateBtn.disabled = false;
            generateBtn.textContent = "✨ AI 이력서 & 포트폴리오 생성하기";
            loadingIndicator.style.display = "none";
        }
    }

    // 2. 폼 제출(Submit) 이벤트 처리
    resumeForm.addEventListener("submit", async (event) => {
        // 브라우저의 기본 페이지 새로고침 동작 방지
        event.preventDefault();

        // 사용자 입력값 수집
        const name = document.getElementById("name").value.trim();
        const role = document.getElementById("role").value.trim();
        const experience = document.getElementById("experience").value.trim();
        const projects = document.getElementById("projects").value.trim();
        const tone = document.getElementById("tone").value;

        // 선택된 프롬프트 라디오 버튼 값 (A 또는 B)
        const selectedPrompt = document.querySelector('input[name="prompt_type"]:checked');
        const promptType = selectedPrompt ? selectedPrompt.value : "A";

        // 프론트엔드 입력값 검증 (필수 항목 확인)
        if (!name) {
            showError("이름을 입력해 주세요.");
            document.getElementById("name").focus();
            return;
        }
        if (!role) {
            showError("지원 직무를 입력해 주세요.");
            document.getElementById("role").focus();
            return;
        }
        if (!experience) {
            showError("경력 및 학력 사항을 입력해 주세요.");
            document.getElementById("experience").focus();
            return;
        }
        if (!projects) {
            showError("주요 프로젝트 경험을 입력해 주세요.");
            document.getElementById("projects").focus();
            return;
        }

        // 입력이 정상이면 기존 에러 제거 및 로딩 시작
        clearError();
        setLoading(true);

        try {
            // Flask 백엔드의 /generate 라우트로 POST 비동기 요청 전송
            const response = await fetch("/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    role: role,
                    experience: experience,
                    projects: projects,
                    tone: tone,
                    prompt_type: promptType
                })
            });

            const data = await response.json();

            // 백엔드 처리 결과 확인
            if (!response.ok || !data.success) {
                // 백엔드가 전달한 친절한 오류 메시지 표시
                const serverErrorMsg = data.error || "서버 통신 중 알 수 없는 오류가 발생했습니다.";
                showError(serverErrorMsg);
                emptyState.style.display = "flex";
                return;
            }

            // 성공: 생성된 결과 화면에 렌더링 출력
            currentGeneratedMarkdown = data.result;
            isRenderedMode = true; // 기본적으로 예쁜 서식 렌더링으로 표시
            updateResultDisplay();

            // 결과 박스 및 액션 버튼(복사/다운로드/전환) 표시
            resultBox.style.display = "block";
            resultActions.style.display = "flex";

        } catch (networkError) {
            console.error("통신 오류 발생:", networkError);
            showError("서버와의 연결에 실패했습니다. Flask 서버(app.py)가 실행 중인지 확인해 주세요.");
            emptyState.style.display = "flex";
        } finally {
            // 성공하든 실패하든 로딩 상태 해제
            setLoading(false);
        }
    });

    // 3. 렌더링 <-> 마크다운 원본 뷰 모드 전환 버튼 기능
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener("click", () => {
            if (!currentGeneratedMarkdown) return;
            isRenderedMode = !isRenderedMode;
            updateResultDisplay();
        });
    }

    // 4. 결과 전체 복사 버튼 기능
    copyBtn.addEventListener("click", async () => {
        if (!currentGeneratedMarkdown) return;

        try {
            // 클립보드에 원본 마크다운 텍스트 복사 시도
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(currentGeneratedMarkdown);
            } else {
                // 구형 브라우저 대응 Fallback
                const tempTextArea = document.createElement("textarea");
                tempTextArea.value = currentGeneratedMarkdown;
                document.body.appendChild(tempTextArea);
                tempTextArea.select();
                document.execCommand("copy");
                document.body.removeChild(tempTextArea);
            }

            // 복사 완료 피드백 (버튼 문구 임시 변경)
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "✅ 복사 완료!";
            copyBtn.disabled = true;

            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.disabled = false;
            }, 2000);

        } catch (err) {
            console.error("클립보드 복사 실패:", err);
            alert("클립보드 복사에 실패했습니다. 직접 드래그하여 복사해 주세요.");
        }
    });

    // 5. 마크다운(.md) 파일 다운로드 버튼 기능
    downloadBtn.addEventListener("click", () => {
        if (!currentGeneratedMarkdown) return;

        const nameInput = document.getElementById("name").value.trim();
        // 파일명 생성: '이름_Resume_Portfolio.md' (이름이 없으면 'My_Resume_Portfolio.md')
        const safeName = nameInput ? nameInput.replace(/[\\/:*?"<>|]/g, "") : "My";
        const fileName = `${safeName}_Resume_Portfolio.md`;

        // 텍스트 데이터를 Markdown 파일 형태(Blob)로 변환
        const blob = new Blob([currentGeneratedMarkdown], { type: "text/markdown;charset=utf-8" });
        const downloadUrl = URL.createObjectURL(blob);

        // 가상의 <a> 태그를 만들어 자동 클릭으로 다운로드 실행
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        // 다운로드 완료 후 정리
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    });

    // 6. PWA Service Worker 등록
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/sw.js")
                .then((registration) => {
                    console.log("[PWA] Service Worker 등록 성공:", registration.scope);
                })
                .catch((error) => {
                    console.warn("[PWA] Service Worker 등록 실패:", error);
                });
        });
    }
});
