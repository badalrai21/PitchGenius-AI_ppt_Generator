from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChartData(BaseModel):
    type: str = "bar" # bar, line, pie, donut
    title: str
    labels: List[str]
    data: List[float]

class SlideContent(BaseModel):
    index: int
    layout: str = "bullets"
    title: str
    subtitle: Optional[str] = None
    bullets: Optional[List[str]] = None
    body: Optional[str] = None
    left_column: Optional[Dict[str, Any]] = None
    right_column: Optional[Dict[str, Any]] = None
    metrics: Optional[List[Dict[str, str]]] = None
    quote: Optional[str] = None
    quote_author: Optional[str] = None
    icon: Optional[str] = "Sparkles"
    image_prompt: Optional[str] = None
    chart: Optional[ChartData] = None
    speaker_notes: Optional[str] = None

class GeneratePromptRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000)
    num_slides: int = Field(default=8, ge=3, le=50)
    language: str = Field(default="en")
    art_style: Optional[str] = "gradient"
    template_slug: Optional[str] = "ocean-breeze"
    target_audience: Optional[str] = "General"

class EnhanceSlideRequest(BaseModel):
    slide: Dict[str, Any]
    action: str = "rewrite" # rewrite, make_shorter, make_professional, add_stats
    language: Optional[str] = "en"