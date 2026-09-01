"""
ProtoPatch API Views

Endpoints:
  - HealthCheckView             : GET  /api/health/
  - Sketch2StackView            : POST /api/sketch2stack/
  - Sketch2StackRefineView      : POST /api/sketch2stack/refine/
  - Sketch2StackExportZipView   : POST /api/sketch2stack/export-zip/
  - ScreenToPatchView           : POST /api/screentopatch/
"""
import gc
import io
import logging
import tempfile
import time
import zipfile
from pathlib import Path

from django.conf import settings
from django.http import HttpResponse
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView, exception_handler

from .serializers import (
    Sketch2StackInputSerializer,
    ProjectRefineSerializer,
    ProjectExportZipSerializer,
    ScreenToPatchInputSerializer,
)
from .services.vision_service import VisionService
from .services.audio_service import AudioService
from .services.ast_engine import ASTEngine
from .services.git_service import GitService
from .services.sandbox_service import SandboxService

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Enrich DRF error responses with consistent structure."""
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            "success": False,
            "error": response.data,
        }
    else:
        logger.exception("Unhandled exception in view: %s", context.get("view"))
        response = Response(
            {"success": False, "error": "An internal server error occurred."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return response


class HealthCheckView(APIView):
    """Simple liveness probe for the backend."""

    def get(self, request):
        return Response({
            "success": True,
            "status": "ok",
            "version": "1.0.0",
            "modes": ["sketch2stack", "screentopatch"],
            "gemini_configured": bool(settings.GEMINI_API_KEY),
            "github_configured": bool(settings.GITHUB_TOKEN),
        })


class Sketch2StackView(APIView):
    """
    POST /api/sketch2stack/

    Full-stack multi-file scaffolding from a wireframe sketch.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            serializer = Sketch2StackInputSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {"success": False, "error": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            validated = serializer.validated_data
            image_file = validated["image"]
            notes = validated.get("notes", "")
            style = validated.get("style", "auto")
            stack = {
                "frontend": validated.get("stack_frontend", "react"),
                "backend": validated.get("stack_backend", "django"),
                "database": validated.get("stack_database", "postgresql"),
            }

            image_bytes = image_file.read()

            # --- Step 1: VLM Multi-File Analysis ---
            vision = VisionService()
            sketch_result = vision.parse_sketch(
                image_bytes=image_bytes,
                mime_type=image_file.content_type or "image/jpeg",
                notes=notes,
                style=style,
                stack=stack,
            )

            # --- Step 2: Sandbox HTML Payload ---
            sandbox = SandboxService()
            raw_html = sketch_result.get("html_code", "")
            sandbox_html = sandbox.build_sandbox_payload(raw_html)

            return Response({
                "success": True,
                "project_name": sketch_result.get("project_name", "protopatch-app"),
                "summary": sketch_result.get("summary", "Full-stack project generated from wireframe sketch."),
                "stack": stack,
                "files": sketch_result.get("files", []),
                "html_code": sketch_result.get("html_code", ""),
                "django_models": sketch_result.get("django_models", ""),
                "drf_serializers": sketch_result.get("drf_serializers", ""),
                "detected_components": sketch_result.get("detected_components", []),
                "sandbox_html": sandbox_html,
            })
        except Exception as exc:
            import traceback
            tb = traceback.format_exc()
            logger.error("Sketch2Stack pipeline error: %s", tb)
            return Response(
                {"success": False, "error": str(exc), "traceback": tb},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class Sketch2StackRefineView(APIView):
    """
    POST /api/sketch2stack/refine/

    Conversational AI iteration ('Vibe Coding') loop.
    Applies incremental modifications to the full-stack multi-file tree.
    """
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = ProjectRefineSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated = serializer.validated_data
        prompt = validated["prompt"]
        current_files = validated["current_files"]
        current_html = validated.get("current_html", "")
        stack = validated.get("stack", {})
        history = validated.get("history", [])

        try:
            vision = VisionService()
            refine_result = vision.refine_project(
                prompt=prompt,
                current_files=current_files,
                current_html=current_html,
                stack=stack,
                history=history,
            )

            modified_files = refine_result.get("modified_files", [])

            # Merge modified files into full files tree
            all_files_dict = {f.get("path"): dict(f) for f in current_files}
            for mod in modified_files:
                path = mod.get("path")
                if path:
                    all_files_dict[path] = mod

            merged_files = list(all_files_dict.values())

            # Update sandbox HTML
            sandbox = SandboxService()
            raw_html = refine_result.get("sandbox_html", "") or current_html
            sandbox_html = sandbox.build_sandbox_payload(raw_html)

            return Response({
                "success": True,
                "summary": refine_result.get("summary", f"Applied: '{prompt}'"),
                "modified_files": modified_files,
                "all_files": merged_files,
                "sandbox_html": sandbox_html,
                "detected_components": refine_result.get("detected_components", []),
            })

        except Exception as exc:
            logger.exception("Sketch2Stack refinement error")
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class Sketch2StackExportZipView(APIView):
    """
    POST /api/sketch2stack/export-zip/

    Streams a bundled .zip archive containing all project files.
    """
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = ProjectExportZipSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated = serializer.validated_data
        project_name = validated.get("project_name", "protopatch-app").strip().replace(" ", "-")
        files = validated["files"]

        try:
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for item in files:
                    file_path = item.get("path", "").lstrip("/\\")
                    content = item.get("content", "")
                    if file_path:
                        zip_file.writestr(f"{project_name}/{file_path}", content)

            zip_buffer.seek(0)
            response = HttpResponse(zip_buffer.read(), content_type="application/zip")
            response["Content-Disposition"] = f'attachment; filename="{project_name}.zip"'
            return response

        except Exception as exc:
            logger.exception("Project zip export error")
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ScreenToPatchView(APIView):
    """
    POST /api/screentopatch/

    Automated bug intent extraction, AST code search, and GitHub PR dispatch.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ScreenToPatchInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated = serializer.validated_data
        video_file = validated.get("video")
        audio_file = validated.get("audio")
        screenshot_file = validated.get("screenshot")
        repo_url = validated["repo_url"]
        branch = validated.get("branch", "main")
        notes = validated.get("notes", "")

        try:
            transcript = ""
            audio_path = None

            with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp_dir:
                tmp_path = Path(tmp_dir)

                # --- Step 1: Save uploaded files ---
                video_path = None
                screenshot_bytes = None

                if video_file:
                    video_path = tmp_path / "recording.webm"
                    video_path.write_bytes(video_file.read())

                if screenshot_file:
                    screenshot_bytes = screenshot_file.read()

                if audio_file:
                    ext = Path(audio_file.name).suffix or ".webm"
                    audio_path = tmp_path / f"audio{ext}"
                    audio_path.write_bytes(audio_file.read())

                # --- Step 2: Transcribe audio ---
                if audio_path:
                    audio_svc = AudioService()
                    transcript = audio_svc.transcribe(audio_path)
                    logger.info("Whisper transcript: %s", transcript[:200])

                full_description = "\n".join(filter(None, [transcript, notes]))

                # --- Step 3: VLM Bug Analysis ---
                vision = VisionService()
                if screenshot_bytes:
                    visual_input = screenshot_bytes
                    mime_type = screenshot_file.content_type or "image/png"
                    bug_result = vision.analyze_bug_from_image(
                        image_bytes=visual_input,
                        mime_type=mime_type,
                        transcript=full_description,
                    )
                elif video_path:
                    bug_result = vision.analyze_bug_from_video(
                        video_path=video_path,
                        transcript=full_description,
                    )
                else:
                    bug_result = {
                        "bug_description": full_description or "Bug detected via description only.",
                        "target_element": "",
                        "suggested_fix": "",
                        "css_or_logic_diff": "",
                    }

                # --- Step 4: AST Code Search ---
                ast_engine = ASTEngine()
                file_matches = ast_engine.search_repo(
                    repo_url=repo_url,
                    bug_analysis=bug_result,
                    tmp_dir=tmp_path,
                )

                # --- Step 5: Create PR ---
                pr_url = ""
                pr_number = None
                branch_name = ""

                if settings.GITHUB_TOKEN and file_matches:
                    try:
                        git_svc = GitService(github_token=settings.GITHUB_TOKEN)
                        pr_result = git_svc.create_fix_pr(
                            repo_url=repo_url,
                            base_branch=branch,
                            bug_analysis=bug_result,
                            file_matches=file_matches,
                            transcript=transcript,
                            tmp_dir=tmp_path,
                        )
                        pr_url = pr_result.get("pr_url", "")
                        pr_number = pr_result.get("pr_number")
                        branch_name = pr_result.get("branch_name", "")
                    except Exception as exc:
                        logger.warning("Could not auto-create GitHub PR: %s", exc)
                        branch_name = f"fix/protopatch-{int(time.time())}"
                else:
                    branch_name = f"fix/protopatch-{int(time.time())}"

                gc.collect()

            return Response({
                "success": True,
                "bug_description": bug_result.get("bug_description", ""),
                "target_element": bug_result.get("target_element", ""),
                "suggested_fix": bug_result.get("suggested_fix", ""),
                "css_or_logic_diff": bug_result.get("css_or_logic_diff", ""),
                "transcript": transcript,
                "pr_url": pr_url,
                "pr_number": pr_number,
                "branch_name": branch_name,
                "file_matches": file_matches,
            })

        except Exception as exc:
            logger.exception("ScreenToPatch pipeline error")
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
