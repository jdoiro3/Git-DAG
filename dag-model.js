

class Repo {

  constructor(repo_path=null) {
    this.repo_path = repo_path;
    this.repo_uri = "http://localhost:8888/cgi-bin/get_commits.py?repo="+repo_path;
    this.tree_uri = "http://localhost:8888/cgi-bin/get_tree.py?repo="+repo_path;
    this.content_uri = "http://localhost:8888/cgi-bin/get_commits.py?repo="+repo_path;
    this.objects = {};
  }

  reset() {
    this.objects = {};
  }

  set_repo_uri(repo_path) {
    this.repo_uri = "http://localhost:8888/cgi-bin/get_commits.py?repo="+repo_path;
    this.tree_uri = "http://localhost:8888/cgi-bin/get_tree.py?repo="+repo_path;
    this.content_uri = "http://localhost:8888/cgi-bin/get_content.py?repo="+repo_path;
  }

  get_refs() {
    return Object.values(this.objects).filter(obj => obj.type === "ref");
  }

  get_ref_pointer(ref) {
    ref = this.objects[ref];
    if (ref.name === "HEAD") {
      this.get_refs().forEach(another_ref => {
        if (another_ref.pointer === ref.pointer && another_ref.name !== "HEAD") {
          ref.pointer = another_ref.name;
        }
      })
    }
    return ref.pointer
  }

  get_parents(objectname) {
    let obj = this.objects[objectname];
    if (obj.parents === "") {
      return [];
    } else {
      return obj.parents.split(" ");
    }
  }

	get_dag_links() {
		let links = [];
    for (let objectname in this.objects) {

      let obj = this.objects[objectname]; // get the object using the objectname (hash)

      if (obj.type === "commit") {

        let parents = this.get_parents(objectname);
			  parents.forEach(p => links.push({source: objectname, target: p}));

      } else if (obj.type === "ref") {

        let ref_pointer = this.get_ref_pointer(objectname)
        links.push({source: objectname, target: ref_pointer});

      // it's either a tree, root-tree or blob and it's not a root tree
      } else {
        
        let parents = this.get_parents(objectname);
        parents.forEach(p => links.push({source: p, target: objectname}));

      }
    }
    return links;
	}

  get_dag_nodes() {
    return Object.values(this.objects);
  }

  async initialize_graph_data() {
    this.reset();
    let data = await fetch(this.repo_uri).then(response => response.json()).catch(err => { throw err });
    let commits = data.commits;
    let refs = data.refs;
    // delete data that exist just to have proper json
    delete commits.empty;
    delete refs.empty;
    for (const objectname in commits) {
      commits[objectname].id = objectname;
      commits[objectname].type = "commit";
      commits[objectname].color = "GoldenRod";
      commits[objectname].selected = false;
    }
    // give references more attributes
    for (const ref in refs) {
      refs[ref].objectname = ref;
      refs[ref].id = ref;
      refs[ref].type = "ref";
      refs[ref].color = "white"
    }
    this.objects = {...commits, ...refs};
    this.graphData = {nodes: this.get_dag_nodes(), links: this.get_dag_links()};
  }

  async add_tree(commit) {
    // get the tree data
    let tree_uri = this.tree_uri+"&commit="+commit.objectname;
    let tree = await fetch(tree_uri).then(response => response.json()).catch(err => { throw err });
    delete tree.objects.empty; // remove unwanted data
    let tree_objects = tree.objects; // access the tree's objects
    let root_tree = {type: "root-tree", objectname: commit.tree, id: commit.tree, parents: commit.objectname}; // define the root tree
    tree_objects[root_tree.objectname] = root_tree; // add the root tree to the tree's objects
    for (let objectname in tree_objects) {
      let obj = tree_objects[objectname];
      obj.commit = commit.objectname;
      if (obj.type === "tree" || obj.type === "root-tree") {
        obj.color = "green";
      }
      if (obj.parents === commit.objectname && obj.type !== "root-tree") {
        obj.parents = commit.tree;
      }
      if (objectname in this.objects) {
        obj.parents = this.objects[objectname].parents+" "+obj.parents;
      }
    }
    // update the model
    this.objects = {...this.objects, ...tree_objects};
    this.graphData = {nodes: this.get_dag_nodes(), links: this.get_dag_links()};
  }

  remove_tree(commit) {
    for (let objectname in this.objects) {
      let obj = this.objects[objectname];
      if (obj.commit === commit.objectname) {
        delete this.objects[objectname];
      }
    }
    this.graphData = {nodes: this.get_dag_nodes(), links: this.get_dag_links()};
  }
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

let repo = new Repo();

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
    .onNodeRightClick(async function(node) {
      if (node.selected && node.type === "commit" ) {
        repo.remove_tree(node);
        node.selected = false;
        Graph.graphData(repo.graphData);
      } else if (node.type === "commit") {
        await repo.add_tree(node);
        node.selected = true;
        Graph.graphData(repo.graphData);
      } else {
        await window.open(repo.content_uri+"&obj="+node.id, "_blank");
      }
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
  if (event.submitter.value === "initialize") {
    let path = document.getElementById("path").value;
    repo.set_repo_uri(path);
    await repo.initialize_graph_data();
    Graph.graphData(repo.graphData);
  } else {
    console.log("update");
    Graph.graphData(repo.graphData);
  }
});

