async function getObjects(repo_path, bash_path, type="all") {
  let object_data = await fetch("/cgi-bin/get_objects.py?repo="+repo_path+"&bash_path="+bash_path+"&type="+type)
    .then(response => response.json())
    .catch(err => { throw err });
  // remove member that is just there for valid json
  delete object_data.end;
  // turn the strings that are actually arrays into arrays
  Object.keys(object_data).forEach(key => {
    object_data[key].parents = object_data[key].parents.trim().split(" ").filter(elem => elem != "");
    object_data[key].points_to = object_data[key].points_to.trim().split(" ").filter(elem => elem != "");
  });
  let key_value_array = Object.entries(object_data).map(([id, value]) => ({id,value}));
  return { objects: object_data, object_array: key_value_array };
}

function get_links(object_array) {
  let links = [];
  object_array.forEach(obj => {
    obj.value.parents.forEach(other_obj => links.push({source: obj.id, target: other_obj}));
    obj.value.points_to.forEach(other_obj => links.push({source: obj.id, target: other_obj}))
  });
  return links;
}

function show_content(node) {
  if (node.type === "commit") {
    let style = "background-color:white; color:black; border-radius: 6px; padding:5px;"
    return '<div style="'+style+'">Committer: '+node.committer+'<br>Date: '+node["committer date"]+'<br>'+node.subject+'</div>'
  } else {
    let style = "background-color:white; color:black; border-radius: 6px; padding:5px;"
    return '<div style="'+style+'">Type: '+node.type+'<br>Name: '+node.name+'<br>id: '+node.id+'</div>'
  }
}

const Graph = ForceGraph3D()
Graph(document.getElementById('3d-graph'))
    .graphData({nodes: [], links: []})
    .nodeRelSize(10)
    .numDimensions(3)
    .nodeLabel(show_content)
    .linkDirectionalArrowLength(5.5)
    .linkDirectionalArrowRelPos(1)
    .linkCurvature(0.25)
    .linkWidth(1)
    .onNodeClick(node => {
      // Aim at node from outside it
      const distance = 40;
      const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
      Graph.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: Graph.cameraPosition.z }, // new position
        node, // lookAt ({ x, y, z })
        800  // ms transition duration
      );
    })
    .onNodeDragEnd(node => {
          node.fx = node.x;
          node.fy = node.y;
          node.fz = node.z;
        })
    .nodeThreeObject(node => {
      if (node.type === "ref") {
        const sprite = new SpriteText(node.id);
        sprite.material.depthWrite = false; // make sprite background transparent
        sprite.color = node.color;
        sprite.textHeight = 8;
        return sprite;
      } else {
        return false;
      }
    });

const form = document.getElementById("form");

form.addEventListener( "submit", async function ( event ) {
  event.preventDefault();
  let path = document.getElementById("path").value;
  let bash_path = document.getElementById("bash-path").value;
  if (event.submitter.value === "initialize") {
    let data = await getObjects(path, bash_path);
    let link_array = get_links(data.object_array);
    Graph.graphData({nodes: data.object_array, links: link_array});
  } else {
    let data = await getObjects(path, bash_path, "new");
  };
});