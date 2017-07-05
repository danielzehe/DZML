const cluster = require("cluster")
var numthreads = 16;

cluster.setupMaster({exec:'index.js'});
let inputarray = new Array();

for(var k=0;k<=1.0;k+=0.01){
	inputarray.push({'trainsplit':k});
}
totalArrays = inputarray.length;
for(let i=0;i<numthreads;i++){
	var worker = cluster.fork();
	worker.on('message',(data)=>{
		console.log(data);
		if(inputarray.length!=0){
			worker.send(inputarray.pop())
		}
		else{
			process.exit(1);
		}
	});
	worker.send(inputarray.pop());
}
