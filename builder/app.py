"""web app for the builder"""
from flask import Flask, send_file, abort, render_template, redirect
from .tasks import TaskQueue, SetupRepository, Build, SendEmail
from flask_cors import CORS
from .config import config
import time
import os

def get_config_for_build():
    conf = config.clone()
    conf.build_id = time.strftime(conf.build_id_format)
    # get headers in flask
    # see https://stackoverflow.com/a/29387151
    conf.host = request.headers.get("Host", conf.host)
    return conf

app = Flask(__name__, static_url_path="")
CORS(app)

tasks = TaskQueue()
#tasks.add(SetupRepository())

@app.route("/tasks.json")
def get_tasks():
    return tasks.toJSON()

@app.route("/build")
def build_firmware():
    config = get_config_for_build()
    repo = SetupRepository(config)
    tasks.add(repo)
    build = Build(repo)
    tasks.add(build)
    send_mail = SendEmail(build)
    tasks.add(send_mail)
    return config.toJSON()

@app.route('/firmwares', defaults={'req_path': ''})
@app.route('/firmwares/', defaults={'req_path': ''})
@app.route('/firmwares/<path:req_path>')
def dir_listing(req_path):
    # from https://stackoverflow.com/a/23724948
    assert not ".." in req_path
    os.makedirs(config.results.target, exist_ok=True)

    # Joining the base and the requested path
    abs_path = os.path.abspath(
        os.path.join(config.results.target, req_path))
    print(abs_path, req_path)

    # Return 404 if path doesn't exist
    if not os.path.exists(abs_path):
        return abort(404)

    # Check if path is a file and serve
    if os.path.isfile(abs_path):
        return send_file(abs_path)

    # redirect to directory name
    # see https://stackoverflow.com/a/14343957
    if not req_path.endswith("/") and req_path:
        return redirect(req_path.rsplit("/", 1)[-1] + "/", code=302)

    # Show directory contents
    files = os.listdir(abs_path)
    return render_template('files.html', files=files, path=req_path)

if __name__ == "__main__":
    app.run()

