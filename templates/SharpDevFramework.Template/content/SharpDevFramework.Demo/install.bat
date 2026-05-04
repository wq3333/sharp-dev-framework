@echo off
title ��װ����
setlocal enabledelayedexpansion

:: ------------------- ��ȡ����ԱȨ�� -------------------
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if !errorlevel! neq 0 (
    echo �������ԱȨ��...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /b
)

:: ȷ����ǰĿ¼Ϊ�ű�����Ŀ¼
pushd "%~dp0"

set APP_NAME=SharpDevFramework.Demo
set SERVICE_NAME=SharpDevFramework.Demo

:: ------------------- ���exe�Ƿ���� -------------------
if not exist "%APP_NAME%.exe" (
    echo ����δ�ҵ�exe�ļ���
    echo ��ȷ�����ļ��� install.bat λ��ͬһĿ¼��
    pause
    exit /b 1
)

:: ------------------- �������Ƿ���� -------------------
sc qc "%SERVICE_NAME%" >nul 2>&1
if !errorlevel! equ 0 (
    echo ���� "%SERVICE_NAME%" �Ѵ��ڡ�
    :: ����Ƿ���������
    sc query "%SERVICE_NAME%" | find "STATE" | find "RUNNING" >nul
    if !errorlevel! equ 0 (
        echo ����ֹͣ����...
        sc stop "%SERVICE_NAME%" >nul
        if !errorlevel! neq 0 (
            echo ֹͣ����ʧ�ܣ�
            pause
            exit /b 1
        )
        timeout /t 2 /nobreak >nul
        echo ������ֹͣ��
    ) else (
        echo ����δ���У�����ֹͣ��
    )
) else (
    echo ���� "%SERVICE_NAME%" �����ڣ����ڴ���...
    sc create "%SERVICE_NAME%" binPath= "%~dp0%APP_NAME%.exe" start= auto
    if !errorlevel! neq 0 (
        echo ��������ʧ�ܣ�
        pause
        exit /b 1
    )
)

:: ------------------- �������� -------------------
echo ������������ "%SERVICE_NAME%"...
sc start "%SERVICE_NAME%" >nul 2>&1
if !errorlevel! neq 0 (
    echo ��������ʧ�ܣ��������״̬����־��
    pause
    exit /b 1
)

echo ���� "%SERVICE_NAME%" �ѳɹ�������
pause
exit /b 0