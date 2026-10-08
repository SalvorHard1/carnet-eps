@echo off
rem Lance le Carnet EPS depuis ce dossier (marche aussi depuis la cle USB, quelle que soit sa lettre).
start "" powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0lancer.ps1"
