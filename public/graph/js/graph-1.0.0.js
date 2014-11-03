function convertToSeries() {
  var series = [];
  for (var i = 0; i < arguments[0].length; i++) {
    var arr = [];
    for (var j = 0; j < arguments.length; j++) {
      arr.push(+arguments[j][i]);
    }
    series.push(arr);
  }
  return series;
};

function isWithin(time, extent) { 
  return extent[0] <= extent[1] ? a <= time && time <= b : isWithin(time, [extent[1], extent[0]]);
};

function dateEquals(a, b) {
  return a.getTime() == b.getTime();
};

function timeFormat(formats) {
  return function(date) {
    var i = formats.length - 1; 
    var f = formats[i];
    while (!f[1](date)) {
      f = formats[--i];
    }
    return f[0](date);
  };
};

var customTimeFormat = timeFormat([
  [d3.time.format("%Y"),    function(d) { return true; }],
  [d3.time.format("%b %e"), function(d) { return d.getMonth(); }],
  [d3.time.format("%a %e"), function(d) { return d.getDate() != 1; }],
  [d3.time.format("%a %e"), function(d) { return d.getDay() && d.getDate() != 1; }],
  [d3.time.format("%I %p"), function(d) { return d.getHours(); }],
  [d3.time.format("%I:%M"), function(d) { return d.getMinutes(); }],
  [d3.time.format(":%S"),   function(d) { return d.getSeconds(); }],
  [d3.time.format(".%L"),   function(d) { return d.getMilliseconds(); }]
]);

function createOptions(defaultOptions, userOptions) {  
  if (!userOptions) {
    return defaultOptions;
  }
  var newOpts = {};
  for (var key in defaultOptions) {
    var currentUserOpt = userOptions[key];
    var currentDefaultOpt = defaultOptions[key];
    if (userOptions && currentUserOpt != null) {
      newOpts[key] = Object.prototype.toString.call(currentUserOpt) == "[object Object]" ? 
        createOptions(currentDefaultOpt, currentUserOpt) : currentUserOpt;
    }
    else {
      newOpts[key] = currentDefaultOpt;
    }
  }
  return newOpts;
}

