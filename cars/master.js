const cluster = require("cluster")
var numthreads = 8;

cluster.setupMaster({exec:'index.js'});
let inputarray = new Array();


for(var k=0;k<=1.0;k+=0.01){
	inputarray.push({'trainsplit':k});
}
totalArrays = inputarray.length;
for(let i=0;i<numthreads;i++){
	var worker = cluster.fork();
	worker.on('message',(data)=>{
		console.log(this);
		console.log(data);

		if(inputarray.length!=0){
			cluster.workers[data.workerid].send(inputarray.pop())
		}
		else{
			cluster.workers[data.workerid].kill()
			if(cluster.workers.length ==0){
				process.exit(1);
			}
		}
	});
	worker.send(inputarray.pop());
}
