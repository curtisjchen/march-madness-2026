import pandas as pd

df_mens = pd.read_csv("./notebooks/submission_mens_ensemble_2026.csv")
df_womens = pd.read_csv("./notebooks/submission_womens_ensemble_2026.csv")

# Concatenate them vertically
final_kaggle_submission = pd.concat([df_mens, df_womens], ignore_index=True)

# Sort by ID just to be clean and standard
final_kaggle_submission = final_kaggle_submission.sort_values(by='ID')

# Save the master file
final_kaggle_submission.to_csv("submission_ensemble_2026.csv", index=False)
print(f"✅ Master Submission ready! Total rows: {len(final_kaggle_submission)}")