#!/usr/bin/python

import cgi, cgitb
import subprocess
import json
cgitb.enable()

params = cgi.FieldStorage()
commit = params["commit"].value
repo_path = params["repo"].value
path_to_bash = params["bash_path"].value

subprocess.run([path_to_bash, "./treeish_to_json.sh", repo_path, commit],
                 cwd=r"./bash-scripts")

with open(r"./data/tree.json", "r") as f:
    data = json.load(f)

print("Content-Type: application/json")
print("")
print(json.dumps(data))