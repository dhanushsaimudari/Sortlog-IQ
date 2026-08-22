import os
import json

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

required_files = [
    "package.json",
    "tsconfig.json",
    "tailwind.config.js",
    "postcss.config.js",
    "app/layout.tsx",
    "app/page.tsx",
    "app/globals.css",
    "app/dashboard/page.tsx",
    "app/upload/page.tsx",
    "app/products/page.tsx",
    "app/products/[id]/page.tsx",
    "app/review/page.tsx",
    "app/evaluation/page.tsx",
    "app/analytics/page.tsx",
    "app/evidence/page.tsx",
    "components/layout/Sidebar.tsx",
    "components/layout/Header.tsx",
    "components/ui/Button.tsx",
    "components/ui/Badge.tsx",
    "components/ui/Card.tsx",
    "components/ui/Progress.tsx",
    "components/enrichment/EnrichmentCanvas.tsx",
    "components/enrichment/FieldWhyDrawer.tsx",
    "components/enrichment/QualityScoreCard.tsx",
    "components/enrichment/DescriptionTabs.tsx",
    "components/enrichment/AutoFixCard.tsx",
    "components/enrichment/ValidationPanel.tsx",
    "components/review/ReviewQueueTable.tsx",
    "components/review/ReviewDetailPanel.tsx",
    "components/review/KeyboardShortcutsHelp.tsx",
    "components/evaluation/MetricCards.tsx",
    "components/evaluation/AccuracyChart.tsx",
    "components/evaluation/ComparisonTable.tsx",
    "components/evaluation/ErrorExplorer.tsx",
    "components/evidence/PdfEvidenceViewer.tsx",
    "components/products/ProductTable.tsx",
    "components/products/ProductFilters.tsx",
    "lib/session.ts",
    "lib/theme-context.tsx",
    "lib/utils.ts",
    "lib/api/products.ts",
    "lib/api/reviews.ts",
    "lib/api/evaluation.ts",
    "lib/api/upload.ts",
    "lib/api/evidence.ts",
    "types/product.ts",
    "types/review.ts",
    "types/evaluation.ts",
    "types/api.ts",
]

print("--- SORTOLOG IQ Frontend File Structure Verification ---")
missing = []
for f in required_files:
    full_p = os.path.join(frontend_dir, f)
    if os.path.exists(full_p):
        print(f"  [OK] {f}")
    else:
        print(f"  [MISSING] {f}")
        missing.append(f)

if not missing:
    print(f"\nSUCCESS: All {len(required_files)} frontend files exist and are verified!")
else:
    print(f"\nFAILED: {len(missing)} files missing!")
