#!/bin/bash

cd ../ # change to the project's root directory
output_file="$PWD/data/tree.json"
cd "$1" # change to the .git directory

# tree_objects is an array (sep by space) that stores each line, which is either a tree or blob
mapfile -t tree_objects < <(git ls-tree -r -t $2)
echo '{"objects": {' > "${output_file}"
for (( i=0; i<${#tree_objects[@]}; i++ )) # for each object
    do
        line=( ${tree_objects[i]} )
        object_name=${line[@]:3} # e.g. parent_of_parent/parent/child
        parent_name="${object_name%/*}" # e.g. parent_of_parent/parent
        echo "\""$object_name\"": {\""perm\"": \""${line[0]}\"", \""type\"": \""${line[1]}\"", \""hash\"": \""${line[2]}\"", \""parent\"": \""$parent_name\"", \""id\"": \""$object_name\""}," >> "${output_file}"
    done
echo '"empty": 0}}' >> "${output_file}"

