import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

def train_and_save_taxonomy_model():
    # Synthetic training dataset for industrial taxonomy classification
    data = [
        ("Built-In Dishwasher 24 in Stainless Steel", "Appliances & Consumer Electronics>Kitchen Appliances>Built-In Dishwashers"),
        ("PDSH4816AF Dishwasher SS Display Only", "Appliances & Consumer Electronics>Kitchen Appliances>Built-In Dishwashers"),
        ("Freud Diablo 10 x 24T Ripping Saw Blade", "Abrasives & Cutting Tools>Abrasive Discs>Metal Cut-Off Discs"),
        ("Metal Cut-Off Disc 4.5 inch 7/8 Arbor", "Abrasives & Cutting Tools>Abrasive Discs>Metal Cut-Off Discs"),
        ("Abrasive Grinding Wheel Heavy Duty", "Abrasives & Cutting Tools>Abrasive Discs>Metal Cut-Off Discs"),
        ("Malco Ratcheting Crimper Tool 5-Blade", "Hand & Power Tools>Hand Tools>Crimpers & Cutters"),
        ("Heavy Duty Cable Crimper & Wire Cutter", "Hand & Power Tools>Hand Tools>Crimpers & Cutters"),
        ("Hex Cap Screw 3/8-16 x 1-1/2 Zinc Plated", "General Industrial>Hardware & Supplies>General Fasteners"),
        ("Stainless Steel Flat Washer 1/2 ID", "General Industrial>Hardware & Supplies>General Fasteners"),
        ("Industrial Spec Brass Coupling 150#", "Plumbing & Hydraulics>Pipe Fittings>Couplings & Adapters"),
    ]

    texts, labels = zip(*data)

    pipeline = make_pipeline(
        TfidfVectorizer(ngram_range=(1, 2)),
        MultinomialNB()
    )

    pipeline.fit(texts, labels)

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_models"))
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "taxonomy_model.joblib")

    joblib.dump(pipeline, model_path)
    print(f"Local ML Taxonomy Model successfully trained and saved to: {model_path}")

if __name__ == "__main__":
    train_and_save_taxonomy_model()
