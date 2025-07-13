#!/bin/bash
set -e

rm -rf dbdoc/
echo "Generating database documentation..."
tbls doc -c .tbls.yml

echo "Generating mermaid diagram..."
cd dbdoc/
tbls out -c ../.tbls.yml -t mermaid -o schema.mmd

echo "Adding mermaid styling configuration..."
MERMAID_CONFIG=$(cat <<'EOF'
---
config:
  layout: elk # %% dagre, elk
  look: classic # %% handDrawn, classic
  theme: forest # %% default, neutral, dark, forest, base
  elk: # %% for layout: elk
    mergeEdges: false # %% true, false
    nodePlacementStrategy: NETWORK_SIMPLEX
      # %% SIMPLE, NETWORK_SIMPLEX, LINEAR_SEGMENTS, BRANDES_KOEPF
  themeCSS:
    - ".relationshipLine[id*=entity-Accounts] { stroke: #7dd3fc; }"
    - ".relationshipLine[id*=entity-SteamPlayers] { stroke: #fbbf24; }"
    - ".relationshipLine[id*=entity-Seasons] { stroke: #a78bfa; }"
    - ".relationshipLine[id*=entity-Teams] { stroke: #f472b6; }"
    - ".relationshipLine[id*=entity-MatchGames] { stroke: #34d399; }"
    - ".relationshipLine[id*=entity-Matches] { stroke: #f87171; }"
---
erDiagram
  direction TB # %% TB, BT, LR, RL

EOF
)

# Create a temporary file with the mermaid config
TMP_FILE=$(mktemp)
echo "$MERMAID_CONFIG" > "$TMP_FILE"

# Append the original schema.mmd content, skipping the first line (erDiagram)
tail -n +2 schema.mmd >> "$TMP_FILE"

# Replace the original schema.mmd with our modified version
mv "$TMP_FILE" schema.mmd

echo "Saving diagram file (mermaid format) to docs..."
mkdir -p ../docs
cp schema.mmd ../docs/database.mmd

echo "Creating HTML wrapper for mermaid diagram..."
cat > ../docs/database.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Database Schema Diagram</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #1e1e1e;
      color: #fff;
      font-family: Arial, sans-serif;
    }
    .container {
      padding: 20px;
    }
    h1 {
      text-align: center;
      color: #fff;
    }
    pre {
      display: none;
    }
    #diagram {
      width: 100%;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Kanaliiga Database Schema</h1>
    <div id="diagram"></div>
    <pre id="mermaid-code">
EOF

# Append the mermaid diagram content
cat schema.mmd >> ../docs/database.html

# Add closing HTML
cat >> ../docs/database.html << 'EOF'
    </pre>
  </div>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const code = document.getElementById("mermaid-code").textContent;
      mermaid.initialize({
        startOnLoad: true,
        theme: 'forest',
        themeVariables: {
          darkMode: true,
          background: '#1e1e1e',
          primaryColor: '#41BDF5',
          primaryTextColor: '#fff',
          primaryBorderColor: '#7C0000',
          lineColor: '#F8B229',
          secondaryColor: '#006100',
          tertiaryColor: '#fff'
        },
        er: { 
          useMaxWidth: false,
          layoutDirection: 'TB',
          entityPadding: 15,
          stroke: '#999',
          fill: '#1f2020'
        },
        flowchart: {
          useMaxWidth: false
        },
        themeCSS: `
          .relationshipLine[id*=entity-Accounts] { stroke: #7dd3fc; }
          .relationshipLine[id*=entity-SteamPlayers] { stroke: #fbbf24; }
          .relationshipLine[id*=entity-Seasons] { stroke: #a78bfa; }
          .relationshipLine[id*=entity-Teams] { stroke: #f472b6; }
          .relationshipLine[id*=entity-MatchGames] { stroke: #34d399; }
          .relationshipLine[id*=entity-Matches] { stroke: #f87171; }
        `,
        securityLevel: 'loose',
        fontFamily: 'trebuchet ms, verdana, arial, sans-serif',
        logLevel: 1,
        deterministicIds: true,
        layout: 'elk',
        "elk": {
          "mergeEdges": false,
          "nodePlacementStrategy": "NETWORK_SIMPLEX"
        }
      });
      
      const element = document.getElementById("diagram");
      const insertSvg = function(svgCode) {
        element.innerHTML = svgCode;
      };
      
      mermaid.render('mermaid-diagram', code).then(result => {
        insertSvg(result.svg);
      });
    });
  </script>
</body>
</html>
EOF

echo "Database diagram successfully generated!"
echo "Diagram available at:"
echo "  - docs/database.mmd (raw mermaid format)"
echo "  - docs/database.html (HTML with rendered diagram)"
echo ""
echo "Open the HTML file in a browser to view the interactive diagram." 