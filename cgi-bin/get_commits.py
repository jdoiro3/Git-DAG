#!/usr/bin/python

import cgi, cgitb
import subprocess
import json
import os
cgitb.enable()

params = cgi.FieldStorage()
repo_path = params["repo"].value
path_to_bash = params["bash_path"].value

print(path_to_bash)

subprocess.run([path_to_bash, "./dag_to_json.sh", repo_path],
                 cwd=r"./bash-scripts")

with open(r"./data/commits.json", "r") as f:
    data = json.load(f)

print("Content-Type: application/json")
print("")
print(json.dumps(data))