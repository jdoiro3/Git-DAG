

class Repo {

  constructor(commits) {
    delete commits.empty;
    for (const commit in commits) {
      commits[commit].id = commit;
    }
		this.commits = commits;
	}

	get_commit(sha1) {
    return this.commits[sha1];
  }

  get_commits() {
    return Object.values(this.commits);
  }

  get_parents(sha1) {
    let commit = this.get_commit(sha1);
    if (commit.parents === "") {
      return [];
    } else {
      return commit.parents.split(" ");
    }
  }

	get_links() {
		let links = []
		for (let commit in this.commits) {
      let parents = this.get_parents(commit);
			parents.forEach(p => links.push({source: commit, target: p}))
		}
		return links;
	}

}


function show_content(node) {
  return node.commmitter+","+node["committer date"]+" Subject:"+node.subject
}

function bar(data) {
  console.log(data)
}

function show_merkel_tree(node) {
  let commit = node.hash;
  let path = document.getElementById("path").value;
  fetch("http://localhost:8888/cgi-bin/get_tree.py?commit="+commit+"&repo="+path)
  .then(response => response.json())
  .then(data => console.log(data));
}

function show_dag(data) {

    let repo = new Repo(data.commits);
    let gData = {
      nodes: repo.get_commits(),
      links: repo.get_links()
    };

    const Graph = ForceGraph3D()
    (document.getElementById('3d-graph'))
      .graphData(gData)
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
      .onNodeRightClick(show_merkel_tree)
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