function Graph(svg, userOptions, data) {  
  
  var self = this;

  this.sizes = {
    text   : { XS :  10, S :  13, M : 16,  L : 19, XL : 22 },
    border : { XS :   1, S :   2, M :  3,  L :  4, XL :  5 },
    path   : { XS :   1, S :   2, M :  2,  L :  3, XL :  4 },
  };
  
  this.defaultOptions = {
    "margin" : { t : 25, r : 15, b : 35, l : 45 },
    "xPos"   : 0,
    "yPos"   : 0,
    "width"  : 400,
    "height" : 200,
    "hover"  : false,
    "title"  : { text : "", size : "M", orientation : "center"},
    "legend" : { display : true, orientation : "right", size : "M" },
    "xAxis"  : { displayPath : false, displayValues : true, displayGrid : true, label : "", min : undefined, max : undefined, time : false },
    "yAxis"  : { displayPath : false, displayValues : true, displayGrid : true, label : "", min : undefined, max : undefined, },
    "path"   : { displayShadow : true, interpolate : "linear", size : "M", type : "line"},
    "border" : { display : true, size : "S" },
    "debug"  : { displayBox : false, displayBorder : false },
  };
  
  this.options = createOptions(this.defaultOptions, userOptions);  
  
  this.xPos = this.options.xPos;
  this.yPos = this.options.yPos;
  this.margin = this.options.margin;
  this.W = this.options.width;  //this svg element width
  this.H = this.options.height; //this svg element height
  this.w = this.W - this.margin.r - this.margin.l; //graph width
  this.h = this.H - this.margin.t - this.margin.b; //graph height
  
  this.X_INDEX = 0;
  this.Y_INDEX = 1;
  this.Y_MAX_THRESHOLD = 1.1;
  this.maxNumLines = 4;
  this.curNumLines = 0;
  this.defaultLineColors = ["#bb492b", "#5b72ca", "#9cbd38", "#ed9121"];    

  this.data;
  this.xExtent;
  this.yExtent;
  this.hoverCoords;
  this.hoverMouseX;
  this.hoverMouseY;
  this.hoverUpdateTimeout; 
  this.bisector = d3.bisector(function(d) { return d[self.X_INDEX]; }).right;
  
  this.xAxisIsTime = this.options.xAxis.time;
  
  this.context = svg.append("g")
    .attr("class", "graph")
    .attr("width", this.W)
    .attr("height", this.H)
    .attr("transform", "translate(" + this.xPos + "," +  this.yPos + ")");

  this.graphContext = this.context.append("g") 
    .attr("width", this.w)
    .attr("height", this.h)
    .attr("transform", "translate(" + this.margin.l + "," + this.margin.t + ")"); 
  
  // Need a better way to deal with multiple clips with different ID's!! this causes huge problems.
  this.randomId = Math.random();
  this.graphContext.append("defs")
    .append("clipPath")
    .attr("id", "clip" + this.randomId)
    .append("rect")
    .attr("width", this.w)
    .attr("height", this.h); 
  
  var titleOrientations = {      
    translate  : { "left" : "(2,-7)", "center" : "(" + (this.w/2) + ",-7)", "right" : "(" + this.w + ",-7)" },
    textAnchor : { "left" : "start",  "center" : "middle",                  "right" : "end" },
  };
  
  this.title = this.graphContext.append("text")
    .attr("class", "graphTitle") 
    .attr("font-size", this.sizes.text[this.options.title.size])
    .attr("transform", "translate" + titleOrientations.translate[this.options.title.orientation.toLowerCase()])
    .attr("text-anchor", titleOrientations.textAnchor[this.options.title.orientation.toLowerCase()])
    .text(this.options.title.text)
    .append("svg:title")
    .text(this.options.title.text);
  
  this.x = (this.xAxisIsTime ? d3.time.scale() : d3.scale.linear())
    .range([0, this.w]);
  
  this.y = d3.scale.linear()
    .range([this.h, 0]);
  
  this.xAxis = d3.svg.axis()
    .scale(this.x)
    .orient("bottom")
    .tickSize(3)
    .tickFormat(function(d) { return self.__xAxisTickFormat(d); });
  
  this.yAxis = d3.svg.axis()
    .scale(this.y)
    .orient("left")
    .tickSize(3)
    .tickFormat(function(d) { return self.__yAxisTickFormat(d); });
  
  this.xAxisContext = this.graphContext.append("g")
    .attr("class", "x axis") 
    .call(this.xAxis)
    .attr("transform", "translate(0," + this.h + ")");
    
  this.yAxisContext = this.graphContext.append("g")
    .attr("class", "y axis")
    .call(this.yAxis);    
  
  this.xAxisContext.select("path")
    .attr("display", !!this.options.xAxis.displayPath ? null : "none");  
  
  this.yAxisContext.select("path")
    .attr("display", !!this.options.yAxis.displayPath ? null : "none"); 
  
  this.xAxisLabel = this.xAxisContext.append("text")
    .attr("class", "label")
    .attr("transform", "translate(" + (this.w/2) + ",30)")
    .attr("text-anchor", "middle") 
    .text(this.options.xAxis.label)
    .append("svg:title")
    .text(this.options.xAxis.label);

  this.yAxisLabel = this.yAxisContext.append("text")
    .attr("class", "label")
    .attr("transform", "translate(-32," + (this.h/2) + ") rotate(-90) ")
    .attr("text-anchor", "middle") 
    .text(this.options.yAxis.label) 
    .append("svg:title")
    .text(this.options.yAxis.label);
  
  if (!!this.options.xAxis.displayGrid) {
    this.xGridAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom") 
      .tickSize(-this.h, 0, 0)
      .tickFormat("");
    this.xGridAxisContext = this.graphContext.append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + this.h + ")") 
      .call(this.xGridAxis); 
  }
  
  if (!!this.options.yAxis.displayGrid) {
    this.yGridAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left")
      .tickSize(-this.w, 0, 0)
      .tickFormat("");
    this.yGridAxisContext = this.graphContext.append("g")
      .attr("class", "grid")
      .call(this.yGridAxis); 
  }
  
  if (!!this.options.border.display) {
    var borderSize = this.sizes.border[this.options.border.size];
    var borderOffset = (borderSize - 1) / 2;
    this.graphContext.append("rect")
      .attr("width", this.w + borderSize - 1)
      .attr("height", this.h + borderSize - 1)
      .attr("transform", "translate(" + (-borderOffset) + "," + (-borderOffset) + ")")
      .attr("class", "border") 
      .attr("stroke-width", borderSize); 
  }
   
  this.focus = this.graphContext.append("g")
    .attr("class", "focus") 
    .attr("display", "none");
  
  this.time = this.focus.append("text")
    .attr("class", "time")
    .attr("y", -2)
    .attr("text-anchor", "end")
    .attr("transform", "translate(" + (this.w-2) + ",-2)"); 
    
  this.lines   = [];
  this.paths   = [];
  this.circles = [];
  
  this.pathContext = this.graphContext.append("g")
    .attr("class", "paths")
    .attr("clip-path", "url(#"+"clip"+this.randomId+")")
    .attr("fill-opacity", 0.2)
    .attr("stroke-width", this.sizes.path[this.options.path.size]);
  
  for (var i = 0; i < this.maxNumLines; i++) {
    this.lines.push( 
        this.options.path.type == "area" ? 
          d3.svg.area()
            .interpolate(this.options.path.interpolate)
            .x(function(d) { return self.x(d[self.X_INDEX]); })
            .y1(function(d) { return self.y(d[self.Y_INDEX]); })
            .y0(this.h)
          :
          d3.svg.line()
            .interpolate(this.options.path.interpolate)
            .x(function(d) { return self.x(d[self.X_INDEX]); })
            .y(function(d) { return self.y(d[self.Y_INDEX]); })
    );
    
    this.paths.push(
        this.pathContext.append("path")
          .attr("class", "path")
          .attr("fill", this.options.path.type == "area" ? this.defaultLineColors[i] : "none") 
          .attr("stroke", this.defaultLineColors[i]) 
    );
    
    this.circles.push(
        this.focus.append("circle")
          .attr("fill", this.defaultLineColors[i]) 
          .attr("r", 2 + this.sizes.path[this.options.path.size])
    );
  }  
  
  if (!!this.options.path.displayShadow) {
    var defs = svg.append("defs");

    var filter = defs.append("filter")
        .attr("id", "drop-shadow")
        .attr("height", "150%");

    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 1)
        .attr("result", "blur");

    filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", -1)
        .attr("dy", 1)
        .attr("result", "offsetBlur");

    var feMerge = filter.append("feMerge");

    feMerge.append("feMergeNode")
        .attr("in", "offsetBlur");
    
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");
        
    this.pathContext.style("filter", "url(#drop-shadow)"); 
  } 
  
  this.resumeHover = true;
  if (!!self.options.hover) {
    this.mouseListenerContext = this.graphContext.append("rect")  
      .attr("class", "overlay")
      .attr("width", this.w)
      .attr("height", this.h)
      .on("mousedown", function() {
        self.resumeHover = false;
        clearTimeout(self.hoverUpdateTimeout);
      })
      .on("mouseup", function() {
        self.resumeHover = true;
        self.__hoverUpdate(); 
      })
      .on("mousemove", function() { 
        self.hoverCoords = d3.mouse(this); 
      }) 
      .on("mouseout",  function() {
        self.focus.attr("display", "none");  
        self.legendsContext.unset(); 
        clearTimeout(self.hoverUpdateTimeout);
      })
      .on("mouseover", function() { 
        if (self.resumeHover && self.data) {
          self.hoverCoords = d3.mouse(this);
          self.__hoverUpdate(); 
        }
      });
  }
 
  if (!!this.options.legend.display) {
    this.legends = [];
    this.shadows = []; 
    
    var legendOrientation = {
        "translate"  : { "left" : "(" + 5 + ", 2)", "right" : "(" + (this.w-5) + ", 2)" },
        "textAnchor" : { "left" : "start",          "right" : "end" },
    };
    
    this.legendsContext = this.graphContext.append("g")
      .attr("class", "legends")
      .attr("transform", "translate" + legendOrientation.translate[this.options.legend.orientation.toLowerCase()])
      .attr("text-anchor", legendOrientation.textAnchor[this.options.legend.orientation.toLowerCase()])
      .attr("font-size", this.sizes.text[this.options.legend.size]); 
    
    this.legendsContext.set = function(dp, index) {  
        self.legends[index].text(dp[self.Y_INDEX]);
        self.shadows[index].text(dp[self.Y_INDEX]);
    }; 
    
    this.legendsContext.unset = function() {
      for (var i = 0; i < self.curNumLines; i++) {
        self.legends[i].text(self.data[i].label);
        self.shadows[i].text(self.data[i].label);
      } 
    };
    
    //have to do this because of JavaScript closures...
    var functions = {
        __highlight   : [ function() { self.__highlight(0);   }, function() { self.__highlight(1);   }, function() { self.__highlight(2);   }, function() { self.__highlight(3);   } ],
        __unhighlight : [ function() { self.__unhighlight(0); }, function() { self.__unhighlight(1); }, function() { self.__unhighlight(2); }, function() { self.__unhighlight(3); } ], 
    };
     
    for (var i = 0; i < this.maxNumLines; i++) { 
      this.shadows.push(
          this.legendsContext.append("text")
            .attr("class", "legendShadow")
            .attr("y", (i+1)*this.sizes.text[this.options.legend.size]) 
      );
      this.legends.push(
          this.legendsContext.append("text")
            .attr("class", "legend")
            .attr("fill", this.defaultLineColors[i]) 
            .attr("y", (i+1)*this.sizes.text[this.options.legend.size]) 
      );
      if (!!this.options.hover) {
        this.legends[i]
          .on("mouseover", functions.__highlight[i])
          .on("mouseout", functions.__unhighlight[i]);
      }
    } 
  }
  
  if (data) {
    this.plot(data);
  } 
  
  if (!!this.options.debug.displayBox) {
    this.context.append("rect")
      .attr("fill", "rgba(0,0,0,0.5")
      .attr("width", this.W)
      .attr("height", this.H);
  } 
  if (!!this.options.debug.displayBorder) {
    this.context.append("rect")
      .attr("fill", "rgba(0,0,0,0)")
      .attr("stroke", "black")
      .attr("width", this.W)
      .attr("height", this.H);
  } 
};

