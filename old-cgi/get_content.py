#!/usr/bin/python

import cgi, cgitb
import subprocess
import json
cgitb.enable()

params = cgi.FieldStorage()
obj = params["obj"].value
repo_path = params["repo"].value
path_to_bash = params["bash_path"].value

subprocess.run([path_to_bash, f"git_cat_file.sh", repo_path, obj],
                 cwd=r"./bash-scripts")

with open(r"./data/content.txt", "r") as f:
    content = f.read()

print("Content-Type: application/json")
print("")
print(content)