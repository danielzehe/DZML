const csv = require('fast-csv')
const fs = require('fs')

let cars = new Array();

csv.fromPath('car.data.txt',{headers:true,objectMode:true}).on('data',(data)=>{
	cars.push(data);
}).on('end',()=>{
	console.log('done');
	console.log(cars);
	fs.writeFileSync('cars.json',JSON.stringify(cars),{encoding:'utf8'})
})


