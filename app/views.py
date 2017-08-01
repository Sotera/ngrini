from flask import render_template, request
from app import app
from app import data_handlers

@app.route("/")
@app.route("/index")
def index():
    user = {'nickname': 'Joe'}  # fake user
    posts = [  # fake array of posts
        {
            'file_title': "Pacific Express",
            'mongo_collection': "test",
            'transaction_type': "Wire Transfer"
        },
        {
            'file_title': "Deutche Bank",
            'mongo_collection': None,
            'transaction_type': "Wire Transfer"
        }
    ]
    return render_template("index.html",
                           title='Home',
                           user=user,
                           posts=posts)

@app.route("/api/load_data/<collection>")
def load_data(collection):
    return data_handlers.date_chart_from_mongo(collection)

@app.route("/api/stats_data")
def load_stats():
    pars = request.args.to_dict()
    if "min_dt" in pars and "max_dt" in pars:
        return data_handlers.stats_table_from_mongo(pars['col'], start=pars['min_dt'], stop=pars['max_dt'])
    return data_handlers.stats_table_from_mongo(pars['col'])