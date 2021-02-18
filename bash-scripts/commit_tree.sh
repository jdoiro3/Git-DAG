#!/bin/bash

cd ../ # change to the project's root directory
output_file="$PWD/data/tree.json"
cd "$1" # change to the .git directory

# tree_objects is an array (sep by space) that stores each line, which is either a tree or blob
mapfile -t tree_objects < <(git ls-tree -r -t $2)
echo '{"objects": [' > "${output_file}"
for (( i=0; i<${#tree_objects[@]}; i++ )) # for each object
    do
        line=( ${tree_objects[i]} )
        dir=${line[@]:3} # get the last values in the array, which is the path (with spaces)
        parent="${dir%/*}" # use bash string formatting to get the parent path
        parent="${parent##*/}" # ./some/path/tp/parent -> parent
        current_dir=${dir##*/}
        echo "{\""perm\"": \""${line[0]}\"", \""type\"": \""${line[1]}\"", \""hash\"": \""${line[2]}\"", \""parent\"": \""$parent\"", \""name\"": \""$current_dir\""}," >> "${output_file}"
    done
echo '{"empty": 0}]}' >> "${output_file}"

