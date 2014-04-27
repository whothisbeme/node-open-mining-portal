var poolWorkerData;
var poolHashrateData;
var poolBlockConfirmedData;

var poolWorkerChart;
var poolHashrateChart;
var poolBlockPendingChart;
var poolBlockPerHourChart;

var statData = [];
var poolKeys = [];

var timeHolder;

function buildChartData(interval){
	
	//First cut down chartData to selected timeInterval
	var retentionTime = (((Date.now() / 1000) - interval) | 0);
	for (var i = 0; i < statData.length; i++){
		if (retentionTime < statData[i].time){
			if (i > 0) {
				console.log("Slicing at time: " + statData[i].time);
				statData = statData.slice(i);
			}
			break;
		}
	}
	
    var pools = {};
	
    poolKeys = [];
    for (var i = 0; i < statData.length; i++){
        for (var pool in statData[i].pools){
            if (poolKeys.indexOf(pool) === -1)
                poolKeys.push(pool);
        }
    }
	
	//console.log("Pool Keys: " + poolKeys);
	//console.log("Stat data Length: " + statData.length);
	console.log("Points to render: " + (statData.length * poolKeys.length));
	
    for (var i = 0; i < statData.length; i++){

        var time = statData[i].time * 1000;
		
		//console.log("Time: " + time);
		
        for (var f = 0; f < poolKeys.length; f++){
		
			//console.log("Pool #: " + f); //f is # of pools
			
            var pName = poolKeys[f];
			
			//console.log("Starting loop for pool: " + pName);
			
            var a = pools[pName] = (pools[pName] || {
                hashrate: [],
                workers: [],
                blocksPending: [],
				blocksConfirmed: []
            });
			
            if (pName in statData[i].pools){
                a.hashrate.push([time, statData[i].pools[pName].hashrate]);
                a.workers.push([time, statData[i].pools[pName].workerCount]);
                a.blocksPending.push([time, statData[i].pools[pName].blocks.pending]);
				a.blocksConfirmed.push([time, statData[i].pools[pName].blocks.confirmed]);
            }
            else{
                a.hashrate.push([time, 0]);
                a.workers.push([time, 0]);
                a.blocksPending.push([time, 0]);
				a.blocksConfirmed.push([time, 0]);
            }

        }

    }
	
    poolWorkerData = [];
    poolHashrateData = [];
    poolBlockPendingData = [];
	poolBlockConfirmedData = [];

    for (var pool in pools){
        poolWorkerData.push({
            key: pool,
            values: pools[pool].workers
        });
        poolHashrateData.push({
            key: pool,
            values: pools[pool].hashrate
        });
        poolBlockPendingData.push({
            key: pool,
            values: pools[pool].blocksPending
        });
		poolBlockConfirmedData.push({
            key: pool,
            values: pools[pool].blocksConfirmed
        });
    }
}

function getReadableHashRateString(hashrate, version){
	if(version == 'default') {
		var i = -1;
		var byteUnits = [ ' KH', ' MH', ' GH', ' TH', ' PH' ];
		do {
			hashrate = hashrate / 1024;
			i++;
		} while (hashrate > 1024);
		return Math.round(hashrate) + byteUnits[i];
	} else if(version == 'beta') {
		if (hashrate > Math.pow(1000, 4)) {
			return (hashrate / Math.pow(1000, 4)) + ' TH/s';
		}
		if (hashrate > Math.pow(1000, 3)) {
			return (hashrate / Math.pow(1000, 3)) + ' GH/s';
		}
		if (hashrate > Math.pow(1000, 2)) {
			return (hashrate / Math.pow(1000, 2)) + ' MH/s';
		}
		if (hashrate > Math.pow(1000, 1)) {
			return (hashrate / Math.pow(1000, 1)) + ' KH/s';
		}
		return hashrate + ' H/s';
	} else if(version == 'tooltip') {
		if (hashrate > Math.pow(1000, 4)) {
			return (hashrate / Math.pow(1000, 4)).toFixed(2) + ' TH/s';
		} else if (hashrate > Math.pow(1000, 3)) {
			return (hashrate / Math.pow(1000, 3)).toFixed(2) + ' GH/s';
		} else if (hashrate > Math.pow(1000, 2)) {
			return (hashrate / Math.pow(1000, 2)).toFixed(2) + ' MH/s';
		} else if (hashrate > Math.pow(1000, 1)) {
			return (hashrate / Math.pow(1000, 1)).toFixed(2) + ' KH/s';
		} else {
			return hashrate + ' H/s';
		}
	}
}

