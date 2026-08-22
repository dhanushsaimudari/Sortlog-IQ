EXTRACTION_PROMPT_TEMPLATE = """
Extract candidate technical attributes for the following industrial product candidate.

PRODUCT DATA:
MPN: {mpn}
Part Description: {description}
Classpath: {classpath}
Allowed List of Values (LOV) Context: {lov_context}

OUTPUT REQUIREMENT:
Return valid JSON list of attributes, where each object has:
"sequence", "label", "raw_value", "normalized_value", "uom", "lov_matched", "source"
"""
