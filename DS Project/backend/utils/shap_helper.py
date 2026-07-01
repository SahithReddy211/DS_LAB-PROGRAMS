import shap
import pandas as pd
import numpy as np

def get_shap_explanation(pipeline, input_df):
    """
    Given a fitted pipeline (ColumnTransformer + Classifier) and a 1-row DataFrame of input data,
    computes the SHAP values and returns the top contributing features.
    """
    # Extract components
    preprocessor = pipeline.named_steps['preprocessor']
    model = pipeline.named_steps['classifier']
    
    # Transform input data
    X_transformed = preprocessor.transform(input_df)
    
    # Get feature names
    cat_cols = preprocessor.transformers_[1][2]
    cat_encoder = preprocessor.transformers_[1][1]
    num_cols = preprocessor.transformers_[0][2]
    
    cat_feature_names = cat_encoder.get_feature_names_out(cat_cols)
    feature_names = num_cols + list(cat_feature_names)
    
    # Initialize explainer based on model type
    model_name = type(model).__name__
    if model_name in ['RandomForestClassifier', 'GradientBoostingClassifier', 'XGBClassifier', 'DecisionTreeClassifier']:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_transformed)
        # For multi-class classification, shap_values is a list of arrays.
        # We find the predicted class
        pred_class = model.predict(X_transformed)[0]
        
        if isinstance(shap_values, list):
            # scikit-learn models return list of arrays
            class_shap_values = shap_values[pred_class][0]
        else:
            # XGBoost multi-class might return a 3D array (num_samples, num_features, num_classes)
            if len(shap_values.shape) == 3:
                class_shap_values = shap_values[0, :, pred_class]
            else:
                class_shap_values = shap_values[0]
                
    elif model_name in ['LogisticRegression']:
        explainer = shap.LinearExplainer(model, X_transformed) # Not ideal without background dataset, but works for quick inference
        shap_values = explainer.shap_values(X_transformed)
        pred_class = model.predict(X_transformed)[0]
        if isinstance(shap_values, list):
            class_shap_values = shap_values[pred_class][0]
        else:
            class_shap_values = shap_values[0]
    else:
        # Fallback to KernelExplainer (can be slow)
        # Using a dummy background of zeros for the sake of speed
        explainer = shap.KernelExplainer(model.predict_proba, np.zeros((1, X_transformed.shape[1])))
        shap_values = explainer.shap_values(X_transformed)
        pred_class = model.predict(X_transformed)[0]
        class_shap_values = shap_values[pred_class][0]
        
    # Zip feature names and absolute shap values to find most important
    feature_importance = list(zip(feature_names, class_shap_values))
    # Sort by absolute impact
    feature_importance.sort(key=lambda x: abs(x[1]), reverse=True)
    
    top_features = [{"feature": f, "impact": float(val)} for f, val in feature_importance[:5]]
    
    return top_features