function timeOfDayFormat(timestamp){
    var tempTime = moment(timestamp).format('MMM Do - h:mm A');
    if (tempTime.indexOf('0') === 0) tempTime = tempTime.slice(1);
    return tempTime;
}

function createCharts() {
	//Temp spot
	Highcharts.setOptions({                                           
		global : {
			useUTC : false
		}
    });
	poolWorkerChart = new Highcharts.Chart({
		chart: {
			renderTo: 'poolWorkerChart',
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
			animation: false,
            shadow: false,
			borderWidth: 0,
		},
		credits: {
			enabled: false
		},
		exporting: {
			enabled: false
		},
		title: {
			text: 'Workers Per Pool'
		},
		xAxis: {
			type: 'datetime',
			dateTimeLabelFormats: {
				second: '%I:%M:%S %p',
				minute: '%I:%M %p',
				hour: '%I:%M %p',
				day: '%I:%M %p',
			},
			title: {
				text: null
			}
		},
		yAxis: {
			labels: {
				
			},
			title: {
				text: null
			},
			min: 0,
		},
		tooltip: {
			useHTML: false,
			shared: true,
			crosshairs: true,
			formatter: function () {
				var s = '<b>' + timeOfDayFormat(this.x) + '</b>';

				$.each(this.points, function (i, point) {
					s += '<br/> <span style="fill:' + point.series.color + '" x="8" dy="16">●</span> ' + point.series.name + ': ' + point.y;
				});
				return s;
			},
		},
		legend: {
			enabled: true,
			borderWidth: 0
		},
		plotOptions: {
			area: {
				lineWidth: 1,
				marker: {
					enabled: false
				}
			}
		}, 
		series: []
	});
	
	poolHashrateChart = new Highcharts.Chart({
		chart: {
			renderTo: 'poolHashRateChart',
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
			animation: true,
            shadow: false,
			borderWidth: 0,
			zoomType: 'x',
		},
		credits: {
			enabled: false
		},
		exporting: {
			enabled: false
		},
		title: {
			text: 'Hashrate Per Pool'
		},
		xAxis: {
			type: 'datetime',
			dateTimeLabelFormats: {
				second: '%I:%M:%S %p',
				minute: '%I:%M %p',
				hour: '%I:%M %p',
				day: '%I:%M %p',
			},
			title: {
				text: null
			},
			minRange: 36000,
		},
		yAxis: {
			labels: {
				formatter: function () {
					return getReadableHashRateString(this.value, 'beta');
				},
			},
			title: {
				text: null
			},
			min: 0,
		},
		tooltip: {
			shared: true,
			valueSuffix: ' H/s',
			crosshairs: true,
			formatter: function () {
				var s = '<b>' + timeOfDayFormat(this.x) + '</b>';

				var hashrate = 0;
				$.each(this.points, function (i, point) {
					val = getReadableHashRateString(point.y, 'tooltip');
					s += '<br/> <span style="fill:' + point.series.color + '" x="8" dy="16">●</span> ' + point.series.name + ': ' + val;
				});
				return s;
			},
		},
		legend: {
			enabled: true,
			borderWidth: 0
		},
		plotOptions: {
			spline: {
				marker: {
					enabled: false
				},
				lineWidth: 1.75,
				shadow: false,
				states: {
					hover: {
						lineWidth: 1.75
					}
				},
				threshold: null,
				animation: true
			},
		}, 
		series: []
	});
	poolBlockPendingChart = new Highcharts.Chart({
		chart: {
			renderTo: 'poolBlockChart',
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
			animation: true,
            shadow: false,
			borderWidth: 0,
			zoomType: 'x',
		},
		credits: {
			enabled: false
		},
		exporting: {
			enabled: false
		},
		title: {
			text: 'Blocks Pending Per Pool'
		},
		xAxis: {
			type: 'datetime',
			dateTimeLabelFormats: {
				second: '%I:%M:%S %p',
				minute: '%I:%M %p',
				hour: '%I:%M %p',
				day: '%I:%M %p',
			},
			title: {
				text: null
			}
		},
		yAxis: {
			labels: {
				
			},
			title: {
				text: null
			},
			min: 0,
		},
		tooltip: {
			shared: true,
			crosshairs: false,
			formatter: function () {
				var s = '<b>' + timeOfDayFormat(this.x) + '</b>';

				$.each(this.points, function (i, point) {
					s += '<br/> <span style="fill:' + point.series.color + '" x="8" dy="16">●</span> ' + point.series.name + ': ' + point.y;
				});
				return s;
			},
		},
		legend: {
			enabled: true,
			borderWidth: 0
		},
		plotOptions: {
			 column: {
					pointWidth: 15,
					pointRange: 0,
					pointPadding: 0,
					borderWidth: 0
			}
		}, 
		series: []
	});
	
	poolBlockPerHourChart = new Highcharts.Chart({
		chart: {
			renderTo: 'tempBlockChart',
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
			animation: true,
            shadow: false,
			borderWidth: 0,
			zoomType: 'x',
		},
		credits: {
			enabled: false
		},
		exporting: {
			enabled: false
		},
		title: {
			text: 'Blocks Confirmed Per Hour Per Pool'
		},
		xAxis: {
			type: 'datetime',
			dateTimeLabelFormats: {
				second: '%I:%M:%S %p',
				minute: '%I:%M %p',
				hour: '%I:%M %p',
				day: '%I:%M %p',
			},
			title: {
				text: null
			}
		},
		yAxis: {
			labels: {
				
			},
			title: {
				text: null
			},
			min: 0,
		},
		tooltip: {
			shared: true,
			crosshairs: false,
			formatter: function () {
				var s = '<b>' + timeOfDayFormat(this.x) + '</b>';

				$.each(this.points, function (i, point) {
					s += '<br/> <span style="fill:' + point.series.color + '" x="8" dy="16">●</span> ' + point.series.name + ': ' + point.y;
				});
				return s;
			},
		},
		legend: {
			enabled: true,
			borderWidth: 0
		},
		plotOptions: {
			 column: {
					pointWidth: 15,
					pointRange: 0,
					pointPadding: 0,
					borderWidth: 0
			}
		}, 
		series: []
	});

}

