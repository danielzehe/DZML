const synaptic = require('synaptic')
const cluster = require('cluster')
const fs = require('fs')
const shuffle = require('knuth-shuffle').knuthShuffle
const assert = require('assert');

const wines = JSON.parse(fs.readFileSync('wine-red.json'))
	// console.log(wines)

	//Normalization
	//find the unique values for each column

	const columns = Object.keys(wines[0])
	const colObject = {};
	//What are the columns in the vector
	for(column of columns){
		console.log(column)
		colObject[column] = 0.0;
	}
	//add the unique values in each column to a set (only required for non-continuous values)
	for(wine of wines){
		for(column of columns){
			console.log(column+': ' +colObject[column]+' '+wine[column])
			if(parseFloat(wine[column])>parseFloat(colObject[column])){

				colObject[column] = wine[column];

			}
		}
	}


	console.log('the largest value for each colum is:')
	console.log(colObject);




	// console.log('Each column has these values:');
	// console.log(colObject);
	// for(column in colObject){
	// 	colObject[column] = makeOneZeroVector(colObject[column]);
	// }
	// // console.log('Normalizer lookup:')
	// // console.log(colObject);

	//normalizing the values by their max value
	const normalizedWines = wines.map((value) =>{
		let returnobject = {}
		for(column of columns){
			returnobject[column] = (parseFloat(value[column])/parseFloat(colObject[column]));
			if(returnobject[column]>1.0){
				console.log(value[column]+'/'+colObject[column]+' ('+column+')');
			}

		}
		return returnobject;
	});
	// console.log(normalizedWines)

process.on('message',function(workload){
	const shuffledNormalizedWines =	shuffle(normalizedWines.slice(0));

	// console.log(normalizedWines);

	let k = workload;
	// console.log(k);

	// for(var k=0;k<=1.0;k+=0.01){
	// for(k of workload){
	//starting the taining by creating a training set

		let trainsplit = Math.round(shuffledNormalizedWines.length*k.trainsplit);
		let trainingset = new Array();
		for(let i = 0;i<trainsplit;i++){
			let object = {}
			let currentcar = shuffledNormalizedWines[i]
			object.input = [currentcar['fixed acidity'],currentcar['citric acid'],currentcar['residual sugar'],currentcar['chlorides'],currentcar['free sulfur dioxide'],currentcar['total sulfur dioxide'],currentcar['density'],currentcar['pH'],currentcar['sulphates'],currentcar['alcohol']];
			// console.log(object.input)
			object.output = [currentcar.quality];
			trainingset.push(object);
		}
		console.log(trainingset);



		const Layer = synaptic.Layer;
		const Network = synaptic.Network;
		const Trainer = synaptic.Trainer;

		const inputLayer = new Layer(10);
		const hiddenLayer = new Layer(5);
		const outputLayer = new Layer(1);

		inputLayer.project(hiddenLayer);
		hiddenLayer.project(outputLayer);

		const myNetwork = new Network({
		    input: inputLayer,
		    hidden: [hiddenLayer],
		    output: outputLayer
		});

		const trainer = new Trainer(myNetwork);
		trainer.train(trainingset, {
		    rate: .1,
		    iterations: 10000,
		    error: .002,
		    shuffle: true,
		    log: 1,
		    cost: Trainer.cost.CROSS_ENTROPY
		});

		let testset = new Array();
		for(let i = trainsplit;i<shuffledNormalizedWines.length;i++){
			let object = {}
			let currentcar = shuffledNormalizedWines[i]
		object.input = [currentcar['fixed acidity'],currentcar['citric acid'],currentcar['residual sugar'],currentcar['chlorides'],currentcar['free sulfur dioxide'],currentcar['total sulfur dioxide'],currentcar['density'],currentcar['pH'],currentcar['sulphates'],currentcar['alcohol']];
			object.output = [currentcar.quality];
			testset.push(object);
		}
		let equalcounter = 0
		for(test of testset){
			let actvalue =myNetwork.activate(test.input)
			let r_actvalue =actvalue.map((value)=>{
				return Math.round(value);
			}) 
			if(compareArray(r_actvalue,test.output)){
				equalcounter++;
			}
			// console.log([r_actvalue, test.output, compareArray(r_actvalue,test.output)]);
			// console.log(test.output);
		}
		// console.log('The error correctness measure for '+Math.round(k.trainsplit*100)+'% traning data is '+(equalcounter/testset.length)*100 +'% ');
		process.send({'wl':k,'value':(equalcounter/testset.length)*100,'workerid':cluster.worker.id});
	

})


//compare array
function compareArray(a,b){
	
	for(var i = 0;i<a.length;i++){
		if(a[i]!=b[i]){
			return false;
		}
	}
	return true;
}


