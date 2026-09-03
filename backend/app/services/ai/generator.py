from typing import Dict, Any, Optional
from app.services.ai.providers import MultiAIProvider
from app.services.ai.prompts import get_prompt_from_db

async def generate_presentation_from_prompt(
    prompt: str,
    num_slides: int = 8,
    language: str = "en",
    art_style: str = "modern",
    template_slug: str = "ocean-breeze",
    target_audience: str = "General",
    context: Optional[str] = None,
    analysis_depth: Optional[str] = "deep",
    instructions: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a structured presentation from a prompt or parsed document context.
    100% dynamic, utilizing system prompts fetched directly from the database.
    """
    
    # 1. ★ DYNAMIC PROMPT RESOLUTION: Load distinct base prompts from DB
    if context:
        # Document / Raw text analysis mode
        system_prompt = await get_prompt_from_db("extract_from_document")
        if not system_prompt:
            # Fallback if specific document prompt is not seeded
            system_prompt = await get_prompt_from_db("generate_outline")
    else:
        # Standard text prompt mode
        system_prompt = await get_prompt_from_db("generate_outline")

    # 2. ★ INJECT DYNAMIC LAYOUT CONTRACTS TO PREVENT EMPTY SLIDES
    layout_guidelines = """
LAYOUT-SPECIFIC STRUCTURAL REQUISITES:
Each slide must choose a 'layout' and populate its matching object keys with high-quality, substantive copy:
1. "title" layout:
   - Use for intro, cover, and section breaks.
   - Requires keys: 'title', 'subtitle', 'body' (an engaging summary paragraph).
2. "bullets" layout:
   - Use for presenting key insights, features, or lists.
   - Requires keys: 'title', 'subtitle', 'bullets' (must be a JSON array of 3 to 5 highly detailed strings. Do not put lists in the 'body').
3. "two_column" layout:
   - Use for comparisons, pros/cons, before/after, or problem/solution.
   - Requires keys: 'title', 'left_column' (JSON object: {"title": "column title", "points": ["point 1", "point 2"]}), 'right_column' (JSON object: {"title": "column title", "points": ["point 1", "point 2"]}).
4. "metrics" layout:
   - Use for presenting key data, statistics, growth metrics, or financial targets.
   - Requires keys: 'title', 'subtitle', 'metrics' (JSON array of exactly 3 objects: [{"value": "10x", "label": "Growth Rate", "desc": "Year-over-year multiplier"}]).
5. "quote" layout:
   - Use for customer voice, testimonials, vision statements, or expert reviews.
   - Requires keys: 'quote' (string), 'quote_author' (string).
"""

    # 3. ★ COMPOSITING THE SYSTEM INSTRUCTION ENVELOPE
    system_instruction = f"""
{system_prompt}

{layout_guidelines}

CRITICAL EXECUTION PARAMETERS:
1. Return EXACTLY {num_slides} slide objects in the 'slides' array.
2. The first slide (index 1) MUST use layout: "title".
3. Maintain diverse layout usage across slides (e.g., include at least one "bullets", one "two_column", one "metrics", and one "quote").
4. Translate and respond entirely in the language: {language}.
5. Match the aesthetic style: {art_style}.
6. Optimize the narrative for target audience: {target_audience}.
7. Do not wrap responses in markdown fences. Respond ONLY with a single parseable JSON object.

JSON OUTPUT CONFIGURATION CONTRACT:
{{
  "title": "Presentation Main Title",
  "subtitle": "Clear and captivating subtitle",
  "topic": "{prompt[:100]}",
  "language": "{language}",
  "theme_slug": "{template_slug}",
  "art_style": "{art_style}",
  "slide_count": {num_slides},
  "slides": [
    {{
      "index": 1,
      "layout": "title",
      "title": "Slide Title text",
      "subtitle": "Optional slide subtitle",
      "body": "Substantive summary paragraph",
      "icon": "Sparkles",
      "image_prompt": "Ultra-realistic scenic conceptual background prompt matching theme",
      "speaker_notes": "What the presenter should say on this slide"
    }}
  ]
}}
"""

    # 4. ★ ENHANCED CONTEXT INJECTION (Fixes document analysis quality)
    if context:
        user_prompt = f"""
SOURCE DOCUMENT FOR HIGH-DEPTH ANALYSIS:
\"\"\"
{context}
\"\"\"

ANALYSIS REQUIREMENTS:
- Depth Level: {analysis_depth}
- Additional Instructions: {instructions or 'No custom guidelines provided.'}
- Task: Analyze the source document above deeply. Extract real, authentic data points, statistics, core arguments, and critical insights. Create a highly professional, cohesive presentation of exactly {num_slides} slides based on this data. 
- Quality Check: Do NOT generate general placeholder bullet points. Every slide must contain deep contextual content parsed directly from the source document.
"""
    else:
        user_prompt = f"Create an engaging, highly detailed presentation on: '{prompt}' containing exactly {num_slides} slides."

    # 5. Execute generation via provider chain
    return await MultiAIProvider.generate_json(system_instruction, user_prompt)