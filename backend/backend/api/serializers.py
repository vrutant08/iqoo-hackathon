"""
ProtoPatch API Serializers
Input validation for multi-file full-stack generation and conversational AI refinement.
"""
from rest_framework import serializers


class Sketch2StackInputSerializer(serializers.Serializer):
    """
    Input for the Sketch2Stack pipeline.
    """
    image = serializers.ImageField(
        required=True,
        help_text="Photo of hand-drawn wireframe or database schema.",
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=2000,
        help_text="Additional context or annotations to guide generation.",
    )
    style = serializers.ChoiceField(
        choices=["dark", "light", "material", "ios", "minimal", "auto"],
        required=False,
        default="auto",
        help_text="Target UI style theme.",
    )
    stack_frontend = serializers.ChoiceField(
        choices=["react", "nextjs", "vue", "html_tailwind"],
        required=False,
        default="react",
        help_text="Frontend framework choice.",
    )
    stack_backend = serializers.ChoiceField(
        choices=["fastapi", "django", "express_ts", "go_gin"],
        required=False,
        default="django",
        help_text="Backend framework choice.",
    )
    stack_database = serializers.ChoiceField(
        choices=["postgresql", "sqlite", "mongodb"],
        required=False,
        default="postgresql",
        help_text="Database choice.",
    )


class ProjectRefineSerializer(serializers.Serializer):
    """
    Input for conversational vibe-coding refinement.
    """
    prompt = serializers.CharField(
        required=True,
        max_length=4000,
        help_text="User's natural language modification or feature request.",
    )
    current_files = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        help_text="Array of current project files with path and content.",
    )
    current_html = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Current live UI HTML content.",
    )
    stack = serializers.DictField(
        required=False,
        default=dict,
        help_text="Selected tech stack dictionary.",
    )
    history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        help_text="Recent conversation history turns.",
    )


class ProjectExportZipSerializer(serializers.Serializer):
    """
    Input for streaming ZIP archive export.
    """
    project_name = serializers.CharField(
        required=False,
        default="protopatch-app",
        max_length=100,
    )
    files = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        help_text="Array of files to bundle into zip.",
    )


class ScreenToPatchInputSerializer(serializers.Serializer):
    """
    Input for the ScreenToPatch pipeline.
    """
    video = serializers.FileField(
        required=False,
        allow_empty_file=False,
        help_text="Screen recording of the bug (WebM/MP4).",
    )
    audio = serializers.FileField(
        required=False,
        allow_empty_file=False,
        help_text="Voice memo describing the bug (WebM/WAV/MP3).",
    )
    screenshot = serializers.ImageField(
        required=False,
        help_text="Single screenshot of the bug (alternative to video).",
    )
    repo_url = serializers.URLField(
        required=True,
        help_text="GitHub repository URL (e.g. https://github.com/org/repo).",
    )
    branch = serializers.CharField(
        required=False,
        default="main",
        max_length=100,
        help_text="Target branch to branch off from.",
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=2000,
        help_text="Additional description of the bug.",
    )

    def validate(self, attrs):
        """At least one visual input (video or screenshot) is required."""
        if not attrs.get("video") and not attrs.get("screenshot"):
            raise serializers.ValidationError(
                "Either 'video' or 'screenshot' must be provided."
            )
        return attrs
