import 'plugins/k5p-c3/c3_vis.less';
import 'plugins/k5p-c3/c3_vis_controller';
import 'ui/agg_table';
import 'ui/agg_table/agg_table_group';
// register the provider with the visTypes registry
import { CATEGORY } from 'ui/vis/vis_category';
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { VisSchemasProvider } from 'ui/vis/editors/default/schemas';

import c3VisTemplate from 'plugins/k5p-c3//c3_vis.html';
import c3VisParamsTemplate from 'plugins/k5p-c3//c3_vis_params.html'
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';

VisTypesRegistryProvider.register(C3VisProvider);
// Require the JavaScript CSS file
require('../node_modules/c3/c3.css');

function C3VisProvider(Private) {
    const VisFactory = Private(VisFactoryProvider);
    const Schemas = Private(VisSchemasProvider);
	
    return VisFactory.createAngularVisualization({
  		name: 'c3Charts',
  		title: 'C3 charts widget',
  		icon: 'fa-spinner',
  		description: 'This is Kibana 5 plugin which uses the JavaScript library C3.js for data representations.',  		
        category: CATEGORY.OTHER,  
        visConfig: {
  			defaults: {
                type1: 'line',
                color1: '#1f77b4',
                type2: 'line',
                color2: '#ff7f0e',
                type3: 'line',
                color3: '#2ca02c', 
                type4: 'line',
                color4: '#d62728',
                type5: 'line',
                color5: '#9467bd',
                enableZoom: false,
                dataLabels: false,
                hidePoints: false,
                gridlines: false,
                few_x_axis: false,
                legend_position: "right",
                time_format: "%d-%m-%Y",
                grouped: false

  			},
            template: c3VisTemplate
        },
        editorConfig:{
            optionsTemplate: c3VisParamsTemplate,
            schemas: new Schemas([
                {
                    group: 'metrics',
                    name: 'metric',
                    title: 'Y-Axis Metric',
                    min: 1,
                    max: 5,
                    defaults: [ { type: 'count', schema: 'metric' } ],   	
                },
                {
                    group: 'buckets',
                    name: 'buckets',
                    title: 'X-Axis',
                    min: 1,
                    max: 2,
                    aggFilter: ['filters', 'terms']
                }
            ])
        },
        implementsRenderComplete: true,
        hierarchicalData: function (vis) {
            return Boolean(vis.params.showPartialRows || vis.params.showMeticsAtAllLevels);
        }
    });
}

// export the provider so that the visType can be required with Private()
export default C3VisProvider;
