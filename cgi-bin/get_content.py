import cgi, cgitb
import subprocess
import json
cgitb.enable()

with open(r"config.json", "r") as f:
    config = json.load(f)
path_to_bash = r"{}".format(config["path_to_bash"])

params = cgi.FieldStorage()
obj = params["obj"].value
repo_path = params["repo"].value

subprocess.run([path_to_bash, f"git_cat_file.sh", repo_path, obj],
                 cwd=r"./bash-scripts")

with open(r"./data/content.txt", "r") as f:
    content = f.read()

print("Content-Type: application/json")
print("")
print(content)