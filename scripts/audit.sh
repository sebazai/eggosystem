if [ -f gl-dependency-scanning-report.json ]; then
        echo '{
          "version": "2.0",
          "vulnerabilities": []
        }' > template.json
        jq -r '.advisories | to_entries | .[] | .value | {
          "category": "dependency_scanning",
          "message": .title,
          "description": .overview,
          "severity": (.severity | ascii_upcase),
          "solution": .recommendation,
          "identifiers": [{
            "type": "PNPM_AUDIT",
            "name": .id,
            "value": .id,
            "url": .url
          }],
          "links": [{
            "url": .url
          }]
        }' gl-dependency-scanning-report.json | jq -s '{"version":"2.0","vulnerabilities":.}' > gl-dependency-scanning.json
fi