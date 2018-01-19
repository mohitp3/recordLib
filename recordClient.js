var mainOb = {
	actionsSet : '',
	currActionSet : '',
	currTime : '',
	currTimeSlot : -1,
	recStartTime : '',
	started : false,
	timeInterval : 100,
	timeSlots : {},
	buffer : [],
	intervalId : null,
	pauseInfo : null,


};


RecordableDrawing = function (canvasId)
{
	var self = this;
	this.canvas = null;
	this.width = this.height = 0;
	this.actions = new Array();
	this.ctx = null;
	this.mouseDown = false;
	this.mouse = true;
	this.currentRecording = null; //instance of Recording
	this.recordings = new Array(); //array of Recording objects
	this.lastMouseX = this.lastMouseY = -1;
	this.bgColor = "rgb(255,255,255)";
	var currentLineWidth = 5;
	var pauseInfo = null;
	//mouse
	var mouse = document.getElementById("mouse");
    onMouseMove = function(event)
	{
			var x = Math.floor(event.pageX);
			var y = Math.floor(event.pageY);
			var	currAction = new Point(x,y,0);
			if (self.currentRecording != null)
				self.currentRecording.addAction(currAction);
				
			event.preventDefault();
		
	}

	onClickRec = function(event){
		var x = Math.floor(event.pageX);
		var y = Math.floor(event.pageY);
		var ce = selectorQuery(event.target); // css selector of element
		
		var	currAction = new Point(x,y,1,ce);
		if (self.currentRecording != null)
			self.currentRecording.addAction(currAction);
		event.preventDefault();
		

	}
	onScroll = function(event){
		var x = 0;
		var y = Math.floor(window.scrollY);
		var	currAction = new Point(x,y,2);
		if (self.currentRecording != null)
			self.currentRecording.addAction(currAction);
		event.preventDefault();
	}
	
	this.startRecording = function()
	{
		self.currentRecording = new Recording(this);
		self.recordings = new Array();
		self.recordings.push(self.currentRecording);
		self.currentRecording.start();
	}
	
	this.stopRecording = function()
	{
		if (self.currentRecording != null)
			self.currentRecording.stop();
		self.currentRecording = null;
    }
    
    __init = function()
	{

		self.canvas = window.document;
		if (self.canvas.length == 0)
		{
			alert("No canvas with id " + canvasId + " found");
			return;
		} 
		self.width = $(self.canvas).width();
		self.height = $(self.canvas).height();
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("click", onClickRec);
		window.addEventListener('scroll', onScroll );
	}
	
	__init();

}

// for recording mouse moments 
//  client side
Recording = function (drawingArg)
{
	var self = this;
	this.drawing = drawingArg;
	this.timeSlots = new Object(); //Map with key as time slot and value as array of Point objects
	this.buffer = new Array(); //array of Point objects 
	this.timeInterval = 100; //10 miliseconds
	this.currTime = 0;
	this.started = false;
	this.intervalId = null;
	this.currTimeSlot = 0;
	this.actionsSet = null;
	this.currActionSet = null;
	this.recStartTime = null;
    this.pauseInfo = null;
    
    
    this.start = function()
	{
		self.currTime = 0;
		self.currTimeSlot = -1;
		self.actionsSet = null;
		self.pauseInfo = null;
		self.recStartTime = (new Date()).getTime();
		self.intervalId = window.setInterval(self.onInterval, self.timeInterval);
		self.started = true;

	}
	
	this.stop = function()
	{
		if (self.intervalId != null)
		{
			window.clearInterval(self.intervalId);
			self.intervalId = null;
		}
        self.started = false;
		mainOb.timeSlots = self.timeSlots; 
		mainOb.buffer = self.buffer; 
		mainOb.timeInterval = self.timeInterval 
		mainOb.currTime =self.currTime;
		mainOb.started = self.started;
		mainOb.intervalId = self.intervalId;
		mainOb.currTimeSlot = self.currTimeSlot;
		mainOb.actionsSet = self.actionsSet;
		mainOb.currActionSet = self.currActionSet;
		mainOb.recStartTime = self.recStartTime;
		mainOb.pauseInfo =self.pauseInfo ;
        console.log(mainOb);
        var id = "record1";
        var value = JSON.stringify(mainOb);
        localStorage.setItem(id, value);
	}    

    this.onInterval = function()
	{
		if (self.buffer.length > 0)
		{
			var timeSlot = (new Date()).getTime() - self.recStartTime;
		
			if (self.currActionSet == null)
			{
				self.currActionSet = new ActionsSet(timeSlot, self.buffer);
				self.actionsSet = self.currActionSet;
			}
			else
			{
				var tmpActionSet = self.currActionSet;
				self.currActionSet = new ActionsSet(timeSlot, self.buffer);
				tmpActionSet.next = self.currActionSet;
			}
			
			self.buffer = new Array();
		}
		self.currTime += self.timeInterval;
	}

    this.addAction = function(actionArg)
	{
		if (!self.started)
			return;
		self.buffer.push(actionArg);
	}
}

