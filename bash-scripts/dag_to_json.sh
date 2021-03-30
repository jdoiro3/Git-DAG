#!/bin/bash

# Description: 
# This shell script will write all the commits and content (e.g. parents) to a json file.

cd ../ # project root directory
output_file="$PWD/data/commits.json"
cd "$1"  # change the directory to the location of the .git folder
printf "{''commits'': {\n" > "${output_file}"
# print all the commits and content in json format
# '' is used to denote " for now. double single quotes insures apostrophes are kept
git log --all --pretty=format:"''%H'': {''objectname'': ''%H'', ''parents'': ''%P'', ''tree'': ''%T'', ''author'': ''%an'', ''author date'': ''%ad'', ''committer'': ''%cn'', ''committer date'': ''%cd'', ''subject'': ''%f'', ''refs'': ''%D''}," --date=format:'%Y/%m/%d %H:%M:%S' >> "${output_file}"
printf "''empty'': 0}," >> "${output_file}" # this is just to have valid json

# get the HEAD and other refs
printf "\n''refs'': {\n" >> "${output_file}"
mapfile -t refs < <(git show-ref --head)
for (( i=0; i<${#refs[@]}; i++ ))
    do
        line=( ${refs[i]} )
        echo "''${line[1]}'': {''pointer'': ''$(git rev-list -n 1 ${line[1]})'',''name'': ''${line[1]}''}," >> "${output_file}"
    done
printf "''empty'': 0}\n}" >> "${output_file}"

