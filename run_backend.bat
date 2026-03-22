@echo off
echo ============================================
echo [ScribeMind AI] Starting Backend Server...
echo ============================================

cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies (this may take a minute)...
pip install -r requirements.txt

echo.
echo ============================================
echo Check backend/.env for GEMINI_API_KEY setting!
echo ============================================
echo.

python app.py
pause
