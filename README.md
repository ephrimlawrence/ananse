<center>
<h1> Ananse USSD Framework</h1>
</center>

<p align="center">A lightweight <a href="http://nodejs.org" target="blank">Node.js</a> framework with batteries included for building efficient, scalable and maintainable USSD applications.</p>

<center>

[![https://nodei.co/npm/ananse.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/ananse.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/ananse)

[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/dwyl/esta/issues)

</center>

[Ananse](https://www.npmjs.com/package/ananse/) is a lightweight NodeJs/Typescript framework with batteries included for building efficient, scalable and maintainable USSD applications. It provides intuitive and flexible APIs for building USSD menus.

Ananse has built-in support for session state management, menu routing, input validation, pagination and command line simulator.

## Features

- Intuitive menu routing
- Supports any USSD gateway (Wigal, Hubtel, AfricasTalking, etc)
- Session state management
- Session storage
- Input validation
- Pagination
- Command line simulator
- E2E Testing with Japa

## Installation

Use your favour nodejs package manager to install [anase](https://www.npmjs.com/package/ananse/).

```bash
npm install ananse
```

## Base Usage

Ananse comes with a built-in HTTP server suitable for a new project. An ExpressJs wrapper is also available for use in existing projects.

### Configuration

The `configure` exposes several options to configure the framework - the ussd gateway, session storage and pagination options.

```typescript

import { Ananse } from "ananse";

const ananse = new Ananse().configure({
  gateway: "wigal", // USSD gateway to use, eg. hubtel, africas_talking.
  session: { type: "redis" }, // Database to store session data. Eg. mysql, postgres and redis
});

export default ananse;
```

### Define the Menus

There are two ways to define menus Ananse - **functional** and **class based** menus. While both offers the same API features, **class based** menus are recommended for complex applications.

Each menu must have a unique name/id, this is similar to route path in expressJS. Ananse uses the id in navigating the user between menus in the application. It is recommended to define menu ids in enum for easy debugging.

Functional menus are automatically discovered by the framework. However, class menus must be added manually.

```typescript
//
// Functional style menu definition
//
MenuRouter
  .menu(MenuType.account_type)
  .start()
  .message("Choose account type")
  .actions([
    {
      choice: "1",
      display: "1. Customer",
      next_menu: async (req: Request, _res: Response) => {
        return MenuType.account_login
      },
    },
    {
      choice: "2",
      display: "2. Sales Executive",
      next_menu: MenuType.sales_executive,
    },
  ]);
```

After defining a class based menu, it must be added to the list of menu routes using the `MenuRouter.add([menu-class], [menu-id])`.

```typescript
//
// Class based menus
//
import { BaseMenu, MenuAction, Request, Response } from "ananse";
import { MenuType } from "../../enums";

export class AmountTypeMenu extends BaseMenu {
  async nextMenu() {
    return MenuType.account_type;
  }

  async message() {
    return "Choose account type";
  }

  async actions(): Promise<MenuAction[]> {
    return [
      {
        choice: "1",
        display: "1. Customer",
        next_menu: async (req: Request, _res: Response) => {
          return MenuType.account_login
        },
      },
      {
        choice: "2",
        display: "2. Sales Executive",
        next_menu: MenuType.sales_executive,
      },
    ];
  }
}

// Add the menu to the list of ananse routes
MenuRouter.add(AmountTypeMenu, MenuType.account_type);
```

### Start the Server

Ananse can be added to an existing express application by simply mount a new route for it.

```typescript

import ananse from "./ussd";

const app = express();

app.get('/ussd', (req, res) => {
  return ananse.express(req, res);
})
```

To use the built-in HTTP server, simply call the `listen` function with the port number.

```typescript
import ananse from "./ussd";

ananse.listen(3000, "localhost", () => {
    console.log("Ananse server listening on port 3000");
});
```

### Sample projects

For more examples, refer to the available [sample projects](https://github.com/ephrimlawrence/ananse/blob/bee6f84743bc6c9b3859cee38de487eba922e575/tests/sample-apps).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

Ananse is [MIT licensed](LICENSE)

## TODOs

### Documentation

- Core components
  - validation
  - forms
  - menus
  - forms
  - pagination
  - simulator
  - japa e2e testing
  - design philosophy

### Pending Features

- Simplify navigation to use stack data structure
- GUI menu builder
- Vscode extension
