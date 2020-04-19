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
const FRAMES_PER_DAY = FRAMES_PER_SECOND;
const CHART_START_DAYS = 100;
let canvas, context;
let balls = [];
let statsChart;
let currentDay = 0
let currentDayFrame = 0;
let recoveryInDays = 0;
let intervalId = null;

function startSimulationLoop() {

  // load canvas
  canvas = document.getElementById("simulation-canvas");
  context = canvas.getContext("2d");

  resetSimulation();
}

function stopSimulation() {
  clearIntervalLoop(intervalId);
}

function finishSimulation() {
  clearIntervalLoop(intervalId);
  document.getElementById("resume_button").disabled = true;
}

function resumeSimulation() {
  intervalId = createIntervalLoop();
}

function resetSimulation() {

  let numberOfBalls = document.getElementById("number_people").value;

  balls = [];
  currentInfections = 0;
  currentDay = 0;
  currentDayFrame = 0;
  recoveryInDays = document.getElementById("recovery_rate").value;
  for(var i = 0; i < numberOfBalls; ++i) {
    balls.push(createBall());
  }

  var chartData = {
    labels: Array.from(Array(CHART_START_DAYS+1).keys()),
    datasets: [
      {
        label: "Infected",
        data: [],
        borderColor: "red",
        backgroundColor: 'transparent',
      },
      {
        label: "Immune",
        data: [],
        borderColor: "lightgreen",
        backgroundColor: 'transparent',
      },
      {
        label: "Dead",
        data: [],
        borderColor: "black",
        backgroundColor: 'transparent',
      },
      {
        label: "Unaffected",
        data: [],
        borderColor: "lightblue",
        backgroundColor: 'transparent',
      },]
  };

  var dataGraphContext = document.getElementById("data_graph");
  statsChart = new Chart(dataGraphContext, {
    type: 'line',
    data: chartData,
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: false
          }
        }]
      },
      legend: {
        display: true,
      }
    }
  });

  // Push all the starting data into the chart
  updateChart(currentDay, balls);

  // set up simulation loop
  clearIntervalLoop(intervalId);
  intervalId = createIntervalLoop();
}

function updateSimulation() {

  updateTime(balls);
  updatePositions(balls);
  updateInfections(balls);

  drawBackground();

  for(var i = 0; i < balls.length; ++i) {
    drawBall(balls[i]);
  };

  if(0 === numberOfInfected(balls)) {
    finishSimulation();
  }
}

