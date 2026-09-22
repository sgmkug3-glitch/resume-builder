import os
import sys

# Vercel Serverless 실행 시 프로젝트 루트를 모듈 탐색 경로에 등록
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# 기존 app.py의 Flask 인스턴스를 가져와 Vercel WSGI 핸들러로 노출
from app import app
