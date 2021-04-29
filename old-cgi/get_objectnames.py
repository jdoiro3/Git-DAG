#!/usr/bin/python

import cgi, cgitb
import subprocess
import json
import os
cgitb.enable()

params = cgi.FieldStorage()
repo_path = params["repo"].value
bash_path = params["bash_path"].value

subprocess.run([bash_path, "./objectnames.sh", repo_path],
                 cwd=r"./bash-scripts")

with open(r"./data/objectnames.txt", "r", encoding="utf8") as f:
	file_str = f.read()

print("Content-Type: application/json")
print("")
print(json.dumps({"objects" : file_str.splitlines()}))