// ************** Dev Notes *****************
  // EXAMPLE TO ADD TIME DELAY FOR TRANSITIONS:
  // nodeUpdate.select(".head-text")
  //   .delay(duration)
  //   .duration(duration)
  // var nodeExit = node.exit().transition()
  //   .duration(duration)
  //   .attr("transform", function(d) {
  //     return "translate(" + source.y + "," + source.x + ")";
  //   })
  //   .style("opacity", 0)
  //   .remove();


// ************** Custom Colors *****************
var color = {
  "red": "#ee5253",
  "blue": "#2e86de",
  "green": "#f368e0",
  "orange": "#ff9f43",
  "purple": "#00d2d3"
};


// ************** SVG Config *****************
var margin = {top: 100, right: 0, bottom: 0, left: 0},
  width = 960 - margin.right - margin.left,
  height = 1000 - margin.top - margin.bottom;

// --- Tree Sizing and Render Settings
var treeWidth = width,
  verticalDistance = 70,
  tree = d3.layout.tree()
    .size([treeWidth, height]),
  diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.x, d.y]; });

// --- Node Sizing and Content
var nodeRadius = 20,
  nameTextSize = 16,
  headTextSize = 13,
  subTextSize = 12,
  textBreak = 0,
  nodeSizeIncrement = 3,
  textBreakIncrement = 0.25;

function simulateUiClick(selector) {
  $(selector).toggleClass("active");
  setTimeout(function(){
    $(selector).toggleClass("active");
  }, 150);
}

function resetRenderDefaults() {
  width = 960 - margin.right - margin.left;
  height = 1000 - margin.top - margin.bottom;

  // --- Tree Sizing and Render Settings Defaults
  treeWidth = width;
  verticalDistance = 70;
  tree.size([treeWidth, height]);

  // --- Node Sizing and Content Defaults
  nodeRadius = 20;
  nameTextSize = 16;
  headTextSize = 13;
  subTextSize = 13;
  textBreak = 0;
  nodeSizeIncrement = 3;
  textBreakIncrement = 0.25;
  update(root);
}

function growNodeSize() {
  if (textBreak < 1.25) {
    nodeRadius += nodeSizeIncrement;
    nameTextSize += nodeSizeIncrement;
    headTextSize += nodeSizeIncrement;
    subTextSize += nodeSizeIncrement;
    textBreak += textBreakIncrement;
    update(root);
  }
}

function shrinkNodeSize() {
  if (textBreak > 0) {
    nodeRadius -= nodeSizeIncrement;
    nameTextSize -= nodeSizeIncrement;
    headTextSize -= nodeSizeIncrement;
    subTextSize -= nodeSizeIncrement;
    textBreak -= textBreakIncrement;
    update(root);
  }
}

// --- Animation Settings
var duration = 300;

// --- Tool Options
var selectedTool;

// --- Globals
var i = 0;
var newNodeHolder = {
  "name": "XP",
  "head": "",
  "sub": ""
};
var quickWordHolder = null;