function displayCharts(){
	for(var i = 0; i < poolKeys.length; i++) {
		poolWorkerChart.addSeries({
            type: 'area',
            name: poolWorkerData[i].key,
            data: poolWorkerData[i].values,
			lineWidth: 2
		});
		poolHashrateChart.addSeries({
            type: 'spline',
            name: poolHashrateData[i].key,
            data: poolHashrateData[i].values,
            lineWidth: 2
		});
		poolBlockPendingChart.addSeries({
            type: 'column',
            name: poolBlockPendingData[i].key,
            data: poolBlockPendingData[i].values,
			pointWidth: ((poolBlockPendingChart.chartWidth / statData.length) - ((poolBlockPendingChart.chartWidth / statData.length) / 4)) //Adjust width of bars need to do this more than once
		});
		poolBlockPerHourChart.addSeries({
            type: 'column',
            name: poolBlockConfirmedData[i].key,
            data: poolBlockConfirmedData[i].values,
			pointWidth: ((poolBlockPerHourChart.chartWidth / statData.length) - ((poolBlockPerHourChart.chartWidth / statData.length) / 4)) //Adjust width of bars need to do this more than once
		});
	}
}

$(function() {
	timeHolder = new Date().getTime();
	createCharts(); //Possible Temporary Placement
});

 $.getJSON('/api/pool_stats', function (data) {
	statData = data;
	console.log("Charts created..");
	buildChartData(3600); //Set interval
	console.log("Chart data built..");
	displayCharts();
	console.log("Charts displayed..");
	console.log("time to load page: " + (new Date().getTime() - timeHolder));
});

