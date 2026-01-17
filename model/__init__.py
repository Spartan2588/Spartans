"""
Multi-Domain Risk Prediction Engine - Phase 1, 2, 3 & 4
Smart City Risk Platform ML/AI Module

This module provides probabilistic risk prediction models for:
- Environmental Risk (AQI, traffic, weather)
- Health Risk (hospital load, respiratory cases, cascading from environmental)
- Food Security Risk (crop supply, prices, disruptions)

Phase 2 adds:
- Cascading risk inference (Environmental → Health)
- Policy-driven scenario simulation
- Confidence scoring and resilience calculation

Phase 3 adds:
- Scenario comparison (before/after analysis)
- Economic impact & ROI calculation
- Natural language explainability
- Decision signals

Phase 4 adds:
- End-to-end system validation
- Probability calibration verification
- Edge case and robustness testing
- Confidence consistency checks

All models feature:
- Calibrated probability outputs
- Policy intervention simulation hooks
- Support for both synthetic and real data training
"""

from .risk_engine import RiskEngine
from .real_data_engine import RealDataRiskEngine
from .cascading_engine import (
    CascadingRiskEngine,
    predict_cascading_risks,
    run_policy_scenario
)
from .scenario_comparison import compare_scenarios, format_comparison_report
from .roi_calculator import calculate_roi, calculate_policy_portfolio_roi, CostAssumptions
from .explainability import (
    ExplainabilityEngine,
    explain_prediction,
    get_feature_importance
)
from .validation import (
    SystemValidator,
    run_full_system_check,
    run_all_validations
)

__all__ = [
    # Phase 1
    'RiskEngine',
    'RealDataRiskEngine',
    # Phase 2
    'CascadingRiskEngine',
    'predict_cascading_risks',
    'run_policy_scenario',
    # Phase 3
    'compare_scenarios',
    'format_comparison_report',
    'calculate_roi',
    'calculate_policy_portfolio_roi',
    'CostAssumptions',
    'ExplainabilityEngine',
    'explain_prediction',
    'get_feature_importance',
    # Phase 4
    'SystemValidator',
    'run_full_system_check',
    'run_all_validations'
]
__version__ = '0.4.0'
