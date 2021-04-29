#!/bin/bash

input_file="$1";
output_file="$2";
SAVEIFS=$IFS;

cd "$3";

printf '{' > "${output_file}";
while read line
    do 
        IFS=',' read -ra line_arr <<< "$line";
        IFS=$SAVEIFS;

        if [ "${line_arr[1]}" = "blob" ]; then
            printf '"'"${line_arr[0]}"'": {"type": "blob", "parents": "", "points_to": ""},\n';
        elif [ "${line_arr[1]}" = "commit" ]; then
            git log --pretty='"'"${line_arr[0]}"'": {"type": "commit", "parents": "%P", "points_to": "%T"},' -n 1 ${line_arr[0]};
        else
            IFS=$'\n'
            content_arr=( $(git cat-file -p ${line_arr[0]}) );
            IFS=$SAVEIFS;
            if [ "${line_arr[1]}" = "tag" ]; then
                printf '"'"${line_arr[0]}"'": {"type": "tag", "parents": "", "points_to": "'"${content_arr[0]}"'", "name": "'"${content_arr[2]}"'"},\n';
            elif [ "${line_arr[1]}" = "tree" ]; then
                printf '"'"${line_arr[0]}"'": {"type": "tree", "parents": "", "points_to": "';
                for (( i=0; i<${#content_arr[@]}; i++ )) do
                    IFS=' ';
                    tree_points_to=( ${content_arr[i]} );
                    IFS=$'\t';
                    hash_and_name=( ${tree_points_to[2]} );
                    IFS=$SAVEIFS;
                    printf "${hash_and_name[0]} ";
                done
                printf '"},\n';
            fi
        fi 
    done < "${input_file}" >> "${output_file}";


mapfile -t refs < <(git show-ref --heads --tags);
for (( i=0; i<${#refs[@]}; i++ ))
    do
        line=( ${refs[i]} );
        printf '"'"${line[1]}"'": {"type": "ref", "parents": "", "points_to": "'"${line[0]}"'"},\n' >> "${output_file}";
    done

cd ./.git
head=( $(cat HEAD) );
printf '"HEAD": {"type": "ref", "parents": "", "points_to": "'"${head[1]}"'"},\n' >> "${output_file}";


printf '"end": "null"}' >> "${output_file}";

