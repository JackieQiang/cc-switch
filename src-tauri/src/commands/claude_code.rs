use tauri::command;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaudeCodeStatus {
    pub installed: bool,
    pub path: Option<String>,
    pub version: Option<String>,
}

#[command]
pub fn check_claude_code_status() -> Result<ClaudeCodeStatus, String> {
    // Check if Claude Code is installed
    // On macOS, check /Applications or ~/Applications
    // On Windows, check Program Files
    
    let output = if cfg!(target_os = "macos") {
        Command::new("mdfind")
            .args(["kMDItemCFBundleIdentifier = 'com.anthropic.claude-code'"])
            .output()
    } else if cfg!(target_os = "windows") {
        Command::new("where")
            .arg("Claude Code.exe")
            .output()
    } else {
        return Err("Unsupported OS".to_string());
    };

    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let installed = !stdout.trim().is_empty();
            
            let path = if installed {
                if cfg!(target_os = "macos") {
                    Some("/Applications/Claude Code.app".to_string())
                } else {
                    Some("C:\\Program Files\\Claude Code\\Claude Code.exe".to_string())
                }
            } else {
                None
            };

            Ok(ClaudeCodeStatus {
                installed,
                path,
                version: None,
            })
        }
        Err(_) => Ok(ClaudeCodeStatus {
            installed: false,
            path: None,
            version: None,
        }),
    }
}

#[command]
pub fn install_claude_code() -> Result<String, String> {
    // Open Claude Code download page
    let url = "https://claude.com/download";
    
    if cfg!(target_os = "macos") {
        Command::new("open")
            .arg(url)
            .spawn()
            .map_err(|e| e.to_string())?;
    } else if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/c", "start", url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok("Opened Claude Code download page".to_string())
}

#[command]
pub fn open_folder_with_claude_code(folder_path: String) -> Result<String, String> {
    // Check if Claude Code is installed first
    let status = check_claude_code_status()?;
    
    if !status.installed {
        return Err("Claude Code is not installed. Please install it first.".to_string());
    }

    // Open folder with Claude Code
    // On macOS, use 'code' command if Claude Code CLI is installed
    // Or open the folder in Claude Code app
    
    if cfg!(target_os = "macos") {
        // Try to use claude CLI first
        let cli_result = Command::new("claude")
            .arg("--version")
            .output();

        match cli_result {
            Ok(_) => {
                // Claude CLI is available, use it
                let output = Command::new("claude")
                    .arg(".")
                    .current_dir(&folder_path)
                    .spawn()
                    .map_err(|e| e.to_string())?;
                Ok(format!("Started Claude Code in {}", folder_path))
            }
            Err(_) => {
                // Fallback: open folder in Finder and prompt user to open in Claude Code
                Command::new("open")
                    .arg(&folder_path)
                    .spawn()
                    .map_err(|e| e.to_string())?;
                
                // Try to open Claude Code app
                Command::new("open")
                    .arg("-a")
                    .arg("Claude Code")
                    .spawn()
                    .map_err(|e| e.to_string())?;
                
                Ok("Opened folder. Please drag the folder to Claude Code app.".to_string())
            }
        }
    } else if cfg!(target_os = "windows") {
        // On Windows, try to use Claude Code CLI
        let output = Command::new("cmd")
            .args(["/c", "cd", &folder_path, "&&", "claude", "."])
            .spawn()
            .map_err(|e| e.to_string())?;
        
        Ok(format!("Started Claude Code in {}", folder_path))
    } else {
        Err("Unsupported OS".to_string())
    }
}

#[command]
pub fn select_folder_dialog() -> Result<Option<String>, String> {
    use std::path::PathBuf;
    
    // Use native file dialog through Tauri
    // This is a simplified version - in production, use tauri-plugin-dialog
    
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("osascript")
            .args(["-e", "POSIX path of (choose folder)"])
            .output()
            .map_err(|e| e.to_string())?;
        
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if path.is_empty() {
            Ok(None)
        } else {
            Ok(Some(path))
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Err("Not implemented for this OS".to_string())
    }
}
