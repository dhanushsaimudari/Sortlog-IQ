from pydantic import BaseModel
from typing import Optional

class BoundingBox(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float

class PageTextCoordinate(BaseModel):
    page_number: int
    text: str
    bounding_box: Optional[BoundingBox] = None
