call .env\Scripts\activate.bat

rem Build Python Backend
pyinstaller entry.spec --noconfirm

rem Test Python Backend
dist\backend\backend.exe

rem Build Electron Frontend
yarn run make