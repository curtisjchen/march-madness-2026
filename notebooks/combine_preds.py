import pandas as pd

df_mens = pd.read_csv("./notebooks/submission_mens_2026.csv")
df_womens = pd.read_csv("./notebooks/submission_womens_2026.csv")

final_df = pd.concat([df_mens, df_womens], ignore_index=True)
final_df.to_csv("./notebooks/submission_2026.csv", index=False)