statsSource.addEventListener('message', function(e){ //Stays active when hot-swapping pages
	var stats = JSON.parse(e.data);
	
	statData.push(stats);
	console.log("parsed some stuff");

	var newPoolAdded = (function(){
		for (var p in stats.pools){
			if (poolKeys.indexOf(p) === -1)
				return true;
		}
		return false;
	})();

	if (newPoolAdded || Object.keys(stats.pools).length > poolKeys.length){
		console.log("displayingCharts again?!?!?!");
		console.log("Object.keys(stats.pools).length: " + Object.keys(stats.pools).length);
		console.log("poolKeys.length: " + poolKeys.length);
		buildChartData();
	}
	else {
		timeHolder = new Date().getTime(); //Temporary
		var time = stats.time * 1000;
		
		for (var f = 0; f < poolKeys.length; f++) {
			var pool =  poolKeys[f];
			console.log("Recieved Message, Updating Pool: " + pool);
			
			//console.log("poolWorkerData length: " + poolWorkerData.length);
			for (var i = 0; i < poolWorkerData.length; i++) {
				if (poolWorkerData[i].key === pool) {
					poolWorkerData[i].values.shift();
					poolWorkerData[i].values.push([time, pool in stats.pools ? stats.pools[pool].workerCount : 0]);
					if(poolWorkerChart.series[f].name == pool) {
						console.log("length of series: " + poolWorkerChart.series.length);
						//console.log("point added to workerChart: " + ([time, pool in stats.pools ? stats.pools[pool].workerCount : 0]));
						poolWorkerChart.series[f].addPoint([time, pool in stats.pools ? stats.pools[pool].workerCount : 0]);
						//console.log("Updated poolWorkerChart: " + poolWorkerChart.series[f].name + "'s Data!");
					}
					break;
				}
			}
			//console.log("poolHashrateData length: " + poolHashrateData.length);
			for (var i = 0; i < poolHashrateData.length; i++) {
				if (poolHashrateData[i].key === pool) {
					poolHashrateData[i].values.shift();
					poolHashrateData[i].values.push([time, pool in stats.pools ? stats.pools[pool].hashrate : 0]);
					if(poolHashrateChart.series[f].name == pool) {
						poolHashrateChart.series[f].addPoint([time, pool in stats.pools ? stats.pools[pool].hashrate : 0], true, true, true);
						//console.log("Updated poolHashRateChart: " + poolHashrateChart.series[f].name + "'s Data!");
					}
					break;
				}
			}
			//console.log("poolBlockConfirmedData length: " + poolBlockConfirmedData.length);
			for (var i = 0; i < poolBlockConfirmedData.length; i++) {
				if (poolBlockConfirmedData[i].key === pool) {
					poolBlockConfirmedData[i].values.shift();
					poolBlockConfirmedData[i].values.push([time, pool in stats.pools ? stats.pools[pool].blocks.pending : 0]);
					if(poolBlockPendingChart.series[f].name == pool) {
						poolBlockPendingChart.series[f].addPoint([time, pool in stats.pools ? stats.pools[pool].blocks.pending : 0]);
						//console.log("Updated poolBlockPendingChart: " + poolBlockPendingChart.series[f].name + "'s Data!");
					}
					break;
				}
			}
		}
		console.log("time to update graph: " + (new Date().getTime() - timeHolder));
	}
	for (var pool in stats.pools) {	
		//Left statBox
		$('#statsValidShares' + pool).text(stats.pools[pool].poolStats.validShares);
		$('#statsInvalidShares' + pool).text(stats.pools[pool].poolStats.invalidShares);
		$('#statsValidBlocks' + pool).text(stats.pools[pool].poolStats.validBlocks);
		//Right statBox
		$('#statsBlocksPending' + pool).text(stats.pools[pool].blocks.pending);
		$('#statsBlocksConfirmed' + pool).text(stats.pools[pool].blocks.confirmed);
		$('#statsBlocksOrphaned' + pool).text(stats.pools[pool].blocks.orphaned);
	}
	console.log("time to update static-stats: " + (new Date().getTime() - timeHolder));
});