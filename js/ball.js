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

function Ball (positionX, positionY, velocityX, velocityY, infected, daysLeftInfected, willDie, deathDay, immune) {

  this.positionX = positionX;
  this.positionY = positionY;
  this.velocityX = velocityX;
  this.velocityY = velocityY;
  this.sizePx = 10;
  this.infected = infected;
  this.daysLeftInfected = daysLeftInfected;
  this.willDie = willDie;
  this.deathDay = deathDay;
  this.immune = immune;
  this.dead = false;

  this.moveByVelocity = function() {
    this.positionX += this.velocityX;
    this.positionY += this.velocityY;
  }

  this.kill = function() {
    this.dead = true;
    this.infected = false;
    this.daysLeftInfected = 0;
    this.immune = false;
    this.velocityX = 0;
    this.velocityY = 0;
  }
}
