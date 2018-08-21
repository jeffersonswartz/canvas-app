import { Component, ViewChild, ElementRef, Input, HostListener, AfterViewInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements AfterViewInit {

  context;
  dragging = false;
  dragStartLocation;
  snapshot;
  lastX;
  lastY;

  canvas;

  @Input() public width;
  @Input() public height;

  @Input() shape;
  @Input() fill;
  @Input() strokeColor;
  @Input() fillColor;
  @Input() strokeWidth;

  private internalData: any;

  undoArray: any = [];
  redoArray: any = [];

  private cx: CanvasRenderingContext2D;

  constructor(private socket: Socket) { }

  public ngAfterViewInit() {
    this.init();
    this.socket.on('draw', (data) => {
      if (!this.internalData.dragging && data.dragging) {
        this.lastX = data.dragStartLocation.x; this.lastY = data.dragStartLocation.y;
      }
      this.drawShape(data.position, data.shape, data.dragStartLocation, data.strokeStyle, data.lineWidth, data.fillStyle, data.fill, data.dragging);
      this.takeSnapshot();
    });

    this.internalData = {
      shape: this.shape,
      dragStartLocation: this.dragStartLocation,
      strokeStyle: this.strokeColor,
      lineWidth: this.strokeWidth,
      fillStyle: this.fillColor,
      fill: this.fill,
      dragging: this.dragging
    };
  }

  // Method to get the coordiantes of the canvas
  getCanvasCoordinates(event) {
    const x = event.clientX - this.canvas.getBoundingClientRect().left,
      y = event.clientY - this.canvas.getBoundingClientRect().top;

    return { x: x, y: y };
  }

  // Method to get the snapshot of the Canvas
  takeSnapshot() {
    this.snapshot = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  // Method to restore the snapshot of the Canvas
  restoreSnapshot() {
    this.context.putImageData(this.snapshot, 0, 0);
  }

  // Method to draw the particular shape
  drawShape(position, shape, dragStartLocation, strokeStyle, lineWidth, fillStyle, fill, dragging) {
    this.internalData = {
      shape: shape,
      dragStartLocation: dragStartLocation,
      position: position,
      strokeStyle: strokeStyle,
      lineWidth: lineWidth,
      fillStyle: fillStyle,
      fill: fill,
      dragging: dragging
    };
    this.context.strokeStyle = this.internalData.strokeStyle;
    this.context.fillStyle = this.internalData.fillStyle;
    this.context.lineWidth = this.internalData.lineWidth;
    switch (this.internalData.shape) {
      case 'line':
        this.drawLine(position);
        break;

      case 'circle':
        this.drawCircle(position);
        break;

      case 'free':
        this.drawFree(position);
        break;

      case 'square':
        this.drawSquare(position);
        break;

      case 'erase':
        this.context.strokeStyle = 'white';
        this.drawFree(position);
        break;
      default:

        break;
    }
  }

  // Method to Draw Line
  drawLine(position) {
    this.context.beginPath();
    this.context.moveTo(this.internalData.dragStartLocation.x, this.internalData.dragStartLocation.y);
    this.context.lineTo(position.x, position.y);
    this.context.stroke();
  }

  // Method to Draw Circle
  drawCircle(position) {
    const radius = Math.sqrt(Math.pow((this.internalData.dragStartLocation.x - position.x), 2) +
      Math.pow((this.internalData.dragStartLocation.y - position.y), 2));
    this.context.beginPath();
    this.context.arc(this.internalData.dragStartLocation.x, this.internalData.dragStartLocation.y, radius, 0, 2 * Math.PI, false);
    if (this.internalData.fill) {
      this.context.fill();
    } else {
      this.context.stroke();
    }
  }

  // Method to Draw Free Text
  drawFree(position) {
    if (this.internalData.dragging === true) {
      this.context.beginPath();
      this.context.lineJoin = 'round';
      this.context.moveTo(this.lastX, this.lastY);
      this.context.lineTo(position.x, position.y);
      this.context.closePath();
      this.context.stroke();
    }
    this.lastX = position.x; this.lastY = position.y;
  }

  // Method to Draw Square
  drawSquare(position) {
    const lengthX = Math.abs(position.x - this.internalData.dragStartLocation.x);
    const lengthY = Math.abs(position.y - this.internalData.dragStartLocation.y);
    let width, height;
    if (lengthX > lengthY) {
      width = lengthX * (position.x < this.internalData.dragStartLocation.x ? -1 : 1);
      height = lengthX * (position.y < this.internalData.dragStartLocation.y ? -1 : 1);
    } else {
      width = lengthY * (position.x < this.internalData.dragStartLocation.x ? -1 : 1);
      height = lengthY * (position.y < this.internalData.dragStartLocation.y ? -1 : 1);
    }
    this.context.beginPath();
    this.context.rect(this.internalData.dragStartLocation.x, this.internalData.dragStartLocation.y, width, height);
    if (this.internalData.fill) {
      this.context.fill();
    } else {
      this.context.stroke();
    }
  }

  // Mouse Drag event start function
  dragStart(event) {
    this.internalData.dragging = true;
    this.dragging = true;
    if (this.shape !== 'erase') {
      this.context.strokeStyle = this.strokeColor;
    }
    this.context.fillStyle = this.fillColor;
    this.context.lineWidth = this.strokeWidth;
    this.dragStartLocation = this.getCanvasCoordinates(event);
    if (this.internalData.shape === 'free' || this.internalData.shape === 'erase') {
      this.lastX = this.dragStartLocation.x; this.lastY = this.dragStartLocation.y;
    } else {
      this.takeSnapshot();
    }
  }

  // Mouse Drag event function
  drag(event) {
    let position;
    if (this.internalData.dragging === true) {
      position = this.getCanvasCoordinates(event);
      if (this.internalData.shape !== 'free' && this.internalData.shape !== 'erase') {
        this.restoreSnapshot();
      } else {
        const shapeObj = {
          shape: this.shape,
          dragStartLocation: this.getCanvasCoordinates(event),
          position: position,
          strokeStyle: this.strokeColor,
          lineWidth: this.strokeWidth,
          fillStyle: this.fillColor,
          fill: this.fill,
          dragging: this.dragging
        };
        this.socket.emit('draw', shapeObj);
      }
      this.drawShape(position, this.shape, this.dragStartLocation, this.strokeColor, this.strokeWidth, this.fillColor, this.fill, this.dragging);
    }
  }

  // Mouse Drag event stop function
  dragStop(event) {
    this.dragging = false;
    this.internalData.dragging = false;
    if (this.internalData.shape !== 'free' && this.internalData.shape !== 'erase') {
      this.restoreSnapshot();
    }
    this.takeSnapshot();
    const position = this.getCanvasCoordinates(event);
    this.drawShape(position, this.shape, this.dragStartLocation, this.strokeColor, this.strokeWidth, this.fillColor, this.fill, this.dragging);
    const shapeObj = {
      shape: this.shape,
      dragStartLocation: this.dragStartLocation,
      position: position,
      strokeStyle: this.strokeColor,
      lineWidth: this.strokeWidth,
      fillStyle: this.fillColor,
      fill: this.fill
    };
    this.setImageData();
    this.socket.emit('draw', shapeObj);
  }

  // Listener for the Screen resize
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.resizeCanvasToDisplaySize(this.canvas);
  }

  // Method to set the image data
  setImageData() {
    sessionStorage.setItem('imageData', this.canvas.toDataURL("image/png"));
  }

  // Method to clear the canvas
  clearCanvas() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.context.clearRect(0, 0, width, height);
  }

  // Initialization Method
  init() {
    this.canvas = document.getElementById('canvas');
    this.context = this.canvas.getContext('2d');
    this.context.strokeStyle = this.strokeColor;
    this.context.fillStyle = this.fillColor;
    this.context.lineWidth = this.strokeWidth;
    this.context.lineCap = 'round';

    this.canvas.addEventListener('mousedown', this.dragStart.bind(this), false);
    this.canvas.addEventListener('mousemove', this.drag.bind(this), false);
    this.canvas.addEventListener('mouseup', this.dragStop.bind(this), false);

    if (sessionStorage.getItem('imageData')) {
      var img = new Image;
      img.onload = () => {
        this.context.drawImage(img, 0, 0);
      };
      img.src = sessionStorage.getItem('imageData');
    }

    this.resizeCanvasToDisplaySize(this.canvas);
  }

  // Resize method for the canvas
  resizeCanvasToDisplaySize(canvas) {
    // look up the size the canvas is being displayed
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // If it's resolution does not match change it
    if (canvas.width !== width || canvas.height !== height) {
      const temp_cnvs = document.createElement('canvas');
      const temp_cntx = temp_cnvs.getContext('2d');
      temp_cnvs.width = canvas.width;
      temp_cnvs.height = canvas.height;
      temp_cntx.drawImage(canvas, 0, 0);
      canvas.width = width;
      canvas.height = height;
      this.context.drawImage(temp_cnvs, 0, 0);
      if (this.shape !== 'erase') {
        this.context.strokeStyle = this.strokeColor;
      }
      this.context.fillStyle = this.fillColor;
      this.context.lineWidth = this.strokeWidth;
      this.context.lineCap = 'round';
      return true;
    }
    return false;
  }

}