(function() {
  
  Graph.prototype.displayDateFormat = d3.time.format("%I:%M %p %a %b %d %Y"); 
  
  Graph.prototype.clear = function() {
    this.data = null;
    this.curNumLines = 0;
    this.__reset();
    this.update();
  };
   
  Graph.prototype.plot = function(array) {
    if (array[0]["data"]) {
      this.__plotData(array);
    }
    if (array[0]["f"]) {
      this.__plotFunction(array); 
    }
  };
  
  Graph.prototype.__plotFunction = function(data) { 
    var d = [];
    for (var i = 0; i < data.length; i++) {
      var obj = {
        "data"  : [],
        "label" : data[i].label,
        "color" : data[i].color,
      };
      for (var x = data[i].domain[0]; x <= data[i].domain[1]; x += data[i].dx) {
        obj.data.push([x, data[i].f(x)]);
      }
      d.push(obj);
    }
    this.__plotData(d);
  };
  
  Graph.prototype.__plotData = function(data) {
    this.data = data;
    this.curNumLines = this.data.length; 
    
    this.__reset();
    
    for (var i = 0; i < this.curNumLines; i++) {
      var lineColor = data[i].color ? data[i].color : this.defaultLineColors[i]; 
      
      if (!!this.options.legend.display) {
        this.shadows[i].text(this.data[i].label);
        this.shadows[i].attr("display", null);
        
        this.legends[i].text(this.data[i].label);
        this.legends[i].attr("display", null); 
        this.legends[i].attr("fill", lineColor);
      }
       
      this.paths[i].attr("display", null);
      this.paths[i].attr("fill", this.options.path.type == "area" ? lineColor : "none");
      this.paths[i].attr("stroke", lineColor);
      
      this.circles[i].attr("display", null);
      this.circles[i].attr("fill", lineColor);
    }
  
    this.xExtent = this.__getXExtent();
    this.yExtent = this.__getYExtent();
    this.extent = [[this.xExtent[0], this.yExtent[0]],[this.xExtent[1], this.yExtent[1]]];
    
    this.x.domain(this.xExtent);
    this.y.domain(this.yExtent);
    
    for (var i = 0; i < this.curNumLines; i++) { 
      if (!!this.options.legend.display) {
        this.legends[i].text(this.data[i].label);
      }
      this.paths[i].datum(this.data[i].data);
    } 
    
    this.update();
  };
  
  Graph.prototype.update = function() { 
    if (!!this.options.xAxis.displayGrid) {
      this.xGridAxisContext.call(this.xGridAxis);
    }
    if (!!this.options.yAxis.displayGrid) {
      this.yGridAxisContext.call(this.yGridAxis);
    }
    
    this.xAxisContext.call(this.xAxis);
    this.yAxisContext.call(this.yAxis);
    
    var self = this;

    this.xAxisContext.selectAll("text")  
      .append("svg:title")
      .text(function (d) { return self.__xAxisTickTitleFormat(d); });
    
    this.yAxisContext.selectAll("text")  
      .append("svg:title")
      .text(function (d) { return self.__yAxisTickTitleFormat(d); });
    
    for (var i = 0; i < this.curNumLines; i++) {
      this.paths[i].attr("d", this.lines[i]);
    } 
  };
  
  Graph.prototype.__reset = function() {
    this.x.domain([0, 1]);
    this.y.domain([0, 1]);
    for (var i = this.curNumLines; i < this.maxNumLines; i++) {
      if (!!this.options.legend.display) {
        this.shadows[i].text("");
        this.shadows[i].attr("display", "none");
        
        this.legends[i].text("");
        this.legends[i].attr("display", "none"); 
        this.legends[i].attr("fill", this.defaultLineColors[i]);
      }
      
      this.paths[i].attr("display", "none");
      this.paths[i].attr("fill", "none");
      this.paths[i].attr("stroke", this.defaultLineColors[i]); 
      
      this.circles[i].attr("display", "none"); 
      this.circles[i].attr("fill", this.defaultLineColors[i]);
    }
  };
  
  Graph.prototype.__hoverUpdate = function() { 
    if (this.hoverCoords[0] != this.hoverMouseX) {
      this.hoverMouseX = this.hoverCoords[0];
      
      for (var i = 0; i < this.curNumLines; i++) {
        var time  = this.x.invert(this.hoverMouseX);
        var index = this.bisector(this.data[i].data, time);
        
        var dp1 = undefined;
        var dp2 = undefined;
        while (!dp1) {
          dp1 = this.data[i].data[  index];
          dp2 = this.data[i].data[--index];
        }
        var dp = (time - dp1[this.X_INDEX] < dp2[this.X_INDEX] - time) ? dp2 : dp1;
        
        var xPos = this.x(dp[this.X_INDEX]);
        var yPos = this.y(dp[this.Y_INDEX]);
        
        if (xPos >= 0 && xPos <= this.w && yPos >= 0 && yPos <= this.h) { 
          this.circles[i].attr("display", null);
          this.circles[i].attr("transform", "translate(" + xPos + "," +  yPos + ")");
          this.legendsContext.set(dp, i);
        }
        else {
          this.circles[i].attr("display", "none");
        } 
      } 
      this.focus.attr("display", null); 
    }  
     
    var self = this;
    this.hoverUpdateTimeout = setTimeout(function() { self.__hoverUpdate(); }, 50);
  };
  
  Graph.prototype.__getXExtent = function() {
    var xExt = this.__getExtent(this.X_INDEX);
    return [ this.options.xAxis.min != undefined ? this.options.xAxis.min : xExt[0], this.options.xAxis.max != undefined ? this.options.xAxis.max : xExt[1] ];
  };
  
  Graph.prototype.__getYExtent = function() {
    var yExt = this.__getExtent(this.Y_INDEX);
    return [ this.options.yAxis.min != undefined ? this.options.yAxis.min : yExt[0], this.options.yAxis.max != undefined ? this.options.yAxis.max : yExt[1] ];
  };
  
  Graph.prototype.__getExtent = function(index) {
    var min = Number.MAX_VALUE;
    var max = Number.MIN_VALUE; 
    for (var i = 0; i < this.curNumLines; i++) {
      var line = this.data[i].data;
      for (var j = 0; j < line.length; j++) {
        min = Math.min(min, line[j][index]);
        max = Math.max(max, line[j][index]);
      }
    }
    return [min, max];
  };
  
  Graph.prototype.__xAxisTickFormat = function(xVal) {
    return !!this.options.xAxis.displayValues ? 
        (this.xAxisIsTime ? customTimeFormat(xVal) : Math.round(xVal * 100) / 100) : "";
  };
  
  Graph.prototype.__yAxisTickFormat = function(yVal) {
    return !!this.options.yAxis.displayValues ? 
        Math.round(yVal * 100) / 100 : "";
  };
  
  Graph.prototype.__yAxisTickTitleFormat = function(yVal) {
    return Math.round(yVal * 100) / 100;
  };
  
  Graph.prototype.__xAxisTickTitleFormat = function(xVal) {
    return this.xAxisIsTime ? this.displayDateFormat(new Date(xVal)) : Math.round(xVal * 100) / 100;
  };
  
  Graph.prototype.setExtent = function(extent) {
    this.x.domain([extent[0][0], extent[1][0]]);
    this.y.domain([extent[0][1], extent[1][1]]);
    this.update();
  };
  
  Graph.prototype.setXDomain = function(domain) {
    this.x.domain(domain);
    this.update();
  };
  
  Graph.prototype.setYDomain = function(domain) {
    this.y.domain(domain);
    this.update();
  };
  
  Graph.prototype.__highlight = function(index) {
    this.legends[index].attr("class", "legendHighlight");
    this.shadows[index].attr("class", "legendShadowHighlight");
    this.paths  [index].attr("class", "pathHighlight"); 
    this.paths  [index].attr("stroke-width", 2 + this.sizes.path[this.options.path.size]);  
  };
  
  Graph.prototype.__unhighlight = function(index) {
    this.legends[index].attr("class", "legend");
    this.shadows[index].attr("class", "legendShadow");
    this.paths  [index].attr("class", "path");
    this.paths  [index].attr("stroke-width", this.sizes.path[this.options.path.size]);
  };

})();


