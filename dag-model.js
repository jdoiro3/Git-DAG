

class Repo {

  constructor(repo_path=null) {
    this.repo_path = repo_path;
    this.repo_uri = "http://localhost:8888/cgi-bin/get_commits.py?repo="+repo_path;
    this.tree_uri = "http://localhost:8888/cgi-bin/get_tree.py?repo="+repo_path;
    this.objects = {};
    this.links = {};
  }

  set_repo_uri(repo_path) {
    this.repo_uri = "http://localhost:8888/cgi-bin/get_commits.py?repo="+repo_path;
    this.tree_uri = "http://localhost:8888/cgi-bin/get_tree.py?repo="+repo_path;
  }

  get_commit(objectname) {
    return this.objects[objectname];
  }

  get_commits() {
    return Object.values(this.objects).filter(obj => obj.type === "commit");
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
    let commit = this.get_commit(objectname);
    if (commit.parents === "") {
      return [];
    } else {
      return commit.parents.split(" ");
    }
  }

	get_dag_links() {
		let links = [];
    for (let objectname in this.objects) {
      // get the object using the objectname (hash)
      let obj = this.objects[objectname];

      if (obj.type === "commit") {
        let parents = this.get_parents(objectname);
			  parents.forEach(p => links.push({source: objectname, target: p}));
      } else if (obj.type === "ref") {
        links.push({source: objectname, target: this.get_ref_pointer(objectname)});
      // it's either a tree or blob and it's not a root tree
      } else if (obj.type === "tree" || obj.type === "blob") {
        // the object is a direct child of the root tree
        if (obj.parent === obj.id) {
          links.push({source: obj.root_tree, target: objectname});
        // object is a child of a child of the root tree
        } else {
          links.push({source: obj.parent, target: objectname});
        }
      // it's a root tree
      } else {
        links.push({source: obj.commit, target: objectname});
      }
    }
    return links;
	}

  get_dag_nodes() {
    return Object.values(this.objects);
  }

  async initialize_graph_data() {
    let data = await fetch(this.repo_uri).then(response => response.json()).catch(err => { throw err });
    let commits = data.commits;
    let refs = data.refs;
    // delete data that exist just to have proper json
    delete commits.empty;
    delete refs.empty;
    for (const objectname in commits) {
      commits[objectname].id = objectname;
      commits[objectname].objectname = objectname;
      commits[objectname].type = "commit";
      commits[objectname].color = "GoldenRod";
      commits[objectname].selected = false;
    }
    // give references more attributes
    for (const ref in refs) {
      refs[ref].id = ref;
      refs[ref].type = "ref";
      refs[ref].color = "white"
    }
    this.objects = {...commits, ...refs};
    this.graphData = {nodes: this.get_dag_nodes(), links: this.get_dag_links()};
  }

  async add_tree(commit) {
    let tree_uri = this.tree_uri+"&commit="+commit.hash;
    let tree = await fetch(tree_uri).then(response => response.json()).catch(err => { throw err });
    let root_tree = {type: "root-tree", objectname: commit.tree, id: commit.tree, color: "green", commit: commit.objectname};
    delete tree.objects.empty;
    let tree_objects = tree.objects;
    for (let objectname in tree_objects) {
      let obj = tree_objects[objectname];
      obj.root_tree = commit.tree;
      obj.objectname = obj.hash;
      if (obj.type === "tree") {
        obj.color = "green";
      }
    }
    tree_objects[root_tree.objectname] = root_tree;
    this.objects = {...this.objects, ...tree_objects};
    console.log(this.get_dag_nodes());
    console.log(this.get_dag_links());
    this.graphData = {nodes: this.get_dag_nodes(), links: this.get_dag_links()};
  }

  remove_tree(commit) {
    for (let objectname in this.objects) {
      let obj = this.objects[objectname];
      if (obj.root_tree === commit.tree || obj.objectname === commit.tree) {
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
    return '<div style="'+style+'">Type: '+node.type+'<br>Hash: '+node.objectname+'<br>Name:'+node.id+'</div>'
  }
}

let repo = new Repo();

const Graph = ForceGraph3D()
Graph(document.getElementById('3d-graph'))
    .graphData({nodes: [], links: []})
    .nodeRelSize(10)
    .numDimensions(3)
    .dagMode("lr")
    .nodeLabel(show_content)
    .dagLevelDistance(40)
    .linkDirectionalArrowLength(5.5)
    .linkDirectionalArrowRelPos(1)
    .linkCurvature(0.25)
    .linkWidth(2)
    .onNodeClick(node => {
      // Aim at node from outside it
      const distance = 40;
      const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

      Graph.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: Graph.cameraPosition.z }, // new position
        node, // lookAt ({ x, y, z })
        3000  // ms transition duration
      );
      })
    .onNodeRightClick(async function(node) {
      if (node.selected) {
        repo.remove_tree(node);
        node.selected = false;
        Graph.graphData(repo.graphData);
      } else {
        await repo.add_tree(node);
        node.selected = true;
        Graph.graphData(repo.graphData);
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

