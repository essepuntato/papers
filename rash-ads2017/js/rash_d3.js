/*
 * rash.js - Version 0.5, February 15, 2016
 * Copyright (c) 2014-2016, Silvio Peroni <essepuntato@gmail.com>
 * 
 * with precious contributions by Ruben Verborgh.
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with 
 * or without fee is hereby granted, provided that the above copyright notice and this 
 * permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD 
 * TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. 
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR 
 * CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR 
 * PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING 
 * OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

/* Additional jQuery functions */
jQuery.fn.extend({
    countWords: function () {
        var text = $(this).text();
        var regex = /\s+/gi;
        var total_word_count = text.trim().replace(regex, ' ').split(' ').length;
        var table_text = $(this).find("table").text();
        var table_word_count = table_text.trim().replace(regex, ' ').split(' ').length;
        return total_word_count - table_word_count
    },
    countElements: function (css_selector) {
        return $(this).find(css_selector).length;
    },
    findNumber: function(css_selector) {
        var cur_count = 0;
        var cur_el = $(this);
        var found = false;
        $(css_selector).each(function(){
            if (!found) {
                cur_count++;
                found = cur_el[0] === $(this)[0];
            }
        });
        return cur_count;
    },
    findHierarchicalNumber: function(css_selector) {
        var cur_count = 1;
        $(this).prevAll(css_selector).each(function() {
            cur_count++;
        });
        var parents = $(this).parents(css_selector);
        if (parents.length > 0) {
            return $(parents[0]).findHierarchicalNumber(css_selector) + "." + cur_count;
        } else {
            return cur_count;
        }
    },
    changeCSS: function(currentStyle) {
        if (currentStyle) {
            var current_path = null;
            $("link[rel='stylesheet']").each(function() {
                if (current_path == null) {
                    var cur_href = $(this).attr("href");
                    if (cur_href.match(/\.css$/)) {
                        var cur_index = cur_href.lastIndexOf("/");
                        if (cur_index < 0) {
                            current_path = "";
                        } else {
                            current_path = cur_href.substring(0, cur_index + 1);
                        }
                    }
                }
            });
            if (current_path == null) {
                current_path = "";
            }
            
            if (currentStyle == "#rash_web_based_layout") { /* Transform to Web layout */
                $("link[rel='stylesheet']").remove();
                var bootstrap_css = $("<link rel=\"stylesheet\" href=\"" + current_path + "bootstrap.min.css\"/>");
                var rash_css = $("<link rel=\"stylesheet\" href=\"" + current_path + "rash.css\"/>");
                bootstrap_css.appendTo($("head"));
                rash_css.appendTo($("head"));
                $("#layoutselection").text("Web-based");
                $(this).hideCSS();
                $(this).addHeaderHTML();
                $(this).orderCaptions(false);
            } else if (currentStyle == "#rash_lncs_layout") { /* Transform to Springer LNCS layout */
                $("link[rel='stylesheet']").remove();
                var lncs_css = $("<link rel=\"stylesheet\" href=\"" + current_path + "lncs.css\"/>");
                lncs_css.appendTo($("head"));
                $("#layoutselection").text("Springer LNCS");
                $(this).hideCSS();
                $(this).addHeaderLNCS();
                $(this).orderCaptions(true, $(tablebox_selector));
            }
        }
    },
    toggleCSS: function() {
        $(".footer ul").toggle();
    },
    hideCSS: function() {
        $(".footer ul").hide();
    },
    addHeaderHTML: function() {
        /* Reset header */
        $("header").remove();
        $("p.keywords").remove();
    
        /* Header title */
        var header = $("<header class=\"page-header container\"></header>");
        header.prependTo($("body"))
        var title_string = "";
        var title_split = $("head title").html().split(" -- ");
        if (title_split.length == 1) {
            title_string = title_split[0];
        } else {
            title_string = title_split[0] + "<br /><small>" + title_split[1] + "</small>";
        }
        
        header.append("<h1 class=\"title\">" + title_string + "</h1>")
        /* /END Header title */
    
        /* Header author */
        var list_of_authors = [];
        $("head meta[name='dc.creator']").each(function() {
            var current_value = $(this).attr("name");
            var current_id = $(this).attr("about");
            var current_name = $(this).attr("content");
            var current_email = $("head meta[about='" + current_id + "'][property='schema:email']").attr("content");
            var current_affiliations = [];
            $("head link[about='" + current_id + "'][property='schema:affiliation']").each(function() {
                var cur_affiliation_id = $(this).attr("href");
                current_affiliations.push($("head meta[about='" + cur_affiliation_id + "'][property='schema:name']").attr("content"));
            });
            
            list_of_authors.push({
                "name": current_name,
                "email": current_email,
                "affiliation": current_affiliations
            });
        });
        
        for (var i = 0; i < list_of_authors.length; i++) {
            var author = list_of_authors[i];
            var author_element = $("<address class=\"lead authors\"></address>");
            if (author["name"] != null) {
                var name_element_string = "<strong class=\"author_name\">" + author.name + "</strong>"
                if (author["email"] != null) {
                    name_element_string += " <code class=\"email\"><a href=\"mailto:" + author.email + "\">" + author.email + "</a></code>";
                }
                author_element.append(name_element_string);
            }
            
            for (var j = 0; j < author.affiliation.length; j++) {
                author_element.append(
                    "<br /><span class=\"affiliation\">" + 
                    author.affiliation[j].replace(/\s+/g, " ").replace(/, ?/g, ", ").trim() + "</span>");
            }
            if (i == 0) {
                author_element.insertAfter($("header h1"));
            } else {
                author_element.insertAfter($("header address:last-of-type"));
            }
        }
        /* /END Header author */
        
        /* ACM subjects */
        var categories = $("meta[name='dcterms.subject']");
        if (categories.length > 0) {
            var list_of_categories = $("<p class=\"acm_subject_categories\"><strong>ACM Subject Categories</strong></p>");
            categories.each(function() {
                list_of_categories.append("<br /><code>" + $(this).attr("content").split(",").join(", ") + "</code>");
            });
            list_of_categories.appendTo(header);
        }
        /* /END ACM subjects */
        
        /* Keywords */
        var keywords = $("meta[property='prism:keyword']");
        if (keywords.length > 0) {
            var list_of_keywords = $("<ul class=\"list-inline\"></ul>");
            keywords.each(function() {
                list_of_keywords.append("<li><code>" + $(this).attr("content") + "</code></li>");
            });
            $("<p class=\"keywords\"><strong>Keywords</strong></p>").append(list_of_keywords).appendTo(header);
        }
        /* /END Keywords */
    },
    /* This function modifies the current structure of the page in order to follow the
     * layout specification of the Lecture Notes in Computer Science by Springer. */
    addHeaderLNCS: function() {
        /* Initialise the page again */
        $(this).addHeaderHTML();
        
        /* Authors */
        var authors = $("<address class=\"lead authors\"></address>");
        
        /* Find all affiliations */
        var list_of_affiliations = [];
        $("header .authors .affiliation").each(function () {
            var cur_affiliation = $(this).text().trim();
            if (list_of_affiliations.indexOf(cur_affiliation) == -1) {
                list_of_affiliations.push(cur_affiliation);
            }
        });
        
        /* Find all authors metadata */
        var author_names = [];
        var author_affiliation_index = [];
        var author_email = [];
        $("header .authors").each(function() {
            /* Name */
            author_names.push($(this).find(".author_name").text().trim());
            
            /* Affiliation index */
            cur_affiliation_indexes = [];
            $(this).find(".affiliation").each(function() {
                cur_affiliation_indexes.push(list_of_affiliations.indexOf($(this).text().trim()) + 1);
            });
            author_affiliation_index.push(cur_affiliation_indexes);
            
            /* Email */
            author_email.push($(this).find(".email a").text().trim());
        });
        
        /* Add authors' names + affiliation number */
        for (var i = 0; i < author_names.length; i++) {
            var cur_affiliation_index = "";
            if (list_of_affiliations.length > 1) {
                cur_affiliation_index += "<sup>";
                for (var j = 0; j < author_affiliation_index[i].length; j++) {
                    if (j > 0) {
                        cur_affiliation_index += ", ";
                    }
                    cur_affiliation_index += author_affiliation_index[i][j];
                }
                cur_affiliation_index += "</sup>";
            }
            authors.append($("<strong class=\"author_name\">" + author_names[i] + cur_affiliation_index + "</strong>"));
        }
        
        /* Affiliation */
        authors.append("<br /><br />");
        var affiliations = $("<span class=\"affiliation\"></span>");
        for (var i = 0; i < list_of_affiliations.length; i++) {
            if (i > 0) {
                affiliations.append("<br />");
            }
            if (list_of_affiliations.length > 1) {
                affiliations.append("<sup>" + (i+1) + "</sup> ");
            }
            affiliations.append(list_of_affiliations[i]);
        }
        affiliations.appendTo(authors);
        
        /* Emails */
        authors.append("<br />");
        var emails = $("<code class=\"email\"></code>");
        for (var i = 0; i < author_email.length; i++) {
            if (i > 0) {
               emails.append(", "); 
            }
            emails.append(author_email[i]);
        }
        emails.appendTo(authors);
        
        /* Remove the all authors' metadata and add the new one */
        $("header address").remove();
        authors.appendTo($("header"));
        
        /* Keywords */
        $("header p.keywords").appendTo("section[role=doc-abstract]");
        /* /END Authors */
    },
    /* It reorder the captions */
    orderCaptions: function(captionFirst, listOfElements) {
        listOfElements = typeof listOfElements !== "undefined" ? 
            listOfElements : $(figurebox_selector + "," + tablebox_selector + "," + listingbox_selector);
        listOfElements.each(function()  {
            var parent_figure = $(this).parents("figure");
            if (captionFirst) {
                parent_figure.find("figcaption").prependTo(parent_figure);
            } else {
                parent_figure.find("figcaption").appendTo(parent_figure);
            }
        });
    },
	/* Creates graph of given type from input data */  
	convertToGraph: function(){
	
		function barHorChart(dataArray,replace,color){
            var barLabelWidth = 200; // Spazio riservato per le label delle bar
            var barLabelPadding = 5; // Padding tra bar e label delle bar
            var gridLabelHeight = 20; // Spazio per le linee tra le label
            var gridChartOffset = 5; // Spazio tra la griglia a la prima bar
            var maxBarWidth = 420; // Larghezza della barra con il valore massimo
            var xPos = 60; //Posizione della didascalia
	        var yLabelRange = 175;
	        var ydidasc = 210;
	        var data = [];
		    var w=720,h=215;//width e height
		    for(var i=0;i<dataArray.length/2;i++){
					var obj = {Nation: dataArray[i*2], Value: dataArray[i*2+1]};
					data.push(obj);
				}
				chart(data);
	
        function chart(data){
			    var barLabel = function (d) { return d['Nation']; };//Array contente tutte le nazioni
                var barValue = function (d) { return parseInt(d['Value']); };//Array contenente tutti i valori
			    var x = d3.scale.linear().domain([0, d3.max(data, barValue)]).range([0, maxBarWidth]);
			    var chart = d3.select(replace).append("svg")
               .attr('width', w)
               .attr('height', h)
		       // Bars
               var barsContainer = chart.append('g')
              .attr('transform', 'translate(' + (barLabelWidth+barLabelPadding) + ',' 
             + (gridLabelHeight - 2*gridChartOffset) + ')');
               barsContainer.selectAll("rect").data(data).enter().append("rect")
               .attr('y', function(d,i){ return i* 25; })
               .attr('height', 20)
               .attr('width', function (d) {return x(barValue(d)); })
               .attr('stroke', 'grey')
		       .attr("fill", function(d, i) { return color(i); } )
            // Label sull'asse delle y(nazioni)
               var labelsContainer = chart.append('g')
              .attr('transform', 'translate(' + barLabelWidth + ',' 
            + (gridLabelHeight + gridChartOffset) + ')');
               labelsContainer.selectAll('text').data(data).enter().append('text')
              .attr('y', function(d,i){ return i * 25; })
              .attr('stroke', 'none')
              .attr('fill', 'black')
              .attr('text-anchor', 'end')//il testo è ancorato partendo dalla fine
              .text(function(d,i){
		          return barLabel(d)});
			// Label sull'asse dei valori
               barsContainer.selectAll("text").data(data).enter().append("text")
               .attr("x", function (d) { return x(barValue(d)); })
               .attr("y", function(d,i){ return i* 25; })
               .attr("dx", 10) // padding-left
               .attr("dy", ".85em") // vertical-align: middle
               .attr("text-anchor", "start") // text-align: right
               .attr("fill", "black")
               .attr("stroke", "none")
               .text(function (d) { return d3.round(barValue(d), 2); });
		   //Linea del grafico(asse delle y)
               barsContainer.append("line")
              .attr("y1", -gridChartOffset)
              .attr("y2", barLabelWidth)
              .style("stroke", "#000");
		   //Linea del grafico(asse delle x)
		       barsContainer.append("line")
              .attr("x1", (-gridChartOffset*3))
              .attr("x2", maxBarWidth+ (gridChartOffset*3 ))
		      .attr("y1", 175)
		      .attr("y2", 175)
              .style("stroke", "#000");
		   /*Didascalia del grafico*/
		   chart.append("text")
           .attr("transform", "translate(" + (maxBarWidth - xPos) + " ," + ydidasc + ")")
           .style("text-anchor", "middle")
           .text("Value");
           chart.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", gridLabelHeight -gridChartOffset)
          .attr("x", 0 - xPos)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Nation");		
		 }
		}
		
		function barVertChart(dataArray,replace,color){
			// Estraggo i dati
			var data = [];
			//Setto i margini
			var margin = {
                top: 45,
                right: 75,
                bottom: 85,
                left: 85
            },
            w = 440,//width
            h = 270;//height
            var max = 300;//valore massimo per le label dell'asse y
			var xPos = 135;//traslazione sull'asse delle x
			var didascY = 330;//posizione y della didascalia
			var svg,sets;//container principale,container delle barre
			var xScale,yScale;//fattori di scala
			var xAxis,yAxis;//assi cartesiani
			    for(var i=0;i<dataArray.length/2;i++){
					var obj = {Nation: dataArray[i*2], Value: dataArray[i*2+1]};
					data.push(obj);
				}
				chart(data);
			function chart(data){
			/*Inzializzo i fattori di scala*/
			xScale = d3.scale.ordinal()
           .domain(d3.range(data.length))
           .rangeRoundBands([0, w],0.07);//fattori di scala per rappresentare i valori in pixel degli elementi(rettangoli) che andrà sull'asse delle x,con padding esterni di 0.05
            yScale = d3.scale.linear()
            .domain([0, max]).range([h,0]);
			/*Creo gli assi delle x(basso) e y(sinistra)*/
            xAxis = d3.svg.axis()
            .scale(xScale)
            .tickFormat(function (d) {
                 return data[d].Nation;
             })
            .orient("bottom");
            
            
            yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(5);

            //Creo l'SVG che conterrà il grafico
            svg = d3.select(replace).append("svg")
            .attr("width", w + margin.left + margin.right)
            .attr("height", h + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (xPos) + "," + margin.top + ")");

            //Creo il conteiner per le barre del grafico
           sets = svg.selectAll("bar")
          .data(data)
          .enter();
          sets.append("rect")
         .attr("class", "Value")
         .attr("width", xScale.rangeBand())
         .attr("y", function (d) {
            return yScale(d.Value);
         })
		 .attr("x",function(d, i){
		     return xScale(i);})
        .attr("height", function (d) {//L'altezza delle barre varia in base a al valore in scala dei valori
            return h - yScale(d.Value);
        })
		.attr('stroke', 'Gray')
        .attr("fill", function(d, i) { return color(i); } );
		
		sets.append("text")
		.attr("x", function(d, i) { return xScale(i)+15; })
        .attr("y", -30)
        .attr("fill", "black")
        .text(function(d) { return d.Value; });
		
        // Appendo l'asse delle x
       svg.append("g") 
       .attr("class", "x axis")
       .attr("transform", "translate(0," + (h) + ")")
       .call(xAxis)
       .selectAll("text")
       .style("text-anchor", "end")
       .attr("transform", function (d) {//ruoto le stringhe per migliorare la visibilità
            return "rotate(-25)";
        });
        // Appendo l'asse delle y
       svg.append("g")
       .attr("class", "y axis")
       .attr("transform", "translate(0 ,0)")
       .call(yAxis);
        
         /*Didascalie*/		
        svg.append("text")
        .attr("transform", "translate(" + (w / 2) + " ," + didascY + ")")
        .style("text-anchor", "middle")
        .text("Nation");

        svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - (margin.left+20))
        .attr("x", 0 - (h / 2))
        .style("text-anchor", "middle")
        .text("Value");
			}
}
		
		function barPieChart(dataArray,replace,color){
			/*Width,Height,Radius,Color*/
			var w = 500,h = 200,r = 100,xTranslate = 185;
			var data = [];
                            for(var i=0;i<dataArray.length/2;i++){
					var obj = {Nation: dataArray[i*2], Value: dataArray[i*2+1]};
					data.push(obj);
				}
				chart(data);
			function chart(data){
			/*Appendo al div l'svg che conterrà il grafico*/
			var pieChart = d3.select(replace).append("svg:svg")              
            .data([data])//Il grafico utilizza i dati contenuti su data                   
            .attr("width", w)//assegno larghezza           
            .attr("height", h)//assegno altezza
             .append("svg:g")//Assegno il group agli elementi       
            .attr("transform", "translate(" + xTranslate + "," + h / 2 + ")");//traslo il grafico
			var arc = d3.svg.arc()//creo l'arco esterno del grafico             
            .outerRadius(r);
             var pie = d3.layout.pie()//creo il layout a torta           
            .value(function(d) { return d.Value; });//recupero i valori
             
			 var arcs = pieChart.selectAll("g.slice")//Fetta della torta
            .data(pie)                           
            .enter()                            
            .append("svg:g")                
            .attr("class", "slice");    
             
			 arcs.append("svg:path")//Seleziono il percorso dei punti che disegneranno l'arco
             .attr("fill", function(d, i) { return color(i); } ) 
             .attr("d", arc);
			 
			 var count = 0,//Contatore per differenziare gli id della legenda
			 legend = pieChart.selectAll(".legend")//Chiamo il metodo per creare la legenda
            .data(data).enter()
            .append("g").attr("class", "legend")
            .attr("legend-id", function(d) {
                 return count++;
            })
            .attr("transform", function(d, i) {//Incolonno gli elementi
                return "translate(40," + (-70 + i * 20) + ")";
            })
  
            legend.append("rect")//Creo i rettangoli del colore del grafo
           .attr("x", w / 2)
           .attr("width", 18).attr("height", 18)
           .style("fill", function(d,i) {
               return color(i);
            });
			
            legend.append("text").attr("x", w / 2)//Aggiungo il testo
            .attr("y", 9).attr("dy", ".35em")
            .style("text-anchor", "end").text(function(d) {
                return ""+d.Nation+", "+d.Value;
            });
			}
		}
		
		function extractData(data){
			var kvarray = data.split("\n").filter(function(value){return /\w/.test(value);});
			var keys = kvarray[0].split(",");
			var values = kvarray[1].split(",");
			var min = Math.min(keys.length, values.length);
			var kvlist = new Array(2*min);
			for(i=0; i<min; i++){
				kvlist[2*i] = keys[i].trim();
				kvlist[2*i+1] = parseInt(values[i].trim());
			}
			return kvlist;
		}
		
		
		/* Graph creation based on type of the graph */
		var src = $(this).find("img").attr("src");
		switch($(this).find("img").attr("class")){
			case "horizontal_bar_chart":
			    switch($(this).closest("figure").attr("id")){
				    case "figure_1":
					    var replace = '<div id="d3div1"></div>';
			            $(this).replaceWith(replace);
						data = $(src).text();
					    barHorChart(extractData(data),"#d3div1",d3.scale.category10());			
			            break;
				    case "figure_4":
					    var replace = '<div id="d3div4"></div>';
			            $(this).replaceWith(replace);
						if(src.indexOf(".csv")>-1){
					        $.get(src, function(data){
                                barHorChart(extractData(data),"#d3div4",d3.scale.category20());									
					        });
						}						
			        break;
			    }
				break;
				case "vertical_bar_chart":
                switch($(this).closest("figure").attr("id")){
				    case "figure_2":
				        var replace = '<div id="d3div2"></div>';
			            $(this).replaceWith(replace);
				        data = $(src).text();
						barVertChart(extractData(data),"#d3div2",d3.scale.category10());				
			            break;
				    case "figure_5":
				        var replace = '<div id="d3div5"></div>';
			            $(this).replaceWith(replace);
					    if(src.indexOf(".csv")>-1){
					        $.get(src, function(data){
                                barVertChart(extractData(data),"#d3div5",d3.scale.category20());									
					        });
						}
			    }
				break;
				case "pie_chart":
				switch($(this).closest("figure").attr("id")){
				    case "figure_3":
				        var replace = '<div id="d3div3"></div>';
			            $(this).replaceWith(replace);
				        data = $(src).text();
						barPieChart(extractData(data),"#d3div3",d3.scale.category10());				
			            break;
				    case "figure_6":
				        var replace = '<div id="d3div6"></div>';
			            $(this).replaceWith(replace);
						if(src.indexOf(".csv")>-1){
					        $.get(src, function(data){
                                barPieChart(extractData(data),"#d3div6",d3.scale.category20());										
					        });
						}
				        break;
			    }
				break;
		}
	}
});

