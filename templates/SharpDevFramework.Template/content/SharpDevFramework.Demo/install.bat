@echo off
title Install Service
setlocal enabledelayedexpansion

:: ------------------- Request Admin Privileges -------------------
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if !errorlevel! neq 0 (
    echo Requesting admin privileges...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /b
)

:: Ensure working directory is script directory
pushd "%~dp0"

set APP_NAME=SharpDevFramework.Demo
set SERVICE_NAME=SharpDevFramework.Demo

:: ------------------- Check if exe exists -------------------
if not exist "%APP_NAME%.exe" (
    echo Exe file not found.
    echo Make sure it is in the same directory as install.bat.
    pause
    exit /b 1
)

:: ------------------- Check if service exists -------------------
sc qc "%SERVICE_NAME%" >nul 2>&1
if !errorlevel! equ 0 (
    echo Service "%SERVICE_NAME%" already exists.
    sc query "%SERVICE_NAME%" | find "STATE" | find "RUNNING" >nul
    if !errorlevel! equ 0 (
        echo Stopping service...
        sc stop "%SERVICE_NAME%" >nul
        if !errorlevel! neq 0 (
            echo Failed to stop service!
            pause
            exit /b 1
        )
        timeout /t 2 /nobreak >nul
        echo Service stopped.
    ) else (
        echo Service is not running, skip stopping.
    )
) else (
    echo Service "%SERVICE_NAME%" does not exist, creating...
    sc create "%SERVICE_NAME%" binPath= "%~dp0%APP_NAME%.exe" start= auto
    if !errorlevel! neq 0 (
        echo Failed to create service!
        pause
        exit /b 1
    )
)

:: ------------------- Start service -------------------
echo Starting service "%SERVICE_NAME%"...
sc start "%SERVICE_NAME%" >nul 2>&1
if !errorlevel! neq 0 (
    echo Failed to start service, check service status and logs.
    pause
    exit /b 1
)

echo Service "%SERVICE_NAME%" started successfully.
pause
exit /b 0
