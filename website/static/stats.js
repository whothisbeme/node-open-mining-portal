var poolWorkerData;
var poolHashrateData;
var poolBlockData;

var poolWorkerChart;
var poolHashrateChart;
var poolBlockChart;

var statData;
var poolKeys = [];

var timeHolder;

function buildChartData(){

    var pools = {};

	console.log("StatsDataEntrylength: " + statData.length);
	
    poolKeys = [];
    for (var i = 0; i < statData.length; i++){
        for (var pool in statData[i].pools){
            if (poolKeys.indexOf(pool) === -1)
                poolKeys.push(pool);
        }
    }
	
	//console.log("Pool Keys: " + poolKeys);
	//console.log("Stat data Length: " + statData.length);
	
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
                blocks: []
            });
			
            if (pName in statData[i].pools){
                a.hashrate.push([time, statData[i].pools[pName].hashrate]);
                a.workers.push([time, statData[i].pools[pName].workerCount]);
                a.blocks.push([time, statData[i].pools[pName].blocks.pending]);
            }
            else{
                a.hashrate.push([time, 0]);
                a.workers.push([time, 0]);
                a.blocks.push([time, 0]);
            }

        }

    }
	
    poolWorkerData = [];
    poolHashrateData = [];
    poolBlockData = [];

    for (var pool in pools){
        poolWorkerData.push({
            key: pool,
            values: pools[pool].workers
        });
        poolHashrateData.push({
            key: pool,
            values: pools[pool].hashrate
        });
        poolBlockData.push({
            key: pool,
            values: pools[pool].blocks
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
				hour: '%I:%M %p',
				day: '%I:%M %p',
				week: '%I:%M %p'
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
				stacking: 'normal',
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
			animation: false,
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
				hour: '%I:%M %p'
			},
			title: {
				text: null
			}
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
			areaspline: {
				fillColor: '#ace',
				marker: {
					enabled: false
				},
				lineWidth: 2,
				shadow: false,
				states: {
					hover: {
						lineWidth: 2
					}
				},
				threshold: null,
				animation: false
			},
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
				animation: false
			},
		}, 
		series: []
	});
	poolBlockChart = new Highcharts.Chart({
		chart: {
			renderTo: 'poolBlockChart',
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
			animation: false,
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
				hour: '%I:%M %p'
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
            data: poolWorkerData[i].values
		});
		poolHashrateChart.addSeries({
            type: 'spline',
            name: poolHashrateData[i].key,
            data: poolHashrateData[i].values,
            lineWidth: 2
		});
		var columnWidth = ((poolHashrateChart.chartWidth / statData.length) + 1);
		console.log(columnWidth);
		poolBlockChart.addSeries({
            type: 'column',
            name: poolBlockData[i].key,
            data: poolBlockData[i].values,
			pointWidth: columnWidth
		});
		for (var pool in statData.pools) {
			var tempTotalMined = Number(stats.pools[pool].poolStats.totalPaid);
			console.log("Worked Temp totalMined: " + tempTotalMined);
			$('#statsTotalPaid' + pool).text(tempTotalMined.toFixed());
			console.log("Worked Temp totalMined: " + tempTotalMined.toFixed());
		}
	}
	//console.log("Charts displayed.");
}

$(function() {
	timeHolder = new Date().getTime();
	createCharts();
    $.getJSON('/api/pool_stats', function (data) {
		statData = data;
		buildChartData();
		displayCharts();
		console.log("time to load page: " + (new Date().getTime() - timeHolder));
	});
});

statsSource.addEventListener('message', function(e){
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
		buildChartData();
		displayCharts();
	}
	else {
		timeHolder = new Date().getTime();
		var time = stats.time * 1000;
		
		for (var f = 0; f < poolKeys.length; f++) {
			var pool =  poolKeys[f];
			console.log("Recieved Message, Updating Pool: " + pool);
			
			console.log("poolWorkerData length: " + poolWorkerData.length);
			for (var i = 0; i < poolWorkerData.length; i++) {
				if (poolWorkerData[i].key === pool) {
					poolWorkerData[i].values.shift();
					poolWorkerData[i].values.push([time, pool in stats.pools ? stats.pools[pool].workerCount : 0]);
					if(poolWorkerChart.series[f].name == pool) {
						console.log("point added to workerChart: " + ([time, pool in stats.pools ? stats.pools[pool].workerCount : 0]));
						poolWorkerChart.series[f].addPoint([time, pool in stats.pools ? stats.pools[pool].workerCount : 0]);
						console.log("Updated poolWorkerChart: " + poolWorkerChart.series[f].name + "'s Data!");
					}
					break;
				}
			}
			console.log("poolHashrateData length: " + poolHashrateData.length);
			for (var i = 0; i < poolHashrateData.length; i++) {
				if (poolHashrateData[i].key === pool) {
					poolHashrateData[i].values.shift();
					poolHashrateData[i].values.push([time, pool in stats.pools ? stats.pools[pool].hashrate : 0]);
					if(poolHashrateChart.series[f].name == pool) {
						poolHashrateChart.series[f].addPoint([time, pool in stats.pools ? stats.pools[pool].hashrate : 0]);
						console.log("Updated poolHashRateChart: " + poolHashrateChart.series[f].name + "'s Data!");
					}
					break;
				}
			}
			console.log("poolBlockData length: " + poolBlockData.length);
			for (var i = 0; i < poolBlockData.length; i++) {
				if (poolBlockData[i].key === pool) {
					poolBlockData[i].values.shift();
					poolBlockData[i].values.push([time, pool in stats.pools ? stats.pools[pool].blocks.pending : 0]);
					if(poolBlockChart.series[f].name == pool) {
						poolBlockChart.series[f].addPoint([time, pool in stats.pools ? stats.pools[pool].blocks.pending : 0]);
						console.log("Updated poolBlockChart: " + poolBlockChart.series[f].name + "'s Data!");
					}
					break;
				}
			}
		}
		console.log("time to update graph: " + (new Date().getTime() - timeHolder));
	}
	for (var pool in stats.pools) {
		$('#statsValidShares' + pool).text(stats.pools[pool].poolStats.validShares);
		$('#statsInvalidShares' + pool).text(stats.pools[pool].poolStats.invalidShares);
		$('#statsValidBlocks' + pool).text(stats.pools[pool].poolStats.validBlocks);
		$('#statsTotalPaid' + pool).text(Number(stats.pools[pool].poolStats.totalPaid).toFixed());
		
		$('#statsBlocksPending' + pool).text(stats.pools[pool].blocks.pending);
		$('#statsBlocksConfirmed' + pool).text(stats.pools[pool].blocks.confirmed);
		$('#statsBlocksOrphaned' + pool).text(stats.pools[pool].blocks.orphaned);
	}
	console.log("time to update static-stats: " + (new Date().getTime() - timeHolder));
});