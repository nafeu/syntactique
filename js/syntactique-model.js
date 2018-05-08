var treeHistory = [];

// ************** Data Model Functions *****************
var treeData = [
  {
    "name": "Click Here To Begin",
    "head": "",
    "sub": "",
    "children": []
  }
];

var structureLib = [
  {
    "keywords" : ["XP", "X phrase"],
    "tree": {
      "name": "XP",
      "head": "",
      "children": [{
        "name": "X'",
        "head": "",
        "children": [{
          "name": "X",
          "head": "head",
          "children": [],
        }],
      }]
    }
  }
];

var justCalledUndo = true;

function undo() {
  if (treeHistory.length > 0) {
    if (justCalledUndo) {
      treeHistory.pop()
      justCalledUndo = false;
    }
    treeData = treeHistory.pop();
    root = treeData[0];
    update(root, true);
  }
}

// ************** Tree Model Manipulation *****************
function addChild(id, newNode) {
  var nodeRef = getTreeNode(treeData, id);
  if (nodeRef) {
    if (nodeRef.children) {
      nodeRef.children.push(newNode);
    } else {
      nodeRef.children = [newNode];
    }
    update(root);
  }
}

function addLeft(id, newNode) {
  var nodeRef = getTreeNode(treeData, id);
  if (nodeRef.parent) {
    for (var i = 0; i < nodeRef.parent.children.length; i++) {
      if (nodeRef.parent.children[i].id == id) {
        nodeRef.parent.children.splice(i, 0, newNode);
        update(root);
        break;
      }
    }
  }
}

function addRight(id, newNode) {
  var nodeRef = getTreeNode(treeData, id);
  if (nodeRef.parent) {
    for (var i = 0; i < nodeRef.parent.children.length; i++) {
      if (nodeRef.parent.children[i].id == id) {
        nodeRef.parent.children.splice(i+1, 0, newNode);
        update(root);
        break;
      }
    }
  }
}

function addParent(id, newNode) {
  var nodeRef = getTreeNode(treeData, id);
  if (nodeRef.parent) {
    var newParent;
    // Insert new node at correct index
    for (var i = 0; i < nodeRef.parent.children.length; i++) {
      if (nodeRef.parent.children[i].id == id) {
        nodeRef.parent.children.splice(i+1, 0, newNode);
        newParent = nodeRef.parent.children[i+1];
        break;
      }
    }
    deleteNode(id);
    nodeRef.parent = null;
    newParent.children = [nodeRef];
    update(root);
  } else {
    treeData = [newNode];
    treeData[0].children = [root];
    root = treeData[0];
    update(root);
  }
}

function swapRight(id) {
  var nodeRef = getTreeNode(treeData, id);
  if (nodeRef.parent) {
    for (var i = 0; i < nodeRef.parent.children.length; i++) {
      if (nodeRef.parent.children[i].id == id && nodeRef.parent.children[i+1]) {
        var temp = nodeRef.parent.children[i+1];
        nodeRef.parent.children[i+1] = nodeRef.parent.children[i];
        nodeRef.parent.children[i] = temp;
        update(root);
        break;
      }
    }
  }
}

function swapLeft(id) {
  var nodeRef = getTreeNode(treeData, id);
  if (nodeRef.parent) {
    for (var i = 0; i < nodeRef.parent.children.length; i++) {
      if (nodeRef.parent.children[i].id == id && nodeRef.parent.children[i-1]) {
        var temp = nodeRef.parent.children[i-1];
        nodeRef.parent.children[i-1] = nodeRef.parent.children[i];
        nodeRef.parent.children[i] = temp;
        update(root);
        break;
      }
    }
  }
}

