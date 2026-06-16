@echo off
cd /d "%~dp0"
echo Building ReflectFlow for production...
echo.
call npx tsc -b && npx vite build
echo.
if %errorlevel% equ 0 (
    echo Build successful! Output in dist/
) else (
    echo Build failed with error code %errorlevel%
)
pause
