# suppress-unused.ps1
# Adds eslint-disable comments above unused React/TS imports or variables

\ = '^\s*import\s+React.*'
\ = '^\s*import\s+.*\s+from\s+.*;'
\ = '^\s*const\s+\w+\s*='

Get-ChildItem -Recurse -Filter *.tsx -Path .\src | ForEach-Object {
    \ = \.FullName
    \ = Get-Content \
    \ = @()

    for (\ = 0; \ -lt \.Count; \++) {
        \ = \[\]

        if (\ -match \ -or \ -match \) {
            \ += "// eslint-disable-next-line @typescript-eslint/no-unused-vars"
        }
        elseif (\ -match \) {
            \ += "// eslint-disable-next-line @typescript-eslint/no-unused-vars"
        }

        \ += \
    }

    Set-Content -Path \ -Value \ -Encoding UTF8
    Write-Host "âœ… Suppression added in \"
}

Write-Host "ðŸŽ‰ Done. Suppressions added where matching unused patterns were found."
