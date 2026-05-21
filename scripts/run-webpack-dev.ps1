$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $projectRoot '.runtime'
$nodeVersion = 'v16.20.2'
$nodeFolder = "node-$nodeVersion-win-x64"
$nodeHome = Join-Path $runtimeRoot $nodeFolder
$nodeExe = Join-Path $nodeHome 'node.exe'
$nodeZip = Join-Path $runtimeRoot "$nodeFolder.zip"
$webpackDevServer = Join-Path $projectRoot 'node_modules\webpack-dev-server\bin\webpack-dev-server.js'
$webpackConfig = Join-Path $projectRoot 'build\webpack.dev.conf.js'

if (!(Test-Path $webpackDevServer)) {
  throw "Missing webpack-dev-server at $webpackDevServer"
}

if (!(Test-Path $nodeExe)) {
  New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
  $downloadUrl = "https://nodejs.org/dist/$nodeVersion/$nodeFolder.zip"
  Write-Host "Downloading $downloadUrl"
  Invoke-WebRequest -Uri $downloadUrl -OutFile $nodeZip
  if (Test-Path $nodeHome) {
    Remove-Item -Recurse -Force $nodeHome
  }
  Expand-Archive -Path $nodeZip -DestinationPath $runtimeRoot -Force
}

$env:Path = "$nodeHome;$env:Path"
& $nodeExe $webpackDevServer --inline --progress --config $webpackConfig