// --- SVG Init
var svg = d3.select("#main").append("svg")
  .attr("width", "100%")
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .call(d3.behavior.zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", zoom))
      .on("dblclick.zoom", null)
  .append("g")
  .attr("id", "main-overlay")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var overlay = svg.append("rect")
  .attr({
    "class": "overlay",
    "width": "100%",
    "height": height,
    "id": "shape"
  });

// --- UI Helpers
function zoom() {
  svg.attr("transform",
    "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"
  );
}

function setTreeWidth(w) {
  treeWidth = w;
  tree.size([treeWidth, height]);
  update(root);
}

function getTreeHeight() {
  return verticalDistance;
}

function setTreeHeight(v) {
  verticalDistance = v;
  update(root);
}

function getTreeWidth() {
  return treeWidth;
}

function shrinkTreeWidth() {
  setTreeWidth(getTreeWidth() - 100);
}

function growTreeWidth() {
  setTreeWidth(getTreeWidth() + 100);
}

function shrinkTreeHeight() {
  setTreeHeight(getTreeHeight() - 20);
}

function growTreeHeight() {
  setTreeHeight(getTreeHeight() + 20);
}


// ************** Tree Rendering *****************
function update(source, performedUndo) {
  saveData(source);
  if (!performedUndo) {
    if (treeHistory.length > 19) {
      treeHistory.shift();
    }
    treeHistory.push(getCleanTreeClone(source));
    justCalledUndo = true;
  }

  // Compute the new tree layout.
  var nodes = tree.nodes(source).reverse();
  var links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * verticalDistance; });

  // Declare the nodes…
  var node = svg.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter the nodes.
  var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"; })
    .on('click', function(d) {
      var regex = /[+-]?\d+(\.\d+)?/g,
        str = $("#main-overlay").attr("transform"),
        zoomTranslation = str.match(regex).map(function(v) {
          return parseFloat(v);
        }),
        xn = zoomTranslation[0] + getScale(d.x,zoomTranslation),
        yn = zoomTranslation[1] + getScale(d.y,zoomTranslation),
        coords = [xn, yn];
      hover(d, coords, getSelectedTool());
    });

  // Style & Fill Circles
  nodeEnter.append("circle")
    .attr("r", 1e-6)
    .style("fill", "#fff");

  // Enter Text Node
  var nodeText = nodeEnter.append("text");

  // Style and Fill Name Text
  nodeText.append("tspan")
    .attr("y", function(d) {
      return (d.children || d._children ? 0 : 0) - 7;
    })
    .attr({
      "dy": ".35em",
      "class": "name-text",
      "text-anchor": "middle"
    })
    .style({
      "fill-opacity": 0,
      "font-size": nameTextSize + "px"
    });

  // Style and Fill Head Text
  nodeText.append("tspan")
    .attr("y", function(d) {
      return (d.children || d._children ? 0 : 0) - 7; })
    .attr({
      "x": 0,
      "dy": "1.5em",
      "class": "head-text",
      "text-anchor": "middle"
    })
    .style({
      "fill-opacity": 0,
      "font-size": headTextSize + "px"
    });

  // Style and Fill Subscript Text
  nodeText.append("tspan")
    .attr("y", function(d) {
      return (d.children || d._children ? 0 : 0) - 7; })
    .attr({
      "x": 18,
      "dy": "1.3em",
      "class": "sub-text",
      "text-anchor": "middle"
    })
    .style({
      "fill-opacity": 0,
      "font-size": subTextSize + "px"
    });

  // Transition node to their new position
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

  nodeUpdate.select("circle")
    .attr("r", function(d){
      if (d.sub.trim() === "") {
        return nodeRadius;
      } else {
        return nodeRadius + 15;
      }
    });


  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
    .duration(duration)
    .style("opacity", 0)
    .remove();

  // Transition any name text
  nodeUpdate.select(".name-text")
    .style({
      "fill-opacity": 1,
      "font-size": function(d){
        if (d.head.trim() === "") {
          return (nameTextSize+4) + "px";
        } else {
          return nameTextSize + "px";
        }
      }
    })
    .attr("y", function(d){
      if (d.head.trim() === "") {
        return "0";
      } else {
        return "-7";
      }
    })
    .attr("x", function(d){
      if (d.sub.trim() === "") {
        return "0";
      } else {
        return "-5";
      }
    })
    .text(function(d) {
      return d.name;
    });

  // Transition any head text
  nodeUpdate.select(".head-text")
    .style({
      "fill-opacity": function(d) {
        if (d.head.trim() === "") {
          return "0";
        } else {
          return "1";
        }
      },
      "font-size": headTextSize + "px"
    })
    .attr("y", textBreak - 7)
    .attr("x", function(d){
      if (d.sub.trim() === "") {
        return "0";
      } else {
        return "-5";
      }
    })
    .text(function(d) {
      return d.head;
    });

  // Transition any subscript text
  nodeUpdate.select(".sub-text")
    .style({
      "fill-opacity": function(d) {
        if (d.sub.trim() === "") {
          return "0";
        } else {
          return "1";
        }
      },
      "font-size": subTextSize + "px"
    })
    .attr("y", function(d){
      if (d.head.trim() === "") {
        return "10";
      } else {
        return (textBreak*12) + 10;
      }
    })
    .attr("x", function(d){
      if (d.sub.trim() === "") {
        return "0";
      } else {
        return "7";
      }
    })
    .text(function(d) {
      return d.sub;
    });

  // Declare the links…
  var link = svg.selectAll("path.link")
    .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", function(d) {
    var o = {x: d.target.parent.x, y: d.target.parent.y};
    return diagonal({source: o, target: o});
    })
    .style("stroke-opacity", 0);

  // Transition links to their new position.
  link.transition()
    .duration(duration)
    .attr("d", diagonal)
    .style("stroke-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
    .duration(duration)
    .style('stroke-width', 0)
    .style('stroke-opacity', 0)
    .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// ************** Edit Text Box *****************
function getNodeVal(node, prop) {
  return node[prop];
}

function fillInputBoxByRef(boxId, node, prop) {
  $(boxId).val(node[prop]);
}

function fillInputBoxByVal(boxId, val) {
  $(boxId).val(val);
}

function clearInputBox(boxId) {
  $(boxId).val("");
  $(boxId).attr("placeholder", "");
}

function checkModified(boxId) {
  return ($(boxId).attr("data-modified") === "true");
}

function setModifiedTrue(boxId) {
  $(boxId).attr("data-modified", "true");
}

function renameNodeProp(id, prop, value) {
  var nodeRef = getTreeNode(treeData, id);
  if (nodeRef) {
    nodeRef[prop] = value;
    update(root);
  }
}

function renderCreateBox(boxId, nodeId, relation) {
  $("#"+boxId).remove();
  var editBox = $("<input></input>")
    .attr({
      "id": boxId,
      "data-modified": "false",
      "type": "text",
      "placeholder": getNewNodeHolder().name,
      "onblur": 'insertFromHolder("#' + boxId + '",' + nodeId + ',"' + relation + '")'
    })
    .change(function(){
      setModifiedTrue("#"+boxId);
      setQuickWord($("#"+boxId).val());
    })
    .keyup(function(e){
      switch(e.keyCode) {

        // Enter Key
        case 13:
          if (!checkModified("#"+boxId)) {
            fillInputBoxByVal("#"+boxId, "XP");
            setModifiedTrue("#"+boxId);
          }
          $("#"+boxId).blur();
          clearSentenceOpts();
          break;

        // Escape Key
        case 27:
          $("#"+boxId).attr("data-cancelled", "true");
          $("#"+boxId).remove();
          clearSentenceOpts();
          break;

        // Right Arrow Key
        case 39:
          if (!checkModified("#"+boxId)) {
            fillInputBoxByVal("#"+boxId, "XP");
            setModifiedTrue("#"+boxId);
            $(this).selectRange(1);
          }
          break;

        // Backspace Key
        case 8:
          if (!checkModified("#"+boxId)) {
            clearInputBox("#"+boxId);
            setModifiedTrue("#"+boxId);
          }
          break;
      }
    });

  $("body").append(editBox);
  displaySentenceOpts("#"+boxId);
  editBox.focus();
}

function setQuickWord(word) {
  quickWordHolder = word;
}

function clearQuickWord() {
  quickWordHolder = null;
}

function displaySentenceOpts(inputId) {

  console.log("displaying sentence options...");

  var sentence = $("#sentence-content").val();

  var sentenceOpts = sentence.split(" ");

  var sentenceDom = $("<div></div>")
    .attr({
      "id": "sentence-opts",
    });

  if (sentence.length > 0) {
    sentenceOpts.forEach(function(item){
      var selectionObj = $("<div></div>")
        .attr({
          "class": "sentenceSelection",
          "onmouseout": "clearQuickWord()",
        })
        .mouseover(function(){
          setQuickWord(item);
        })
        .text(item);
      sentenceDom.append(selectionObj);
    });
  }

  // Add common options
  sentenceDom.append(function(){
    return $("<div></div>")
      .attr({
        "class": "sentenceSelection commonOpts"
      })
      .mouseover(function(){
        setQuickWord('Ø');
      })
      .text("null symbol");
  });

  $("body").prepend(sentenceDom);


}

function clearSentenceOpts() {
  console.log("clearing sentence options");
  $("#sentence-opts").remove();
}

function renderEditBox(boxId, nodeId, opt) {
  var nodeRef = getTreeNode(treeData, nodeId);
  $("#"+boxId).remove();

  var editBox = $("<input></input>")
    .attr({
      "id": boxId,
      "data-modified": "false",
      "type": "text",
      "placeholder": getNodeVal(nodeRef, opt),
      "onblur": 'confirmEdit("#' + boxId + '",' + nodeId + ',"' + opt + '")'
    })
    .change(function(){
      setModifiedTrue("#"+boxId);
    })
    .keyup(function(e){
      switch(e.keyCode) {

        // Enter Key
        case 13:
          $("#"+boxId).blur();
          clearSentenceOpts();
          break;

        // Escape Key
        case 27:
          $("#"+boxId).remove();
          clearSentenceOpts();
          break;

        // Right Arrow Key
        case 39:
          if (!checkModified("#"+boxId)) {
            fillInputBoxByRef("#"+boxId, nodeRef, opt);
            setModifiedTrue("#"+boxId);
            $(this).selectRange(1);
          }
          break;

        // Backspace Key
        case 8:
          if (!checkModified("#"+boxId)) {
            clearInputBox("#"+boxId);
            setModifiedTrue("#"+boxId);
          }
          break;
      }
    });

  $("body").append(editBox);
  displaySentenceOpts("#"+boxId);
  editBox.focus();
}

function confirmEdit(boxId, id, prop) {
  var value = $(boxId).val();
  var placeholder = $(boxId).attr("placeholder");
  var modified = checkModified(boxId);
  if (modified) {
    setQuickWord(value);
  }
  else if (!(quickWordHolder)) {
    setQuickWord(placeholder);
  }
  renameNodeProp(id, prop, quickWordHolder);
  $(boxId).remove();
  clearSentenceOpts();
  quickWordHolder = null;
}

function getScale(input, zoomTranslation) {
  if (zoomTranslation[2]) {
    return input*zoomTranslation[2];
  } else {
    return input;
  }
}

// ************** Toolbar Settings *****************

var toolbarSettings = {

  "edit": {

  },
  "add": {
    "selection_opt": ["all", "child", "parent", "left", "right"],
    "selection_type": "all",
    "edit_on_create": false,
    "auto_complete_phrase": false
  },
  "move": {

  },
  "delete": {

  },
  "build": {

  }

};

function getSelectedTool() {
  return selectedTool;
}

function toggleSetting(setting) {
  var settingObj = $("#setting-"+setting);
  if (settingObj.attr("data-setting") == "enabled") {
    settingObj.attr("data-setting", "disabled");
    settingObj.children("i").removeClass("fa-toggle-on");
    settingObj.children("i").addClass("fa-toggle-off");
  } else {
    settingObj.attr("data-setting", "enabled");
    settingObj.children("i").removeClass("fa-toggle-off");
    settingObj.children("i").addClass("fa-toggle-on");
  }
  var s = setting.split("-");
  toolbarSettings[s[0]][s[1]] = !toolbarSettings[s[0]][s[1]];
}

function persistToolSettings() {
  for (var setting in toolbarSettings) {
      // skip loop if the property is from prototype
      if (!toolbarSettings.hasOwnProperty(setting)) continue;
      var obj = toolbarSettings[setting];
      for (var prop in obj) {
          // skip loop if the property is from prototype
          if(!obj.hasOwnProperty(prop)) continue;
          if (obj[prop] === true) {
            var settingObj = $("#setting-"+setting+"-"+prop);
            settingObj.attr("data-setting", "enabled");
            settingObj.children("i").removeClass("fa-toggle-off");
            settingObj.children("i").addClass("fa-toggle-on");
          } else if (prop === "selection_type") {
            $("#setting-"+setting+"-selection_type").text(obj[prop]);
          }
      }
  }
}

function rotateSetting(setting) {
  var s = setting.split("-");
  var settingRef = toolbarSettings[s[0]];
  var index = settingRef.selection_opt.indexOf(settingRef.selection_type);
  if (index == settingRef.selection_opt.length-1) {
    settingRef.selection_type = settingRef.selection_opt[0];
    $("#setting-"+s[0]+"-selection_type").text(settingRef.selection_opt[0]);
  } else {
    settingRef.selection_type = settingRef.selection_opt[index+1];
    $("#setting-"+s[0]+"-selection_type").text(settingRef.selection_opt[index+1]);
  }
}

function toggleToolConfig() {
  if ($("#toolconfig").is(":visible")) {
    $("#toolconfig").hide();
  } else {
    $("#toolconfig").show();
  }
}

function setSelectedTool(select) {
  console.log(select);
  $(".toolbtn-opt").removeClass("selected");
  $(".toolsetting").hide();
  $("#toolbtn-" + select).addClass("selected");
  $("#toolsetting-" + select).show();
  selectedTool = select;
}



// ************** Option Box *****************
function hover(node, coords, opt) {
  clearOptionBox();
  var mouseX = coords[0]-98;
  var mouseY = coords[1]-41;

  var optionBox = d3.select("svg").append("g")
    .attr("id", "option-box")
    .attr("transform", "translate(" + mouseX + "," + mouseY + ")")
    .on('mouseleave',clearOptionBox)
    .on('click', clearOptionBox);

    optionBox.append("rect")
      .attr("width", 210)
      .attr("height",80)
      .attr("id", "option-rect");

    if (opt != "build") {
      showOpt(opt);
    } else {

      // Node Edit Options
      optionBox.append("text")
        .attr("class", "option-text-1")
        .style("fill", color.green)
        .attr("y", 68)
        .attr("x", 86)
        .text("add")
        .on('mouseover', function(){
          clearOption();
          showOpt("add");
        });

      optionBox.append("text")
        .attr("class", "option-text-1")
        .style("fill", color.purple)
        .attr("y", 45)
        .attr("x", 50)
        .text("edit")
        .on('mouseover', function(){
          clearOption();
          showOpt("edit");
        });

      optionBox.append("text")
        .attr("class", "option-text-1")
        .style("fill", color.red)
        .attr("y", 45)
        .attr("x", 120)
        .text("delete")
        .on('click', function(){
          clearOptionBox();
          deleteNode(node.id);
        });

      optionBox.append("text")
        .attr("class", "option-text-1")
        .style("fill", color.blue)
        .attr("y", 21)
        .attr("x", 80)
        .text("move")
        .on('mouseover', function(){
          clearOption();
          showOpt("move");
        });
    }

  function initiateAddLogic(boxId, nodeId, modType) {
    clearOptionBox();
    if (toolbarSettings.add.edit_on_create) {
      renderCreateBox(boxId, nodeId, modType);
    } else {
      initiateNodeInsertion(nodeId, modType);
    }
  }

  function initiateNodeInsertion(nodeId, modType) {
    switch (modType) {
      case "child":
        addChild(nodeId, useNewNodeHolder());
        break;
      case "parent":
        addParent(nodeId, useNewNodeHolder());
        break;
      case "left":
        addLeft(nodeId, useNewNodeHolder());
        break;
      case "right":
        addRight(nodeId, useNewNodeHolder());
        break;
    }
  }

  function showOpt(option) {

    switch (option) {
      case "add":
        if (toolbarSettings.add.selection_type != "all") {
          initiateAddLogic("create-field", node.id, toolbarSettings.add.selection_type);
        } else {
          optionBox.append("text")
            .attr("class", "option-text-2")
            .style("fill", color.green)
            .attr("y", 68)
            .attr("x", 77)
            .text("+child")
            .on('click', function(){
              initiateAddLogic("create-field", node.id, "child");
            });
          optionBox.append("text")
            .attr("class", "option-text-2")
            .style("fill", color.green)
            .attr("y", 20)
            .attr("x", 72)
            .text("+parent")
            .on('click', function(){
              initiateAddLogic("create-field", node.id, "parent");
            });
          optionBox.append("text")
            .attr("class", "option-text-2")
            .style("fill", color.green)
            .attr("y", 45)
            .attr("x", 45)
            .text("+left")
            .on('click', function(){
              initiateAddLogic("create-field", node.id, "left");
            });
          optionBox.append("text")
            .attr("class", "option-text-2")
            .style("fill", color.green)
            .attr("y", 45)
            .attr("x", 121)
            .text("+right")
            .on('click', function(){
              initiateAddLogic("create-field", node.id, "right");
            });
        }
    }

    switch (option) {
      case "move":
        optionBox.append("text")
          .attr("class", "option-text-2")
          .style("fill", color.blue)
          .attr("y", 20)
          .attr("x", 63)
          .text("parent pos")
          .on('click', function(){
            clearOptionBox();
            swapParent(node.id);
          });
        optionBox.append("text")
          .attr("class", "option-text-2")
          .style("fill", color.blue)
          .attr("y", 45)
          .attr("x", 15)
          .text("swap left")
          .on('click', function(){
            clearOptionBox();
            swapLeft(node.id);
          });
        optionBox.append("text")
          .attr("class", "option-text-2")
          .style("fill", color.blue)
          .attr("y", 45)
          .attr("x", 122)
          .text("swap right")
          .on('click', function(){
            clearOptionBox();
            swapRight(node.id);
          });
    }

    switch (option) {
      case "edit":
        optionBox.append("text")
          .attr("class", "option-text-2")
          .attr("y", 20)
          .attr("x", 83)
          .style("fill", color.purple)
          .text("name")
          .on('click', function(){
            clearOptionBox();
            renderEditBox("rename-field", node.id, "name");
          });
        optionBox.append("text")
          .attr("class", "option-text-2")
          .style("fill", color.purple)
          .attr("y", 45)
          .attr("x", 45)
          .text("head")
          .on('click', function(){
            clearOptionBox();
            renderEditBox("rename-field", node.id, "head");
          });
        optionBox.append("text")
          .attr("class", "option-text-2")
          .style("fill", color.purple)
          .attr("y", 45)
          .attr("x", 122)
          .text("subscript")
          .on('click', function(){
            clearOptionBox();
            renderEditBox("rename-field", node.id, "sub");
          });
    }

    switch (option) {
      case "delete":
          clearOptionBox();
          deleteNode(node.id);
          break;
    }
  }

  function clearOption() {
    var removeOption = d3.selectAll(".option-text-1").remove();
  }

  function clearOptionBox() {
    var removeOptionBox = d3.selectAll("#option-box").remove();
  }
}

function click(){

  // Ignore the click event if it was suppressed
  if (d3.event.defaultPrevented) return;

  // Extract the click location\
  var point = d3.mouse(this);
  var p = {x: point[0], y: point[1] };

  $("#coord").text("x:"+p.x+", y:"+p.y);

}

var drag = d3.behavior.drag()
    .on("drag", dragmove);

function dragmove(d) {
  var x = d3.event.x;
  var y = d3.event.y;
  d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
}

$.fn.selectRange = function(start, end) {
    if(end === undefined) {
        end = start;
    }
    return this.each(function() {
        if('selectionStart' in this) {
            this.selectionStart = start;
            this.selectionEnd = end;
        } else if(this.setSelectionRange) {
            this.setSelectionRange(start, end);
        } else if(this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

function insertFromHolder(boxId, nodeId, relation) {
  if ($(boxId).attr("data-cancelled") != "true") {
    // ----
    // This is repetitive code please refactor ***
    var value = $(boxId).val();
    var placeholder = $(boxId).attr("placeholder");
    var modified = checkModified(boxId);
    if (modified) {
      setQuickWord(value);
    }
    // ------
    else if (!(quickWordHolder)) {
      setQuickWord(placeholder);
    }
    setNewNodeHolder({
      "name": quickWordHolder,
      "head": "",
      "sub": ""
    });
    switch (relation) {
      case "child":
        addChild(nodeId, useNewNodeHolder());
        break;
      case "parent":
        addParent(nodeId, useNewNodeHolder());
        break;
      case "left":
        addLeft(nodeId, useNewNodeHolder());
        break;
      case "right":
        addRight(nodeId, useNewNodeHolder());
        break;
    }
  }
  $(boxId).remove();
  clearSentenceOpts();
}