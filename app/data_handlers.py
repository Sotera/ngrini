import pandas as pd
from pymongo import MongoClient
from datetime import datetime

def dt_from_ms(ms):
    dt = datetime.fromtimestamp(ms/1000.)
    s_m = "0"+str(dt.month) if len(str(dt.month))==1 else str(dt.month)
    return str(dt.year)+"-"+s_m

def date_chart_from_mongo(collection):
    client = MongoClient()
    db = client["fin-new"]
    if collection not in db.collection_names():
        return None
    df = pd.DataFrame(list(db[collection].find()))
    df = df.dropna(axis=0, how='any')
    df['str_dt'] = df.Date.apply(dt_from_ms)
    df_mag = df.groupby('str_dt', as_index=False).agg({"Transfer Amount":"sum"})
    df_vol = df.groupby('str_dt').agg({"Transfer Amount":{"Count":"count"}})
    df_vol.columns = df_vol.columns.droplevel(0)
    df_vol.reset_index(level=0, inplace=True)
    return list(df_vol.merge(df_mag, on='str_dt').T.to_dict().values())
