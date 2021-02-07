get_parents() {
	
	content=$(git cat-file -p $1)

	SAVEIFS=$IFS   # Save current IFS
	IFS=$'\n'      # Change IFS to new line
	content=($content) # split to array $content
	IFS=$SAVEIFS   # Restore IFS

	echo -n "\""parents\"": ["
	for (( i=0; i<${#content[@]}; i++ ))
		do
			string=(${content[$i]})
			next_string=(${content[$(($i+1))]})
			if [ "${string[0]}" == "parent" ]; then
				if [ "${next_string[0]}" == "parent" ]; then
						echo -n "\""${string[@]:1}\"","
				else
					echo -n "\""${string[@]:1}\"""
				fi
			fi
		done
	echo -n "],"
	printf "\n"
}


commit_format() {
	content=$(git cat-file -p $1)

	SAVEIFS=$IFS   # Save current IFS
	IFS=$'\n'      # Change IFS to new line
	content=($content) # split to array $content
	IFS=$SAVEIFS   # Restore IFS

	echo "{" >> $2
	get_parents $1 >> $2
	for (( i=0; i<${#content[@]}; i++ ))
		do
			string_array=(${content[$i]})
			if [ "$i" != "$((${#content[@]}-1))" ]; then
				if [ "${string_array[0]}" != "parent" ] && [ "${string_array[0]}" != "gpgsig" ]; then
					echo "\""${string_array[0]}\"": \""${string_array[@]:1}\""," >> $2
				else
					echo "\""message\"": \"""${content[$((${#content[@]}-1))]}\"" >> $2
					break
				fi
			else
				echo "\""message\"": \""${string_array[@]}\""" >> $2
			fi
		done
	echo "}"
}

tree_format() {
	content=$(git cat-file -p $1)

	SAVEIFS=$IFS   # Save current IFS
	IFS=$'\n'      # Change IFS to new line
	content=($content) # split to array $content
	IFS=$SAVEIFS   # Restore IFS

	echo "[" >> $2
	for (( i=0; i<${#content[@]}; i++ ))
		do
			string=(${content[$i]})
			if [ "$i" != "$((${#content[@]}-1))" ]; then
				echo "{\""perm\"":\""${string[0]}\"",\""type\"":\""${string[1]}\"",\""hash\"":\""${string[2]}\"",\""name\"":\""${string[3]}\""}," >> $2
			else
				echo "{\""perm\"":\""${string[0]}\"",\""type\"":\""${string[1]}\"",\""hash\"":\""${string[2]}\"",\""name\"":\""${string[3]}\""}" >> $2
			fi
		done
	echo "]"
}


git cat-file --batch-check --batch-all-objects > objects.txt
printf "{\""empty\"": {\n" > objects.json
while IFS= read -r line; 
	do
		if [ "${line:41:1}" != "b" ]; then
			printf "},\n"
			printf "\""%s\"":{\n" ${line::40}
			printf "\""type\"": \""%s\"",\n" $(git cat-file -t ${line::40})
			printf "\""hash\"": \""%s\"",\n" ${line::40}
			printf "\""content\"":"
			if [ "${line:41:1}" == "t" ]; then
				tree_format ${line::40} objects.json
			elif [ "${line:41:1}" == "c" ]; then
				commit_format ${line::40} objects.json
			else
				echo "somehing else" >> objects.json
			fi
		fi
	done < objects.txt >> objects.json
printf "}}" >> objects.json