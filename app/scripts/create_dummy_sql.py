from pymongo import MongoClient
from openpyxl import load_workbook
import pandas as pd
import json, argparse

def main(collection_name):
    print("Load xlsx, create dataframe")
    wb = load_workbook(filename = "/Users/jgartner/Desktop/fin_dummy_data.xlsx")
    df = pd.DataFrame(wb['Al-Zoomba'].values)
    df.columns = df.iloc[0]
    df = df.iloc[1:]
    print(df.head())

    print("Write Dataframe to mongo")
    client = MongoClient()
    db = client["fin-new"]
    records = json.loads(df.T.to_json()).values()
    db[collection_name].insert(records)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("collectionName", help="Directory or file name (e.g. 'hdfs://domain.here.dev:/pathToData/")
    args = parser.parse_args()

    main(args.collectionName)