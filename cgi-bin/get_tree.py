import cgi, cgitb
import subprocess
import json
cgitb.enable()

with open(r"config.json", "r") as f:
    config = json.load(f)
path_to_bash = r"{}".format(config["path_to_bash"])

params = cgi.FieldStorage()
commit = params["commit"].value
repo_path = params["repo"].value

subprocess.run([path_to_bash, "./commit_tree.sh", repo_path, commit],
                 cwd=r"./bash-scripts")

with open(r"./data/tree.json", "r") as f:
    data = json.load(f)

print("Content-Type: application/json")
print("")
print(json.dumps(data))