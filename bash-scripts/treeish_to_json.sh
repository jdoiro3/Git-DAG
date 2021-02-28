#!/bin/bash

cd ../ # change to the project's root directory
output_file="$PWD/data/tree.json"
cd "$1" # change to the .git directory

tree_object_to_json()
{
    mapfile -t tree_objects < <(git ls-tree $1)

    for (( i=0; i<${#tree_objects[@]}; i++ )) do # for each object

        line=( ${tree_objects[i]} )
        object_name=${line[@]:3} # e.g. parent_of_parent/parent/child

        if [ "${line[1]}" == "tree" ]; then
            echo "\""${line[2]}\"": {\""perm\"": \""${line[0]}\"", \""type\"": \""${line[1]}\"", \""parents\"": \""$1\"", \""name\"": \""$object_name\"", \""id\"": \""${line[2]}\""}," >> "${output_file}"
            unset $1
            (tree_object_to_json ${line[2]}) # subshell
        else
            echo "\""${line[2]}\"": {\""perm\"": \""${line[0]}\"", \""type\"": \""${line[1]}\"", \""parents\"": \""$1\"", \""name\"": \""$object_name\"", \""id\"": \""${line[2]}\""}," >> "${output_file}"
        fi

    done
}

echo '{"objects": {' > "${output_file}"
tree_object_to_json $2
echo '"empty": 0}}' >> "${output_file}"