// client side 
Action = function()
{
	var self = this;
	this.actionType; // 1 - Point, other action types could be added later
	this.x = 0;
	this.y = 0;
	this.isMovable = false;
	this.index = 0;

	if (arguments.length > 0)
	{
		self.actionType = arguments[0];
	}
	if (arguments.length > 2)
	{
		self.x = arguments[1];
		self.y = arguments[2];
	}
	if (arguments[3])
	{
		this.elem = '';
		self.elem = arguments[3]
	}
}
/**
 * elem = css selector of element
 */

Point = function (argX,argY,typeArg,elem)
{
	var self = this;
	this.type = typeArg; //0 - moveto, 1 - lineto
		Action.call(this,1,argX,argY,elem);
	
}

Point.prototype = new Action();

ActionsSet = function (interalArg, actionsArrayArg)
{
	var self = this;
	this.actions = actionsArrayArg;
	this.interval = interalArg;
	this.next = null;
	// console.log(this);
}

////// clickedEl Query start //////////
getNth = function (node) {
	var startNode = node
	var i = 1
	while (node = node.previousElementSibling) {
		++i
	}
	return i
};

selectorQuery = function (node) {
	var ignoreClassList = ["over", "hover", "active", "selected", "scrolled", "collapsed"];
	if (typeof node !== 'object') {
		throw new Error('expects dom node')
	}

	var selector = '';

	if (node.nodeName === 'HTML') {
		return 'html'
	}
	do {
		var elSelector = '';
		if (node.nodeName === 'HTML' | node.nodeName === '#document') {
			selector += elSelector;
			break;
		}
		if (node.id) {
			elSelector += ' #' + node.id
			selector += elSelector;
			break;
		}
		if (node.nodeName === 'BODY') {
			elSelector += ' ' + 'body'
			selector += elSelector;
			continue;
		}
		// refactor me *dying cough*
		if (node.className) {
			elSelector += ' ' + node.nodeName.toLowerCase() + (node.className.trim().split(/\s+/).map(function (x) {
				if (ignoreClassList.indexOf(x) === -1) {
					return '.' + x.replace('.', '\\\\.');
				}
				return '';
			}).join(''));

			if (node.parentNode.childNodes.length > 1 && node.parentNode.querySelectorAll(elSelector).length > 1) {
				elSelector += ':nth-child(' + getNth(node) + ')';
			}
		} else {
			elSelector += ' ' + node.nodeName.toLowerCase();
			if (node.parentNode.childNodes.length > 1 && node.parentNode.querySelectorAll(elSelector).length > 1) {
				elSelector += ':nth-child(' + getNth(node) + ')';
			}
		}

		selector += elSelector;

	} while (node = node.parentNode)

	selector = selector.split(' ').reverse().join(' ')
	return selector || null
};
