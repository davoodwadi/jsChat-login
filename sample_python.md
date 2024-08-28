The `MLPClassifier` from the `scikit-learn` library.

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, classification_report

def train_mlp(hidden_layer_sizes=(100,), activation='relu', solver='adam', alpha=0.0001, batch_size='auto', learning_rate='constant', learning_rate_init=0.001, max_iter=200):
    # Generate a synthetic dataset for classification
    X, y = make_classification(n_samples=1000, n_features=20, n_informative=10, n_redundant=10, random_state=42)
    
    # Split the dataset into training and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Standardize the features
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    
    # Create the MLPClassifier
    mlp = MLPClassifier(hidden_layer_sizes=hidden_layer_sizes, activation=activation, solver=solver, alpha=alpha, batch_size=batch_size, learning_rate=learning_rate, learning_rate_init=learning_rate_init, max_iter=max_iter, random_state=42)
    
    # Train the MLPClassifier
    mlp.fit(X_train, y_train)
    
    # Make predictions
    y_pred = mlp.predict(X_test)
    
    # Evaluate the model
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)
    
    # Print the results
    print(f'Accuracy: {accuracy}')
    print('Classification Report:')
    print(report)
    
    return mlp

# Example usage
trained_mlp = train_mlp()
```

### Explanation:
1. **Data Generation**: Uses `make_classification` to create a synthetic dataset.
2. **Data Splitting**: Splits the data into training and testing sets.
3. **Data Standardization**: Standardizes the features to have zero mean and unit variance.
4. **Model Creation**: Creates an instance of `MLPClassifier` with specified hyperparameters.
5. **Model Training**: Fits the MLP model to the training data.
6. **Prediction and Evaluation**: Predicts the labels for the test data and evaluates the performance using accuracy and classification report.

You can customize the parameters of the `MLPClassifier` to suit your specific needs. The function returns the trained MLP model for further use or evaluation.