const synaptic = require('synaptic')
const cluster = require('cluster')
const fs = require('fs')
const shuffle = require('knuth-shuffle').knuthShuffle

const cars = JSON.parse(fs.readFileSync('cars.json'))
	// console.log(cars)

	//Normalization
	//find the unique values for each column

	const columns = Object.keys(cars[0])
	const colObject = {};

	for(column of columns){
		// console.log(column)
		colObject[column] = new Set();
	}

	for(car of cars){
		for(column of columns){
			colObject[column].add(car[column]);
		}
	}
	// console.log('Each column has these values:');
	// console.log(colObject);
	for(column in colObject){
		colObject[column] = makeOneZeroVector(colObject[column]);
	}
	// console.log('Normalizer lookup:')
	// console.log(colObject);


	const normalizedCars = cars.map((value) =>{
		let returnobject = {}
		for(column of columns){
			returnobject[column] = colObject[column][value[column]];

		}
		return returnobject;
	});
process.on('message',function(workload){
	const shuffledNormalizedCars =	shuffle(normalizedCars.slice(0));

	// console.log(normalizedCars);

	let k = workload;
	// console.log(k);

	// for(var k=0;k<=1.0;k+=0.01){
	// for(k of workload){
	//starting the taining by creating a training set

		let trainsplit = Math.round(normalizedCars.length*k.trainsplit);
		let trainingset = new Array();
		for(let i = 0;i<trainsplit;i++){
			let object = {}
			let currentcar = normalizedCars[i]
			object.input = currentcar.buying.concat(currentcar.maint,currentcar.doors,currentcar.persons,currentcar.lug_boot,currentcar.safety);
			object.output = currentcar.class;
			trainingset.push(object);
		}
		// console.log(trainingset);



		const Layer = synaptic.Layer;
		const Network = synaptic.Network;
		const Trainer = synaptic.Trainer;

		const inputLayer = new Layer(21);
		const hiddenLayer = new Layer(12);
		const outputLayer = new Layer(4);

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
		    error: .00002,
		    shuffle: true,
		    log: 0,
		    cost: Trainer.cost.CROSS_ENTROPY
		});

		let testset = new Array();
		for(let i = trainsplit;i<normalizedCars.length;i++){
			let object = {}
			let currentcar = normalizedCars[i]
			object.input = currentcar.buying.concat(currentcar.maint,currentcar.doors,currentcar.persons,currentcar.lug_boot,currentcar.safety);
			object.output = currentcar.class;
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

//making a index vector from the different values

function makeOneZeroVector(inputSet){
	let returnvector = new Array();
	let returnObject = {};
	let c = 0;
	for(value of inputSet){
		returnObject[value] = new Array();
		for (var i = 0;i < inputSet.size; i++) {
			returnObject[value][i] = c==i ? 1 : 0;
		}
		c++;
	}
	return returnObject;
}




