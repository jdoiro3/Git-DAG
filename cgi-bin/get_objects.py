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
request_type = params["type"].value # can either be 'all' or 'new'

base_url = pathlib.Path(__file__).parent.absolute().parent / "data"
output_file = str(base_url / "response.json")

# write the current content to previous so we can figure out which objects are new
with open(str(base_url / "curr_objects.txt"), "r") as curr:
	with open(str(base_url / "prev_objects.txt"), "w") as prev:
		for line in curr:
			prev.write(line)

# use bash script to load all objects inside the ./git directory
# this updates curr_objects.txt
subprocess.run([bash_path, "./objectnames.sh", str(base_url / "curr_objects.txt"), repo_path], cwd=r"./bash-scripts")

if request_type == "all":

	input_file = str(base_url / "curr_objects.txt")

elif request_type == "new":

	# figure out which objects are new from the last time we queried Git
	with open(str(base_url / "curr_objects.txt"), "r") as curr:
		curr_objects = set([line.strip() for line in curr.readlines()])
	with open(str(base_url / "prev_objects.txt"), "r") as prev:
		prev_objects = set([line.strip() for line in prev.readlines()])
	# write new objects to the new_objects file. This will be used for the bash script
	# if the request is only for new objects
	with open(str(base_url / "new_objects.txt"), "w", newline='\n') as new:
		new_objects = curr_objects - prev_objects
		new.write("\n".join(list(new_objects))+"\n")

	input_file = str(base_url / "new_objects.txt")

# query git for object info needed for the graph
subprocess.run([bash_path, "./get_graph_data.sh", input_file, output_file, repo_path], cwd=r"./bash-scripts")

with open(str(base_url / "response.json"), "r", encoding="utf8") as f:
	data = json.load(f)

print("Content-Type: application/json")
print("")
print(json.dumps(data))