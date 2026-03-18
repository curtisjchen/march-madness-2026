# 🏀 2026 March Madness Forecasting & Simulation
> An end-to-end machine learning pipeline and Monte Carlo simulation engine for predicting NCAA Tournament outcomes.

![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![ML](https://img.shields.io/badge/framework-XGBoost%20%7C%20LightGBM-green)
![Status](https://img.shields.io/badge/status-Live--2026-orange)

## 📌 Project Overview
This project leverages historical NCAA tournament data (1985–2025) and advanced seasonal metrics to forecast the 2026 Men's and Women's brackets. The core objective was to minimize the **Brier Score** (predictive accuracy) and provide a probabilistic "Expected Wins" (EV) roadmap for bracket optimization.

## 🚀 Key Features
- **Feature Engineering:** Advanced integration of Elo ratings, Strength of Schedule (SOS), "Season Form" (late-season momentum), and Four Factors.
- **Exhaustive Sweep:** Forward feature selection and hyperparameter tuning to identify "Less is More" architectures (preventing overfitting).
- **Dependency-Aware Simulator:** A high-speed simulation engine that resolves "First Four" play-in games before propagating winners through the 64-team bracket.
- **Expected Wins (EV) Analysis:** Moving beyond "Chalk" by calculating the mean number of wins per team across 10,000 alternate realities.

## 📁 Repository Structure
```text
├── data/
│   └── raw/                # Kaggle MNCAA/WNCAA data files
├── notebooks/
│   ├── eda.ipynb           # Mens pipeline
│   └── womens.ipynb        # Womens pipeline
└── README.md