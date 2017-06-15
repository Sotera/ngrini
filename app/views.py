from flask import render_template
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
    df = data_handlers.data_from_mongo(collection)