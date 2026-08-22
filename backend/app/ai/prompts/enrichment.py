ENRICHMENT_PROMPT_TEMPLATE = """
Perform complete semantic enrichment on raw product feed data.

PRODUCT DATA:
MPN: {mpn}
Part Description: {description}
Part Manufacturer: {part_manuf}
Brand Inputs: {brand_inputs}

OUTPUT REQUIREMENT:
Return valid JSON containing candidate classification, candidate brand, candidate manufacturer, and candidate attributes.
"""
