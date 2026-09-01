"""
ProtoPatch — Automated Pipeline Tests
Tests both Sketch2Stack and ScreenToPatch pipelines using mocked services.

Run with:
    cd protopatch/backend
    python manage.py test api.tests.test_pipeline -v 2
"""
import io
import json
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch, PropertyMock

from django.conf import settings
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _make_test_image() -> bytes:
    """Create a minimal valid JPEG using Pillow."""
    from io import BytesIO
    from PIL import Image
    buf = BytesIO()
    img = Image.new('RGB', (100, 100), color='white')
    img.save(buf, format='JPEG')
    return buf.getvalue()


def _make_test_image_io():
    """Return a BytesIO of a valid JPEG for use as InMemoryUploadedFile."""
    from io import BytesIO
    from django.core.files.uploadedfile import InMemoryUploadedFile
    data = _make_test_image()
    buf = BytesIO(data)
    buf.name = 'test_sketch.jpg'
    return InMemoryUploadedFile(
        buf, 'image', 'test_sketch.jpg', 'image/jpeg', len(data), None
    )


def _make_test_audio_io():
    """Return a mock WebM audio file for upload."""
    from io import BytesIO
    from django.core.files.uploadedfile import InMemoryUploadedFile
    # Minimal valid WebM header bytes
    data = b'\x1a\x45\xdf\xa3' + b'\x00' * 200
    buf = BytesIO(data)
    buf.name = 'voice.webm'
    return InMemoryUploadedFile(
        buf, 'audio', 'voice.webm', 'audio/webm', len(data), None
    )


MOCK_SKETCH_RESULT = {
    "html_code": """<!DOCTYPE html>
<html>
<head><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-gray-900 text-white p-8">
  <nav class="bg-gray-800 p-4 rounded-xl mb-6">
    <h1 class="text-2xl font-bold text-indigo-400">TaskFlow</h1>
  </nav>
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-gray-800 p-4 rounded-xl">
      <h2 class="font-bold mb-3">📋 Todo</h2>
      <div class="space-y-2">
        <div class="bg-gray-700 p-3 rounded-lg text-sm">Design wireframes</div>
        <div class="bg-gray-700 p-3 rounded-lg text-sm">Setup Django API</div>
      </div>
    </div>
  </div>
</body>
</html>""",
    "django_models": """from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'Todo'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['status', '-created_at']

    def __str__(self):
        return self.title
""",
    "drf_serializers": """from rest_framework import serializers
from .models import Project, Task


class TaskSerializer(serializers.ModelSerializer):
    assignee_username = serializers.CharField(source='assignee.username', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status',
            'project', 'assignee', 'assignee_username',
            'due_date', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_by', 'tasks', 'task_count', 'created_at']
        read_only_fields = ['id', 'created_at', 'created_by']
    
    def get_task_count(self, obj):
        return obj.tasks.count()
""",
    "detected_components": ["NavBar", "KanbanBoard", "TaskCard", "StatusColumn"],
}

MOCK_BUG_RESULT = {
    "bug_description": "The price badge has a negative top offset (-8px) causing it to clip outside the product image container boundary, making it partially invisible on all screen sizes.",
    "target_element": ".price-badge",
    "suggested_fix": "Change the `top` CSS property from `-8px` to `8px` on the `.price-badge` element inside `.product-image-container`.",
    "css_or_logic_diff": """--- a/src/components/BuggyProductCard.jsx
+++ b/src/components/BuggyProductCard.jsx
@@ -28,7 +28,7 @@
         {/* BUG HERE: top: -8px causes badge to clip outside container */}
-        <div className="price-badge" style={{ position: 'absolute', top: '-8px', right: '12px' }}>
+        <div className="price-badge" style={{ position: 'absolute', top: '8px', right: '12px' }}>
           ${product.price}
         </div>
@@ -43,7 +43,7 @@
         <button
           className={`add-to-cart-btn ${addedToCart ? 'added' : ''}`}
           onClick={handleAddToCart}
-          style={{ marginTop: 0 /* should be 12px */ }}
+          style={{ marginTop: '12px' }}
           disabled={addedToCart}
         >""",
}


# ──────────────────────────────────────────────────────────────────────────────
# Test: Sketch2Stack Pipeline
# ──────────────────────────────────────────────────────────────────────────────

