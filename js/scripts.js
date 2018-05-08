function saveData(treeRoot) {
  console.log("saving data...");
  localStorage.setItem('syntactique-data', getTreeStringFromJSON(treeRoot));
}

function loadData() {
  console.log("loading data...");
  return getJSONFromTreeString(localStorage.getItem('syntactique-data'));
}

function restart() {
  console.log("resetting tree...");
  localStorage.removeItem('syntactique-data');
  window.location.reload();
}

$(document).ready(function () {

  persistToolSettings();
  setSelectedTool("add");

  $.getJSON( "../data/xbar-structures.json", function( res ) {
    structureLib = res.data;
  }).fail(function(){
    console.log("xbar structure library loading failed...");
  });

  // Init Tree Model (testing)
  var retrievedData = loadData();
  if (retrievedData) {
    treeData = retrievedData;
    root = treeData[0];
    update(root);
  } else {
    $.getJSON( "../data/intro-tree.json", function( res ) {
      treeData = res.data;
      root = treeData[0];
      update(root);
    }).fail(function(){
      console.log("Tree loading failed, loading default tree...");
      root = treeData[0];
      update(root);
    });
  }

  // Hot Key Shortcuts
  $( "body" ).keypress(function(e) {
    if
      (
      !($("#rename-field").is(":focus")) &&
      !($("#create-field").is(":focus")) &&
      !($("#sentence-content").is(":focus")) &&
      !(e.shiftKey)
      )
    {
      switch(e.keyCode) {
        // e
        case 101:
          setSelectedTool("edit");
          break;
        // a
        case 97:
          setSelectedTool("add");
          break;
        // m
        case 109:
          setSelectedTool("move");
          break;
        // d
        case 100:
          setSelectedTool("delete");
          break;
        // b
        case 98:
          setSelectedTool("build");
          break;
        // r
        case 114:
          resetRenderDefaults();
          simulateUiClick("#toolbtn-reset");
          break;
        // [
        case 91:
          shrinkTreeWidth();
          simulateUiClick("#toolbtn-width-minus");
          break;
        // ]
        case 93:
          growTreeWidth();
          simulateUiClick("#toolbtn-width-plus");
          break;
        // -
        case 45:
          shrinkNodeSize();
          simulateUiClick("#toolbtn-size-minus");
          break;
        // ==]
        case 61:
          growNodeSize();
          simulateUiClick("#toolbtn-size-plus");
          break;
      }
      // console.log(e.keyCode);
    } else {
      // SHIFT KEY ACTIONS
      switch(e.keyCode) {
      // {
        case 123:
          shrinkTreeHeight();
          simulateUiClick("#toolbtn-height-minus");
          break;
      // }
        case 125:
          growTreeHeight();
          simulateUiClick("#toolbtn-height-plus");
          break;
      }
      // console.log(e.keyCode);
    }
  });


});