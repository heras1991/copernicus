$OutputFile = "chat_handover_recursive_dump.txt"

$AllowedExtensions = @(
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".geojson"
)

$ExcludedDirectories = @(
  "node_modules",
  "dist",
  "build",
  ".git",
  ".next",
  "coverage",
  ".vite"
)

if (Test-Path $OutputFile) {
  Remove-Item $OutputFile -Force
}

function Test-IsExcludedPath {
  param(
    [string]$Path,
    [string[]]$ExcludedNames
  )

  foreach ($name in $ExcludedNames) {
    if ($Path -match "(\\|/)$([regex]::Escape($name))(\\|/|$)") {
      return $true
    }
  }

  return $false
}

function Get-NormalizedExtension {
  param(
    [System.IO.FileInfo]$File
  )

  if ($File.Name -ieq ".env") {
    return ".env"
  }

  return $File.Extension.ToLower()
}

function Get-RelativePathCompat {
  param(
    [string]$BasePath,
    [string]$TargetPath
  )

  $baseFull = [System.IO.Path]::GetFullPath($BasePath)
  $targetFull = [System.IO.Path]::GetFullPath($TargetPath)

  if (-not $baseFull.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $baseFull += [System.IO.Path]::DirectorySeparatorChar
  }

  $baseUri = New-Object System.Uri($baseFull)
  $targetUri = New-Object System.Uri($targetFull)
  $relativeUri = $baseUri.MakeRelativeUri($targetUri)

  $relativePath = [System.Uri]::UnescapeDataString($relativeUri.ToString())
  $relativePath = $relativePath -replace "/", [System.IO.Path]::DirectorySeparatorChar

  return $relativePath
}

$ProjectRoot = (Get-Location).Path

Add-Content $OutputFile "PROJECT ROOT: $ProjectRoot"
Add-Content $OutputFile "GENERATED AT: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Content $OutputFile ""
Add-Content $OutputFile "ALLOWED EXTENSIONS: $($AllowedExtensions -join ', ')"
Add-Content $OutputFile "EXCLUDED DIRECTORIES: $($ExcludedDirectories -join ', ')"
Add-Content $OutputFile ""
Add-Content $OutputFile "==================== PROJECT TREE (FILTERED) ===================="
Add-Content $OutputFile ""

$AllFiles = Get-ChildItem -Path $ProjectRoot -Recurse -File | Where-Object {
  $fullPath = $_.FullName

  if (Test-IsExcludedPath -Path $fullPath -ExcludedNames $ExcludedDirectories) {
    return $false
  }

  $ext = Get-NormalizedExtension -File $_
  return $AllowedExtensions -contains $ext
} | Sort-Object FullName

foreach ($file in $AllFiles) {
  $relativePath = Get-RelativePathCompat -BasePath $ProjectRoot -TargetPath $file.FullName
  $ext = Get-NormalizedExtension -File $file
  Add-Content $OutputFile "$relativePath [ext=$ext]"
}

Add-Content $OutputFile ""
Add-Content $OutputFile "==================== FILE CONTENTS ===================="
Add-Content $OutputFile ""

foreach ($file in $AllFiles) {
  $relativePath = Get-RelativePathCompat -BasePath $ProjectRoot -TargetPath $file.FullName
  $ext = Get-NormalizedExtension -File $file

  Add-Content $OutputFile ""
  Add-Content $OutputFile "==================== FILE: $relativePath ===================="
  Add-Content $OutputFile "EXTENSION: $ext"
  Add-Content $OutputFile "SIZE_BYTES: $($file.Length)"
  Add-Content $OutputFile ""

  try {
    Get-Content -Path $file.FullName -Raw -ErrorAction Stop | Add-Content $OutputFile
  }
  catch {
    Add-Content $OutputFile "[ERROR READING FILE] $($_.Exception.Message)"
  }

  Add-Content $OutputFile ""
}

Write-Host "Dump generado correctamente: $OutputFile"
Write-Host "Archivos incluidos: $($AllFiles.Count)"