@override_settings(GEMINI_API_KEY='test-key-sk-xxx', GITHUB_TOKEN='')
class TestSketch2StackPipeline(TestCase):
    """Tests the complete Sketch2Stack API endpoint with mocked Gemini calls."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('sketch2stack')

    def _get_image_upload(self):
        return _make_test_image_io()

    @patch('api.services.vision_service.VisionService._call_gemini')
    @patch('api.services.sandbox_service.SandboxService.build_sandbox_payload')
    def test_sketch2stack_success(self, mock_sandbox, mock_gemini):
        """Full pipeline: image → Gemini VLM → sandbox HTML → response."""
        mock_gemini.return_value = MOCK_SKETCH_RESULT
        mock_sandbox.return_value = '<html><body>Sandboxed HTML</body></html>'

        img = self._get_image_upload()
        response = self.client.post(
            self.url,
            {
                'image': img,
                'notes': 'Kanban board for task management',
                'style': 'dark',
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check success flag
        self.assertTrue(data['success'])

        # Check all required output fields
        self.assertIn('html_code', data)
        self.assertIn('django_models', data)
        self.assertIn('drf_serializers', data)
        self.assertIn('detected_components', data)
        self.assertIn('sandbox_html', data)

        # Validate django_models content
        self.assertIn('from django.db import models', data['django_models'])
        self.assertIn('class Task', data['django_models'])
        self.assertIn('class Project', data['django_models'])

        # Validate DRF serializers
        self.assertIn('from rest_framework import serializers', data['drf_serializers'])
        self.assertIn('ModelSerializer', data['drf_serializers'])

        # Validate detected components
        self.assertIsInstance(data['detected_components'], list)
        self.assertGreater(len(data['detected_components']), 0)
        self.assertIn('NavBar', data['detected_components'])

    def test_sketch2stack_missing_image(self):
        """Should return 400 if no image is provided."""
        response = self.client.post(self.url, {'notes': 'test'}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('image', str(data['error']))

    def test_sketch2stack_invalid_style(self):
        """Should return 400 for invalid style choice."""
        img = self._get_image_upload()
        response = self.client.post(
            self.url,
            {'image': img, 'style': 'invalid-style'},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('api.services.vision_service.VisionService._call_gemini')
    @patch('api.services.sandbox_service.SandboxService.build_sandbox_payload')
    def test_sketch2stack_html_contains_tailwind(self, mock_sandbox, mock_gemini):
        """Generated HTML should reference Tailwind CDN."""
        mock_gemini.return_value = MOCK_SKETCH_RESULT
        mock_sandbox.return_value = MOCK_SKETCH_RESULT['html_code']

        img = self._get_image_upload()
        response = self.client.post(self.url, {'image': img}, format='multipart')
        data = response.json()

        self.assertTrue(data['success'])
        self.assertIn('cdn.tailwindcss.com', data['html_code'])

    @patch('api.services.vision_service.VisionService._call_gemini')
    @patch('api.services.sandbox_service.SandboxService.build_sandbox_payload')
    def test_sketch2stack_default_notes_and_style(self, mock_sandbox, mock_gemini):
        """Should accept request with just image — notes and style are optional."""
        mock_gemini.return_value = MOCK_SKETCH_RESULT
        mock_sandbox.return_value = '<html></html>'

        img = self._get_image_upload()
        response = self.client.post(self.url, {'image': img}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────────────────────
# Test: ScreenToPatch Pipeline
# ──────────────────────────────────────────────────────────────────────────────

@override_settings(GEMINI_API_KEY='test-key-sk-xxx', GITHUB_TOKEN='ghp_test_token_xxx')
class TestScreenToPatchPipeline(TestCase):
    """Tests the ScreenToPatch API endpoint with mocked AI/git services."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('screentopatch')

    def _get_screenshot(self):
        return _make_test_image_io()

    def _get_audio(self):
        return _make_test_audio_io()

    @patch('api.services.vision_service.VisionService.analyze_bug_from_image')
    @patch('api.services.audio_service.AudioService.transcribe')
    @patch('api.services.ast_engine.ASTEngine.search_repo')
    @patch('api.services.git_service.GitService.create_fix_pr')
    def test_screentopatch_full_pipeline(
        self, mock_pr, mock_ast, mock_audio, mock_vision
    ):
        """Full pipeline: screenshot + audio → transcript → bug → AST → PR."""
        mock_audio.return_value = "The price badge is clipping outside the card on mobile"
        mock_vision.return_value = MOCK_BUG_RESULT
        mock_ast.return_value = [
            {
                'file_path': 'src/components/BuggyProductCard.jsx',
                'start_line': 28,
                'end_line': 30,
                'snippet': '28: <div className="price-badge" style={{ top: \'-8px\' }}>',
                'score': 87.5,
                'match_type': 'ast:javascript',
            }
        ]
        mock_pr.return_value = {
            'pr_url': 'https://github.com/test/repo/pull/42',
            'pr_number': 42,
            'branch_name': 'fix/protopatch-1234567890',
        }

        screenshot = self._get_screenshot()
        audio = self._get_audio()

        response = self.client.post(
            self.url,
            {
                'screenshot': screenshot,
                'audio': audio,
                'repo_url': 'https://github.com/test/repo',
                'branch': 'main',
                'notes': 'Price badge is broken',
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check success
        self.assertTrue(data['success'])

        # Check all required output fields
        self.assertIn('bug_description', data)
        self.assertIn('target_element', data)
        self.assertIn('suggested_fix', data)
        self.assertIn('css_or_logic_diff', data)
        self.assertIn('transcript', data)
        self.assertIn('pr_url', data)
        self.assertIn('pr_number', data)
        self.assertIn('branch_name', data)
        self.assertIn('file_matches', data)

        # Check specific values
        self.assertEqual(data['pr_number'], 42)
        self.assertIn('pull/42', data['pr_url'])
        self.assertEqual(data['target_element'], '.price-badge')
        self.assertEqual(data['transcript'], "The price badge is clipping outside the card on mobile")
        self.assertIsInstance(data['file_matches'], list)
        self.assertEqual(len(data['file_matches']), 1)
        self.assertEqual(data['file_matches'][0]['file_path'], 'src/components/BuggyProductCard.jsx')

    def test_screentopatch_missing_visual_input(self):
        """Should return 400 if neither video nor screenshot is provided."""
        response = self.client.post(
            self.url,
            {'repo_url': 'https://github.com/test/repo'},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertFalse(data['success'])

    def test_screentopatch_missing_repo_url(self):
        """Should return 400 if repo_url is missing."""
        screenshot = self._get_screenshot()
        response = self.client.post(
            self.url,
            {'screenshot': screenshot},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_screentopatch_invalid_repo_url(self):
        """Should return 400 for non-URL repo_url."""
        screenshot = self._get_screenshot()
        response = self.client.post(
            self.url,
            {'screenshot': screenshot, 'repo_url': 'not-a-url'},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('api.services.vision_service.VisionService.analyze_bug_from_image')
    @patch('api.services.audio_service.AudioService.transcribe')
    @patch('api.services.ast_engine.ASTEngine.search_repo')
    def test_screentopatch_no_github_token(self, mock_ast, mock_audio, mock_vision):
        """Without GITHUB_TOKEN, pipeline should still succeed but return empty pr_url."""
        mock_audio.return_value = "nav overlaps hero"
        mock_vision.return_value = MOCK_BUG_RESULT
        mock_ast.return_value = []

        screenshot = self._get_screenshot()
        with self.settings(GITHUB_TOKEN=''):
            response = self.client.post(
                self.url,
                {
                    'screenshot': screenshot,
                    'repo_url': 'https://github.com/test/repo',
                },
                format='multipart',
            )

        # Should still return 200 — PR is optional
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['pr_url'], '')
        self.assertIsNone(data['pr_number'])


# ──────────────────────────────────────────────────────────────────────────────
# Test: Health Check
# ──────────────────────────────────────────────────────────────────────────────

class TestHealthCheck(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('health')

    def test_health_returns_ok(self):
        """Health endpoint should always return 200."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['status'], 'ok')
        self.assertIn('sketch2stack', data['modes'])
        self.assertIn('screentopatch', data['modes'])


# ──────────────────────────────────────────────────────────────────────────────
# Test: Services Unit Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestSandboxService(TestCase):

    def setUp(self):
        from api.services.sandbox_service import SandboxService
        self.service = SandboxService()

    def test_empty_payload(self):
        """Empty input returns a valid placeholder HTML."""
        result = self.service.build_sandbox_payload('')
        self.assertIn('<!DOCTYPE html>', result)
        self.assertIn('cdn.tailwindcss.com', result)

    def test_fragment_gets_wrapped(self):
        """HTML fragment should be wrapped in full page template."""
        fragment = '<div class="test">Hello World</div>'
        result = self.service.build_sandbox_payload(fragment)
        self.assertIn('<!DOCTYPE html>', result)
        self.assertIn('Hello World', result)
        self.assertIn('cdn.tailwindcss.com', result)
        self.assertIn('PP_RELOAD', result)

    def test_full_page_gets_injection(self):
        """Full HTML page should get Tailwind and postMessage injected."""
        full_html = '<html><head></head><body><p>Test</p></body></html>'
        result = self.service.build_sandbox_payload(full_html)
        self.assertIn('cdn.tailwindcss.com', result)
        self.assertIn('PP_RELOAD', result)

    def test_postmessage_listener_always_present(self):
        """Every sandbox payload must contain the postMessage reload listener."""
        for html in ['', '<div>fragment</div>', '<html><head></head><body></body></html>']:
            result = self.service.build_sandbox_payload(html)
            self.assertIn('PP_RELOAD', result, f"PP_RELOAD missing for input: {html[:50]}")


class TestVisionServiceJsonExtraction(TestCase):
    """Unit test the JSON extraction helper without calling Gemini."""

    def setUp(self):
        from api.services.vision_service import VisionService
        self.service = VisionService()

    def test_extract_direct_json(self):
        """Should parse clean JSON directly."""
        text = '{"html_code": "<html></html>", "detected_components": []}'
        result = self.service._extract_json(text)
        self.assertEqual(result['html_code'], '<html></html>')

    def test_extract_json_from_markdown_fence(self):
        """Should strip markdown code fences."""
        text = '```json\n{"html_code": "<html></html>", "x": 1}\n```'
        result = self.service._extract_json(text)
        self.assertEqual(result['x'], 1)

    def test_extract_json_raises_on_invalid(self):
        """Should raise ValueError for completely non-JSON text."""
        with self.assertRaises(ValueError):
            self.service._extract_json("This is just plain text with no JSON at all.")


class TestASTEngineFileIteration(TestCase):
    """Test AST engine file scanning logic."""

    def test_skips_node_modules(self):
        """node_modules directory should be excluded from scan."""
        from api.services.ast_engine import ASTEngine
        engine = ASTEngine()

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            # Create a file inside node_modules
            node_mod_file = tmp_path / 'node_modules' / 'react' / 'index.js'
            node_mod_file.parent.mkdir(parents=True)
            node_mod_file.write_text('module.exports = {};')

            # Create a legit source file
            src_file = tmp_path / 'src' / 'App.js'
            src_file.parent.mkdir()
            src_file.write_text('function App() { return <div>Hello</div>; }')

            files = list(engine._iter_source_files(tmp_path))
            paths = [str(f) for f in files]

            # Should find App.js but NOT node_modules file
            self.assertTrue(any('App.js' in p for p in paths))
            self.assertFalse(any('node_modules' in p for p in paths))

    def test_regex_extract_js_functions(self):
        """Should extract JS function names via regex."""
        from api.services.ast_engine import ASTEngine
        engine = ASTEngine()

        source = """
function NavBar() { return <nav>...</nav>; }
const Header = () => <header>...</header>;
class ProductCard extends Component { render() {} }
"""
        identifiers = engine._regex_extract(source, 'javascript')
        names = [name for name, _ in identifiers]

        self.assertIn('NavBar', names)
        self.assertIn('Header', names)
        self.assertIn('ProductCard', names)


class TestProjectExportZipView(TestCase):
    """Test project zip export endpoint."""

    def test_export_zip_success(self):
        client = APIClient()
        payload = {
            "project_name": "test-app",
            "files": [
                {"path": "frontend/App.tsx", "content": "export default function App() {}"},
                {"path": "backend/main.py", "content": "from fastapi import FastAPI"},
            ],
        }
        response = client.post("/api/sketch2stack/export-zip/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/zip")
        self.assertIn("attachment; filename=\"test-app.zip\"", response["Content-Disposition"])

