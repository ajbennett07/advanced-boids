# Boids algorithm demonstration

Copyright 2020 Ben Eater
Copyright 2024 Albert Bennett

This code is [MIT licensed](http://en.wikipedia.org/wiki/MIT_License).

## What is this?
This is a fork of the boids algorithm implemented by Ben Eater with extra boid behaviors.

The original simulation can be found on [his website](https://eater.net/boids)

## How does it work?

Each of the boids (bird-oid objects) obeys three simple rules:

### 1. Coherence

Each boid gradually changes direction so that it is pointing at the "center of mass" of the other total flock of boids.


### 2. Separation

Each boid also tries to avoid running into other boids. It does this by frantically steering away from other boids in its FOV.
Boids also steer away from the predatoid (see below) several times more intensly.

### 3. Alignment

Boids also try to conform their velocity vectors with the rest of the flock. This is done by gradually adjusting the velocity of each boid to be closer to the mean of the velocities of boids in its FOV.

## Additions

These are all the "extras" I've added from the base boid algorithm:

### 1. The Predatoid

The predatoid is a red-colored boid that has slightly different behavior from the others. Its pathfinding only takes into Alignment into account. Other boids will "run away" from the predatoid. This models predators in real ecosystems.

### 2. Perching

If a boid finds itself at the bottom of the screen, it has a small chance to enter perching mode. While a boid is perching, it doesn't move and points straight up. After a short period of rest, the boid shoots back into the sky and is absorbed into the flock.

## Visual range

FOV, or "field of vision", is the last component of the basic boid components. Just like real animals are limited to only be able to see animals nearby, the components of the boid algorithm only take into consideration boids within a certain distance from a given boid.

## How do I run this code?

Simply download the code and run `index.html` in your browser. I make no attempt to make this browser-universal, though it should run everywhere.

## What have we done? What are we going to do?

Some of the extra algorithms implemented are:

Predatoids (see above)
Perching behavior

Future plans include:
Predatoid collision detection to kill boids
Energy system for perching
Boid reproduction ie. natural selection

### Inspiration and Credit

Obviously, this project was motivated by an intense curiosity in the boids algorithm (and an overwhelming need to have something easy to program). Thank you to Ben Eater for writing the vast majority of the logic behind this program and providing it open source (significant portions of this readme are also paraphrased from the original repo).
