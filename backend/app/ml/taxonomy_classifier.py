import os
import joblib
from typing import Dict, Any, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger

class LocalTaxonomyMLClassifier:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(settings.ML_MODEL_DIR, "taxonomy_model.joblib")
        self.is_loaded = False
        self._load_model()

    def _load_model(self) -> None:
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.is_loaded = True
                logger.info(f"Local ML Taxonomy Model loaded successfully from {self.model_path}.")
            except Exception as e:
                logger.warning(f"Could not load local ML model from {self.model_path}: {e}")
                self.is_loaded = False
        else:
            logger.info("Local ML taxonomy model artifact not found. Operating with local rule-based ML fallback.")

    def predict(self, description: str) -> Optional[Tuple[Dict[str, Any], float]]:
        """
        Returns (classification_dict, confidence_score) if model is loaded and confident.
        Otherwise returns None.
        """
        if not self.is_loaded or not self.model:
            return None

        try:
            prediction = self.model.predict([description])[0]
            proba = max(self.model.predict_proba([description])[0]) if hasattr(self.model, "predict_proba") else 0.85
            
            # Map prediction tuple or string to classification dictionary
            if isinstance(prediction, dict):
                return prediction, float(proba)
            
            # Formulate classification dict from prediction string
            parts = str(prediction).split(">")
            dept = parts[0] if len(parts) > 0 else "General Industrial"
            cls = parts[1] if len(parts) > 1 else "Hardware & Supplies"
            fine = parts[2] if len(parts) > 2 else "General Fasteners"
            classpath = str(prediction)

            return {
                "department": dept,
                "class_name": cls,
                "fine_class": fine,
                "classpath": classpath,
                "confidence": float(proba),
                "reason": f"Local scikit-learn ML model prediction (confidence={proba:.2f})"
            }, float(proba)
        except Exception as e:
            logger.warning(f"Error during local ML taxonomy inference: {e}")
            return None

local_ml_classifier = LocalTaxonomyMLClassifier()
