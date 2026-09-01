import os
import sys
import subprocess
import time

def generate_pdf():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    md_path = os.path.join(base_dir, "detail.md")
    html_path = os.path.join(base_dir, "detail.html")
    pdf_path = os.path.join(base_dir, "detail.pdf")

    if not os.path.exists(md_path):
        print(f"Error: {md_path} not found!")
        return False

    with open(md_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    # Escape for JavaScript template literal
    escaped_md = md_content.replace("\\", "\\\\").replace("`", "\\`").replace("$", "\\$")

    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ProtoPatch — Project Architecture & Folder Structure</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {{
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {{
        content: "Page " counter(page);
        font-family: 'JetBrains Mono', monospace;
        font-size: 8pt;
        color: #64748b;
      }}
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.6;
      font-size: 10pt;
      margin: 0;
      padding: 0;
    }}

    .container {{
      max-width: 820px;
      margin: 0 auto;
    }}

    h1 {{
      font-size: 22pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2.5px solid #f97316;
      padding-bottom: 8px;
      margin-top: 15px;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }}

    h2 {{
      font-size: 14pt;
      font-weight: 700;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-top: 24px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }}

    h3 {{
      font-size: 11pt;
      font-weight: 700;
      color: #334155;
      margin-top: 18px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }}

    h4 {{
      font-size: 10pt;
      font-weight: 600;
      color: #475569;
      margin-top: 14px;
      margin-bottom: 4px;
    }}

    p {{
      margin: 0 0 8px 0;
    }}

    blockquote {{
      border-left: 3.5px solid #f97316;
      background: #fff7ed;
      color: #9a3412;
      padding: 8px 14px;
      margin: 10px 0;
      border-radius: 0 6px 6px 0;
      font-size: 9.5pt;
    }}

    pre {{
      background: #0f172a !important;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 10px 14px;
      overflow-x: auto;
      margin: 10px 0;
      page-break-inside: avoid;
    }}

    code {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
    }}

    p code, li code, td code {{
      background: #f1f5f9;
      color: #0f172a;
      padding: 1.5px 4.5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }}

    pre code {{
      color: #f8fafc;
      background: transparent;
      padding: 0;
      border: none;
      line-height: 1.45;
    }}

    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }}

    th, td {{
      border: 1px solid #cbd5e1;
      padding: 6px 9px;
      text-align: left;
      vertical-align: top;
    }}

    th {{
      background: #f8fafc;
      color: #0f172a;
      font-weight: 700;
      border-bottom: 2px solid #94a3b8;
    }}

    tr:nth-child(even) td {{
      background: #fcfdfe;
    }}

    hr {{
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 18px 0;
    }}

    ul, ol {{
      margin: 0 0 10px 0;
      padding-left: 20px;
    }}

    li {{
      margin-bottom: 3px;
    }}

    .mermaid {{
      text-align: center;
      margin: 14px 0;
      page-break-inside: avoid;
      background: #fafafa;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }}

    a {{
      color: #ea580c;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="container" id="content"></div>

  <script>
    mermaid.initialize({{ startOnLoad: false, theme: 'neutral' }});
    marked.setOptions({{
      highlight: function(code, lang) {{
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, {{ language }}).value;
      }}
    }});

    const markdownText = `{escaped_md}`;
    document.getElementById('content').innerHTML = marked.parse(markdownText);

    // Render Mermaid diagrams
    document.querySelectorAll('pre code.language-mermaid').forEach((el) => {{
      const pre = el.parentElement;
      const graphDef = el.textContent;
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = graphDef;
      pre.parentElement.replaceChild(mermaidDiv, pre);
    }});

    mermaid.run();
  </script>
</body>
</html>
"""

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_template)
    print(f"Generated HTML template at: {html_path}")

    # Find Chrome or Edge
    browser_candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    browser_path = None
    for cand in browser_candidates:
        if os.path.exists(cand):
            browser_path = cand
            break

    if not browser_path:
        print("Error: Neither Chrome nor Edge was found on system.")
        return False

    print(f"Using browser: {browser_path}")
    cmd = [
        browser_path,
        "--headless=new",
        "--disable-gpu",
        "--allow-file-access-from-files",
        "--enable-local-file-accesses",
        "--virtual-time-budget=4000",
        f"--print-to-pdf={pdf_path}",
        html_path,
    ]

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000:
            print(f"SUCCESS: PDF successfully generated at: {pdf_path} (Size: {os.path.getsize(pdf_path):,} bytes)")
            return True
        else:
            print("Failed to generate PDF. Subprocess output:", res.stderr)
            return False
    except Exception as e:
        print("Exception during PDF generation:", e)
        return False

if __name__ == "__main__":
    success = generate_pdf()
    sys.exit(0 if success else 1)
