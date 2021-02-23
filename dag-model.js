

class Repo {

  constructor(repo_path=null) {
    this.repo_path = repo_path;
    this.repo_uri = "http://localhost:8888/cgi-bin/get_commits.py?repo="+repo_path;
    this.commits = null;
    this.refs = null;
    this.trees = null;
  }

  set_repo_uri(repo_path) {
    this.repo_uri = "http://localhost:8888/cgi-bin/get_commits.py?repo="+repo_path;
  }

  get_commit(hash) {
    if (this.commits == null) {
      return null;
    } else {
      return this.commits[hash];
    }
  }

  get_commits() {
    if (this.commits == null) {
      return null;
    } else {
      return Object.values(this.commits);
    }
  }

  get_trees() {
    if (this.trees == null) {
      return null;
    } else {
      return Object.values(this.trees);
    }
  }

  get_refs() {
    if (this.refs == null) {
      return null;
    } else {
      return Object.values(this.refs);
    }
  }

  get_ref_pointer(ref) {
    ref = this.refs[ref];
    if (ref.name === "HEAD") {
      this.get_refs().forEach(another_ref => {
        if (another_ref.pointer === ref.pointer && another_ref.name !== "HEAD") {
          ref.pointer = another_ref.name;
        }
      })
    }
    return ref.pointer
  }

  get_parents(sha1) {
    let commit = this.get_commit(sha1);
    if (commit.parents === "") {
      return [];
    } else {
      return commit.parents.split(" ");
    }
  }

	get_dag_links() {
		let links = []
		for (let commit in this.commits) {
      let parents = this.get_parents(commit);
			parents.forEach(p => links.push({source: commit, target: p}));
		}
    for (let ref in this.refs) {
      links.push({source: ref, target: this.get_ref_pointer(ref)});
    }
		return links;
	}

  get_dag_nodes() {
    return this.get_commits().concat(this.get_refs());
  }

  async initialize_graph_data() {
    let data = await fetch(this.repo_uri).then(response => response.json()).catch(err => { throw err });
    let commits = data.commits;
    let refs = data.refs;
    // delete data that exist just to have proper json
    delete commits.empty;
    delete refs.empty;
    for (const hash in commits) {
      commits[hash].id = hash;
      commits[hash].type = "commit";
      commits[hash].color = "GoldenRod";
      commits[hash].clicked = false;
    }
    // give references more attributes
    for (const ref in refs) {
      refs[ref].id = ref;
      refs[ref].type = "ref";
      refs[ref].color = "white"
    }
    this.commits = commits;
    this.refs = refs;
    this.graphData = {nodes: this.get_dag_nodes(), links: this.get_dag_links()};
  }

  async add_tree(commit) {
    let tree_uri = this.repo_uri+"&commit="+commit.hash;
    let tree = fetch(tree_uri).then(response => response.json()).catch(err => { throw err });
    let root_tree = {type: "tree", hash: commit.tree, id: commit.tree, color: "green"};
    delete tree.objects.empty;
    let tree_children = Object.values(tree.objects);
  }

  remove_tree() {

  }

}


function show_content(node) {
  if (node.type === "commit") {
    let style = "background-color:white; color:black; border-radius: 6px; padding:5px;"
    return '<div style="'+style+'">Committer: '+node.committer+'<br>Date: '+node["committer date"]+'<br>'+node.subject+'</div>'
  } else {
    let style = "background-color:white; color:black; border-radius: 6px; padding:5px;"
    return '<div style="'+style+'">Type: '+node.type+'<br>Hash: '+node.hash+'<br>ID: '+node.id+'</div>'
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
    .onNodeRightClick(node => {
      let commit = node.hash;
      let path = document.getElementById("path").value;
      fetch("http://localhost:8888/cgi-bin/get_tree.py?commit="+commit+"&repo="+path)
      .then(response => response.json())
      .then(tree_data => Graph.graphData(repo.get_graph_data(node, tree_data)));
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

