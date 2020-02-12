import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { CanvasComponent } from './canvas/canvas.component';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Canvas';
  shape: any = 'line';
  fill: any;
  strokeWidth: any = 2;
  strokeColor: any = "#000000";
  fillColor: any = '#000000';
  name: string;
  users: any = {};
  objectKeys = Object.keys;

  userColors = ['#ff9800', '#ffc107', '#ffeb3b', '#8bc34a', '#03a9f4', '#00bcd4']

  random = Math.floor(Math.random() * 6) + 1 ;

  @ViewChild('appCanvas', { static: true }) appCanvas: CanvasComponent;

  constructor(public dialog: MatDialog, public socket: Socket) { }

  // Method to set the shape of the object selected
  setShape(shape) {
    this.shape = shape;
  }

  // Method to open user dialog
  openDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      this.name = result;
      this.socket.emit('recieveUserName', result);
    });
  }

  // Method to logout
  logout() {
    this.name = '';
    sessionStorage.clear();
    this.socket.emit('logout');
    this.appCanvas.clearCanvas();
    this.openDialog();
  }

  // Init Method for the component
  ngOnInit() {
    if (!sessionStorage.getItem('userName')) {
      this.openDialog();
    } else {
      this.name = sessionStorage.getItem('userName');
      this.socket.emit('recieveUserName', this.name);
    }

    this.socket.on('users', (data) => {
      this.users = data;
    });
  }
}
