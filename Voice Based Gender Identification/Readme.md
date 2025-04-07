# 🎙️ Voice-Based Gender Identification

This project identifies gender based on voice recordings using machine learning. It involves extracting key audio features, training classification models, and evaluating their performance. It’s a practical application of audio signal processing and supervised learning.

## 📌 Project Overview

Gender classification from voice can be useful in areas like virtual assistants, targeted customer services, and voice-based authentication. In this project, I built an end-to-end pipeline to predict gender using audio data and machine learning models.

## 🛠️ Technologies Used

- **Python**
- **Librosa** – Audio feature extraction (MFCC, Chroma, Mel)
- **Scikit-learn** – Model building (Random Forest, SVM, KNN)
- **Matplotlib / Seaborn** – Visualization
- **NumPy / Pandas** – Data manipulation

## 📁 Project Structure


## 🧠 What the Script Does

- Loads and preprocesses `.wav` audio files
- Extracts features using Librosa (MFCCs, Chroma, Mel Spectrogram)
- Encodes gender labels based on file names
- Splits data into training and testing sets
- Trains 3 classifiers: Random Forest, SVM, and KNN
- Evaluates performance using accuracy and classification reports
- Visualizes confusion matrix

## 📊 Sample Output

- Random Forest Accuracy: ~96%
- SVM Accuracy: ~94%
- KNN Accuracy: ~92%

E
