import cgi, cgitb
import subprocess
import json
import os
cgitb.enable()

with open(r"config.json", "r") as f:
    config = json.load(f)
path_to_bash = r"{}".format(config["path_to_bash"])

params = cgi.FieldStorage()
repo_path = params["repo"].value

subprocess.run([path_to_bash, "./dag_to_json.sh", repo_path],
                 cwd=r"./bash-scripts")

with open(r"./data/commits.json", "r") as f:
    data = json.load(f)

print("Content-Type: application/json")
print("")
print(json.dumps(data))