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

// ***************************************************************************
// Description:
//   This is the main entry point for setting up and starting the simulation
//   on an HTML page. This should only be called once when the page is first
//   being displayed.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function startSimulationLoop() {

  // load canvas
  canvas = document.getElementById("simulation-canvas");
  context = canvas.getContext("2d");
  resetSimulation();
}

// ***************************************************************************
// Description:
//   This function temporarily stops the simulation. It can be resumed by
//   calling resumeSimulation.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function stopSimulation() {
  _clearIntervalLoop(intervalId);
}

// ***************************************************************************
// Description:
//   This function resumes a simulation that has been previously
//   stopped.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function resumeSimulation() {
  intervalId = _createIntervalLoop();
}

// ***************************************************************************
// Description:
//   This function resets all the UI options back to their default values.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function resetOptions() {
  _resetRangeOption("number_people");
  _resetRangeOption("unsafe_distance");
  _resetRangeOption("recovery_rate");
  _resetRangeOption("death_rate");
  _resetRangeOption("movement_rate");
  _resetRangeOption("hospital_capacity");
}

// ***************************************************************************
// Description:
//   This function resets the current simulation. The current option values are
//   used to seed the new simulation run.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
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

// ***************************************************************************
// Description:
//   This function updates the simulation during each iteration of the event
//   loop.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
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
    _finishSimulation();
  }
}

// ***************************************************************************
// Description:
//   This function can be called to end the simulation. The event is stopped
//   and a modal window displays statistics for the simulation.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function finishSimulation() {
  _clearIntervalLoop(intervalId);
  document.getElementById("resume_button").disabled = true;
  _showFinishedModal();
}

// ***************************************************************************
// Description:
//   This function cancels the interval callback . It also updates the UI
//   buttons to reflect that simulation cannot be stopped, only resumed or reset.
//
// Inputs:
//   intervalId - The ID of the interval callback to clear.
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function _clearIntervalLoop(intervalId) {
  if(null !== intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  document.getElementById("stop_button").disabled = true;
  document.getElementById("resume_button").disabled = false;
}

// ***************************************************************************
// Description:
//   This function registers a new interval callback.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   The ID of the new event loop callback. This can be used to cancel
//   the event loop.
// ***************************************************************************
//
function _createIntervalLoop() {
  document.getElementById("stop_button").disabled = false;
  document.getElementById("resume_button").disabled = true;
  return setInterval(_updateSimulation, 1000 / FRAMES_PER_SECOND);
}

// ***************************************************************************
// Description:
//   This function draws the background for the simulation canvas.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function _drawBackground() {
  // draw background
  context.fillStyle = "#aabbaa";
  context.fillRect(0, 0, canvas.width, canvas.height);
}

// ***************************************************************************
// Description:
//   This function draws a single call on the simulation canvas.
//
// Inputs:
//   ball - The instance of the ball to draw
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
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

// ***************************************************************************
// Description:
//   This function creates an instance of a ball. The options from the
//   UI are used to define many of the attributes of the ball instance.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   An instance of a ball
// ***************************************************************************
//
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

// ***************************************************************************
// Description:
//   This function updates the attributes of the balls that are dependent on
//   the day changing.
//
// Inputs:
//   balls - The array of all balls in the simulation.
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
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

// ***************************************************************************
// Description:
//   This function updates the positions of all the balls. This is typically
//   called on every event loop iteration.
//
// Inputs:
//   balls - The array of all balls in the simulation.
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function _updatePositions(){
  for(var i = 0; i < balls.length; ++i) {
    _updateBallPosition(balls[i]);
  }
}

// ***************************************************************************
// Description:
//   This function updates the position of a single ball.
//
// Inputs:
//   ball - The ball to update the position for.
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
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

// ***************************************************************************
// Description:
//   This function updates the "days infected" for all balls that are current
//   infected.
//
// Inputs:
//   balls - The array of all balls in the simulation.
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function _updateDaysInfected(balls) {
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected) {
      balls[i].reduceDaysInfected(1);
    }
  }
}

// ***************************************************************************
// Description:
//   This function determines if balls should die and kills them.
//
// Inputs:
//   balls - The array of all balls in the simulation.
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function _updateDeaths(balls) {
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected && balls[i].willDie) {
      if(balls[i].shouldDie()) {
        balls[i].makeDead();
      }
    }
  }
}

// ***************************************************************************
// Description:
//   This function determines if balls have complete the time to fight
//   off the virus, and makes them as immune.
//
// Inputs:
//   balls - The array of all balls in the simulation.
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function _updateImmunity(balls) {
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected && balls[i].daysLeftInfected === 0) {
      balls[i].makeImmune();
    }
  }
}

// ***************************************************************************
// Description:
//   This function determines if balls should before infected based in their
//   proximity to other balls, and the safe distance for infections.
//
// Inputs:
//   balls - The array of all balls in the simulation.
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
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

// ***************************************************************************
// Description:
//   This function updates the statistics on the line chart and doughnut
//   chart.
//
// Inputs:
//   currentDay - The current simulation "day"
//   balls - The array of all balls in the simulation.
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
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

// ***************************************************************************
// Description:
//   This function cleans up the line chart and doughnut charts. This is
//   required when attempting a new simulation run.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
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

// ***************************************************************************
// Description:
//   This function determines the number balls that are current infected
//   and returns the value.
//
// Inputs:
//   ball - The array of all balls in the simulation.
// Outputs:
//   None
// Returns:
//   The total number of balls currently infected.
// ***************************************************************************
//
function _numberOfInfected(balls) {
  let totalInfected = 0;
  for(var i = 0; i < balls.length; ++i) {
    if(balls[i].infected){
      totalInfected++;
    }
  }
  return totalInfected;
}

// ***************************************************************************
// Description:
//   This function shows the modal window that displays simulation statistics.
//
// Inputs:
//   None
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
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

// ***************************************************************************
// Description:
//   This function resets a single range slider input element. It also resets
//   the companion output element beside the range slider
//
// Inputs:
//   rangeOutputId  - The ID of the companion output element. This is used for
//                    looking up the ID of the range input element.
// Outputs:
//   None
// Returns:
//   None
// ***************************************************************************
//
function _resetRangeOption(rangeOutputId) {

  let rangeInputElement = document.getElementById(rangeOutputId + "_range");
  let rangeOutputElement = document.getElementById(rangeOutputId);
  let rangeDefault = rangeInputElement.getAttribute("value");
  rangeInputElement.value = rangeDefault;
  rangeOutputElement.value = rangeDefault;
}
