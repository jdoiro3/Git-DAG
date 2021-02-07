class Repo {

	constructor(objects) {
		this.objects = objects;
		console.log(this.objects)
	}

	get_commits() {
		let commits = Object.values(this.objects).filter(obj => obj.type === "commit");
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
    console.log(repo.get_commits());
    console.log(repo.get_links());
    let gData = {
      nodes: repo.get_commits(),
      links: repo.get_links()
    };

    const Graph = ForceGraph3D()
    (document.getElementById('3d-graph'))
      .graphData(gData)
      .linkDirectionalArrowLength(3.5)
      .linkDirectionalArrowRelPos(1)
      .linkCurvature(0.25)
      .onNodeClick(function (node) {add_nodes(node.id)});

    function add_nodes(this_id) {
        const { nodes, links } = Graph.graphData();
        const id = nodes.length;
        Graph.graphData({
            nodes: [...nodes, {id: id, t: "t"}],
            links: [...links, { source: id, target: this_id}]
        })
    }
}

document.getElementById('file').addEventListener('change', onChange);