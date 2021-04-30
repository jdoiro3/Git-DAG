
async function gitObjects(repo_path, bash_path, type="all") {
  let object_data = await fetch("/cgi-bin/get_objects.py?repo="+repo_path+"&bash_path="+bash_path+"&type="+type)
    .then(response => response.json())
    .catch(err => { throw err });
  // remove member that is just there for valid json
  delete object_data.end;

  Object.keys(object_data).forEach(key => {
    // turn the strings that are actually arrays into arrays
    object_data[key].parents = object_data[key].parents.trim().split(" ").filter(elem => elem != "");
    object_data[key].points_to = object_data[key].points_to.trim().split(" ").filter(elem => elem != "");
    // add object attributes for graph visibility
    object_data[key].clicked = false;
    if (object_data[key].type == "commit" || object_data[key].type === "tag" || object_data[key].type === "ref") {
      object_data[key].visible = true;
    } else {
      object_data[key].visible = false;
    }
  });
  return object_data;
}

function get_links(objects) {
  let links = [];
  Object.keys(objects).forEach(key => {
    let obj = objects[key];
    obj.parents.forEach(other_obj => links.push({source: key, target: other_obj, strength: 1}));
    obj.points_to.forEach(other_obj => {
      if (objects[other_obj] !== undefined) {
        console.log({source: key, target: other_obj, strength: 0});
        links.push({source: key, target: other_obj, strength: 0});
      }
    })
  });
  return links;
}

function get_graph_data(object_data) {
  let object_array = Object.entries(object_data).map(([id, value]) => ({id,value}));
  let visible_objects_array = object_array.filter(obj => obj.value.visible);
  let visible_objects = visible_objects_array.reduce((obj, item) => (obj[item.id] = item.value, obj) ,{});
  console.log(visible_objects);
  let links = get_links(visible_objects);
  return {nodes: visible_objects_array, links: links}
}

const yCenter = {"commit": 500, "tree": 400, "blob": 300, "tag": -100};
const Graph = ForceGraph3D()
Graph(document.getElementById('3d-graph'))
    .graphData({nodes: [], links: []})
    .d3Force('collide', d3.forceCollide(2))
    .numDimensions(3)
    .nodeLabel(node => {
      let style = "background-color:white; color:black; border-radius: 6px; padding:5px;";
      return '<div style="'+style+'">Type: '+node.value.type+'<br>objectname: '+node.id+'</div>';
    })
    .linkDirectionalArrowLength(3)
    .linkDirectionalArrowRelPos(1)
    .linkCurvature(0.25)
    .onNodeClick(async (node, event) => {
      if (event.ctrlKey || event.shiftKey || event.altKey) {
        await window.open("/cgi-bin/get_content.py?repo="+Graph.repo_path+"&bash_path="+Graph.bash_path+"&object="+node.id, "_blank");
      } else {
        // Aim at node from outside it
        const distance = 40;
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
        Graph.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: Graph.cameraPosition.z }, // new position
          node, // lookAt ({ x, y, z })
          800  // ms transition duration
        );
      }
    })
    .onNodeDragEnd(node => {
          node.fx = node.x;
          node.fy = node.y;
          node.fz = node.z;
        })
    .nodeThreeObject(node => {
      if (node.value.type === "ref") {
        const sprite = new SpriteText(node.id);
        sprite.material.depthWrite = false; // make sprite background transparent
        sprite.color = node.color;
        sprite.textHeight = 8;
        return sprite;
      } else {
        return false;
      }
    })
    .onNodeRightClick(node => {
      node.value.points_to.forEach(obj => {
        Graph.git_objects[obj].visible = true;
        console.log(Graph.git_objects[obj]);
      });
      Graph.graphData(get_graph_data(Graph.git_objects));
    })
    .nodeAutoColorBy(node => node.value.type);

const form = document.getElementById("form");

form.addEventListener( "submit", async function ( event ) {
  event.preventDefault();
  let repo_path = document.getElementById("path").value;
  let bash_path = document.getElementById("bash-path").value;
  if (event.submitter.value === "initialize") {
    let git_objects = await gitObjects(repo_path, bash_path);
    Graph.git_objects = git_objects;
    Graph.repo_path = repo_path;
    Graph.bash_path = bash_path;
    Graph.graphData(get_graph_data(Graph.git_objects));
  } else {
    let new_git_objects = await gitObjects(Graph.repo_path, Graph.bash_path, "new");
    //let {nodes, links} = Graph.graphData();
    Graph.git_objects = {...Graph.git_objects, ...new_git_objects};
    Graph.graphData(get_graph_data(Graph.git_objects));
  };
});

window.addEventListener('resize', function () {
  Graph.width(window.innerWidth);
  Graph.height(window.innerHeight);
}); 