function clearIntervalLoop(intervalId) {
  if(null !== intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  document.getElementById("stop_button").disabled = true;
  document.getElementById("resume_button").disabled = false;
}

function createIntervalLoop() {
  document.getElementById("stop_button").disabled = false;
  document.getElementById("resume_button").disabled = true;
  return setInterval(updateSimulation, 1000 / FRAMES_PER_SECOND);
}

function drawBackground() {
  // draw background
  context.fillStyle = "#aabbaa";
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBall(ball) {
  // draw ball
  context.beginPath();
  context.arc(ball.positionX, ball.positionY, ball.sizePx, 0, 2 * Math.PI, false);
  if(ball.infected) {
    context.fillStyle = "red";
  }
  else if(ball.immune){
    context.fillStyle = "lightgreen";
  }
  else if(ball.dead) {
    context.fillStyle = "black";
  }
  else{
    context.fillStyle = "lightblue";
  }
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = "black";
  context.stroke();
}

function createBall() {

  let positionX, positionY;
  let velocityX, velocityY;
  let infected = false;
  let immune = false;
  let daysLeftInfected = null;
  let willDie = false;
  let deathDay = Math.floor(Math.random() * recoveryInDays);
  let deathRate = document.getElementById("death_rate").value;

  if(0 !== deathRate) {
    let d20 = Math.floor(Math.random() * (100/deathRate));
    willDie = (0 === d20);
  }

  // ball starting position
  positionX = Math.random() * canvas.width;
  positionY = Math.random() * canvas.height;

  // random ball starting speed
  let movementRate = document.getElementById("movement_rate").value;
  velocityX = (Math.floor(Math.random() * movementRate)) / FRAMES_PER_SECOND;
  velocityY = (Math.floor(Math.random() * movementRate)) / FRAMES_PER_SECOND;

  // random ball direction
  if (Math.floor(Math.random() * 2) == 0) {
    velocityX = -velocityX;
  }
  if (Math.floor(Math.random() * 2) == 0) {
    velocityY = -velocityY;
  }

  // Randomly infect
  if(Math.floor(Math.random() * 10) === 5) {
    infected = true;
    daysLeftInfected = recoveryInDays;
  }

  return new Ball(positionX, positionY, velocityX, velocityY, infected, daysLeftInfected, willDie, deathDay, immune);
}

function updateTime(balls) {
  currentDayFrame++;
  if(currentDayFrame >= FRAMES_PER_DAY) {
    currentDay++;
    currentDayFrame = 0;
    updateDaysInfected(balls);
    updateDeaths(balls);
    updateImmunity(balls);
    updateChart(currentDay, balls);
  }
}

function updatePositions(){
  for(var i = 0; i < balls.length; ++i) {
    updateBallPosition(balls[i]);
  }
}

function updateBallPosition(ball) {

  // move the ball
  ball.moveByVelocity();

  // bounce the ball off each wall
  if (ball.positionX - (ball.sizePx / 2) < 0 && ball.velocityX < 0) {
    ball.velocityX = -ball.velocityX;
  }
  if (ball.positionX + (ball.sizePx / 2) > canvas.width && ball.velocityX > 0) {
    ball.velocityX = -ball.velocityX;
  }
  if (ball.positionY - (ball.sizePx / 2) < 0 && ball.velocityY < 0) {
    ball.velocityY = -ball.velocityY;
  }
  if (ball.positionY + (ball.sizePx / 2) > canvas.height && ball.velocityY > 0) {
    ball.velocityY = -ball.velocityY;
  }
}

function updateDaysInfected(balls) {
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected) {
      balls[i].reduceDaysInfected(1);
    }
  }
}

function updateDeaths(balls) {
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected && balls[i].willDie) {
      if(balls[i].shouldDie()) {
        balls[i].makeDead();
      }
    }
  }
}

function updateImmunity(balls) {
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected && balls[i].daysLeftInfected === 0) {
      balls[i].makeImmune();
    }
  }
}

function updateInfections(balls) {
  let distanceBetweenBalls = 0;
  let deltaX = 0;
  let deltaY = 0;

  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected){
      for(var j = 0; j < balls.length; ++j) {
        if(i !== j && !balls[j].immune && !balls[j].infected && !balls[j].dead) {
          deltaX = balls[i].positionX - balls[j].positionX;
          deltaY = balls[i].positionY - balls[j].positionY;
          distanceBetweenBalls = Math.sqrt(deltaX*deltaX + deltaY*deltaY) - balls[i].sizePx - balls[j].sizePx;
          if(distanceBetweenBalls <= 0) {
            balls[j].makeInfected(recoveryInDays);
          }
        }
      }
    }
  }
}

function updateChart(currentDay, balls) {

  let totalInfected = 0;
  let totalImmune = 0;
  let totalDead = 0;
  let totalUnaffected = 0;

  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected){
      totalInfected++;
    }
    else if(balls[i].immune){
      totalImmune++;
    }
    else if(balls[i].dead){
      totalDead++;
    }
    else {
      totalUnaffected++;
    }
  }

  // After a certain amount of time start adding values
  // to the x-axis
  if(currentDay > CHART_START_DAYS) {
    statsChart.data.labels.push(currentDay);
  }

  statsChart.data.datasets[0].data.push(totalInfected);
  statsChart.data.datasets[1].data.push(totalImmune);
  statsChart.data.datasets[2].data.push(totalDead);
  statsChart.data.datasets[3].data.push(totalUnaffected);
  statsChart.update();
}

function numberOfInfected(balls) {
  let totalInfected = 0;
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected){
      totalInfected++;
    }
  }
  return totalInfected;
}
