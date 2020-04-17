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
const NUMBER_OF_BALLS = 50;
let canvas, context;
let balls = [];


function startSimulationLoop() {

  // load canvas
  canvas = document.getElementById("simulation-canvas");
  context = canvas.getContext("2d");

  // set up interval (game loop)
  setInterval(updateSimulation, 1000 / FRAMES_PER_SECOND);

  for(var i = 0; i < NUMBER_OF_BALLS; ++i) {
    balls.push(createBall());
  }
}

function updateSimulation() {

  for(var i = 0; i < NUMBER_OF_BALLS; ++i) {
    updateBall(balls[i]);
  }

  drawBackground();

  for(var i = 0; i < NUMBER_OF_BALLS; ++i) {
    drawBall(balls[i]);
  }
}

function drawBackground() {
  // draw background
  context.fillStyle = "#aaaaaa";
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBall(ball) {
  // draw ball
  context.beginPath();
  context.arc(ball.positionX, ball.positionY, ball.sizePx, 0, 2 * Math.PI, false);
  context.fillStyle = "lightblue";
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = "black";
  context.stroke();
}

function createBall() {

  let positionX, positionY;
  let velocityX, velocityY;

  // ball starting position
  positionX = canvas.width / 2;
  positionY = canvas.height / 2;

  // random ball starting speed
  velocityX = Math.floor(Math.random() * 75 + 25) / FRAMES_PER_SECOND;
  velocityY = Math.floor(Math.random() * 75 + 25) / FRAMES_PER_SECOND;

  // random ball direction
  if (Math.floor(Math.random() * 2) == 0) {
    velocityX = -velocityX;
  }
  if (Math.floor(Math.random() * 2) == 0) {
    velocityY = -velocityY;
  }

  return new Ball(positionX, positionY, velocityX, velocityY);
}

function updateBall(ball) {

  // move the ball
  ball.moveByVelocity();

  // bounce the ball off each wall
  if (ball.positionX - ball.sizePx / 2 < 0 && ball.velocityX < 0) {
    ball.velocityX = -ball.velocityX;
  }
  if (ball.positionX + ball.sizePx / 2 > canvas.width && ball.velocityX > 0) {
    ball.velocityX = -ball.velocityX;
  }
  if (ball.positionY - ball.sizePx / 2 < 0 && ball.velocityY < 0) {
    ball.velocityY = -ball.velocityY;
  }
  if (ball.positionY + ball.sizePx / 2 > canvas.height && ball.velocityY > 0) {
    ball.velocityY = -ball.velocityY;
  }
}
