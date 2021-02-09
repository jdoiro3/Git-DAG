#!/bin/bash

get_parents() {

	echo -n "\""parents\"": ["
	for (( i=0; i<${#arr[@]}; i++ ))
		do
			local line=( ${arr[i]} )
			local next_line=( ${arr[$(($i+1))]} )
			if [ "${line[0]}" == "parent" ] && [ "${next_line[0]}" == "parent" ]; then
				echo -n "\""${line[@]:1}\"","
			elif [ "${line[0]}" == "parent" ]; then
				echo -n "\""${line[@]:1}\"""
				break
			fi
		done
	echo -n "],"
	printf "\n"

}


commit_content_to_json() {

	local content=$(git cat-file -p $1)
	local SAVEIFS=$IFS # save IFS
	local IFS=$'\n'
	local arr=( $content )
	local IFS=' '
	local arr_last_index=$((${#arr[@]}-1))

	local i
	echo "{"
	get_parents $1
	for (( i=0; i<${#arr[@]}; i++ ))
		do
			local line=( ${arr[i]} )
			if [ "$i" != "$arr_last_index" ] && [ "${line[0]}" != "gpgsig" ] && [ "${line[0]}" != "Revert" ] && [ "${line[0]}" != "parent" ]; then
				echo "\""${line[0]}\"": \""${line[@]:1}\"","
			elif [ "$i" = "$arr_last_index" ]; then
				echo "\""message\"": \""${line[@]}\"""
			elif [ "${line[0]}" == "Revert" ]; then
				echo "\""${line[0]}\"": ${line[@]:1},"
			fi
		done
	echo "}"
	local IFS=$SAVEIFS
}

tree_content_to_json() {

	local content=$(git cat-file -p $1)
	local SAVEIFS=$IFS # save IFS
	local IFS=$'\n'
	local arr=( $content )
	local IFS=$SAVEIFS
	local arr_last_index=$((${#arr[@]}-1))

	echo "["
	local i
	for (( i=0; i<${#arr[@]}; i++ ))
		do
			local line=( ${arr[i]} )
			if [ "$i" != "$arr_last_index" ]; then
				echo "{\""perm\"":\""${line[0]}\"",\""type\"":\""${line[1]}\"",\""hash\"":\""${line[2]}\"",\""name\"":\""${line[3]}\""},"
			else
				echo "{\""perm\"":\""${line[0]}\"",\""type\"":\""${line[1]}\"",\""hash\"":\""${line[2]}\"",\""name\"":\""${line[3]}\""}"
			fi
		done
	echo "]"
}

git cat-file --batch-check --batch-all-objects > objects.txt

printf "{\""empty\"": {" > objects.json
while read -r line;
	do
		if [ "${line:41:1}" != "b" ]; then
			printf "\n},\n\"""${line:0:40}\""":"
			printf "{\n\"""type\""": \"""${line:41:1}\""",\n\"""hash\""": \"""${line:0:40}\""",\n"
			printf "\"""content\""":"
			if [ "${line:41:1}" == "c" ]; then
				commit_content_to_json ${line:0:40}
			elif [ "${line:41:1}" == "t" ]; then
				tree_content_to_json ${line:0:40}
			fi
		fi
	done < objects.txt >> objects.json 
printf "}}" >> objects.json