function Brush(svg, userOptions, graphs) {
  
  var self = this;
  
  this.sizes = {
    text   : { XS : 10, S : 13, M : 16, L : 19, XL : 22 },
    border : {          S :  1, M :  2, L :  3          },
    path   : { XS :  1, S :  2, M :  3, L :  4, XL :  5 },
  };
  
  this.defaultOptions = {
    "margin" : { t : 20, r : 15, b : 0, l : 45 },
    "xPos"   : 0,
    "yPos"   : 0,
    "width"  : 400,
    "height" : 50,
    "mode"   : "xy",
    "xAxis"  : { displayPath :  true, displayValues :  true, displayGrid : false, label : "", min : undefined, max : undefined, time : false },
    "yAxis"  : { displayPath : false, displayValues : false, displayGrid : false, label : "", min : undefined, max : undefined, },
    "path"   : { displayShadow : false, interpolate : "monotone", size : "XS", type : "area" },
    "border" : { display : false },
    "debug"  : { displayBox : false, displayBorder: false },
  };
  
  this.options = createOptions(this.defaultOptions, userOptions);
  
  this.xPos = this.options.xPos;
  this.yPos = this.options.yPos;
  this.margin = this.options.margin;
  this.W = this.options.width;  //this svg element width
  this.H = this.options.height; //this svg element height
  this.w = this.W - this.margin.r - this.margin.l; //graph width
  this.h = this.H - this.margin.t - this.margin.b; //graph height
  
  this.data;
  this.xExtent;
  this.yExtent;
  this.hoverCoords;
  this.hoverMouseX;
  this.hoverMouseY;
  this.hoverUpdateTimeout; 
  this.bisector = d3.bisector(function(d) { return d[self.X_INDEX]; }).right;
  
  this.xAxisIsTime = this.options.xAxis.time;
  this.mode = this.options.mode.toLowerCase();
  
  this.context = svg.append("g")
    .attr("class", "brush")
    .attr("width", this.W)
    .attr("height", this.H)
    .attr("transform", "translate(" + this.xPos + "," +  this.yPos + ")"); 
  
  this.graphContext = this.context.append("g") 
    .attr("width", this.w)
    .attr("height", this.h)
    .attr("transform", "translate(" + this.margin.l + "," + this.margin.t + ")");
  
  this.graphOpts = {
    "margin" : { t : 0, r : 0, b : 12, l : 0 },
    "xPos"   : 0,
    "yPos"   : 0,
    "width"  : this.w,
    "height" : this.h,
    "hover"  : false,
    "legend" : { display : false },
    "xAxis"  : this.options.xAxis,
    "yAxis"  : this.options.yAxis,
    "path"   : this.options.path,
    "border" : this.options.border,
    "debug"  : { displayBox : false },
  };
  
  this.graph = new Graph(this.graphContext, this.graphOpts); 
  
  this.graph.defaultLineColors = ["steelblue", "steelblue"];
  this.graph.maxNumLines = 2;
  
  this.resetLabel = this.graphContext.append("g")
    .attr("transform", "translate(" + (-30) + "," + (2+this.h/2) + ")")
    .attr("text-anchor", "start")
    .attr("class", "showAllLabel")
    .append("text")
    .text("all")
    .on("click", function() { self.showAll(); });
  
  this.xLabels = this.graphContext.append("g")
    .attr("transform", "translate(" + this.w + ", -6)")
    .attr("text-anchor", "end")
    .append("text")
    .attr("class", "xLabels");
  
  this.brush = d3.svg.brush()
    .on("brush", function() { self.refreshBrush(); });
  
  this.brushRect = this.graphContext.append("g")
    .attr("class", "brush");

  if (this.mode == "x") {
    this.brush.x(this.graph.x);
    this.brushRect.call(this.brush)
      .selectAll("rect")
      .attr("height", this.graph.h);
  }
  if (this.mode == "y") {
    this.brush.y(this.graph.y);
    this.brushRect.call(this.brush)
      .selectAll("rect")
      .attr("width", this.graph.w);
  }
  if (this.mode == "xy" || this.mode == "yx") {
    this.brush.x(this.graph.x);
    this.brush.y(this.graph.y);
    this.brushRect.call(this.brush);
  }
  
  if (graphs) {
    this.setGraphsInSync(graphs);
  }
  else {
    this.refreshBrush();
  }
  
  if (!!this.options.debug.displayBox) {
    this.context.append("rect")
      .attr("fill", "rgba(0,0,0,0.5")
      .attr("width", this.W)
      .attr("height", this.H);
  } 
  if (!!this.options.debug.displayBorder) {
    this.context.append("rect")
      .attr("fill", "rgba(0,0,0,0)")
      .attr("stroke", "black")
      .attr("width", this.W)
      .attr("height", this.H);
  } 
}

