---
sidebar_position: 1
---
# Ananse USSD Framework

Ananse is a full-stack framework for developing USSD applications in NodeJs. Ananse comes with batteries included, suitable for USSD projects of any size. Ananse can be adapted to any USSD API without any code changes when switching between USSD providers.

## Features

- Intuitive menu routing
- Supports any USSD gateway (Wigal, Hubtel, AfricasTalking, etc)
- Out-of-the-box session state management
- Session storage
- Input validation
- Pagination
- Command line simulator
- End-to-end testing with [Japa](https://japa.dev)

## Motivation

Due to the nature of USSD menu flows, using traditional frameworks like ExpressJS is difficult, even more so when debugging complex menu flows. This project aims to provide a framework that maximizes developers' productivity in building USSD applications.

The lack of a tool that abstracts the complexities of USSD APIs and provides a consistent API for building USSD applications has been a major challenge for developers. Ananse aims to solve this problem by providing a unified API for building USSD applications that can be easily adapted to any USSD API without any code changes.

## Installation

Use your favourite NodeJS package manager to install [ananse](https://www.npmjs.com/package/ananse).

```bash npm2yarn
npm install ananse
```
