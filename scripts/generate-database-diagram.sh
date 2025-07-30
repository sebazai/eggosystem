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
config: # https://mermaid.js.org/schemas/config.schema.json
  layout: elk
    # dagre, elk, elk.force, elk.stress, elk.mrtree, elk.sporeOverlap
    # def:dagre
  look: classic # handDrawn, classic
  theme: dark # default, neutral, dark, forest, base
  elk:
    mergeEdges: false # true, false
    nodePlacementStrategy: SIMPLE # def:BRANDES_KOEPF
      # SIMPLE, NETWORK_SIMPLEX, LINEAR_SEGMENTS, BRANDES_KOEPF
    cycleBreakingStrategy: GREEDY_MODEL_ORDER # def:GREEDY_MODEL_ORDER 
      # GREEDY, DEPTH_FIRST, INTERACTIVE, MODEL_ORDER, GREEDY_MODEL_ORDER
      # (no effect - something overrides?)
  themeVariables:
    lineColor: "#F0F0F0"
  er:
    useWidth: 0 #px
    useMaxWidth: false # def:true
    titleTopMargin: 0 #px def:25
    diagramPadding: 15 #px def:20 (applies to table nodes)
    layoutDirection: BT #TB,BT,LR,RL def:TB (no effect - something overrides?)
    minEntityWidth: 10 #px def:100
    minEntityHeight: 10 #px def:75
    entityPadding: 0 #px def:15 (applies to table entities)
    nodeSpacing: 140 #px def:140 (no effect - something overrides?)
    rankSpacing: 80 #px def:80 (no effect - something overrides?)
    stroke: gray # def:gray (no effect - something overrides?)
    fill: honeydew # def:honeydew (no effect - something overrides?)
    fontSize: 12 #px def:12 (no effect - something overrides?)
---
erDiagram
  direction BT # TB, BT, LR, RL

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