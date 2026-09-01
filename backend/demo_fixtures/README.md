# ProtoPatch Demo Fixtures

This folder contains demo assets for testing and demonstrating ProtoPatch pipelines.

## Files

### `sample_napkin_sketch.png`
A realistic hand-drawn mobile app wireframe (Kanban board) for testing **Sketch2Stack** mode.

**How to use:**
1. Open ProtoPatch → ⚡ Sketch2Stack tab
2. Click "Upload" and select this file
3. Set notes: "Kanban task manager with drag-and-drop"
4. Click "Generate Stack"

### `buggy_react_component.jsx`
A React component with **intentional bugs** for testing **ScreenToPatch** mode.

**Bugs present:**
| Bug | Location | Fix |
|-----|----------|-----|
| Price badge clips outside container | Line 28: `top: '-8px'` | Change to `top: '8px'` |
| Button touches description (no margin) | Line 43: `marginTop: 0` | Change to `marginTop: '12px'` |
| Rating flex collapses at 375px | Line 52: no `flex-wrap` | Add `flexWrap: 'wrap'` |

**How to use:**
1. Take a screenshot of the rendered component showing the clipping bug
2. Record a voice memo: _"The price badge is overlapping outside the card boundary"_
3. Open ProtoPatch → 🩺 ScreenToPatch tab
4. Upload the screenshot + voice memo
5. Enter your GitHub repo URL
6. Click "Heal & Create PR"

### `sample_voice_note.webm`
*(Optional — generate with ffmpeg)*

To generate a test voice note:
```bash
# Record 5 seconds of silence (or use text-to-speech)
ffmpeg -f lavfi -i aevalsrc=0 -t 5 sample_voice_note.webm

# Or use online TTS to save as webm:
# Say: "The price badge element is clipping outside the product card on mobile devices"
```

## Offline Demo Mode

If you don't have API keys, the pipeline will show an error message after processing.
To simulate a full demo without API keys:
1. Set `DJANGO_DEBUG=True` in `.env`
2. The frontend health indicator will show "No API Key"
3. All UI flows (camera, recording, file upload) work without backend

---
*ProtoPatch Demo Fixtures — iQOO National Hackathon 2024*
