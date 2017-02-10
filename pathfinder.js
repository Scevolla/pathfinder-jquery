(function($) {

var data = [
  [0,0,0,1,0,0,1,0,0,0], 
  [0,1,0,1,0,1,0,0,1,0],
  [0,1,0,0,0,1,0,1,1,0],
  [1,0,0,1,1,0,0,1,0,0],
  [0,1,0,0,0,1,0,0,0,0],
  [0,1,0,1,0,0,0,1,1,1],
  [0,0,0,1,0,1,1,1,0,0],
  [1,1,0,0,0,1,0,0,0,0],
  [0,0,0,1,0,1,0,1,1,1],
  [0,1,0,0,0,0,0,1,0,0]
];

 ////////// FIELD CLASS

function field(data) {
  this.rows = data.length; // field height
  this.cols = data[0].length; // field width
  this.cells = [];
  this.$table = this.createTable(data);
  this.$table.on("click", this.clickHandler.bind(this));
  this.clickCallback = null; // callback for notifing that there was click on cell
  this.selectedCells = []; // start and finish cells
  this.pathCells = []; // cells with arrows displaying path
  this.isDrawing = false; // path is drawing
}

field.prototype.createTable = function(data) {
  var $tbody = $('<tbody></tbody>');
  var $table = $("<table></table>").addClass("field").append($tbody);  

  for (var y = 0; y < this.rows; ++y) {
    this.cells.push([]);
    var $row = $("<tr></tr>");
    $tbody.append($row);
    for (var x = 0; x < this.cols; ++x) {
      var $cell = $("<td></td>").addClass(data[y][x] ? "cell cell-wall" : "cell");
      $row.append($cell);
      this.cells[y].push($cell.get()[0]);
    }
  }

  // block mouse hovers and clicks when visualizing drawing path
  this.$blockingOverlay = $("<tbody></tbody>")
    .addClass("blocking-input-overlay")
    .css("display", "none");
  $table.append(this.$blockingOverlay);

  return $table;
}

field.prototype.getRootElem = function() {
  return this.$table;
}

field.prototype.addClickCallback = function(callback) {
  this.clickCallback = callback;
}

field.prototype.clickHandler = function(e) {
  // if clicked when visualazing accelerate path drawing
  if (this.isDrawing) {
    this.drawInterval = 0;
    return;
  }

  if (e.target.tagName !== "TD") 
    return;   

  var cellCoords = this.getCoords(e.target);
  // notify external code that has been click on cell
  if (this.clickCallback)
    this.clickCallback(cellCoords.x, cellCoords.y);
}

field.prototype.getCoords = function(cell) {
  return {x: cell.cellIndex, y: cell.parentElement.rowIndex};
}

field.prototype.clear = function() {
  this.selectedCells.forEach(function(cell) {cell.className = "cell"}, this);
  this.selectedCells = [];

  this.pathCells.forEach(function(cell) {cell.className = "cell"}, this);
  this.pathCells = [];
}

field.prototype.selectCell = function(x, y) {
  this.cells[y][x].classList.add("cell-selected");
  this.selectedCells.push(this.cells[y][x]);
}

// callback - notifing external code when path drawing will be ended
// visualize - bool, draw each path arrow with time delay
field.prototype.drawPath = function(path, visualize, callback) {
  path.forEach(function(node) {
    var cell = this.cells[node.y][node.x];
    cell.classList.add("cell-path");
    this.pathCells.push(cell);     
  }, this);

  if (visualize) {
    this.isDrawing = true;
    this.drawInterval = 250;
    this.drawIndex = 0;
    this.drawCallback = callback;
    this.$blockingOverlay.css("display", "");
    this.drawPathArrows();
  }
  else {
    this.pathCells.forEach(function(cell, i) {this.drawArrow(i)}, this);
    callback();
  }
}

field.prototype.drawPathArrows = function() {
  this.drawArrow(this.drawIndex);
  this.drawIndex++;

  if (this.drawIndex === this.pathCells.length) {
    this.isDrawing = false;
    this.$blockingOverlay.css("display", "none");
    this.drawCallback();
  }
  else {
    setTimeout(this.drawPathArrows.bind(this), this.drawInterval);
  }
}

field.prototype.drawArrow = function(index) {
  if (index === this.pathCells.length - 1) {
    this.drawFinishArrow(index);
  }
  else if (index === 0) {
    this.drawStartArrow();
  }
  else {
    this.drawIntermediateArrow(index);
  }
}

field.prototype.drawStartArrow = function() {
  var first = this.getCoords(this.pathCells[0]);
  var second = this.getCoords(this.pathCells[1]);

  if (first.x === second.x) {
    this.pathCells[0].classList.add((first.y > second.y) ? "arrow-top" : "arrow-bottom");
  }
  else {
    this.pathCells[0].classList.add((first.x > second.x) ? "arrow-left" : "arrow-right");
  }
}

field.prototype.drawIntermediateArrow = function(i) {
  var cur = this.getCoords(this.pathCells[i]);
  var prev = this.getCoords(this.pathCells[i-1]);
  var next = this.getCoords(this.pathCells[i+1]);

  if (cur.x === prev.x && cur.x === next.x) {
    this.pathCells[i].classList.add((cur.y < prev.y) ? "arrow-top" : "arrow-bottom");
  }
  else if (cur.y === prev.y && cur.y === next.y) {
    this.pathCells[i].classList.add((cur.x < prev.x) ? "arrow-left" : "arrow-right");
  }
  else if (cur.x === prev.x) {
    if (cur.y < prev.y) {
      this.pathCells[i].classList.add((cur.x < next.x) ? "arrow-top-right" : "arrow-top-left");
    }
    else {
      this.pathCells[i].classList.add((cur.x < next.x) ? "arrow-bottom-right" : "arrow-bottom-left");
    }
  }
  else if (cur.y === prev.y) {
    if (cur.x > prev.x) {
      this.pathCells[i].classList.add((cur.y > next.y) ? "arrow-right-top" : "arrow-right-bottom");
    }
    else {
      this.pathCells[i].classList.add((cur.y > next.y) ? "arrow-left-top" : "arrow-left-bottom");
    }
  }
}

field.prototype.drawFinishArrow = function(i) {
  this.pathCells[i].classList.add("finish");
}

///// Class Node for Pathfinder
function Node(x, y, visited, isWalkable, prevNode) {
  this.x = x;
  this.y = y;
  this.visited = visited;
  this.isWalkable = isWalkable;
  this.prevNode = prevNode;
}

//////// WAVE PATH FINDER

function wavePathFinder(data) {
  this.rows = data.length;
  this.cols = data[0].length;
  this.nodes = this.createNodes(data);
  this.checkList = []; // queue of nodes for checking when finding path
}

wavePathFinder.prototype.createNodes = function(data) {
  var nodes = [];
  for (var y = 0; y < this.rows; ++y) {
    nodes.push([]);
    for (var x = 0; x < this.cols; ++x) {
      nodes[y].push(new Node(x, y, false, data[y][x] === 0, null));
    }
  }

  return nodes;
}

wavePathFinder.prototype.clear = function() {
  for (var y = 0; y < this.rows; ++y) {
    for (var x = 0; x < this.cols; ++x) {
      this.nodes[y][x].visited = false;
      this.nodes[y][x].prevNode = null;
    }
  }

  this.checkList = [];
}

wavePathFinder.prototype.getPath = function(curX, curY, finishX, finishY) {
  // path finded
  if (curX === finishX && curY === finishY) {
    return this.constructPath(this.nodes[curY][curX]);
  }

  // mark current checked node as visited and add to checkList all his neighbours
  this.nodes[curY][curX].visited = true;
  this.checkNeighbours(curX, curY);

  // if there are any not checked nodes continue recursive search
  if (this.checkList.length > 0) {
    var node = this.checkList.shift();
    return this.getPath(node.x, node.y, finishX, finishY);
  }
  // path is not exist, return empty array
  else {
    return [];
  }
}

wavePathFinder.prototype.checkNeighbours = function(x, y) {
  if (this.canBeAddedToCheckList(x - 1, y))
    this.addNeighbourToCheckList(x - 1, y, this.nodes[y][x]);

  if (this.canBeAddedToCheckList(x + 1, y))
    this.addNeighbourToCheckList(x + 1, y, this.nodes[y][x]);

  if (this.canBeAddedToCheckList(x, y - 1))
    this.addNeighbourToCheckList(x, y - 1, this.nodes[y][x]);

  if (this.canBeAddedToCheckList(x, y + 1))
    this.addNeighbourToCheckList(x, y + 1, this.nodes[y][x]);
}

wavePathFinder.prototype.canBeAddedToCheckList = function(x, y) {
  return ( 
    this.isInField(x, y) &&
    !this.nodes[y][x].visited &&
    this.nodes[y][x].isWalkable
    );
}

wavePathFinder.prototype.addNeighbourToCheckList = function(x, y, prevNode) {
  this.nodes[y][x].prevNode = prevNode;
  this.checkList.push(this.nodes[y][x]);
}

wavePathFinder.prototype.isInField = function(x, y) {
  return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
}

wavePathFinder.prototype.isWalkable = function(x, y) {
  return this.nodes[y][x].isWalkable;
}

wavePathFinder.prototype.constructPath = function(node) {
  //go from finish node to start node
  var path = [];
  do {
    path.push({x: node.x, y: node.y});
    node = node.prevNode;
  }
  while (node !== null);

  path.reverse();
  return path;  
}

var field;
var pathfinder;
var startPoint, finishPoint;
var $prompt, // prompts how to use pathfinder, what to do next
    $statusText, // info about start and finish point, path length
    $visualizeCB; // checkbox for drawing path with delay

var SELECT_START = 0;
var SELECT_FINISH = 1;
var DRAWING_PATH = 2;
var state = SELECT_START;

$(document).ready(function() {
  // create field and append it to #root
  field = new field(data);
  $("#root").append(field.getRootElem());
  field.addClickCallback(cellClicked);

  pathfinder = new wavePathFinder(data);

  $prompt = $(".prompt");
  $statusText = $(".status");
  $visualizeCB = $(".visualize-checkbox");
});

function cellClicked(x, y) {
  // cell is a wall, nothing to do
  if (!pathfinder.isWalkable(x, y))
    return;

  // select start point
  if (state === SELECT_START) {
    selectStart(x, y);
  }
  //select finish point and start path drawing
  else if (state === SELECT_FINISH) {
    selectFinish(x, y);
  }
}

function selectStart(x, y) {
  state = SELECT_FINISH; 
  
  // clear all data from last finded path
  pathfinder.clear();
  field.clear();

  startPoint = {x: x, y: y};
  field.selectCell(x, y);
  finishPoint = null;   

  $prompt.html("Выберите клеточку финиша.");
  $statusText.html("Старт: (" + x + ", " + y + "). Финиш: не выбрано.");
}

function selectFinish(x, y) {
  // start point === finish point
  if (startPoint.x === x && startPoint.y === y)
    return;

  state = DRAWING_PATH;
  finishPoint = {x: x, y: y};
  field.selectCell(x, y);

  var path = pathfinder.getPath(startPoint.x, startPoint.y, finishPoint.x, finishPoint.y);
  
  // path is exist, draw him instantly or with interval delay 
  // depending on value of visualize checkbox
  if (path.length > 0) {
    field.drawPath(path, $visualizeCB.is(":checked"), endPathDrawing);
    if ($visualizeCB.is(":checked"))
      $prompt.html("Построение пути. Кликните по полю, чтоб ускорить построение.");
      $statusText.html("Старт: (" + startPoint.x + ", " + startPoint.y + "). Финиш: (" + x + ", " + y + "). Длина пути: " + path.length + ".");    
  }
  // path in not eist
  else {
    endPathDrawing();
    $statusText.html("Старт: (" + startPoint.x + ", " + startPoint.y + "). Финиш: (" + x + ", " + y + "). Путь не существует.");
  } 
}

function endPathDrawing() {
  state = SELECT_START;
  $prompt.html("Выберите 2 пустые клеточки для нахождения пути между ними.");
}

}(jQuery));