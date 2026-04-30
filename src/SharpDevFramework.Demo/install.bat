@echo off
title 安装服务
setlocal enabledelayedexpansion

:: ------------------- 获取管理员权限 -------------------
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if !errorlevel! neq 0 (
    echo 请求管理员权限...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /b
)

:: 确保当前目录为脚本所在目录
pushd "%~dp0"

set APP_NAME=SharpDevFramework.Demo
set SERVICE_NAME=demo

:: ------------------- 检查exe是否存在 -------------------
if not exist "%APP_NAME%.exe" (
    echo 错误：未找到exe文件！
    echo 请确保该文件与 install.bat 位于同一目录。
    pause
    exit /b 1
)

:: ------------------- 检查服务是否存在 -------------------
sc qc "%SERVICE_NAME%" >nul 2>&1
if !errorlevel! equ 0 (
    echo 服务 "%SERVICE_NAME%" 已存在。
    :: 检查是否正在运行
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
        echo 服务未运行，无需停止。
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

:: ------------------- 启动服务 -------------------
echo 正在启动服务 "%SERVICE_NAME%"...
sc start "%SERVICE_NAME%" >nul 2>&1
if !errorlevel! neq 0 (
    echo 启动服务失败！请检查服务状态或日志。
    pause
    exit /b 1
)

echo 服务 "%SERVICE_NAME%" 已成功启动。
pause
exit /b 0