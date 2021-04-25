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

# escape strings with quotes for valid json
with open(r"./data/commits.json", "r", encoding="utf8") as f:
	invalid_json = f.read()

with open(r"./data/commits.json", "w", encoding="utf8") as f:
	valid_json = invalid_json.replace('"','\\"').replace("''", '"')
	f.write(valid_json)

with open(r"./data/commits.json", "r", encoding="utf8") as f:
    data = json.load(f)

print("Content-Type: application/json")
print("")
print(json.dumps(data))