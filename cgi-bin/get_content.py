#!/usr/bin/python

import cgi, cgitb
import subprocess
import json
import pathlib
cgitb.enable()

# client provides these paths
params = cgi.FieldStorage()
repo_path = params["repo"].value
bash_path = params["bash_path"].value
obj = params["object"].value

base_url = pathlib.Path(__file__).parent.absolute().parent / "data"
output_file = str(base_url / "content.txt")

# query git for object info needed for the graph
subprocess.run([bash_path, "./git_cat_file.sh", repo_path, obj, output_file], cwd=r"./bash-scripts")

with open(str(base_url / "content.txt"), "r", encoding="utf8") as f:
	content = f.read()

print("Content-Type: text/plain")
print("")
print(content)