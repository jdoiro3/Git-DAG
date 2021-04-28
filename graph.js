
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

function show_content(node) {
  let style = "background-color:white; color:black; border-radius: 6px; padding:5px;";
  return '<div style="'+style+'">Type: '+node.value.type+'<br>objectname: '+node.id+'</div>';
}

const yCenter = {"commit": 500, "tree": 400, "blob": 300, "tag": -100};
const Graph = ForceGraph3D()
Graph(document.getElementById('3d-graph'))
    .graphData({nodes: [], links: []})
    .d3Force('collide', d3.forceCollide(30))
    .d3Force('y', d3.forceY().y(function(node) {
      return yCenter[node.value.type];
    }))
    .d3Force('z', d3.forceZ().z(function(node) {
      return 100;
    }))
    .d3Force("link", d3.forceLink().distance(d => 20))
    .d3Force("link", d3.forceLink().strength(d => d.strength))
    .numDimensions(3)
    .nodeLabel(show_content)
    .linkDirectionalArrowLength(3)
    .linkDirectionalArrowRelPos(1)
    .linkCurvature(0.25)
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
  let path = document.getElementById("path").value;
  let bash_path = document.getElementById("bash-path").value;
  if (event.submitter.value === "initialize") {
    let git_objects = await gitObjects(path, bash_path);
    Graph.git_objects = git_objects;
    Graph.graphData(get_graph_data(git_objects));
  } else {
    let data = await getObjects(path, bash_path, "new");
  };
});

window.addEventListener('resize', function () {
  Graph.width(window.innerWidth);
  Graph.height(window.innerHeight);
}); 