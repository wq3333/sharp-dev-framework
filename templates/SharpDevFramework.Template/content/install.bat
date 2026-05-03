@echo off
title 安装服务
setlocal enabledelayedexpansion

>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if !errorlevel! neq 0 (
    echo 请求管理员权限...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /b
)

pushd "%~dp0"

set APP_NAME=SharpDevFramework.Demo
set SERVICE_NAME=demo-service-name

if not exist "%APP_NAME%.exe" (
    echo 当前未找到exe文件。
    echo 请确保此文件与 install.bat 位于同一目录。
    pause
    exit /b 1
)

sc qc "%SERVICE_NAME%" >nul 2>&1
if !errorlevel! equ 0 (
    echo 服务 "%SERVICE_NAME%" 已存在。
    sc query "%SERVICE_NAME%" | find "STATE" | find "RUNNING" >nul
    if !errorlevel! equ 0 (
        echo 正在停止服务...
        sc stop "%SERVICE_NAME%" >nul
        if !errorlevel! neq 0 (
            echo 停止服务失败！
            pause
            exit /b 1
        )
        timeout /t 2 /nobreak >nul
        echo 服务已停止。
    ) else (
        echo 服务未运行，跳过停止。
    )
) else (
    echo 服务 "%SERVICE_NAME%" 不存在，正在创建...
    sc create "%SERVICE_NAME%" binPath= "%~dp0%APP_NAME%.exe" start= auto
    if !errorlevel! neq 0 (
        echo 创建服务失败！
        pause
        exit /b 1
    )
)

echo 正在启动服务 "%SERVICE_NAME%"...
sc start "%SERVICE_NAME%" >nul 2>&1
if !errorlevel! neq 0 (
    echo 启动服务失败，请检查服务状态和日志。
    pause
    exit /b 1
)

echo 服务 "%SERVICE_NAME%" 已成功启动。
pause
exit /b 0
