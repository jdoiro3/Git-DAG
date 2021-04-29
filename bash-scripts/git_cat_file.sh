#!/bin/bash

# Description: 
# This shell script will write all the commits and content (e.g. parents) to a json file.

cd "$1"  # change the directory to the location of the .git folder
git cat-file -p $2 > "$3"

