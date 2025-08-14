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
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Database Schema Diagram</title>
</head>
<body>
  <div class="spinner"><div class="spinner-icon"></div></div>
  <pre class="mermaid">
EOF

# Append the mermaid diagram content
cat schema.mmd >> ../docs/database.html

# Add closing HTML with modern functionality
cat >> ../docs/database.html << 'EOF'
  </pre>
  <div class="footer">Pan: Left Mouse Button | Zoom: Scroll Wheel</div>
  <style>
    body {
      background-color: #1e1e1e;
      overflow: hidden;
      user-select: none;
    }
    .spinner {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .spinner-icon {
      display: inline-block;
      width: 10em;
      height: 10em;
      border: 1em solid #ccc;
      border-top: 1em solid #333;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
    .mermaid {
      display: none;
      visibility: hidden;
      width: max-content;
      height: max-content;
      cursor: grab;
    }
    .footer{
      visibility: hidden;
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(30, 30, 30, 0.7);
      backdrop-filter: blur(8px);
      color: #757575;
      padding: 0.5em;
      text-align: center;
      font-family: "trebuchet ms", "sans-serif";
      font-size: 12px;
      border-top: 1px solid #333;
      box-shadow: 0 -2px 12px 0 rgba(0,0,0,0.15);
    }
    /* Node styling */
    .node > [class*=row-rect-] > path {
      fill: #2c2d2d !important;
    }
    .node > .label.name {
      font-weight: 600 !important;
      letter-spacing: 0.02em !important;
    }
    .node > g > path {
      fill: #141414 !important;
      stroke: none !important;
    }
    .node > g:first-of-type > path:last-of-type {
      stroke: none !important;
    }
  </style>
  <script type="module">

    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.mjs";
    import elkLayouts from "https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.mjs";

    const mermaidContainer = document.querySelector(".mermaid");


    // Clean up Mermaid ER diagram text for better display
    mermaidContainer.textContent = mermaidContainer.textContent
      .replace(/int_10__unsigned/g, "int")
      .replace(/bigint_20__unsigned/g, "bigint")
      .replace(/bigint_20_/g, "bigint")
      .replace(/tinyint_3__unsigned/g, "tinyint")
      .replace(/varchar_255_/g, "varchar")
      .replace(/enum__steam___discord__/g, "enum")
      .replace(/^(\s*)(\w+)\s+([\w_]+)\s+(PK|FK)$/gm, "$1$2($4) $3");


    // --- Automated relationship coloring for top entities ---

    function getTopEntities(erText, topN = 5) {
      // Matches relationship lines:
      //   "EntityA" }o--|| "EntityB" : ""
      const relRegex = /\"([^\"]+)\"\s*}[^ ]+\s*\"([^\"]+)\"/g;
      const counts = {};
      let match;
      while ((match = relRegex.exec(erText))) {
        const [a, b] = [match[1], match[2]];
        counts[a] = (counts[a] || 0) + 1;
        counts[b] = (counts[b] || 0) + 1;
      }

      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, topN)
        .map(([name]) => name);
    }

    function injectEntityColors(entities, colors) {
      const style = document.createElement("style");
      style.setAttribute("data-auto-entity-colors", "true");
      let css = "";
      entities.forEach((entity, i) => {
        const safe = entity.replace(/[^a-zA-Z0-9_-]/g, s => `\\${s.charCodeAt(0).toString(16)}`);
        css += `.relationshipLine[id*=entity-${safe}] { stroke: ${colors[i % colors.length]} !important; }`
      });
      style.textContent = css;
      document.head.appendChild(style);
    }

    const entityColors = [
      "#7dd3fc", // blue-cyan
      "#fbbf24", // yellow
      "#34d399", // green
      "#f87171", // red
      "#a78bfa", // purple
      "#facc15", // gold
      "#60a5fa", // light blue
      "#38bdf8", // sky blue
      "#f472b6", // pink
      "#fb7185"  // rose
    ];

    const topEntities = getTopEntities(mermaidContainer.textContent, 5);
    injectEntityColors(topEntities, entityColors);

    // --- End automated coloring ---


    //Rendering
    mermaid.registerLayoutLoaders(elkLayouts);
    mermaid.initialize({ startOnLoad: true });

    (function() {
      const footer = document.querySelector(".footer");
      const div = document.createElement("div");
      div.className = "footer-" + Math.random().toString(36).slice(2, 7);
      div.innerHTML = atob("Q29kZWQgd2l0aCBsb3ZlICZsdDszICZjb3B5OyAyMDI1IGluc28=");
      div.style.float = "right";
      footer.appendChild(div);
      footer.style.visibility = "visible";
    })();
    
    // --- Panning and Zooming ---

    let isPanning = false;
    let startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0;
    let zoom = 1.0;
    const minZoom = 0.2;
    const maxZoom = 3.0;

    function getSvg() {
      return mermaidContainer.querySelector("svg");
    }

    // Panning with left mouse button

    mermaidContainer.addEventListener("mousedown", (e) => {
      isPanning = true;
      mermaidContainer.style.cursor = "grabbing";
      startX = e.clientX;
      startY = e.clientY;
      scrollLeft = window.scrollX;
      scrollTop = window.scrollY;
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!isPanning) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      window.scrollTo({
        left: scrollLeft - dx,
        top: scrollTop - dy,
        behavior: "auto"
      });
    });

    window.addEventListener("mouseup", () => {
      if (isPanning) {
        isPanning = false;
        mermaidContainer.style.cursor = "grab";
      }
    });

    // Prevent dragging when holding down the left mouse button
    mermaidContainer.addEventListener("dragstart", (e) => e.preventDefault());

    // Zooming with scroll wheel

    mermaidContainer.addEventListener("wheel", (e) => {

      if (e.ctrlKey) return; // Prevent zooming with Ctrl key
      e.preventDefault(); // Prevent default zoom behavior
      
      const svgEl = getSvg();
      if (!svgEl) return;

      // Get the mouse position relative to the SVG
      const rect = svgEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate the new zoom level
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * delta));
      const scaleChange = newZoom / zoom;

      // Get the previous scroll position
      const prevScrollLeft = window.scrollX;
      const prevScrollTop = window.scrollY;

      // Set the transform origin to the top-left corner of the SVG
      svgEl.style.transformOrigin = "0 0";
      svgEl.style.transform = `scale(${newZoom})`;

      // Adjust scroll to keep zoom centered on mouse
      const newScrollLeft = (mouseX * (scaleChange - 1)) + prevScrollLeft;
      const newScrollTop = (mouseY * (scaleChange - 1)) + prevScrollTop;

      // Scroll to the new position
      window.scrollTo({
        left: newScrollLeft,
        top: newScrollTop,
        behavior: "auto"

      });
      zoom = newZoom;
    }, { passive: false });
    
     // --- End Panning and Zooming ---
    

    mermaidContainer.style.visibility = "hidden";
    mermaidContainer.style.display = "block";

    function showMermaidWhenRendered() {
      const svgEl = getSvg();
      if ( svgEl && svgEl.querySelector("g") ) {
        setTimeout(() => {
          mermaidContainer.style.visibility = "visible";
          document.querySelector(".spinner").style.display = "none";
        }, 1000); // Hack: 1 sec delay to allow Mermaid to actually finish rendering
      } else {
        requestAnimationFrame(showMermaidWhenRendered);
      }
    }

    showMermaidWhenRendered();
    
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