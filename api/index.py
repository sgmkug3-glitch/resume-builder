import os
import sys

# Vercel Serverless 실행 시 프로젝트 루트를 모듈 탐색 경로에 등록
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# 기존 app.py의 Flask 인스턴스를 가져와 Vercel WSGI 핸들러로 노출
from app import app

# Vercel이 인식하는 핸들러 이름으로 명시적 노출
handler = app
