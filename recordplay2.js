

var id = "record1";
var value = localStorage.getItem(id);
var rec1 = JSON.parse(value);



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
		
			// var canvasX = $(self.canvas).offset().left;
			// var canvasY = $(self.canvas).offset().top;
			// var x = Math.floor(event.pageX - canvasX);
			// var y = Math.floor(event.pageY - canvasY);
			var x = Math.floor(event.pageX);
			var y = Math.floor(event.pageY);
			var	currAction = new Point(x,y,0);
			// self.drawAction(currAction, true);
			if (self.currentRecording != null)
				self.currentRecording.addAction(currAction);
				
			event.preventDefault();
		
	}

	onClickRec = function(){
		var x = Math.floor(event.pageX);
		var y = Math.floor(event.pageY);
		var	currAction = new Point(x,y,1);
		// self.drawAction(currAction, true);
		if (self.currentRecording != null)
			self.currentRecording.addAction(currAction);
		event.preventDefault();

	}
	
	this.playRecording = function(onPlayStart, onPlayEnd, onPause, interruptActionStatus)
	{
		self.currentRecording = new Recording(this);
		self.recordings = new Array();
		self.recordings.push(self.currentRecording);
		// self.recordings[0] = rec1;    ///  recorded data to be passed here
		if (typeof interruptActionStatus == 'undefined')
			interruptActionStatus = null;
		
		if (self.recordings.length == 0)
		{
			alert("No recording loaded to play");
			onPlayEnd();
			return;
		}

		self.clearCanvas();
		
		onPlayStart();
		
		self.pausedRecIndex = -1;
		
		for (var rec = 0; rec < self.recordings.length; rec++)
		{
			if (interruptActionStatus != null)
			{
				var status = interruptActionStatus();
				if (status == "stop") {
					pauseInfo = null;
					break;
				}
				else 
					if (status == "pause") {
						__onPause(rec-1, onPlayEnd, onPause, interruptActionStatus);
						break;
					}
			}
			self.recordings[rec].playRecording(self.drawActions, onPlayEnd, function(){
				__onPause(rec-1, onPlayEnd, onPause, interruptActionStatus);
			}, interruptActionStatus);
		}
	}

	function __onPause(index, onPlayEnd, onPause, interruptActionStatus)
	{
		pauseInfo = {
			"index": index,
			"onPlayend": onPlayEnd,
			"onPause":onPause,
			"interruptActionStatus": interruptActionStatus
		};
		self.currentRecording = null;
		if (onPause)
			onPause();
	}
		
	this.resumePlayback = function (onResume)
	{
		if (pauseInfo == null) {
			if (onResume)
				onResume(false);
			return;
		}
		
		var index = pauseInfo.index;
		var onPlayEnd = pauseInfo.onPlayend;
		var interruptActionStatus = pauseInfo.interruptActionStatus;
		var onPause = pauseInfo.onPause;
		
		if (self.recordings.length == 0)
		{
			alert("No recording loaded to play");
			onPlayEnd();
			return;
		}

		onResume(true);
		
		pauseInfo = null;
		
		for (var rec = index; rec < self.recordings.length; rec++)
		{
			if (interruptActionStatus != null)
			{
				var status = interruptActionStatus();
				if (status == "stop")
					break;
				else if (status == "pause")
				{
					__onPause(rec-1, onPlayEnd, onPause, interruptActionStatus);
					break;		
				}
			}
			self.recordings[rec].playRecording(self.drawActions, onPlayEnd, function(){
				__onPause(rec-1, onPlayEnd, onPause, interruptActionStatus);
			},interruptActionStatus);
		}
	}

	this.clearCanvas = function()
	{
		// self.ctx.fillStyle = self.bgColor;
		// self.ctx.fillRect(0,0,self.canvas.width,self.canvas.height);		
	}

	this.removeAllRecordings = function()
	{
		self.recordings = new Array()
		self.currentRecording = null;
	}
	
	this.drawAction = function (actionArg, addToArray)
	{
		var x = actionArg.x;
		var y = actionArg.y;
		// mouse.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
		switch (actionArg.type)
		{
		case 0: //moveto
			mouse.style.left = x+"px";
			mouse.style.top = y+"px";	
			break;
		case 1: 
			 // handle clicks
			
			if(actionArg){
				
				var playframe = document.getElementById('recFrame');
				var contentWindow = playframe.contentWindow;
				var msg = {
					type : 'click',
					elem : actionArg.elem
				}
				contentWindow.postMessage(msg, "*");
				
			}

			var div = document.createElement("div");
			div.className = "recClicks"
			div.style.width = "10px";
			div.style.height = "10px";
			div.style.background = "red";
			div.style.color = "white";
			div.style.position = "absolute";
			div.style.left = x+"px";
			div.style.top = y+"px";
			div.style.opacity = 0.3;
			document.body.appendChild(div);
			break;
		case 2 :
			// handle scroll
			window.scrollTo( x, y);

			break;	
		case 3 :
			// handle key strokes
			var msg;
			var playframe = document.getElementById('recFrame');
			var contentWindow = playframe.contentWindow;
			if( actionArg && x.length <= 1){
				
				msg = {
					type : 'getVal',
					elem : actionArg.y
				}
				
				contentWindow.postMessage(msg, "*");
			}
			if(currentElement !=  actionArg.y){
				currentValue = 'nvEmpty';
				currentElement =  actionArg.y;
			}
			if(currentValue == 'nvEmpty'){
					msg = {
						type : 'focus',
						elem : actionArg.y,
						val : actionArg.x
					}
					contentWindow.postMessage(msg, "*");
			}else {
				var cursorPos = actionArg.elem;
				if(x  === 'Backspace'){
					msg = {
						type : 'focus',
						elem : actionArg.y,
						val : currentValue.substring(0,cursorPos-1) + currentValue.substring(cursorPos)
					}
				}else if(x  === 'Delete'){
					msg = {
						type : 'focus',
						elem : actionArg.y,
						val : currentValue.slice(0,cursorPos) + currentValue.slice(cursorPos+1)
					}
				}else if (x  === 'ArrowUp' || x  === 'ArrowLeft' || x  === 'ArrowRight' || x  === 'ArrowDown'){
					msg = {
						type : 'focus',
						elem : actionArg.y,
						val : currentValue
					}
				}else{
					msg = {
						type : 'focus',
						elem : actionArg.y,
						val : currentValue + x
					}
				}
				contentWindow.postMessage(msg, "*");
			}		
			break;	

		}
		// if (addToArray)
			self.actions.push(actionArg);
	}	
		
	__init = function()
	{

		self.canvas = window.document;
		if (self.canvas.length == 0)
		{
			alert("No canvas with id " + canvasId + " found");
			return;
		} 
		// self.canvas = self.canvas.get(0);
		self.width = $(self.canvas).width();
		self.height = $(self.canvas).height();
		// self.ctx = self.canvas.getContext("2d");
		// document.addEventListener("mousemove", onMouseMove);
		// document.addEventListener("click", onClickRec);
		self.clearCanvas();		
	}
	
	// only when recording is enabled by user
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
	this.currTime = rec1.currTime;
	this.started = false;
	this.intervalId = null;
	this.currTimeSlot = rec1.currTimeSlot;
	this.actionsSet = rec1.actionsSet;
	this.currActionSet = rec1.currActionSet;
	this.recStartTime = rec1.recStartTime;
	this.pauseInfo = null;
	
	
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
	// console.log(self);

	// for playing recording 
	// panel side 
	this.playRecording = function(callbackFunctionArg, onPlayEnd, onPause, interruptActionStatus)
	{
		if (self.actionsSet == null)
		{
			if (typeof onPlayEnd != 'undefined' && onPlayEnd != null)
				onPlayEnd();
			return;
		}	
		// document.getElementsByClassName("recClicks").style.display = "block";
		self.scheduleDraw(self.actionsSet,self.actionsSet.interval,callbackFunctionArg, onPlayEnd, onPause, true, interruptActionStatus);
	}

	this.scheduleDraw = function (actionSetArg, interval, callbackFunctionArg, onPlayEnd, onPause, isFirst, interruptActionStatus)
	{
		window.setTimeout(function(){
			var status = "";
			if (interruptActionStatus != null)
			{
				status = interruptActionStatus();
				if (status == 'stop')
				{
					self.pauseInfo = null;
					onPlayEnd();
					return;
				}
			}
			
			if (status == "pause")
			{
				self.pauseInfo = {
					"actionset":actionSetArg,
					"callbackFunc":callbackFunctionArg,
					"onPlaybackEnd":onPlayEnd,
					"onPause":onPause,
					"isFirst":isFirst,
					"interruptActionsStatus":interruptActionStatus
				};
				
				if (onPause)
					onPause();
				return;
			}

			
			if (self.pauseInfo != null && status == "")
			{
				
				self.resume(onPlayEnd, isFirst);	
				return;
			}
			
			var intervalDiff = -1;
			var isLast = true;
			if (actionSetArg.next != null)
			{
				isLast = false;
				intervalDiff = actionSetArg.next.interval - actionSetArg.interval;
			}
			if (intervalDiff >= 0)
				self.scheduleDraw(actionSetArg.next, intervalDiff, callbackFunctionArg, onPlayEnd, onPause, false,interruptActionStatus);
				self.drawActions(actionSetArg.actions, onPlayEnd, isFirst, isLast);
		},interval);
	}
	
	this.resume = function(onPlayEnd, isFirst)
	{
		if (!self.pauseInfo){
			return;
		}
		
		var intervalDiff = -1;
		var isLast = true;
		if (self.pauseInfo.actionset.next != null)
		{
			isLast = false;
			intervalDiff = self.pauseInfo.actionset.next.interval - self.pauseInfo.actionset.interval;
		}
		if (intervalDiff >= 0){
		self.scheduleDraw(self.pauseInfo.actionset, 0, 
			self.pauseInfo.callbackFunc, 
			self.pauseInfo.onPlaybackEnd, 
			self.pauseInfo.onPause,
			self.pauseInfo.isFirst,
			self.pauseInfo.interruptActionsStatus);
			resume = self.pauseInfo;
			self.pauseInfo = null;
			self.drawActions(resume.actionset.actions, onPlayEnd, isFirst, isLast);
		}
	}	

	this.drawActions = function (actionArray, onPlayEnd, isFirst, isLast)
	{
		for (var i = 0; i < actionArray.length; i++)
			self.drawing.drawAction(actionArray[i],false);
			
		if (isLast)
		{
			onPlayEnd();
		}
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
}

Point = function (argX,argY,typeArg)
{
	var self = this;
	this.type = typeArg; //0 - moveto, 1 - lineto
	
	Action.call(this,1,argX,argY);
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


isSelectorValid = function (selector)
{
	try {
		document.querySelector(selector);
	} catch (x) {
		return false;
	}
	return true;
}

// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

// window.addEventListener("message", messagelistener, false);
// function messageto(){

// 	console.log(evt);
// }