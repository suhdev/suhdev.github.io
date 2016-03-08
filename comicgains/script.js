(function(D,W,$,Q,injector){

// window.injector = injector;


injector.register('App',['Config','SplashScreen', 'Content','Modal','GraphController',
	function(Config, SplashScreen, Content,Modal, GraphController){
		var App = function(){
			this.el = null;
			this.sortEl = null;
		};

		App.prototype = { 
			render:function(newState){
				this.el = $("#AppCtrl");
				this.sortEl = this.el.find(".sort-value");
				this.scrollTopEl = this.el.find("#ScrollToTop");
				this.infoButtonEl = this.el.find("#InfoButton");
				this.iFrameButtonEl = this.el.find(".IframeButton");
				this.mainContent= this.el.find("#MainContent");
				this.headerSocialMedia = this.mainContent.find(".social-link-container");
				this.footerListEl = this.el.find(".footer").find(".social-link-container");
				//state updates
		        this.onPageLoad();
				SplashScreen.render();
				Content.render();
				
				//listeners
				this.sortEl.on("click", function(){
					Content.displayComics($(this).data("sort-by"));
				});
				this.infoButtonEl.on("click", $.proxy(this.showModal, this, this.infoButtonEl));
				this.iFrameButtonEl.on("click", $.proxy(this.showModal, this, this.iFrameButtonEl));
				this.scrollTopEl.on("click", function(){
					$("html,body").animate({
					   scrollTop: 0
					},1000,"swing");
				});

				$(window).resize($.proxy(this.onResize,this));
				$(window).scroll($.proxy(this.onPageScroll, this));
				Config.loadData().then(function(){
					Content.refreshList();
				});

				this.showMainPage();
		        
			},
			onPageScroll:function(){
				var currentScroll = $(window).scrollTop(),
					socialButtonsOffset = $(this.headerSocialMedia).offset().top
					widnowWidth = $(window).width();
				if(widnowWidth >768){
					if((socialButtonsOffset - currentScroll) <0){
						this.footerListEl.fadeIn("slow");
						return;
					}
					this.footerListEl.fadeOut("slow");
				}else{
					this.footerListEl.show();
				}
			},
			showMainPage:function(mode){
				Content.showMainPage();
			
			},
			showModal:function(element){
				Modal.show(element.data("modal"));

			},
			onResize:function(){
				
			},
		    onPageLoad:function(){
		    }

		};

		var app = new App();

		$(document).ready($.proxy(app.render,app));
		return app;
	}]);



injector.register('Config',function(){
var data = [], def = Q.defer();


	var Config = function(){	
		window.fbAsyncInit = jQuery.proxy(this.onFacebookLoaded,this);
		this._def = jQuery.Deferred();
		this.defGraph = null;
		this.graphData = [];
	}

	Config.prototype = {
		onFacebookLoaded:function(){
		},
		onFacebookReady:function(){
			return this._def.promise();
		},
		load:function(){
			return def.promise;
		},
		getData:function(){
			return data; 
		},
		loadData:function(){
			this.data_def = $.Deferred();
			this.getJSON();
			return this.data_def.promise();
		},
		getJSON:function(){
			var self = this;
			$.ajax({
				url:'data/data.json',
				dataType:'json',
				success:function(e){
					self.data = e;
					self.data_def.resolve(e);
				},
				error:function(e){
					console.log(e.responseText);
				}
			});
		},
		loadGraphData:function(comicID){
			this.defGraph = jQuery.Deferred();
			//show loading message

			this.getGraphJSON(comicID);
			return this.defGraph.promise();
		},
		getGraphJSON:function(comicID){
			var self = this; 
			$.ajax({
				url:'data/comic-1.json',
				dataType:'json',
				success:function(e){
					self.graphData = e;
					self.defGraph.resolve(e);
				}, 
				error:function(e){
					console.log(e.responseText);
				}
			})
		},
		getGraphData:function(){
			return this.graphData;
		},
		getData:function(){
			return this.data; 
		},
		isMobile:function(){
			return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		},
	};

	return new Config();
});

injector.register('Content',['Config','GraphController',
	function(Config, GraphController){
		var Content = function(){
			this.appCtrl = null;
			this.mainContent = null;
			this.header = null;
			this.footer = null;
			this.data = [];
			

			this.filterFn = Content.FILTERS.identity;


		};
		Content.FILTERS = {
			identity:function(d){
				return typeof d !== "undefined";
			},
			marvel:function(d){
				return d.publisher ===  "Marvel";
			},
			dc:function(d){
				return d.publisher === "DC Comics";
			},
			other:function(d){
				return (d.publisher !== "DC Comics") && (d.publisher !==  "Marvel");

			}

		};
		Content.prototype = { 
			render:function(newState){
				var self=this;
				this.appCtrl = $("#AppCtrl");
				this.mainContent = this.appCtrl.find("#MainContent");
				this.header = this.appCtrl.find("#Header");
				this.footer = this.appCtrl.find(".footer");


				this.temp = $(".nav-list li");
				this.temp.on("click",function(){
					self.header.removeClass("fixed-header");
					self.showMainPage();
				});
			},
			toggleComicInfoDisplay:function(e){
				$(".comic-list").toggleClass("disable-list");
			},
			updateView:function(updateSet){
				var self = this;
				updateSet
				.style('transform','scale(0)')

					.select('.comic-title h2').text(function(d){
						return d.title + " #"+d.issue;
					});

				updateSet.select(".comic-issue p").text(function(d){
						return "Issue No. " +d.issue;
				})

				updateSet.select(".comic-publisher p").text(function(d){
					return d.publisher;
				});

				// updateSet.select(".comic-image")
				// 	.style({"background-image":function(d){
				// 		return "url(" +d.imgURL + ")"; 
				// 	}
				// });

				updateSet.select(".comic-desc p").text(function(d){
						return "Officia adipisci id nesciunt maiores in blanditiis a consequuntur, iusto, voluptas voluptatibus dolorem commodi ut repellendus eveniet corporis, sunt! Expedita molestias dolore voluptate corporis minima ratione porro, rerum saepe, repellat.";
				});

				updateSet.select(".comic-date p").text(function(d){					
						return d.years;
				});

				updateSet.select(".comic-publisher p").text(function(d){
					return d.publisher;
				});


				updateSet.select(".comic-price p").text(function(d){
					return self.formatPrice(d.currentPrice);
				});

				updateSet.transition()
					.delay(function(d,i){
						return 100*i;
					})
					.styleTween('transform',function(){
						return d3.interpolateString('scale(0)','scale(1)')
					});


				updateSet.exit()
					.transition()
					.duration(100)
					.style('transform','scale(0)')
					.remove(); 

			},
			refreshList:function(){
				this.data = Config.getData();
				var self = this, el, container, updateSet; 
				this.comicList = updateSet = d3.select(".comic-list").selectAll(".comic-item")
							.data(this.data.filter(this.filterFn));

				this.updateView(updateSet);
				
				el = this.comicList.enter()
					.append("li")
						.attr("class","comic-item");

				container = el.append('div').attr("class", "comic-container").on("click", function(e){
							self.toggleComicInfoDisplay(e);
							self.showComicInfo(this);
						});
				//close-button
				el.append("div").attr("class", "close-comic")
						.on("click", function(){
							self.hideComicInfo();
							self.hideComicGraph();
						})
						.append("img").attr("src","img/close-button.png");
				//title
					//h2
				var title = container.append("div").attr("class", "comic-title");
				title.append("h2").text(function(e){
					return e.title + " #"+e.issue;
				});

					title.append("div").attr("class","comic-graph")
						.transition()
						.delay(function(e,i){
							return i*40;
						})
						.duration(1000)
						// .ease("quad")
						// .ease("sin")
						// .ease("elastic(0,0.6)")
						.ease("cubic-in-out")
						// .ease("poly(3)")
						// .ease("bounce")
						.style({"width":function(e, i){
							return (100-i)+"%";
						}});
					
					title.append("div").attr("class", "comic-publisher").append("p").text(function(e){
						return e.publisher;
					});

					title.append("div").attr("class", "comic-value-time").append("p").text(function(e){
						return "200% price gain";
					})

				//image
				container.append("div").attr("class", "comic-image")
						.append("img").attr("src", function(e){
							return e.imgURL;
						})

				// style({"background-image":function(e){
				// 	return "url(" +e.imgURL + ")"; 
				// }});

				//comic-view container
				var comicView = container.append("div").attr("class", "comic-view-container");
					
					// comicView.append("div").attr("class","comic-show-info btn-default")
					// 	.append("div").attr("class", "btn-label").text("Show Info");

					comicView.append("div").attr("class", "comic-show-graph btn-default no-user-select")
						.on("click", function(){
							self.toggleGraphView(this);
						})
						.append("div").attr("class", "btn-label").text("Show Graph");


				// GraphController.updateGraph(comicGraph);
				//comic-info
				var comicInfo = container.append("div").attr("class", "comic-info");

					//comic-desc 
						//p
					comicInfo.append("div").attr("class","comic-desc").append("p").text(function(e){
						return "Officia adipisci id nesciunt maiores in blanditiis a consequuntur, iusto, voluptas voluptatibus dolorem commodi ut repellendus eveniet corporis, sunt! Expedita molestias dolore voluptate corporis minima ratione porro, rerum saepe, repellat.";
					})

					//comic-issue
						//p
					comicInfo.append("div").attr("class", "comic-issue").append("p").text(function(e){
						return "Issue No. " +e.issue;
					});
					//comic-date
						//p
					comicInfo.append("div").attr("class", "comic-date").append("p").text(function(e){
						return "Publication Year" + e.years;
					});
					//comic-publisher
						//p
					comicInfo.append("div").attr("class", "comic-publisher").append("p").text(function(e){
						return e.publisher;
					});

				// var comicGraph = container.append("div").attr("class", "comic-graph-container");

				//comic-price
				container.append("div").attr("class", "comic-price").append("p").text(function(e){
					return self.formatPrice(e.currentPrice);
				});
				//comic-desc
					//p
				container.append("div").attr("class","comic-desc").append("p").text(function(e){
					return "Officia adipisci id nesciunt maiores in blanditiis a consequuntur, iusto, voluptas voluptatibus dolorem commodi ut repellendus eveniet corporis, sunt! Expedita molestias dolore voluptate corporis minima ratione porro, rerum saepe, repellat.";
				})

				
				//comic-graph 
				var comicGraph = container.append("div").attr("class", "comic-graph-wrapper")
						.append("div").attr("class", "comic-graph-container");


				// comicGraph.each(function(e){
				// 	GraphController.updateGraph(e, this);
				// });

			},
			toggleGraphView:function(element){
				var comicInfo = this.currentComic.find(".comic-info");
				if(comicInfo.get(0).style.display == "none"){
					this.hideComicGraph();
					return;
				}
				this.showComicGraph();
			},
			showComicGraph:function(){
				var comicInfo = this.currentComic.find(".comic-info"),
					comicGraph = this.currentComic.find(".comic-graph-wrapper")
					priceContainer = this.currentComic.find(".comic-price");

				priceContainer.fadeOut("fast");
				comicInfo.fadeOut("fast", function(){
					comicGraph.fadeIn("fast");
				});

			},
			hideComicGraph:function(){
				var comicInfo = this.currentComic.find(".comic-info"),
					comicGraph = this.currentComic.find(".comic-graph-wrapper")
					priceContainer = this.currentComic.find(".comic-price");

				comicGraph.fadeOut("fast", function(){
					comicInfo.fadeIn("fast");
					priceContainer.fadeIn("fast");
				});
			},
			showComicInfo:function(element){
				if (this.currentComic != null){
					this.hideComicInfo();
				}
				this.currentComic = $(element).parent(".comic-item");
				this.currentComic.addClass("active");
			},
			hideComicInfo:function(){
				this.currentComic.removeClass("active");
			},
			displayComics:function(orderBy){
				this.filterFn = Content.FILTERS[orderBy];
				this.refreshList();

				this.comicList.selectAll(".comic-item").filter(function(d){
					return d.publisher =="DC Comics";
				}).attr("display","none");
			}, 
			orderComics:function(orderBy){

			},
			showMainPage:function(mode){
				this.appCtrl.show();
				this.showFooter();
			},
			onResize:function(){
				
			},
			formatPrice:function(price){
				if (price < 1000){
					return "$"+price;
				}else if (price < 1000000){
					return "$"+parseInt(price/1000)+"K";
				}else{
					return "$"+parseInt(price/1000000)+ "M";
				}
			},
			showFooter:function(){
				this.footer.show();
			}, 
			comicToActive:function(){

			},
			comicToInactive:function(){

			},
			showHeader:function(){
				this.header.fadeIn("slow");
			}

		};




		return new Content();;
	}]);

// var updateSet = select('#container').selectAll('.comic-item')
// .data(yourData);

// //only done once
// updateSet.enter()
// 	.append()


// select('#container').selectAll('.comic-item')
// .data(updatedData)
// .style('position','absolute')
// .transition()
// .style('top',function(d,i){
	
// })
// .transition()
// .select()
// .style({position:'relative','top':0})
// injector.register("GraphController", ['Config', 
// function(Config){
// 	var GraphController = function(){

// 	}


// 	GraphController.prototype = {
// 		render:function(){

// 		},
// 		init:function(){

// 		},
// 		test:function(){
// 			var margin = {top: 20, right: 80, bottom: 30, left: 50},
// 			    width = 960 - margin.left - margin.right,
// 			    height = 500 - margin.top - margin.bottom;

// 			var parseDate = d3.time.format("%Y%m%d").parse;

// 			var x = d3.time.scale()
// 			    .range([0, width]);

// 			var y = d3.scale.linear()
// 			    .range([height, 0]);

// 			var color = d3.scale.category10();

// 			var xAxis = d3.svg.axis()
// 			    .scale(x)
// 			    .orient("bottom");

// 			var yAxis = d3.svg.axis()
// 			    .scale(y)
// 			    .orient("left");

// 			var line = d3.svg.line()
// 			    .interpolate("basis")
// 			    .x(function(d) { return x(d.date); })
// 			    .y(function(d) { return y(d.temperature); });

// 			var svg = d3.select("body").append("svg")
// 			    .attr("width", width + margin.left + margin.right)
// 			    .attr("height", height + margin.top + margin.bottom)
// 			  .append("g")
// 			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// 			d3.tsv("data.tsv", function(error, data) {
// 			  if (error) throw error;

// 			  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

// 			  data.forEach(function(d) {
// 			    d.date = parseDate(d.date);
// 			  });

// 			  var cities = color.domain().map(function(name) {
// 			    return {
// 			      name: name,
// 			      values: data.map(function(d) {
// 			        return {date: d.date, temperature: +d[name]};
// 			      })
// 			    };
// 			  });

// 			  x.domain(d3.extent(data, function(d) { return d.date; }));

// 			  y.domain([
// 			    d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.temperature; }); }),
// 			    d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.temperature; }); })
// 			  ]);

// 			  svg.append("g")
// 			      .attr("class", "x axis")
// 			      .attr("transform", "translate(0," + height + ")")
// 			      .call(xAxis);

// 			  svg.append("g")
// 			      .attr("class", "y axis")
// 			      .call(yAxis)
// 			    .append("text")
// 			      .attr("transform", "rotate(-90)")
// 			      .attr("y", 6)
// 			      .attr("dy", ".71em")
// 			      .style("text-anchor", "end")
// 			      .text("Temperature (ºF)");

// 			  var city = svg.selectAll(".city")
// 			      .data(cities)
// 			    .enter().append("g")
// 			      .attr("class", "city");

// 			  city.append("path")
// 			      .attr("class", "line")
// 			      .attr("d", function(d) { return line(d.values); })
// 			      .style("stroke", function(d) { return color(d.name); });

// 			  city.append("text")
// 			      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
// 			      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
// 			      .attr("x", 3)
// 			      .attr("dy", ".35em")
// 			      .text(function(d) { return d.name; });
// 			});
// 		},
// 		updateGraph:function(comicObj, comicEl){
// 			var graphContainer = d3.select(comicEl), 
// 				data = comicObj.graphData,
// 				comicValue = [],
// 				spValue = [],
// 				goldValue = [];


// 			if (data.length > 0){

// 				var tData = [[],[],[]]; 

// 				// // Parse the date / time
// 				var parseDate = d3.time.format("%d-%b-%y").parse;

// 				data.forEach(function(e){
// 					var tempDate = new Date(e.date);
// 					console.log(tempDate);
// 					tData[0].push({
// 						date:tempDate,
// 						value:e.comicValue
// 					});
// 					tData[1].push({
// 						date:tempDate,
// 						value:e.spValue
// 					});
// 					tData[2].push({
// 						date:tempDate,
// 						value:e.goldValue
// 					});
// 				});


// 				//before drawing the graph remove everything
// 				graphContainer.selectAll("*").remove();

// 				var margin = {top: 30, right: 20, bottom: 30, left: 50},
// 				    width = $(comicEl).width() - margin.left - margin.right,
// 				    height = 300 - margin.top - margin.bottom;


// 				// // Set the ranges
// 				var x = d3.time.scale().range([0, width]);
// 				var y = d3.scale.linear().range([height, 0]);



// 				// var x = d3.scale.linear().domain([1960,2016]).range([0, width]);
// 				// var y = d3.scale.linear().domain([0, 100]).range([height, 0]);
// 				// // Define the axes
// 				var xAxis = d3.svg.axis().scale(x)
// 				    .orient("bottom").ticks(5);

// 				var yAxis = d3.svg.axis().scale(y)
// 				    .orient("left").ticks(5);

// 				// // Define the line
// 				var valueline = d3.svg.line()
// 				    .x(function(d) { return x(d.date); })
// 				    .y(function(d) { return y(d.value); });

// 				// var line = d3.svg.line()
// 				//     .interpolate("basis")
// 				//     .x(function(d) { return x(d.date); })
// 				//     .y(function(d) { return y(d.value); });

// 				var svg = graphContainer.append("svg")
// 							.attr("width", width + margin.left + margin.right)
// 					        .attr("height", height + margin.top + margin.bottom)
// 					    .append("g")
// 					        .attr("transform", 
// 					              "translate(" + margin.left + "," + margin.top + ")");

// 				x.domain(d3.extent(tData[0], function(d) { return d.date; }));
// 			    y.domain([0, d3.max(tData[0], function(d) { return d.value; })]);


// 			    var updateSel = svg.selectAll('path.line')
// 			    	.data(tData);

// 			    updateSel
// 			    	.enter()
// 			    	.append('path')
// 			    	.attr('class', function(d,i){
// 			    		return 'line line-'+i;
// 			    	})
// 			    	.attr('d',tData); 


// 			    // Add the valueline path.
// 			    svg.append("path")
// 			        .attr("class", function(e,i){
// 			        	return 'line line-'+i;
// 			        })
//         			.attr("d", function(d) { return valueline(d.value); })
// 			        .attr("d", valueline(tData));

// 			    // Add the X Axis
// 			    svg.append("g")
// 			        .attr("class", "x axis")
// 			        .attr("transform", "translate(0," + height + ")")
// 			        .call(xAxis)
// 			        .append("text")
// 			        .attr("x" ,280)
// 			        .attr("y" , -18)
// 			        .attr("dy", ".71em")
// 			        .attr("class", "axis-label")
// 			        .text("Year");

// 			    // Add the Y Axis
// 			    svg.append("g")
// 			        .attr("class", "y axis")
// 			        .call(yAxis).append("text")
// 			      // .attr("transform", "rotate(-90)")
// 			      .attr("y", -15).attr("x", 20)
// 			      .attr("dy", ".71em")
// 			      .attr("class", "axis-label")
// 			      // .style({"text-anchor": "end", "fill":"#fff"})
// 			      .text("Price ($)");

// 			}
			    
// 		}
// 	}

// 	return new GraphController();
// }]);
// injector.register("LineChart", ['Config', 
// 	function(Config){
// 		var LineChart = function(cfg){
// 			this.data = [];
// 			this.canvas = null;
// 			this.parentEl = null;
// 			// this.maxFn = cfg.maxFn || maxComparator;
// 			// this.maxXFn = cfg.maxXFn || maxComparator;
// 			// this.maxYFn = cfg.maxYFn || maxComparator;
// 			// this.dataFn = cfg.dataFn || maxComparator;
// 			this.isCreated = false;
// 		}
// 		​
// 		LineChart.prototype = {
// 			create:function(parentEl){
// 				this.isCreated = true;
// 				this.parentEl = parentEl;
// 				var canvasWidth = parentEl?$(parentEl).width():100,
// 					canvasHeight = parentEl?$(parentEl).height():100,
// 					margins = {
// 						top:20,
// 						left:60,
// 						right:30,
// 						bottom:60
// 					},
// 				height = canvasHeight - margins.bottom - margins.top,
// 		  		width = canvasWidth - margins.left - margins.right,
// 				self = this;
// 				// this.tooltipCtrl = tooltipCtrl;
// 				this.canvas = d3.select(parentEl)
// 					.append('svg')
// 					.attr('class','chart-canvas')
// 			    	.attr({
// 				        height:canvasHeight,
// 				        width:canvasWidth
// 				      });
// 				this.lineCanvas = this.canvas
// 			    	.append('g')
// 			    	.attr('class','line-canvas')
// 			      	.attr('transform','translate('+[margins.left,margins.top].join(',')+')');
// 				this.colorSet = ['#334d5c','#71b949','#df5a49','#f08a38','#fdd758','#ccc'];
// 				this.colorScale = d3.scale.ordinal()
// 					.domain([0,5])
// 					.range(['#334d5c','#71b949','#df5a49','#f08a38','#fdd758','#ccc']);
// 				this.xScale = d3.scale.linear();
// 				this.yScale = d3.scale.linear();
// 		​
// 				this.lineGenerator = d3.svg.line()
// 					.interpolate('cardinal')
// 					.defined(function(e){
// 						return jQuery.isNumeric(e.value);
// 					})
// 					.x(function(e,i){
// 						return self.xScale(i);
// 					})
// 					.y(function(e,i){
// 						return self.yScale(e.value);
// 					});
// 		​
// 				this.xAxisLabel = this.canvas
// 					.append('text')
// 					.attr('class','x-axis-label')
// 					.text('Year');
// 				this.yAxisLabel = this.canvas
// 					.append('text')
// 					.attr('class','y-axis-label')
// 					.attr({
// 						transform:'translate('+[20,margins.top+(height/2)].join(',')+') rotate(-90)'});
// 		​
// 				this.xAxis = d3.svg.axis()
// 					.orient('bottom')
// 					.ticks(d3.max(this.data,function(d){
// 						return d.length;
// 					}))
// 					.tickFormat(function(e,i){
// 						return i+1996;
// 					});;
// 		​
// 				this.yAxis = d3.svg.axis()
// 					.orient('left')
// 					.ticks(8);
// 		​
// 				this.xAxisEl = this.lineCanvas
// 					.append('g')
// 					.attr({
// 						'class':'x-axis',
// 						'transform':'translate('+[0,height-margins.bottom].join(',')+')'
// 					});
// 				this.yAxisEl = this.lineCanvas
// 					.append('g')
// 					.attr({
// 						'class':'y-axis',
// 						transform:'translate('+[0,0].join(',')+')'
// 					});
// 		​
// 				this.pathEl = this.lineCanvas
// 					.append('g')
// 					.attr('class','line-path')
// 					.attr('transform','translate('+[0,0].join(',')+')');
// 		​
// 				this.circleGroupEl = this.lineCanvas
// 					.append('g')
// 					.attr('class','circle-group')
// 					.attr('transform','translate('+[0,0].join(',')+')');
// 		​
// 		​
// 				this.verticalLines = this.lineCanvas
// 					.selectAll('line.vertical');
// 		​
// 				this.circleSelection = this.circleGroupEl.selectAll('circle');
// 		​
// 				$(window).resize(this.onResize.bind(this))
// 			},
// 			update:function(parentEl,data,cls){
				
// 				if (!data){
// 					return false;
// 				}
// 				this.dataset = data;
// 				var innerData = _.map(data.datasets,function(v){
// 					return v.data;
// 				}),
// 				colorIndices = cls || this.colorSet,
// 		      	canvasWidth = parentEl?$(parentEl).width():$(this.parentEl).width(),
// 				canvasHeight = parentEl?$(parentEl).height():$(this.parentEl).height(),
// 				margins = {
// 					top:20,
// 					left:60,
// 					right:30,
// 					bottom:60
// 				},
// 				height = canvasHeight - margins.top - margins.bottom,
// 		  		width= canvasWidth - margins.left - margins.right,
// 				self = this,
// 				prefix = data.prefix?data.prefix:"",
// 				postfix = data.postfix?data.postfix:"",
// 				startYear = this.dataset.startYear || 2008,
// 		  		xAxisTitle = this.dataset.xAxisTitle || "",
// 				horizontalLines = _.filter(this.dataset.lines,function(kj){
// 					return kj.type === 'horizontal';
// 				}),
// 				verticalLines = _.filter(this.dataset.lines,function(kj){
// 					return kj.type === 'vertical';
// 				}),
// 				yAxisTitle = this.dataset.yAxisTitle || "",
// 				maxX = d3.max(innerData,function(d){
// 					return d.length;
// 				}),
// 				maxY = d3.max(innerData,function(d){
// 					return d3.max(d,function(vv){return jQuery.isNumeric(vv.value)?vv.value:-1;});
// 				}),
// 				minY = d3.min(innerData,function(d){
// 					return d3.min(d,function(vv){return jQuery.isNumeric(vv.value)?vv.value:99999;});
// 				}),
// 				maxLines = 0;
// 				for(var i=0;i<horizontalLines.length;i++){
// 					if (maxY < horizontalLines[i].at){
// 						maxY = horizontalLines[i].at;
// 					}
// 				}
// 				console.log(maxY);
// 				// maxY = maxY > maxLines ? maxY : maxLines;
// 				minY = (minY-2) <= 0?0:(minY-2);
// 				//update canvas size
// 				this.canvas
// 					.attr('height',canvasHeight)
// 					.attr('width',canvasWidth);
// 		​
// 				//update labels positions
// 				//update x-axis label
// 				this.xAxisLabel
// 					.attr({
// 						x:canvasWidth/2,
// 						y:canvasHeight
// 					})
// 					.text(xAxisTitle);
// 		​
// 				//update y-axis label
// 				this.yAxisLabel
// 					.attr({
// 						transform:'translate('+[20,margins.top+(height/2)].join(',')+') rotate(-90)'})
// 					.text(yAxisTitle);
// 		​
// 				//update the scales
// 				//update the x-axis scale
// 				this.xScale
// 					.domain([0,maxX])
// 					.range([0,width]);
// 		​
// 				//update the y-axis scale
// 				this.yScale
// 					.domain([minY,parseInt(maxY+maxY/5)])
// 					.range([height,0]);
// 		​
// 				//configure the x-axis
// 				this.xAxis
// 					.scale(this.xScale)
// 					.tickValues(d3.range(0,parseInt((maxX/4)+1)*4,4))
// 					.tickFormat(function(e,i){
// 						return (i*4)+startYear;
// 					});
// 		​
// 				//update x-axis
// 				this.xAxisEl
// 					.attr("transform", "translate(0," + (height) + ")")
// 					.call(this.xAxis);
// 		​
// 				//configure y-axis scale
// 				this.yAxis
// 					.scale(this.yScale);
// 		​
// 				//update y-axis
// 				this.yAxisEl
// 					.call(this.yAxis);
// 				;
// 				if(horizontalLines.length > 0){
// 					;
// 				}
// 		​
// 				//handle horizontal lines
// 				var hLineSel = this.lineCanvas.selectAll('line.horizontal')
// 					.data(horizontalLines);
// 		​
// 				//handle horizontal lines changes (update selection)
// 				hLineSel
// 					.attr({x1:10,x2:10})
// 					.attr('y1',function(d){
// 						return self.yScale(d.at);
// 					})
// 					.attr('y2',function(d){
// 						return self.yScale(d.at);
// 					})
// 					.transition()
// 					.attr('x2',width);
// 		​
// 				//handle horizontal lines addition (enter selection)
// 				hLineSel.enter()
// 					.append('line')
// 					.attr("stroke", "darkred")
// 					.attr('stroke-dasharray','5,5')
// 					.attr('class','horizontal')
// 					.attr({x1:10,x2:10})
// 					.attr('y1',function(d){
// 						return self.yScale(d.at);
// 					})
// 					.attr('y2',function(d){
// 						return self.yScale(d.at);
// 					})
// 					.transition()
// 					.duration(1000)
// 					.attr('x2',width);
// 		​
// 				//handle horizontal lines removal (exit selection)
// 				hLineSel.exit()
// 					.transition()
// 					.attr('y2',10)
// 					.remove();
// 		​
// 				//handle vertical lines
// 				var vLineSel = this.lineCanvas.selectAll('line.vertical')
// 					.data(_.filter(this.dataset.lines,function(kj){
// 						return kj.type === 'vertical';
// 					}));
// 				//handle vertical lines changes (update selection)
// 				vLineSel
// 					.attr('x1',function(d){
// 						return self.xScale(d.at-startYear);
// 					})
// 					.attr('x2',function(d){
// 						return self.xScale(d.at-startYear);
// 					})
// 					.attr({
// 						y1:10,
// 						y2:10//height-padding+10
// 					})
// 					.transition()
// 					.attr('y2',height);
// 				//handle vertical lines addition (enter selection)
// 				vLineSel.enter()
// 					.append('line')
// 					.attr("stroke", "steelblue")
// 					.attr('stroke-dasharray','5,5')
// 					.attr('class','vertical')
// 					.attr('x1',function(d){
// 						return self.xScale(d.at-startYear);
// 					})
// 					.attr('x2',function(d){
// 						return self.xScale(d.at-startYear);
// 					})
// 					.attr({
// 						y1:10,
// 						y2:10
// 					})
// 					.transition()
// 					.duration(1000)
// 					.attr('y2',height);
// 				//handle vertical lines removal (exit selection)
// 				vLineSel.exit()
// 					.transition()
// 					.attr('y2',10)
// 					.remove();
// 		​
// 				//update line charts
// 				this.pathsEl = this.pathEl.selectAll('path')
// 					.data(innerData)
// 					.attr('d',this.lineGenerator)
// 					.attr('stroke',function(d,i,j){
// 						return self.dataset.datasets[i].color;
// 					});
// 		​
// 		    //ENTER SELECTION
// 				this.pathsEl
// 					.enter()
// 					.append('path')
// 					.attr('stroke',function(d,i,j){
// 						return self.dataset.datasets[i].color;
// 					})
// 					.transition()
// 					.duration(500)
// 					.attr('d',this.lineGenerator)
// 				//EXIT SELECTION
// 				this.pathsEl
// 					.exit()
// 					.remove();
// 				var currentIndex = 0;
// 				//LINE MARKERS SELECTION
// 				var sels = this.circleGroupEl
// 					.selectAll('g.circle-group')
// 					.data(innerData);
// 		​
// 				//update selection
// 				var circles = sels.selectAll('circle.point-circle')
// 					.data(function(e,i){
// 						currentIndex++;
// 						return e;
// 					});
// 				//updates
// 				circles
// 					.attr('cx',function(d,i){
// 						return self.xScale(i);
// 					})
// 					.attr('cy',function(v){
// 						return jQuery.isNumeric(v.value)?self.yScale(v.value):0;
// 					})
// 					.attr('fill',function(dz,p,j){
// 						return self.dataset.datasets[j].color;
// 					})
// 					.attr('r',function(km){
// 						if (jQuery.isNumeric(km.value)){
// 							return 4;
// 						}
// 						return 0;
// 					});
// 		​
// 		​
// 				//enter selection
// 				circles.enter()
// 					.append('circle')
// 					.attr('class','point-circle')
// 					.attr('cx',function(d,i){
// 						return self.xScale(i);
// 					})
// 					.attr('cy',function(v){
// 						return jQuery.isNumeric(v.value)?self.yScale(v.value):0;
// 					})
// 					.attr('fill',function(dz,p,j){
// 						return self.dataset.datasets[j].color;
// 					})
// 					.attr('r',function(km){
// 						if (jQuery.isNumeric(km.value)){
// 							return 4;
// 						}
// 						return 0;
// 					})
// 					.on('mouseenter',function(dd,idx){
// 						var parentData = d3.select(this.parentNode).datum();
// 						var strYear = self.dataset.startYear;
// 						var pre = self.dataset.prefix?self.dataset.prefix:"",
// 						post = self.dataset.postfix?self.dataset.postfix:"",
// 						val = d3.select(this).datum();
// 						post = (post.length > 1) && ((val.value > 1 && post )|| (val.value === 1 && post.slice(0,post.length-1))) || post;
// 		​
// 						self.tooltipCtrl.showTooltip(parseInt(d3.select(this).attr('cx'))-40,
// 							parseInt(d3.select(this).attr('cy')),
// 							val.label,
// 							pre+val.value+post,
// 							(idx+strYear));
// 					})
// 					.on('mouseleave',function(de){
// 						self.tooltipCtrl.hide();
// 					});
// 				circles.exit()
// 					.transition()
// 					.attr('r',0)
// 					.remove();
// 		​
// 				var newSels = sels
// 					.enter()
// 					.append('g')
// 					.attr('class','circle-group');
// 		​
// 				circles = newSels.selectAll('circle.point-circle')
// 					.data(function(e,i){
// 						// currentIndex++
// 						return e;
// 					}).enter()
// 					.append('circle')
// 					.attr('class','point-circle')
// 					.attr('cx',function(d,i){
// 						return self.xScale(i);
// 					})
// 					.attr('cy',function(v){
// 						return jQuery.isNumeric(v.value)?self.yScale(v.value):0;
// 					})
// 					.attr('fill',function(dz,p,j){
// 						return self.dataset.datasets[currentIndex+j].color;
// 					})
// 					.attr('r',function(km){
// 						if (jQuery.isNumeric(km.value)){
// 							return 4;
// 						}
// 						return 0;
// 					})
// 					.on('mouseenter',function(dd,idx){
// 						var parentData = d3.select(this.parentNode).datum();
// 						var strYear = self.dataset.startYear;
// 						var pre = self.dataset.prefix?self.dataset.prefix:"",
// 						post = self.dataset.postfix?self.dataset.postfix:"",
// 						val = d3.select(this).datum();
// 						post = (post.length > 1) && ((val.value > 1 && post )|| (val.value === 1 && post.slice(0,post.length-1))) || post;
// 		​
// 						self.tooltipCtrl.showTooltip(parseInt(d3.select(this).attr('cx'))-40,
// 							parseInt(d3.select(this).attr('cy')),
// 							val.label,
// 							pre+val.value+post,
// 							(idx+strYear));
// 					})
// 					.on('mouseleave',function(de){
// 						self.tooltipCtrl.hide();
// 					});
// 		​
// 				sels.exit()
// 					.remove();
// 		​
// 			},
// 		​
// 			onResize:function(){
// 				var self = this;
// 				if (this.isBusy){
// 					return true;
// 				}
// 				this.isBusy = true;
// 				setTimeout(function(){
// 					self.update(self.parentEl,self.dataset);
// 					self.isBusy = false;
// 				},400);
// 			}
// 		};


// 		return new LineChart();

// 	}]);


injector.register('Modal',function(){

var Modal = function (){
	this.el = null;
}

Modal.prototype = {
	render:function(){
		this.el = $("#Modal");
		this.contentEl = this.el.find(".modal-content");
		this.titleEl = this.el.find(".modal-title");
		this.closeEl = this.el.find(".close-button");
		this.backdropEl = this.el.find(".backdrop");
		this.backdropEl.on("click", $.proxy(this.onModalCloseClicked, this));
	},
	onModalCloseClicked:function(){
		this.hide();
	},
	copyToClipboard:function(){
		console.log(this.textAreaEl);
		this.textAreaEl.select();
		if (document.execCommand){
		   var res = document.execCommand('copy');
		   if (res){
		       this.clipboardMessage.html("Copied");
		   }
		}
	},
	show:function(elementID){
		// this.titleEl.html(title);
		// this.contentEl.html(content);
		this.el = $("#" + elementID);
		$(document.body).css({overflow:"hidden"});
		this.contentEl = this.el.find(".modal-content");
		this.titleEl = this.el.find(".modal-title");
		this.closeEl = this.el.find(".close-button");
		this.backdropEl = this.el.find(".ze-backdrop");
		this.copyToClipboardEl = this.el.find("#CopyToClipboardEl");
		this.textAreaEl = this.el.find("#IframeTextArea").get(0);
		this.clipboardMessage = this.el.find(".clipboard-message");

		this.copyToClipboardEl.on("click", $.proxy(this.copyToClipboard, this));
		this.closeEl.on("click", $.proxy(this.onModalCloseClicked, this));
		this.closeEl.on("click", $.proxy(this.onModalCloseClicked, this));
		this.backdropEl.on("click", $.proxy(this.onModalCloseClicked, this));
		this.el.fadeIn(200);
	},
	hide:function(){
		$(document.body).css({overflow:"visible"});
		       this.clipboardMessage.html("");
		this.el.fadeOut(200);
	}
}

return new Modal();

	
});
injector.register('SplashScreen',['Config', 'AudioWidget',function(cfg, AudioWidget){
	
	var SplashScreen = function(){
		this.def = null;
		this.el = null;
	};

	SplashScreen.prototype = {
		render:function(){
			this.el = $('#SplashScreen');
			this.enterButtonEl = this.el.find('#EnterButton');
			this.enterButtonEl.on('click',$.proxy(this.onEnterButtonClicked,this));

		},
		onEnterButtonClicked:function(){
			this.hide();
			this.def.resolve();
		},
		show:function(){
			this.def = $.Deferred();
			this.el.fadeIn(1000);
			return this.def.promise();
		},
		hide:function(){
			this.el.hide();
			// this.def.resolve();
		}

	};
	return new SplashScreen();
}]);
	injector.get("App");
})(document,window,jQuery,Q,new shInjector());
