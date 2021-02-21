

class Repo {

  constructor(commits, refs) {
    // delete both empty objects. These are created in the bash scripts
    // to have valid json
    delete commits.empty;
    delete refs.empty;
    // give each commit more attributes
    for (const hash in commits) {
      commits[hash].id = hash;
      commits[hash].type = "commit";
      commits[hash].color = "yellow"
    }
		this.commits = commits;
    // give references more attributes
    for (const ref in refs) {
      refs[ref].id = ref;
      refs[ref].type = "ref";
    }
    this.refs = refs;
	}

	get_commit(hash) {
    return this.commits[hash];
  }

  get_commits() {
    return Object.values(this.commits);
  }

  get_refs() {
    return Object.values(this.refs);
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

	get_commit_links() {
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

  get_graph_data(node, tree_data) {
    if (tree_data == null && node == null) {
       return {nodes: this.get_commits().concat(this.get_refs()), links: this.get_commit_links()};
    } else {
      delete tree_data.objects.empty;
      let root_tree = {type: "tree", hash: node.tree, id: node.tree, color: "green"};
      let tree_objects = Object.values(tree_data.objects);
      let tree_links = [];
      tree_objects.forEach(obj => {
        if (obj.type === "blob") {
          obj.color = "orange";
        } else {
          obj.color = "green";
        }
        if (obj.parent == obj.id) {
          tree_links.push({source: root_tree, target: obj});
        } else {
          tree_links.push({source: obj.parent, target: obj});
        }
      });
      tree_links.push({source: node, target: root_tree});
      tree_objects.push(root_tree);
      let commits_and_tree_objects = this.get_commits().concat(this.get_refs()).concat(tree_objects);
      let links = this.get_commit_links().concat(tree_links);
      console.log({nodes: commits_and_tree_objects, links: links});
      return {nodes: commits_and_tree_objects, links: links};
    }
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

function show_dag(data) {

    let repo = new Repo(data.commits, data.refs);

    const Graph = ForceGraph3D()
    (document.getElementById('3d-graph'))
      .graphData(repo.get_graph_data())
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
          sprite.color = "white";
          sprite.textHeight = 8;
          return sprite;
        } else {
          return false;
        }
      });
}

async function get_data(repo_path) {
  let uri = "http://localhost:8888/cgi-bin/get_commits.py?repo="+repo_path;
  let data = await fetch(uri).then(request => request.json()).catch(err => { throw err });
  show_dag(data);
}


const form = document.getElementById("form");
form.addEventListener( "submit", function ( event ) {
  event.preventDefault();
  let path = document.getElementById("path").value;
  get_data(path);
});

