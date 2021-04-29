

async function getObjects(type="all") {
	let repo_path = "C:\\Users\\josep\\Desktop\\force-graph"
	let bash_path = "C:\\Program Files\\Git\\bin\\bash.exe"
  let object_data = await fetch("/cgi-bin/get_objects.py?repo="+repo_path+"&bash_path="+bash_path+"&type="+type)
    .then(response => response.json())
    .catch(err => { throw err });
  // remove member that is just there for valid json
  delete object_data.end;
  // turn the strings that are actually arrays into arrays
  Object.keys(object_data).forEach(key => {
    object_data[key].parents = object_data[key].parents.trim().split(" ");
    object_data[key].points_to = object_data[key].points_to.trim().split(" ");
  });
  let key_value_array = Object.entries(object_data).map(([id, value]) => ({id,value}));
  return { objects: object_data, object_array: key_value_array };
}