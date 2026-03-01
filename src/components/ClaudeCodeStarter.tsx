import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke } from '@tauri-apps/api/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Download, FolderOpen, AlertCircle, Loader2 } from 'lucide-react'

interface ClaudeCodeStatus {
  installed: boolean
  path?: string
  version?: string
}

export function ClaudeCodeStarter() {
  const { t } = useTranslation()
  const [checking, setChecking] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [openingFolder, setOpeningFolder] = useState(false)
  const [status, setStatus] = useState<ClaudeCodeStatus | null>(null)
  const [selectedFolder, setSelectedFolder] = useState('')

  // Check if Claude Code is installed
  const checkClaudeCode = async () => {
    setChecking(true)
    try {
      const result = await invoke<ClaudeCodeStatus>('check_claude_code_status')
      setStatus(result)
    } catch (error) {
      console.error('Failed to check Claude Code status:', error)
      setStatus({ installed: false })
    } finally {
      setChecking(false)
    }
  }

  // Install Claude Code (macOS)
  const installClaudeCode = async () => {
    setInstalling(true)
    try {
      await invoke('install_claude_code')
      // Check status again after installation
      await checkClaudeCode()
    } catch (error) {
      console.error('Failed to install Claude Code:', error)
    } finally {
      setInstalling(false)
    }
  }

  // Open folder and start Claude Code
  const openFolderWithClaudeCode = async () => {
    if (!selectedFolder) return
    setOpeningFolder(true)
    try {
      await invoke('open_folder_with_claude_code', { folderPath: selectedFolder })
    } catch (error) {
      console.error('Failed to open folder with Claude Code:', error)
    } finally {
      setOpeningFolder(false)
    }
  }

  // Select folder dialog
  const selectFolder = async () => {
    try {
      const folder = await invoke<string>('select_folder_dialog')
      if (folder) {
        setSelectedFolder(folder)
      }
    } catch (error) {
      console.error('Failed to select folder:', error)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Claude Code 小白入门</h1>
          <p className="text-muted-foreground">
            一键安装和使用 Claude Code，让 AI 帮你编程
          </p>
        </div>

        {/* Step 1: Check Installation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">1</span>
              检查 Claude Code 安装状态
            </CardTitle>
            <CardDescription>
              点击下方按钮检查你的电脑是否已经安装了 Claude Code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button onClick={checkClaudeCode} disabled={checking}>
                {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {checking ? '检查中...' : '检查安装状态'}
              </Button>
              
              {status && (
                <div className={`flex items-center gap-2 ${status.installed ? 'text-green-500' : 'text-yellow-500'}`}>
                  {status.installed ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>已安装 (版本: {status.version})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      <span>未安装</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Install (if not installed) */}
        {!status?.installed && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">2</span>
                一键安装 Claude Code
              </CardTitle>
              <CardDescription>
                如果未安装，点击下方按钮自动安装 Claude Code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={installClaudeCode} disabled={installing}>
                {installing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {installing ? '安装中...' : '一键安装 Claude Code'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Open Folder with Claude Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">3</span>
              一键启动 Claude Code
            </CardTitle>
            <CardDescription>
              选择一个文件夹，在该文件夹位置启动 Claude Code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={selectFolder}>
                <FolderOpen className="mr-2 h-4 w-4" />
                选择文件夹
              </Button>
              
              {selectedFolder && (
                <div className="flex-1 px-4 py-2 bg-muted rounded-md text-sm overflow-hidden text-ellipsis">
                  {selectedFolder}
                </div>
              )}
            </div>
            
            {selectedFolder && (
              <Button onClick={openFolderWithClaudeCode} disabled={openingFolder}>
                {openingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {openingFolder ? '启动中...' : '在文件夹中启动 Claude Code'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>使用帮助</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Claude Code 是一个 AI 编程助手，可以帮助你编写代码、调试程序</p>
            <p>• 首次使用需要登录你的 Claude 账号</p>
            <p>• 在文件夹中启动后，可以直接用自然语言让 AI 帮你编程</p>
            <p>• 支持 macOS 和 Windows 系统</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
