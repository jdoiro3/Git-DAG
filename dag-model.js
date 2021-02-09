class Repo {

	constructor(objects) {
		this.objects = objects;
	}

	get_commits() {
		let commits = Object.values(this.objects).filter(obj => obj.type === "c");
    commits.forEach(obj => obj.id = obj.hash);
		return commits;
	}

	get_links() {
		let links = []
		let commits = this.get_commits();
		for (let commit in commits) {
      let parents = commits[commit].content.parents;
			parents.forEach(p => links.push({source: commits[commit].hash, target: p}))
		}
		return links;
	}

}

    
function onChange(event) {
    let reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
}

function onReaderLoad(event){
    let obj = JSON.parse(event.target.result);
    let repo = new Repo(obj);
    let gData = {
      nodes: repo.get_commits(),
      links: repo.get_links()
    };

    const Graph = ForceGraph3D()
    (document.getElementById('3d-graph'))
      .graphData(gData)
      .nodeRelSize(8)
      .numDimensions(3)
      .dagMode("lr")
      .nodeLabel(show_content)
      .dagLevelDistance(10)
      .linkDirectionalArrowLength(5.5)
      .linkDirectionalArrowRelPos(1)
      .linkCurvature(0.25)
      //.onNodeClick(function (node) {show_content(node)});

    function show_content(node) {
      return node.content.message+"\n"+node.content.committer
    }
}

document.getElementById('file').addEventListener('change', onChange);