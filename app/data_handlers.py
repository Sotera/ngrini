import pandas as pd
from pymongo import MongoClient
import numpy as np
from datetime import datetime, date
import json, locale

def str_dt_pddt(pddt):
    return str(pddt.date())

def z_score(ap, ep, n):
    return (np.abs(ap-ep)-(1./(2.*n)))/np.sqrt((ep*(1-ep))/n)

def date_chart_from_mongo(collection):
    client = MongoClient("mongodb://10.1.70.150:27017")
    db = client["fby-ny"]
    if collection not in db.collection_names():
        return None
    df = pd.DataFrame(list(db[collection].find()))
    df = df.dropna(axis=0, how='any')
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
    df['TRN_AMT'] = df['TRN_AMT'].apply(locale.atof)
    df = df.set_index('TRN_DATE')
    df_mag = df.groupby(pd.TimeGrouper(freq='M')).agg({"TRN_AMT":"sum"}).reset_index(level=['TRN_DATE'])
    df_mag['TRN_DATE'] = df_mag.TRN_DATE.apply(str_dt_pddt)
    df_vol = df.groupby(pd.TimeGrouper(freq='M')).agg({"TRN_AMT":{"count":"count"}})
    df_vol.columns = df_vol.columns.droplevel(0)
    df_vol.reset_index(level=0, inplace=True)
    df_vol['TRN_DATE'] = df_vol.TRN_DATE.apply(str_dt_pddt)
    return json.dumps(sorted(list(df_vol.merge(df_mag, on='TRN_DATE').T.to_dict().values()), key=lambda x: x['TRN_DATE']))

def hist_to_d3(occ, bc):
    return [{"occ":x[0], "bins":x[1]} for x in zip(occ.tolist(), bc)]

def stats_table_from_mongo(collection, start=None, stop=None):
    client = MongoClient("mongodb://10.1.70.150:27017")
    db = client["fby-ny"]
    if collection not in db.collection_names():
        return None
    df = pd.DataFrame(list(db[collection].find()))
    df = df.dropna(axis=0, how='any')
    df['TRN_DATE'] = df.TRN_DATE.apply(str_dt_pddt)
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
    df['TRN_AMT'] = df['TRN_AMT'].apply(locale.atof)
    abs_max = df[df["TRN_AMT"]>2000]["TRN_AMT"].max()
    axis_max = int(abs_max-abs_max%5000+5000)
    if (start is not None) and (stop is not None):
        if start > stop:
            start, stop = (stop, start)
        df = df[(df['TRN_DATE'] >= start) & (df['TRN_DATE'] <= stop)]
    #build stats table
    r_dict = {"stats":[{"Number of Records":len(df)}]}
    r_dict["stats"].append({"Start Date":df['TRN_DATE'].min()})
    r_dict["stats"].append({"End Date":df['TRN_DATE'].max()})
    r_dict["stats"].append({"Number of Senders":len(df.groupby("ORIG_NAME").agg({"TRN_AMT":{"count":"count"}}))})
    grouped = df.groupby("ORIG_NAME").agg({"TRN_AMT":{"count":"count", "sum":"sum"}})
    grouped.columns = grouped.columns.droplevel(0)
    r_dict["stats"].append({"Highest Volume Sender":grouped['count'].idxmax()})
    r_dict["stats"].append({"Highest Net Value Sender":grouped['sum'].idxmax()})
    r_dict["stats"].append({"Number of Recievers":len(df.groupby("BENE_NAME").agg({"TRN_AMT":{"count":"count"}}))})
    grouped = df.groupby("BENE_NAME").agg({"TRN_AMT":{"count":"count", "sum":"sum"}})
    grouped.columns = grouped.columns.droplevel(0)
    r_dict["stats"].append({"Highest Volume Reciever":grouped['count'].idxmax()})
    r_dict["stats"].append({"Highest Net Value Rec":grouped['sum'].idxmax()})
    r_dict["stats"].append({"Max Transfer":df["TRN_AMT"].max()})
    r_dict["stats"].append({"Min Transfer":df["TRN_AMT"].min()})
    r_dict["stats"].append({"Mean":df["TRN_AMT"].mean()})
    r_dict["stats"].append({"Median":df["TRN_AMT"].median()})
    r_dict["stats"].append({"Number of Transfers of less than $100":len(df[df["TRN_AMT"]<100])})
    #build histogram for transfer values
    lh_occ, lh_bins =  np.histogram(df["TRN_AMT"], bins=list(range(0,2100,100)))
    lh_bc = [int((lh_bins[x]-lh_bins[x-1])/2 +lh_bins[x-1]) for x in range(1,len(lh_bins))]
    r_dict["low_hist"] = hist_to_d3(lh_occ, lh_bc)
    hh_occ, hh_bins = np.histogram(df[df["TRN_AMT"]>2000]["TRN_AMT"], bins=list(range(2000,axis_max,1000)))
    hh_bc = [int((hh_bins[x]-hh_bins[x-1])/2 +hh_bins[x-1]) for x in range(1,len(hh_bins))]
    r_dict["high_hist"] = hist_to_d3(hh_occ, hh_bc)
    dump = json.dumps(r_dict)
    return dump

def benfords_law(collection, start=None, stop=None):
    client = MongoClient("mongodb://10.1.70.150:27017")
    db = client["fby-ny"]
    df = pd.DataFrame(list(db[collection].find()))
    df = df.dropna(axis=0, how='any')
    df['TRN_DATE'] = df.TRN_DATE.apply(str_dt_pddt)
    if (start is not None) and (stop is not None):
        if start > stop:
            start, stop = (stop, start)
        df = df[(df['TRN_DATE'] >= start) & (df['TRN_DATE'] <= stop)]
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
    df['TRN_AMT'] = df['TRN_AMT'].apply(locale.atof)
    s_amt = df[df['TRN_AMT']>10]['TRN_AMT'].dropna().apply(lambda x: str(x))
    total = len(s_amt)
    #leading digit
    ob_lead = s_amt.apply(lambda x: x[0]).value_counts(normalize=True).to_dict()
    ex_lead = {str(x): np.log10(1.+1./x) for x in range(1,10)}
    z_lead = {str(i):z_score(ob_lead[str(i)], ex_lead[str(i)], total) for i in range(1,10)}
    #leading digit pairs
    ob_pair = s_amt.apply(lambda x: x[:2]).value_counts(normalize=True).to_dict()
    ex_pair = {str(x): np.log10(1.+1./x) for x in range(10,100)}
    z_pair = {str(i):z_score(ob_pair[str(i)], ex_pair[str(i)], total) for i in range(10,100)}
    #build return dict
    r_dict = {"ob_lead":ob_lead, "ex_lead":ex_lead, "z_lead":z_lead, "ob_pair": ob_pair, "ex_pair": ex_pair, "z_pair":z_pair}
    dump = json.dumps(r_dict)
    return dump
