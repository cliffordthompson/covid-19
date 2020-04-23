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
const CHART_START_DAYS = 60;
let canvas, context;
let balls = [];
let lineChart = null;
let doughnutChart = null;
let currentDay = 0
let currentDayFrame = 0;
let recoveryInDays = 0;
let intervalId = null;
let totalInfections = 0;
let totalDead = 0;

function startSimulationLoop() {

  // load canvas
  canvas = document.getElementById("simulation-canvas");
  context = canvas.getContext("2d");
  resetSimulation();
}

function stopSimulation() {
  _clearIntervalLoop(intervalId);
}

function finishSimulation() {
  _clearIntervalLoop(intervalId);
  document.getElementById("resume_button").disabled = true;
  _showFinishedModal();
}

function resumeSimulation() {
  intervalId = _createIntervalLoop();
}

function resetOptions() {
  _resetRangeOption("number_people");
  _resetRangeOption("unsafe_distance");
  _resetRangeOption("recovery_rate");
  _resetRangeOption("death_rate");
  _resetRangeOption("movement_rate");
  _resetRangeOption("hospital_capacity");
}

function resetSimulation() {

  let numberOfBalls = document.getElementById("number_people").value;

  balls = [];
  currentInfections = 0;
  currentDay = 0;
  currentDayFrame = 0;
  recoveryInDays = document.getElementById("recovery_rate").value;
  for(var i = 0; i < numberOfBalls; ++i) {
    balls.push(_createBall());
  }

  _destroyCharts();

  let lineChartData = {
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

  let lineChartContext = document.getElementById("line_chart");
  lineChart = new Chart(lineChartContext, {
    type: 'line',
    data: lineChartData,
    options: {
      responsive: false,
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

  let doughnutChartData = {
    labels: ["Infected", "Immune", "Dead", "Unaffected"],
    datasets: [
      {
        backgroundColor: ["red", "lightgreen", "black", "lightblue"],
        borderWidth: 0,
        data: [1,1,1,1],
      },]
  };

  let doughnutChartContext = document.getElementById("doughnut_chart");
  doughnutChart = new Chart(doughnutChartContext, {
    type: 'doughnut',
    data: doughnutChartData,
    options: {
      responsive: false,
    },});

  // Push all the starting data into the chart
  _updateCharts(currentDay, balls);

  // set up simulation loop
  _clearIntervalLoop(intervalId);
  intervalId = _createIntervalLoop();
}

function _updateSimulation() {

  _updateTime(balls);
  _updatePositions(balls);
  _updateInfections(balls);

  _drawBackground();

  for(var i = 0; i < balls.length; ++i) {
    _drawBall(balls[i]);
  };

  document.getElementById("current_day_badge").innerHTML = "Day " + currentDay;

  if(0 === _numberOfInfected(balls)) {
    finishSimulation();
  }
}

function _clearIntervalLoop(intervalId) {
  if(null !== intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  document.getElementById("stop_button").disabled = true;
  document.getElementById("resume_button").disabled = false;
}

function _createIntervalLoop() {
  document.getElementById("stop_button").disabled = false;
  document.getElementById("resume_button").disabled = true;
  return setInterval(_updateSimulation, 1000 / FRAMES_PER_SECOND);
}

function _drawBackground() {
  // draw background
  context.fillStyle = "#aabbaa";
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function _drawBall(ball) {
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

function _createBall() {

  let positionX, positionY;
  let velocityX, velocityY;
  let infected = false;
  let immune = false;
  let daysLeftInfected = null;
  let willDie = false;
  let deathDay = Math.floor(Math.random() * recoveryInDays);
  let deathRate = document.getElementById("death_rate").value;
  let unsafeDistance = document.getElementById("unsafe_distance").value;

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

  return new Ball(
    positionX, positionY,
    velocityX, velocityY,
    unsafeDistance,
    infected, daysLeftInfected,
    willDie, deathDay);
}

function _updateTime(balls) {
  currentDayFrame++;
  if(currentDayFrame >= FRAMES_PER_DAY) {
    currentDay++;
    currentDayFrame = 0;
    _updateDaysInfected(balls);
    _updateDeaths(balls);
    _updateImmunity(balls);
    _updateCharts(currentDay, balls);
  }
}

function _updatePositions(){
  for(var i = 0; i < balls.length; ++i) {
    _updateBallPosition(balls[i]);
  }
}

function _updateBallPosition(ball) {

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

function _updateDaysInfected(balls) {
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected) {
      balls[i].reduceDaysInfected(1);
    }
  }
}

function _updateDeaths(balls) {
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected && balls[i].willDie) {
      if(balls[i].shouldDie()) {
        balls[i].makeDead();
      }
    }
  }
}

function _updateImmunity(balls) {
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected && balls[i].daysLeftInfected === 0) {
      balls[i].makeImmune();
    }
  }
}

function _updateInfections(balls) {
  let distanceBetweenBalls = 0;
  let deltaX = 0;
  let deltaY = 0;

  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected){
      for(var j = 0; j < balls.length; ++j) {
        if(i !== j && !balls[j].immune && !balls[j].infected && !balls[j].dead) {
          deltaX = balls[i].positionX - balls[j].positionX;
          deltaY = balls[i].positionY - balls[j].positionY;
          distanceBetweenBalls = Math.sqrt(deltaX*deltaX + deltaY*deltaY) - balls[i].safeDistance - balls[j].safeDistance;
          if(distanceBetweenBalls <= 0) {
            balls[j].makeInfected(recoveryInDays);
          }
        }
      }
    }
  }
}

function _updateCharts(currentDay, balls) {

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
    lineChart.data.labels.push(currentDay);
  }

  lineChart.data.datasets[0].data.push(totalInfected);
  lineChart.data.datasets[1].data.push(totalImmune);
  lineChart.data.datasets[2].data.push(totalDead);
  lineChart.data.datasets[3].data.push(totalUnaffected);
  lineChart.update();

  doughnutChart.data.datasets[0].data = [totalInfected,totalImmune,totalDead,totalUnaffected];
  doughnutChart.update();
}

function _destroyCharts() {

  if(null !== lineChart) {
    lineChart.destroy();
    lineChart = null;
  }

  if(null !== doughnutChart) {
    doughnutChart.destroy();
    doughnutChart = null;
  }
}

function _numberOfInfected(balls) {
  let totalInfected = 0;
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected){
      totalInfected++;
    }
  }
  return totalInfected;
}

function _showFinishedModal() {
  let totalImmune = 0;
  let totalDead = 0;
  let totalUnaffected = 0;

  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].immune){
      totalImmune++;
    }
    else if(balls[i].dead){
      totalDead++;
    }
    else {
      totalUnaffected++;
    }
  }

  document.getElementById("finished_modal_total_days").innerHTML = currentDay + 1;
  document.getElementById("finished_modal_total_infections").innerHTML = totalImmune + totalDead;
  document.getElementById("finished_modal_total_dead").innerHTML = totalDead;
  document.getElementById("finished_modal_total_unaffected").innerHTML = totalUnaffected;
  $("#finished_modal").modal("show");
}

function _resetRangeOption(rangeOutputId) {

  let rangeInputElement = document.getElementById(rangeOutputId + "_range");
  let rangeOutputElement = document.getElementById(rangeOutputId);
  let rangeDefault = rangeInputElement.getAttribute("value");
  rangeInputElement.value = rangeDefault;
  rangeOutputElement.value = rangeDefault;
}
