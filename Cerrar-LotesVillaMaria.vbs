Option Explicit

Dim shell
Dim fso
Dim rutaProyecto
Dim comando

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

rutaProyecto = fso.GetParentFolderName(WScript.ScriptFullName)

' =========================================================
' CERRAR SOLO LOS PROCESOS NODE/CMD DE ESTE PROYECTO
' =========================================================

comando = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command " & _
Chr(34) & _
"$ruta = '" & Replace(rutaProyecto, "'", "''") & "'; " & _
"$procesos = Get-CimInstance Win32_Process | Where-Object { " & _
"$_.CommandLine -and " & _
"($_.Name -eq 'node.exe' -or $_.Name -eq 'cmd.exe') -and " & _
"$_.CommandLine -like ('*' + $ruta + '*') " & _
"}; " & _
"$procesos | ForEach-Object { " & _
"try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {} " & _
"}" & _
Chr(34)

shell.Run comando, 0, True

' =========================================================
' MENSAJE FINAL
' =========================================================

MsgBox _
  "Lotes Villa Maria se ha cerrado correctamente.", _
  64, _
  "Lotes Villa Maria"

Set shell = Nothing
Set fso = Nothing