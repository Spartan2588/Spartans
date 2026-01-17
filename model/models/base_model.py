"""
Base Risk Model Class

Provides common functionality for all risk models:
- Probability calibration using CalibratedClassifierCV
- Standardized prediction interface
- Hooks for reliability curve generation
"""

from abc import ABC, abstractmethod
from typing import Dict, Tuple, List, Optional
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import LabelEncoder


class BaseRiskModel(ABC):
    """
    Abstract base class for calibrated risk prediction models.
    
    All risk models inherit from this class to ensure:
    1. Consistent probability calibration
    2. Standard prediction interface
    3. Reliability curve data extraction capability
    """
    
    def __init__(self, calibration_method: str = 'sigmoid', cv: int = 3):
        """
        Initialize base model.
        
        Args:
            calibration_method: 'sigmoid' or 'isotonic' for calibration
            cv: Number of cross-validation folds for calibration
        """
        self.calibration_method = calibration_method
        self.cv = cv
        self.label_encoder = LabelEncoder()
        self.class_names = ['low', 'medium', 'high']
        self.label_encoder.fit(self.class_names)
        
        self.base_model = None  # Set by subclass
        self.calibrated_model = None
        self._is_trained = False
        
        # Store training data for reliability curve generation
        self._calibration_data: Optional[Dict] = None
    
    @abstractmethod
    def _create_base_model(self):
        """Create the underlying sklearn model. Implemented by subclass."""
        pass
    
    @abstractmethod
    def _generate_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Generate training data. Implemented by subclass."""
        pass
    
    @abstractmethod
    def get_feature_names(self) -> List[str]:
        """Return feature names. Implemented by subclass."""
        pass
    
    def train(self, X: Optional[np.ndarray] = None, y: Optional[np.ndarray] = None):
        """
        Train the model with probability calibration.
        
        If X and y are not provided, generates synthetic training data.
        
        Args:
            X: Feature array (n_samples, n_features)
            y: Label array (n_samples,) with 'low', 'medium', 'high'
        """
        # Generate data if not provided
        if X is None or y is None:
            X, y = self._generate_training_data()
        
        # Encode labels to integers
        y_encoded = self.label_encoder.transform(y)
        
        # Create base model
        self.base_model = self._create_base_model()
        
        # Wrap with calibration
        # CalibratedClassifierCV performs probability calibration using cross-validation
        # This ensures well-calibrated probability outputs for downstream trust & ROI modeling
        self.calibrated_model = CalibratedClassifierCV(
            self.base_model,
            method=self.calibration_method,
            cv=self.cv
        )
        
        # Train calibrated model
        self.calibrated_model.fit(X, y_encoded)
        
        self._is_trained = True
        
        # Store predictions for reliability curve generation
        self._store_calibration_data(X, y_encoded)
    
    def _store_calibration_data(self, X: np.ndarray, y_encoded: np.ndarray):
        """Store data needed for reliability curve generation."""
        probas = self.calibrated_model.predict_proba(X)
        
        self._calibration_data = {
            'y_true': y_encoded,
            'y_prob': probas,
            'n_classes': len(self.class_names)
        }
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict risk class labels.
        
        Args:
            X: Feature array (n_samples, n_features)
        
        Returns:
            Array of risk labels ('low', 'medium', 'high')
        """
        if not self._is_trained:
            raise RuntimeError("Model must be trained before prediction")
        
        y_encoded = self.calibrated_model.predict(X)
        return self.label_encoder.inverse_transform(y_encoded)
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict calibrated probability distribution across risk classes.
        
        Args:
            X: Feature array (n_samples, n_features)
        
        Returns:
            Array of shape (n_samples, 3) with probabilities for [low, medium, high]
        """
        if not self._is_trained:
            raise RuntimeError("Model must be trained before prediction")
        
        return self.calibrated_model.predict_proba(X)
    
    def predict_with_proba(self, X: np.ndarray) -> Dict:
        """
        Predict with full probability information.
        
        Args:
            X: Feature array (n_samples, n_features)
        
        Returns:
            Dictionary with:
            - 'class': Predicted class labels
            - 'probabilities': Full probability distribution
            - 'confidence': Probability of predicted class
        """
        if not self._is_trained:
            raise RuntimeError("Model must be trained before prediction")
        
        probas = self.predict_proba(X)
        predictions = self.calibrated_model.predict(X)
        labels = self.label_encoder.inverse_transform(predictions)
        
        # Get confidence (probability of predicted class)
        confidence = probas[np.arange(len(predictions)), predictions]
        
        return {
            'class': labels,
            'probabilities': {
                'low': probas[:, 0],
                'medium': probas[:, 1],
                'high': probas[:, 2]
            },
            'confidence': confidence
        }
    
    def get_reliability_curve_data(self) -> Optional[Dict]:
        """
        Get data needed to generate reliability curves (calibration plots).
        
        Returns:
            Dictionary with y_true, y_prob for each class, or None if not trained.
            
        Usage (for later Phase visualization):
            from sklearn.calibration import calibration_curve
            
            data = model.get_reliability_curve_data()
            fraction_of_positives, mean_predicted_value = calibration_curve(
                (data['y_true'] == class_idx),
                data['y_prob'][:, class_idx],
                n_bins=10
            )
        """
        return self._calibration_data
    
    @property
    def is_trained(self) -> bool:
        """Check if model is trained."""
        return self._is_trained
