#!/bin/bash

# Description: 
# This shell script will write all the commits and content (e.g. parents) to a json file.

cd ../ # project root directory
output_file="$PWD/data/commits.json"
cd "$1"  # change the directory to the location of the .git folder
printf "{\""commits\"": {\n" > "${output_file}"
# print all the commits and content in json format
git log --all --pretty=format:'"%H": {"hash": "%H", "parents": "%P", "tree": "%T", "author": "%an", "author date": "%ad", "commmitter": "%cn", "committer date": "%cd", "subject": "%f", "refs": "%D"},' --date=format:'%Y/%m/%d %H:%M:%S' >> "${output_file}"
printf "\""empty\"": 0}}" >> "${output_file}" # this is just to have valid json