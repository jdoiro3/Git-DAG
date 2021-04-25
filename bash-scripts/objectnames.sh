#!/bin/bash

cd "$2"  # change the directory to the location of the .git folder

git cat-file --unordered --batch-all-objects --buffer --batch-check='%(objectname),%(objecttype)' > "$1";

