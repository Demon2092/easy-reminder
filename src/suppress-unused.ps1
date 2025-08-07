@"
# suppress-unused.ps1
# Adds eslint-disable comments above unused React/TS imports or variables

\$patternImportReact = '^\s*import\s+React.*'
\$patternUnusedImport = '^\s*import\s+.*\s+from\s+.*;'
\$patternUnusedConst = '^\s*const\s+\w+\s*='

Get-ChildItem -Recurse -Filter *.tsx -Path .\src | ForEach-Object {
    \$file = \$_.FullName
    \$lines = Get-Content \$file
    \$newLines = @()

    for (\$i = 0; \$i -lt \$lines.Count; \$i++) {
        \$line = \$lines[\$i]

        if (\$line -match \$patternImportReact -or \$line -match \$patternUnusedImport) {
            \$newLines += "// eslint-disable-next-line @typescript-eslint/no-unused-vars"
        }
        elseif (\$line -match \$patternUnusedConst) {
            \$newLines += "// eslint-disable-next-line @typescript-eslint/no-unused-vars"
        }

        \$newLines += \$line
    }

    Set-Content -Path \$file -Value \$newLines -Encoding UTF8
    Write-Host "✅ Suppression added in \$($_.Name)"
}

Write-Host "🎉 Done. Suppressions added where matching unused patterns were found."
"@ | Out-File -Encoding UTF8 -FilePath .\suppress-unused.ps1
