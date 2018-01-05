import uiModules from 'ui/modules';
import AggResponseTabifyTabifyProvider from 'ui/agg_response/tabify/tabify';
import errors from 'ui/errors'; 

// get the kibana/table_vis module, and make sure that it requires the "kibana" module if it didn't already
const module = uiModules.get('kibana/c3_vis', ['kibana']);

// Require C3.js
const c3 = require('c3');

module.controller('KbnC3VisController', function($scope, $element, Private){

	var hold ="";
	var wold= "";
	$scope.$root.label_keys = [];
	$scope.$root.editorParams = {};
	$scope.$root.activate_grouped = false;
	const tabifyAggResponse = Private(AggResponseTabifyTabifyProvider);
	var x_axis_values = [];
	var timeseries = [];
	var parsed_data = [];
	var chart_labels = {};
	var x_label = "";
	var time_format = "";
	var bucket_type2 = "";

	// Identify the div element in the HTML
	var idchart = $element.children().find(".chartc3");
	const message = 'This chart require more than one data point. Try adding an X-Axis Aggregation. If you to use filters put labels in each filter.';


	// Be alert to changes in vis_params
	$scope.$watch('vis.params', function (params) {

		if (!$scope.$root.show_chart) return;
		//if (Object.keys(params.editorPanel).length == 0 && params.enableZoom == previo_zoom) return;
		$scope.chartGen();
	});


	// C3JS chart generator
	$scope.chart = null;
	$scope.chartGen = function(){

		// change bool value
		$scope.$root.show_chart = true;

		// adding title
		$scope.chart_title = $scope.vis.params.chart_title;

		//create data_colors object
		var the_labels = Object.keys(chart_labels);		
		var data_colors = {};
		var data_types = {};
		var i = 0;
		var create_color_object = the_labels.map(function(chart){
			
			if (i == 0){
				data_colors[chart] = $scope.vis.params.color1;
				data_types[chart] = $scope.vis.params.type1;
			
			} else if (i == 1){			
				data_colors[chart] = $scope.vis.params.color2;
				data_types[chart] = $scope.vis.params.type2;
			
			} else if (i == 2){
				data_colors[chart] = $scope.vis.params.color3;
				data_types[chart] = $scope.vis.params.type3;
			
			} else if (i == 3){
				data_colors[chart] = $scope.vis.params.color4;
				data_types[chart] = $scope.vis.params.type4;
			
			} else if (i == 4){
				data_colors[chart] = $scope.vis.params.color5;
				data_types[chart] = $scope.vis.params.type5;
			}

			i++;

		});

		// count bar charts and change bar ratio
		var the_types = Object.values(data_types);
		var chart_count = {};
		the_types.forEach(function(i){ chart_count[i] = (chart_count[i] || 0)+1; });

		if (chart_count.bar){

			var my_ratio = 5 / timeseries.length;
			my_ratio = (my_ratio > 0.35) ? my_ratio = 0.3 : my_ratio;

			if (chart_count.bar > 1){
			
				my_ratio = (my_ratio < 0.02) ? my_ratio = 0.02 : my_ratio;
				$scope.$root.activate_grouped = true;
			
			} else {
				
				my_ratio = (my_ratio < 0.01) ? my_ratio = 0.01 : my_ratio;
				$scope.$root.activate_grouped = false;
			}

		}

		var bucket_type = $scope.vis.aggs.bySchemaName['buckets'][0].type.name;
		if($scope.vis.aggs.bySchemaName['buckets'][1] != undefined)
			var bucket_type2 = $scope.vis.aggs.bySchemaName['buckets'][1].type.name;

		// define the data to representate
		if(bucket_type2 == undefined){			
			if (parsed_data.length == 1) {
				var total_data = {'x': 'x1', 'columns': [timeseries, parsed_data[0]]};
			} else if (parsed_data.length == 2) {
				var total_data = {'x': 'x1', 'columns': [timeseries, parsed_data[0], parsed_data[1]]};
			} else if (parsed_data.length == 3) {
				var total_data = {'x': 'x1', 'columns': [timeseries, parsed_data[0], parsed_data[1], parsed_data[2]]};
			} else if (parsed_data.length == 4) {
				var total_data = {'x': 'x1', 'columns': [timeseries, parsed_data[0], parsed_data[1], parsed_data[2], parsed_data[3]]};
			} else {
				var total_data = {'x': 'x1', 'columns': [timeseries, parsed_data[0], parsed_data[1], parsed_data[2], parsed_data[3], parsed_data[4]]};
			}
		} else {
			// prepare the columns in the correct format (n filters)
			var total_data = {
					'x': 'x1', 
					'columns':[
						timeseries, 								
					]}

			var total_data_str = JSON.stringify(total_data);
			var parsed_data_str = JSON.stringify(parsed_data);			
			total_data_str = total_data_str.slice(0, -2);			
			
			if(parsed_data_str.charAt(0) === '['){
				parsed_data_str = parsed_data_str.slice(1);
				parsed_data_str = parsed_data_str.slice(0, -1);
			}
			
			total_data_str = total_data_str + ', ' + parsed_data_str + ']}';			
			total_data = JSON.parse(total_data_str);			
		}
		

		// largest number possible in JavaScript.
		var global_min = Number.MAX_VALUE;

		// Search the min value of the data
		var parsed_data_copy = JSON.parse(JSON.stringify(parsed_data));

		var cada_array = parsed_data_copy.map(function(each_array){

			each_array.splice(0, 1);    
			// ECMAScript 6 spread operator
			var each_array_min = Math.min(...each_array);
			global_min = (each_array_min < global_min) ? each_array_min : global_min;

		});

		global_min = (global_min >= 0) ? 0 : global_min;

		// configurate C3 object
		var config = {};
		config.bindto = idchart[0];
		config.data = total_data;
		config.data.types = data_types;
		
		if(bucket_type2 != undefined){
			let filters_name = data_types.filters;			
			var newType_tmp = changeChartType(parsed_data, filters_name);
			var newType	= newType_tmp.slice(0, -1);

			newType = "{" + newType.slice(0, -1) + "}";
						
			try {
				$scope.chart_error = ""; 
				var format_obj = JSON.parse(newType);
			} catch(e){
				$scope.chart_error = "Error! Try to put a label in each filter."
			}	
			
			//delete data duplicated
			for(var key in format_obj){
				for(var key2 in data_types){					
					if(key === key2){						
						delete format_obj[key]
					}
				}				
			}
			var newDataTypes = Object.assign({}, data_types, format_obj);
			config.data.types = newDataTypes;						
		}
	
		config.data.colors = data_colors;
		if($scope.vis.params.has_threshold){
			var labels_aux = { format: null};
			var format = {};
			var labels_to_hide = $scope.vis.params.threshold_label.split(",");

			console.log(the_labels);
			
			for(var i = 0; i < the_labels.length; i++){
				if(the_labels[i] !== "filters"){					
					if(labels_to_hide.indexOf(the_labels[i]) > -1){
						format[the_labels[i]] =  function(v, id, i, j) { return '';}
					} else{
						format[the_labels[i]] =  function(v, id, i, j) { return v;}	
					}
				}						
			}
	
			labels_aux.format = format;				
			config.data.labels = labels_aux;
			
		} else{
			config.data.labels = $scope.vis.params.dataLabels;
		}
		
		config.legend = {"position": $scope.vis.params.legend_position};

		// timeseries config
		if (bucket_type == "date_histogram" || bucket_type == "date_range"){

			config.bar = {"width": {"ratio": my_ratio}};

			var last_timestapm = timeseries[timeseries.length-1];
			var first_timestamp = timeseries[1];
			var timestamp_diff = last_timestapm - first_timestamp;

			// Time format 
			if (timestamp_diff > 86400000){
				time_format = "%Y-%m-%d";
			} else {
				time_format = "%H:%M";
			}
			
			var bool_fit = false;
			bool_fit = (timeseries.length < 4) ? bool_fit = true : bool_fit = false;

			config.axis = {"x": {"label": {"text": x_label, "position": 'outer-center'}, "type":"timeseries", "tick": {"fit": bool_fit, "multiline": false,"format": time_format}}, "y": {"min": global_min, "padding": {"top": 30, "bottom": 0 }}};
			config.tooltip = {"format": {"title": function (x) {return x;} }};

			if ($scope.vis.params.legend_position == "bottom"){
				config.padding = {"right": 20};
			}

		// category data config
		} else {
			
			config.axis = {"x": {"label": {"text": x_label, "position": 'outer-center'}, "type":"category", "tick": {"multiline": false}}, "y": {"min": global_min, "padding": {"top": 30, "bottom": 1 }}};
			
			if (timeseries.length-1 > 13 && $scope.vis.params.few_x_axis){
				config.axis = {"x": {"label": {"text": x_label, "position": 'outer-center'}, "type":"category", "tick": {"fit": false, "multiline": false, "culling": {"max": 10}}}, "y": {"min": global_min, "padding": {"top": 30, "bottom": 1 }}};
			}
		
		}	
		console.log(config);	
		// Group bar charts, we need 2+ bar charts and checked checkbox in params
		if ($scope.$root.activate_grouped && $scope.vis.params.grouped){

			var los_keys = Object.keys(data_types);
			var los_values = Object.values(data_types);
			var group_charts = [];
			var i = 0;
			var are_they = los_values.map(function(chart_type){
			
				if (chart_type == "bar"){
					group_charts.push(los_keys[i]);
				}

				i++;

			});

			config.data.groups = [group_charts];
		}

		if ($scope.vis.params.gridlines){
			config.grid = {"x": {"show": true}, "y": {"show": true}};
		}

		// zoom and hide points features
		config.point = {"show": !$scope.vis.params.hidePoints};
		config.zoom = {"enabled" : $scope.vis.params.enableZoom};

		// Generate and draw
		$scope.chart = c3.generate(config);

		// resize
		var elem = $(idchart[0]).closest('div.visualize-chart');
		var h = elem.height();
		var w = elem.width();
		$scope.chart.resize({height: h - 50, width: w - 50});        

	};

	// changes chart types
	function changeChartType(parsedData, type){
		var chart_types_str = '';
		var names = getNamesData(parsedData);
		
		for(var i = 0; i < names.length; i++){
			chart_types_str = chart_types_str + '"' + names[i] + '": "' + type + '", ';
		}
		return chart_types_str;
	}

	// get all data's names
	function getNamesData(data) {
		var dataNames = [];
		for(var i = 0; i < data.length; i++){
			var data_tmp = data[i];
			dataNames.push(data_tmp[0]);
		}
		return dataNames;
	}

	// Get data from ES
	$scope.processTableGroups = function (tableGroups) {
		console.log(tableGroups);
		
		tableGroups.tables.forEach(function (table) {
			table.columns.forEach(function (column, i) {
			
				var data = table.rows;
				var tmp = [];

				for (var val in data){
					var aux = data[val][i];					
					if(typeof(aux) === 'number'){
						var aux2 = parseFloat(Math.round(aux * 100) / 100).toFixed(1);
						tmp.push(aux2);	
					} else{
						tmp.push(aux);	
					}								
				}

				if (i > 0){

					$scope.$root.label_keys.push(column.title);
					chart_labels[column.title] = column.title;
					tmp.splice(0, 0, column.title);							
					parsed_data.push(tmp);															
					
				} else {
			 
					x_label = column.title;
					x_axis_values.push(tmp);					
				}
			});
		});

		console.log(parsed_data);
		
		if($scope.vis.aggs.bySchemaName['buckets'][1] != undefined)
			parsed_data = processFilter(parsed_data);		

		$scope.$root.editorParams.label = chart_labels;
	};

	// get array to generate chart with filters
	function processFilter(parsedData){
		var filtersItem = parsedData[0];
		filtersItem.shift();		
		var values = parsedData[1];
		values.shift();		
		var finalArray = [];		

		var uniqueFilters = filtersItem.filter(function(elem, index, self) {
			return index === self.indexOf(elem);
		})

		for(var i = 0; i < uniqueFilters.length; i++){
			var indices = [];
			var tmp = [];
			indices = getIndices(filtersItem, uniqueFilters[i]);
			
			for(var j = 0; j < indices.length; j++){
				tmp.push(values[indices[j]]);				
			}
			tmp.splice(0,0,uniqueFilters[i]);
			finalArray.push(tmp);
		}

		var thresholds = getThresholds(parsedData);		
		finalArray = finalArray.concat(thresholds);	

		return finalArray;
	}

	//get indices from array that has duplicated elements
	function getIndices(array, key){
		var indices = [];	
						
		array.filter(function(arr, index) {
			if(arr === key){
				indices.push(index)
			}
		});	

		return indices;
	}
	
	//get thresholds in chart with filters
	function getThresholds(parsedData) {

		var thresholds = [];
		var timeseries_tmp = x_axis_values[0].slice();
		timeseries_tmp = timeseries_tmp.filter(function(elem, index, self) {
			return index === self.indexOf(elem);
		})
		
		for(var i = 2; i < parsedData.length; i++){
			var tmp = parsedData[i];		
			var max_of_array = Math.max.apply(Math, tmp.slice(1));
			var tmp2 = [];
			for(var j = 0; j <= timeseries_tmp.length; j++){
				if(j == 0){
					tmp2.push(tmp[0]);
				} else{
					tmp2.push(max_of_array);
				}													
			}								
			thresholds.push(tmp2);
			
		}
		return thresholds;
	}
		
	$scope.$watch('esResponse', function(resp){
		if (resp) {

			if (!$scope.vis.aggs.bySchemaName['buckets']){
				$scope.waiting = message;
				return;
			}

			x_axis_values.length = 0;
			timeseries.length = 0;
			parsed_data.length = 0;
			chart_labels = {};
			$scope.$root.label_keys = [];	
			$scope.processTableGroups(tabifyAggResponse($scope.vis, resp));

			// avoid reference between arrays!!!
			timeseries = x_axis_values[0].slice();
			
			if($scope.vis.aggs.bySchemaName['buckets'][1] != undefined){
				timeseries = timeseries.filter(function(elem, index, self) {
					return index === self.indexOf(elem);
				})	
			}

			timeseries.splice(0,0,'x1');
			
			$scope.chartGen();
		}

	});

	// Automatic resizing of graphics
	$scope.$watch(
		function () {
			var elem = $(idchart[0]).closest('div.visualize-chart');
			var h = elem.height();
			var w = elem.width();

			if (!$scope.chart) return;

			if (idchart.length > 0 && h > 0 && w > 0) {

				if (hold != h || wold != w) {
					$scope.chart.resize({height: h - 50, width: w - 50});
					hold = elem.height();
					wold = elem.width();
				}

			}      
		}, 
		true
	);

});

