Option Explicit

Dim shell
Dim rutaProyecto
Dim rutaBackend
Dim rutaFrontend

Set shell = CreateObject("WScript.Shell")

rutaProyecto = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

rutaBackend = rutaProyecto & "\backend"
rutaFrontend = rutaProyecto & "\frontend"

' =========================================================
' INICIAR BACKEND OCULTO
' =========================================================

shell.Run _
  "cmd /c cd /d """ & rutaBackend & """ && npm run dev", _
  0, _
  False

' =========================================================
' ESPERAR BACKEND
' =========================================================

WScript.Sleep 2500

' =========================================================
' INICIAR FRONTEND OCULTO Y EXPUESTO A LA RED
' =========================================================

shell.Run _
  "cmd /c cd /d """ & rutaFrontend & """ && npm run dev -- --host 0.0.0.0", _
  0, _
  False

' =========================================================
' ESPERAR VITE
' =========================================================

WScript.Sleep 3500

' =========================================================
' ABRIR LOTES VILLA MARIA
' =========================================================

shell.Run "http://localhost:5173", 1, False

Set shell = Nothing