(function() {
  
  Brush.prototype.displayDateFormat = d3.time.format("%I:%M %p %a %b %d %Y");
  
  Brush.prototype.setGraphsInSync = function(graphs) {
    this.graphsInSync = graphs;
    this.graph.xAxisIsTime = this.graphsInSync[0].xAxisIsTime;
    this.__plot(this.graphsInSync[0].data);
  };

  Brush.prototype.clear = function() {
    this.graph.clear();
  };
  
  Brush.prototype.refreshBrush = function() {
    this.brushExtent = this.brush.extent();
    
    this.xLabels.text(this.graph.__xAxisTickTitleFormat(this.brushExtent[0]) + " - "
                    + this.graph.__xAxisTickTitleFormat(this.brushExtent[1]));
    
    var newDomain = this.brush.empty() ? this.graphsInSync[0].extent : this.brushExtent;
    
    for (var i = 0; this.graphsInSync && i < this.graphsInSync.length; i++) { 
      if (this.mode == "x") {
        this.graphsInSync[i].setXDomain(newDomain);
      }
      if (this.mode == "y") {
        this.graphsInSync[i].setYDomain(newDomain);
      }
      if (this.mode == "xy" || this.mode == "yx") {
        this.graphsInSync[i].setExtent(newDomain);
      }
    }
  };
  
  Brush.prototype.setBrushExtent = function(extent) { 
    this.brush.extent(extent);
    this.refreshBrush(); 
    this.brushRect.call(this.brush);
  };
  
  Brush.prototype.__plot = function(data) {
    this.graph.plot(data);
    this.showAll();
  }; 
  
  Brush.prototype.showAll = function() {
    if (this.mode == "x") {
      this.setBrushExtent(this.graphsInSync[0].xExtent);
    }
    if (this.mode == "y") {
      this.setBrushExtent(this.graphsInSync[0].yExtent);
    }
    if (this.mode == "xy" || this.mode == "yx") {
      this.setBrushExtent(this.graphsInSync[0].extent);
    }
  };
  
})(); 