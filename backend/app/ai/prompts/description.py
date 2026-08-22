DESCRIPTION_PROMPT_TEMPLATE = """
Synthesize multi-channel marketing and commerce descriptions for this industrial product candidate.

PRODUCT DATA:
MPN: {mpn}
Manufacturer: {manufacturer}
Brand: {brand}
Noun: {noun}
Attributes: {attributes}

OUTPUT REQUIREMENT:
Return valid JSON with keys:
"product_name", "mobile_desc", "invoice_desc", "short_desc", "long_desc", "retail_desc", "marketing_description", "item_features"
"""