var figurebox_selector_img = "p > img:not([role=math])";
var figurebox_selector_svg = "p > svg";
var figurebox_selector = "figure > " + figurebox_selector_img + ", figure > " + figurebox_selector_svg;
var tablebox_selector_table = "table";
var tablebox_selector = "figure > " + tablebox_selector_table;
var formulabox_selector_img = "p > img[role=math]";
var formulabox_selector_span = "p > span[role=math]";
var formulabox_selector_math = "p > math";
var formulabox_selector = 
    "figure > " + formulabox_selector_img + ", figure > " + formulabox_selector_span + ", figure > " + formulabox_selector_math;
var listingbox_selector_pre = "pre";
var listingbox_selector = "figure > " + listingbox_selector_pre;

$(function() {
    /* LaTeX formulas */
    if (typeof MathJax !== 'undefined') {
        var s_delim = 's$s';
        var e_delim = 'e$e';
        $('body').attr("class", "nomath");
        $('span[role=math]').each(function() {
            $(this).attr("class", "math");
            $(this).html(s_delim + $(this).html() + e_delim);
        });
        MathJax.Hub.Config({
            tex2jax: {
                inlineMath: [ [s_delim, e_delim] ],
                processClass: "math",
                ignoreClass: "nomath"
            }
        });
    }
    /* /END LaTeX formulas */
    
    /* Code Block */
    $('pre').each(function() {
        $(this).html($.trim($(this).html()))
    });
    $('pre > code').each(function() {
        $(this).html($.trim($(this).html()))
    });
    /* /END Code Block */

    /* Bibliographic reference list */
    $('li[role=doc-biblioentry] , li[role=doc-biblioentry]').sort(function(a,b) {
        var a_text = $(a).text().replace(/\s+/g," ").split();
        var b_text = $(b).text().replace(/\s+/g," ").split();
        if (a_text < b_text) {
            return -1;
        } else if (a_text > b_text) {
            return 1;
        } else {
            return 0;
        }
    }).appendTo('section[role=doc-bibliography] ul , section[role=doc-bibliography] ol');
    /* /END Bibliographic reference list */
    
    /* Footnotes (part one) */
    $('section[role=doc-footnotes] section[role=doc-footnote]').sort(function(a,b) {
        var all_footnote_pointers = $("a[href]").each(function() {
            if ($.trim($(this).text()) == '' && $($(this).attr("href")).parents("section[role=doc-footnotes]")) {
                return $(this);
            }
        });
        var a_index = all_footnote_pointers.index(all_footnote_pointers.filter("a[href='#" + $(a).attr("id") + "']"));
        var b_index = all_footnote_pointers.index(all_footnote_pointers.filter("a[href='#" + $(b).attr("id") + "']"));
        if (a_index < b_index) {
            return -1;
        } else if (a_index > b_index) {
            return 1;
        } else {
            return 0;
        }
    }).appendTo('section[role=doc-footnotes]');
    $("section[role=doc-footnotes]").prepend("<h1>Footnotes</h1>");
    /* /END Footnotes (part one) */
    
    /* Captions */
    $(figurebox_selector).each(function() {
        var cur_caption = $(this).parents("figure").find("figcaption");
        var cur_number = $(this).findNumber(figurebox_selector);
        cur_caption.html("<strong>Figure " + cur_number + ".</strong> " + cur_caption.html());
    });
    $(tablebox_selector).each(function() {
        var cur_caption = $(this).parents("figure").find("figcaption");
        var cur_number = $(this).parent().findNumber(tablebox_selector);
        cur_caption.html("<strong>Table " + cur_number + ".</strong> " + cur_caption.html());
    });
    $(formulabox_selector).each(function() {
        var cur_caption = $(this).parents("figure").find("p");
        var cur_number = $(this).findNumber(formulabox_selector);
        cur_caption.html(cur_caption.html() + " (" + cur_number + ")");
    });
    $(listingbox_selector).each(function() {
        var cur_caption = $(this).parents("figure").find("figcaption");
        var cur_number = $(this).parent().findNumber(listingbox_selector);
        cur_caption.html("<strong>Listing " + cur_number + ".</strong> " + cur_caption.html());
    });
    /* /END Captions */
    
    /* References */
    $("a[href]").each(function() {
        if ($.trim($(this).text()) == '') {
           var cur_id = $(this).attr("href");
           referenced_element = $(cur_id); 
           
           if (referenced_element.length > 0) { 
                referenced_element_figure = referenced_element.find(figurebox_selector_img + "," + figurebox_selector_svg);
                referenced_element_table = referenced_element.find(tablebox_selector_table);
                referenced_element_formula = referenced_element.find(
                    formulabox_selector_img + "," + formulabox_selector_span + "," + formulabox_selector_math);
                referenced_element_listing = referenced_element.find(listingbox_selector_pre);
                /* Special sections */
                if (
                    $("section[role=doc-abstract]" + cur_id).length > 0 ||
                    $("section[role=doc-bibliography]" + cur_id).length > 0 ||
                    $("section[role=doc-footnotes]" + cur_id).length > 0 ||
                    $("section[role=doc-acknowledgements]" + cur_id).length > 0) {
                    $(this).html("Section <q>" + $(cur_id + " h1").text() + "</q>");
                /* Bibliographic references */
                } else if ($(cur_id).parents("section[role=doc-bibliography]").length > 0) {
                    var cur_count = $(cur_id).prevAll("li").length + 1;
                    $(this).html("[" + cur_count + "]");
                    $(this).attr("title", $(cur_id).text().replace(/\s+/g, " ").trim());
                /* Footnote references */
                } else if ($(cur_id).parents("section[role=doc-footnotes]").length > 0) {
                    var cur_contents = $(this).parent().contents();
                    var cur_index = cur_contents.index($(this));
                    var prev_tmp = null;
                    while (cur_index > 0 && !prev_tmp) {
                        cur_prev = cur_contents[cur_index - 1];
                        if (cur_prev.nodeType != 3 || $(cur_prev).text().replace(/ /g,'') != '') {
                            prev_tmp = cur_prev;
                        } else {
                            cur_index--;
                        }
                    }
                    var prev_el = $(prev_tmp);
                    var current_id = $(this).attr("href");
                    var footnote_element = $(current_id);
                    if (footnote_element.length > 0 && footnote_element.parent("section[role=doc-footnotes]").length > 0) {
                        var count = $(current_id).prevAll("section").length + 1;
                        $(this).after("<sup class=\"fn\">" + (prev_el.hasClass("fn") ? "," : "") +
                            "<a name=\"fn_pointer_" + current_id.replace("#", "") + 
                            "\" href=\"" + current_id + "\"" + 
                            "\" title=\"" + $(current_id).text().replace(/\s+/g," ").trim() + "\">" + count + "</a></sup>");
                        $(this).remove()
                    } else {
                        $(this).replaceWith("<span class=\"error\">ERR: footnote '" + current_id.replace("#","") + "' does not exist</span>");
                    }
                /* Common sections */
                } else if ($("section" + cur_id).length > 0) {
                    var cur_count = $(cur_id).findHierarchicalNumber(
                        "section:not([role=doc-abstract]):not([role=doc-bibliography]):" + 
                        "not([role=doc-footnotes]):not([role=doc-acknowledgements])");
                    if (cur_count != null && cur_count != "") {
                        $(this).html("Section " + cur_count);
                    }
                /* Reference to figure boxes */
                } else if (referenced_element_figure.length > 0) {
                    var cur_count = referenced_element_figure.findNumber(figurebox_selector);
                    if (cur_count != 0) {
                        $(this).html("Figure " + cur_count);
                    }
                /* Reference to table boxes */
                } else if (referenced_element_table.length > 0) {
                    var cur_count = referenced_element_table.findNumber(tablebox_selector);
                    if (cur_count != 0) {
                        $(this).html("Table " + cur_count);
                    }
                /* Reference to formula boxes */
                } else if (referenced_element_formula.length > 0) {
                    var cur_count = referenced_element_formula.findNumber(formulabox_selector);
                    if (cur_count != 0) {
                        $(this).html("Formula " + cur_count);
                    }
                /* Reference to listing boxes */
                } else if (referenced_element_listing.length > 0) {
                    var cur_count = referenced_element_listing.findNumber(listingbox_selector);
                    if (cur_count != 0) {
                        $(this).html("Listing " + cur_count);
                    }
                } else {
                    $(this).replaceWith("<span class=\"error\">ERR: referenced element '" + cur_id.replace("#","") + 
                        "' has not the correct type (it should be either a figure, a table, a formula, a listing, or a section)</span>");
                }
           } else {
               $(this).replaceWith("<span class=\"error\">ERR: referenced element '" + cur_id.replace("#","") + "' does not exist");
           }
        }
    });
    /* /END References */

    /* Footnotes (part 2) */
    $("section[role=doc-footnotes] > section[role=doc-footnote]").each(function() {
        var current_id = $(this).attr("id");
        $(this).children(":last-child").append(" <sup class=\"hidden-print\"><a href=\"#fn_pointer_" + current_id + "\">[back]</a></sup>");
    });
    /* /END Footnotes (part 2) */
    
    /* Container sections */
    $(
        "body > section , section[role=doc-abstract] , section[role=doc-acknowledgements] , " + 
        "section[role=doc-bibliography], section[role=doc-footnotes]").addClass("container");
    /* /END Container sections */
    
    /* Heading dimensions */
    $("h1").each(function () {
        var counter = 0;
        $(this).parents("section").each(function() {
            if ($(this).children("h1,h2,h3,h4,h5,h6").length > 0) {
                counter++;
            }
        });
        $(this).replaceWith("<h" + counter + ">"+ $(this).html() + "</h" + counter + ">")
    });
    /* /END Heading dimensions */
    
    /* Set header */
    $(this).addHeaderHTML();
    /* /END Set header */
    
    /* Bibliography */
    $("section[role=doc-bibliography] ul").replaceWith("<ol>" +$("section[role=doc-bibliography] ul").html() + "</ol>");
    /* /END Bibliography */
    
    /* Footer */
    var footer = $("<footer class=\"footer hidden-print\">" + 
        "<p><span>Words: " + $("body").countWords() + "</span>" +
        "<span>Figures: " + $("body").countElements(figurebox_selector) + "</span>" +
        "<span>Tables: " + $("body").countElements(tablebox_selector) + "</span>" +
        "<span>Formulas: " + $("body").countElements(formulabox_selector) + "</span>" +
        "<span>Listings: " + $("body").countElements(listingbox_selector) + "</span></p>" +
        "<div class=\"btn-group dropup\">" +
            "<button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" " + 
                "aria-expanded=\"false\" onClick=\"$(this).toggleCSS()\">" + 
                "Layout: <span id=\"layoutselection\">Web-based</span><span class=\"caret\"></span></button>" +
            "<ul class=\"dropdown-menu\" role=\"menu\">" +
                "<li><a href=\"#rash_web_based_layout\" onClick=\"$(this).changeCSS('#rash_web_based_layout')\">Web-based</a></li>" +
                "<li><a href=\"#rash_lncs_layout\" onClick=\"$(this).changeCSS('#rash_lncs_layout')\">Springer LNCS</a></li>" +
            "</ul>" +
        "</div>" +
        "</p></footer>");
    footer.appendTo($("body"))
    /* /END Footer */
    
    /* General function for loading CSS */
    var currentStyle = document.location.hash;
    $(this).changeCSS(currentStyle);
    
    /* This will be run only when the status (via hash in the URL) changes */
    $(window).on('hashchange',function() { 
        var currentStyle = document.location.hash;
        if (!currentStyle) {
            currentStyle = "#rash_web_based_layout";
        }
        $(this).changeCSS(currentStyle);
    });
    /* /END General function for loading CSS */
    
    /* Conversion of graphs' img_blocks into actual graphs */
	$('figure img').each(function(){
		$(this).parent().convertToGraph();
	});
	/* /END Conversion of graphs' img_blocks into actual graphs */
});