function swapParent(id) {

  var nodeRef = getTreeNode(treeData, id);
  if (nodeRef.parent) {
    var grandParent;
    var grandParentChildren;
    var grandParentIndex;
    if (nodeRef.parent.parent) {
      grandParent = nodeRef.parent.parent;
      grandParentChildren = grandParent.children;
      for (var i = 0; i < grandParent.children.length; i++) {
        if (grandParent.children[i].id == nodeRef.parent.id) {
          grandParentIndex = i;
          break;
        }
      }
    }
    var nodeRefChildren = nodeRef.children;
    var nodeParent = nodeRef.parent;
    var nodeParentChildren = nodeParent.children;

    // Find nodeRef index in nodeParent.children
    for (var j = 0; j < nodeParent.children.length; j++) {
      if (nodeParent.children[j].id == id) {
        // Swap nodeParent into its child array at the index of nodeRef
        nodeParentChildren.splice(j, 1, nodeParent);
        nodeParent.parent = nodeRef;
        break;
      }
    }

    // Assign nodeRef as the new parent
    nodeRef.children = nodeParentChildren;
    nodeParent.children = nodeRefChildren;

    if (grandParent) {
      grandParent.children.splice(grandParentIndex, 1, nodeRef);
      update(root);
    } else {
      nodeRef.parent = null;
      treeData = [nodeRef];
      root = treeData[0];
      update(root);
    }
  }
}

function deleteNode(id) {
  var nodeRef = getTreeNode(treeData, id);
  if (nodeRef) {
    nodeRef = nodeRef.parent;
    for (var i = 0; i < nodeRef.children.length; i++) {
      if (nodeRef.children[i].id == id) {
        nodeRef.children.splice(i,1);
        update(root);
        break;
      }
    }
  }
}

// ************** Tree Model Manipulation Helpers **************
function getTreeNode(input_vi, id) {
    // when I first call this function, fn([data_tree], null)
    var visited = input_vi;
    if (visited.length === 0) {
        return null;
    } else {
        if (visited[0].id == id) {
            return visited[0];
        } else {
            var recurse;
            if (visited[0].children) {
              recurse = visited.concat(visited[0].children);
            } else {
              recurse = visited;
            }
            recurse.shift();
            return getTreeNode(recurse, id);
        }
    }
}

function recursiveTreeClean(inputArray, propArray) {
  $.each(inputArray, function(i, o) {
    filterProps(o, propArray);
    if (hasNoChildren(o)) {
      return;
    } else {
      recursiveTreeClean(o.children, propArray);
    }
  });
}

function filterProps(obj, propArray) {
  $.each(Object.keys(obj), function(i, v) {
    if ($.inArray(v, propArray) >= 0) {
      delete obj[v];
    }
  });
}

function hasNoChildren(obj) {
  if ((obj.children) && (obj.children.length > 0)) {
    return false;
  }
  return true;
}

function getCleanTreeClone(treeRoot) {
  recursiveTreeClean([treeRoot], ["parent", "id"]);
  var out = [$.extend(true, {}, treeRoot)];
  return out;
}

function getTreeStringFromJSON(treeRoot) {
  return JSON.stringify(getCleanTreeClone(treeRoot));
}

function getJSONFromTreeString(treeString) {
  return JSON.parse(treeString);
}

// ************** Node Placeholder Helpers **************
function setNewNodeHolder(node) {
  newNodeHolder = node;
}

function getNewNodeHolder() {
  return newNodeHolder;
}

function resetNewNodeHolder() {
  newNodeHolder = {
    "name": "XP",
    "head": "",
    "sub": ""
  };
}

function useNewNodeHolder() {
  var out = {};
  var keywordMatch = getStructureByKeyword(newNodeHolder.name);
  if (keywordMatch && toolbarSettings.add.auto_complete_phrase) {
    out = $.extend(true, {}, keywordMatch);
  } else {
    out.name = newNodeHolder.name;
    out.head = newNodeHolder.head;
    out.sub = newNodeHolder.sub;
  }
  resetNewNodeHolder();
  return out;
}

// ************** Structure Library Helpers **************
function getStructureByKeyword(keyword) {
  for (var i = 0; i < structureLib.length; i++) {
    if (structureLib[i].keywords.indexOf(keyword) > -1) {
      return structureLib[i].tree;
    }
  }
}

// ************** Data Persistence **************



// Put the object into storage


// Retrieve the object from storage
