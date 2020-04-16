// ***************************************************************************
// Copyright (c) 2020 Clifford Thompson
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// ***************************************************************************

const FRAMES_PER_SECOND = 30;
const BALL_SIZE_PX = 5;
let ballPositionX, ballPositionY;
let ballVelocityX, ballVelocityY;
let canvas, context;

function startSimulationLoop() {

  // load canvas
  canvas = document.getElementById("simulation-canvas");
  context = canvas.getContext("2d");

  // set up interval (game loop)
  setInterval(updateCanvas, 1000 / FRAMES_PER_SECOND);

  // ball starting position
  ballPositionX = canvas.width / 2;
  ballPositionY = canvas.height / 2;

  // random ball starting speed
  ballVelocityX = Math.floor(Math.random() * 75 + 25) / FRAMES_PER_SECOND;
  ballVelocityY = Math.floor(Math.random() * 75 + 25) / FRAMES_PER_SECOND;

  // random ball direction
  if (Math.floor(Math.random() * 2) == 0) {
    ballVelocityX = -ballVelocityX;
  }
  if (Math.floor(Math.random() * 2) == 0) {
    ballVelocityY = -ballVelocityY;
  }
}

function updateCanvas() {

  // move the ball
  ballPositionX += ballVelocityX;
  ballPositionY += ballVelocityY;

  // bounce the ball off each wall
  if (ballPositionX - BALL_SIZE_PX / 2 < 0 && ballVelocityX < 0) {
    ballVelocityX = -ballVelocityX;
  }
  if (ballPositionX + BALL_SIZE_PX / 2 > canvas.width && ballVelocityX > 0) {
    ballVelocityX = -ballVelocityX;
  }
  if (ballPositionY - BALL_SIZE_PX / 2 < 0 && ballVelocityY < 0) {
    ballVelocityY = -ballVelocityY;
  }
  if (ballPositionY + BALL_SIZE_PX / 2 > canvas.height && ballVelocityY > 0) {
    ballVelocityY = -ballVelocityY;
  }

  // draw background
  context.fillStyle = "grey";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // draw ball
  context.beginPath();
  context.arc(ballPositionX, ballPositionY, BALL_SIZE_PX, 0, 2 * Math.PI, false);
  context.fillStyle = "lightblue";
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = "black";
  context.stroke();
}
