const csv = require('fast-csv')
const fs = require('fs')

let cars = new Array();

csv.fromPath('winequality-red.csv',{headers:true,objectMode:true,delimiter:';'}).on('data',(data)=>{
	cars.push(data);
}).on('end',()=>{
	console.log('done');
	console.log(cars);
	fs.writeFileSync('wine-red.json',JSON.stringify(cars),{encoding:'utf8'})
})




