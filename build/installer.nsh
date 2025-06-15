; Unicode support
Unicode true

!macro customHeader
  !system "echo '' > ${BUILD_RESOURCES_DIR}\\customHeader"
!macroend

!macro preInit
  ; This macro is called before the installer displays the first page
!macroend

!macro customInit
  ; Check if the app is already installed
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString"
  ${If} $0 != ""
    MessageBox MB_YESNO|MB_ICONQUESTION "Glimpseは既にインストールされています。$\n$\n現在のバージョンをアンインストールして新しいバージョンをインストールしますか？" IDYES uninst
    Abort
    uninst:
      ; Run uninstaller silently
      ExecWait '"$0" /S'
  ${EndIf}
!macroend

!macro customInstall
  ; Create start menu shortcut
  CreateShortCut "$SMPROGRAMS\Glimpse.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
!macroend

!macro customUninstall
  ; Remove start menu shortcut
  Delete "$SMPROGRAMS\Glimpse.lnk"
  
  ; Remove desktop shortcut
  Delete "$DESKTOP\Glimpse.lnk"
  
  ; Remove from system tray if running
  ; First, try to close the application gracefully
  FindWindow $0 "" "Glimpse"
  ${If} $0 != 0
    MessageBox MB_YESNO|MB_ICONQUESTION "Glimpseが実行中です。終了してからアンインストールを続行しますか？" IDYES kill_app
    Abort
    kill_app:
      ; Send close message to the window
      SendMessage $0 ${WM_CLOSE} 0 0
      Sleep 2000
  ${EndIf}
  
  ; Remove app data if user wants
  MessageBox MB_YESNO|MB_ICONQUESTION "アプリケーションデータ（設定、履歴など）も削除しますか？$\n$\n※削除しない場合、再インストール時に設定が引き継がれます。" IDYES delete_data
  Goto skip_delete_data
  
  delete_data:
    ; Remove application data
    RMDir /r "$APPDATA\glimpse-electron"
    
    ; Remove LocalStorage data
    RMDir /r "$LOCALAPPDATA\glimpse-electron"
    
    ; Remove Electron cache
    RMDir /r "$APPDATA\glimpse-electron\Cache"
    RMDir /r "$APPDATA\glimpse-electron\GPUCache"
    
    ; Remove settings stored by electron-store
    Delete "$APPDATA\glimpse-electron\config.json"
    
  skip_delete_data:
  
  ; Remove registry entries
  DeleteRegKey HKCU "Software\Glimpse"
  
  ; Remove file associations if any
  DeleteRegKey HKCR ".glimpse"
  
  ; Clear Windows jump list
  ; This removes pinned items and recent files from taskbar
  !insertmacro ComClearRecentDocs
!macroend

; Windows message constants are already defined in NSIS standard includes
; No need to define WM_CLOSE here

; Macro for clearing recent documents
!macro ComClearRecentDocs
  System::Call 'shell32.dll::SHAddToRecentDocs(i 2, i 0)'
!macroend