call .env\Scripts\activate.bat

rem Build Python Backend
pyinstaller entry.spec --noconfirm

rem Build Electron Frontend
yarn run make